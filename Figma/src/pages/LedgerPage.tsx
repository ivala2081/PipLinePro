import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Calendar } from '../components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Alert, AlertDescription } from '../components/ui/alert'
import { Progress } from '../components/ui/progress'
import { Separator } from '../components/ui/separator'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'sonner@2.0.3'
import { 
  BookOpen, 
  Download, 
  Filter, 
  Calendar as CalendarIcon,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  DollarSign,
  CreditCard,
  Building,
  Clock,
  Settings,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Users,
  Calculator,
  FileText,
  Edit,
  Save,
  X,
  Plus,
  Minus,
  ArrowUpDown,
  BarChart3,
  PieChart,
  Activity,
  Banknote
} from 'lucide-react'

// Core Ledger Data Models
interface DailyBalance {
  // Identification
  date: string
  psp: string
  
  // Financial Data (15,2 decimal precision)
  openingBalance: number
  totalInflow: number       // Sum of all DEP transactions
  totalOutflow: number      // Sum of all WD transactions
  commissionTotal: number   // Sum of all commission amounts
  netAmount: number         // Inflow - Outflow - Commission
  closingBalance: number    // Opening + Net - Allocation
  allocationAmount: number  // Allocated funds
  rolloverAmount: number    // Remaining funds
  
  // Metadata
  transactionCount: number
  createdAt: string
  lastUpdate: string
  reconciled: boolean
  
  // Multi-currency tracking
  currencyBreakdown: Record<string, {
    amount: number
    exchangeRate: number
    tlAmount: number
  }>
}

interface PSPAllocation {
  // Identification
  date: string
  psp: string
  
  // Allocation Data
  allocationAmount: number
  maxAllocation: number
  utilizationRate: number
  
  // Tracking
  createdAt: string
  createdBy: string
  lastUpdate: string
  updatedBy: string
  reason: string
  
  // Validation
  isActive: boolean
  approvalStatus: 'pending' | 'approved' | 'rejected'
}

interface LedgerEntry {
  // Identification
  id: string
  date: string
  
  // Transaction Details
  type: 'opening' | 'deposit' | 'withdrawal' | 'commission' | 'allocation' | 'rollover' | 'closing'
  description: string
  reference: string
  
  // Financial Data
  debit: number
  credit: number
  runningBalance: number
  
  // PSP and Currency
  psp?: string
  currency: 'TL' | 'USD' | 'EUR'
  exchangeRate?: number
  
  // Audit Trail
  createdBy: string
  createdAt: string
  notes?: string
}

interface LedgerSummary {
  date: string
  totalPSPs: number
  totalOpeningBalance: number
  totalInflow: number
  totalOutflow: number
  totalCommission: number
  totalNetAmount: number
  totalAllocations: number
  totalRollovers: number
  totalClosingBalance: number
  reconciliationStatus: 'complete' | 'pending' | 'discrepancy'
}

// Mock transaction data (simulating real transaction system integration)
const mockTransactions = [
  {
    id: 'TXN-001',
    date: '2024-01-15',
    clientName: 'Acme Corporation',
    category: 'DEP',
    amount: 25000,
    baseCurrency: 'USD',
    exchangeRate: 34.25,
    tlAmount: 856250,
    commission: 750,
    netAmount: 24250,
    psp: 'PayPal',
    status: 'completed'
  },
  {
    id: 'TXN-002',
    date: '2024-01-15',
    clientName: 'Tech Solutions Ltd',
    category: 'WD',
    amount: 15000,
    baseCurrency: 'EUR',
    exchangeRate: 37.48,
    tlAmount: 562200,
    commission: 0,
    netAmount: 15000,
    psp: 'Stripe',
    status: 'completed'
  },
  {
    id: 'TXN-003',
    date: '2024-01-15',
    clientName: 'Global Trading Inc',
    category: 'DEP',
    amount: 850000,
    baseCurrency: 'TL',
    exchangeRate: 1.0,
    tlAmount: 850000,
    commission: 21250,
    netAmount: 828750,
    psp: 'Iyzico',
    status: 'completed'
  },
  {
    id: 'TXN-004',
    date: '2024-01-14',
    clientName: 'E-commerce Solutions',
    category: 'DEP',
    amount: 5000,
    baseCurrency: 'USD',
    exchangeRate: 34.25,
    tlAmount: 171250,
    commission: 145,
    netAmount: 4855,
    psp: 'Square',
    status: 'completed'
  },
  {
    id: 'TXN-005',
    date: '2024-01-14',
    clientName: 'Manufacturing Corp',
    category: 'WD',
    amount: 75000,
    baseCurrency: 'EUR',
    exchangeRate: 37.48,
    tlAmount: 2811000,
    commission: 0,
    netAmount: 75000,
    psp: 'Adyen',
    status: 'completed'
  }
]

// PSP Configuration
const pspConfig = [
  { name: 'PayPal', commissionRate: 3.2, isActive: true },
  { name: 'Stripe', commissionRate: 2.9, isActive: true },
  { name: 'Iyzico', commissionRate: 2.5, isActive: true },
  { name: 'Square', commissionRate: 3.0, isActive: true },
  { name: 'Adyen', commissionRate: 2.8, isActive: true },
  { name: 'Shopify Payments', commissionRate: 2.9, isActive: true }
]

export default function LedgerPage() {
  const { user, hasPermission } = useAuth()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [dateRange, setDateRange] = useState('today')
  const [selectedPSP, setSelectedPSP] = useState('all')
  const [activeTab, setActiveTab] = useState('daily')
  
  // Ledger State
  const [dailyBalances, setDailyBalances] = useState<DailyBalance[]>([])
  const [pspAllocations, setPspAllocations] = useState<PSPAllocation[]>([])
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([])
  const [ledgerSummaries, setLedgerSummaries] = useState<LedgerSummary[]>([])
  
  // UI State
  const [isCalculating, setIsCalculating] = useState(false)
  const [isAllocationDialogOpen, setIsAllocationDialogOpen] = useState(false)
  const [selectedAllocation, setSelectedAllocation] = useState<PSPAllocation | null>(null)
  const [allocationForm, setAllocationForm] = useState({
    psp: '',
    amount: '',
    reason: ''
  })
  
  // Filters
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    psp: 'all',
    reconciled: 'all'
  })

  // Permissions
  const canModifyAllocations = hasPermission('ledger.allocations') || hasPermission('*')
  const canRecalculate = hasPermission('ledger.calculate') || hasPermission('*')
  const canExport = hasPermission('ledger.export') || hasPermission('*')

  // Initialize ledger data on component mount
  useEffect(() => {
    calculateDailyBalances()
    generateLedgerEntries()
    calculateLedgerSummaries()
  }, [])

  // Ledger Calculation Engine
  const calculateDailyBalances = () => {
    setIsCalculating(true)
    
    try {
      // Group transactions by date and PSP
      const transactionsByDatePSP: Record<string, Record<string, any[]>> = {}
      
      mockTransactions.forEach(transaction => {
        const dateKey = transaction.date
        const pspKey = transaction.psp
        
        if (!transactionsByDatePSP[dateKey]) {
          transactionsByDatePSP[dateKey] = {}
        }
        if (!transactionsByDatePSP[dateKey][pspKey]) {
          transactionsByDatePSP[dateKey][pspKey] = []
        }
        
        transactionsByDatePSP[dateKey][pspKey].push(transaction)
      })
      
      const newDailyBalances: DailyBalance[] = []
      
      // Calculate balances for each date-PSP combination
      Object.entries(transactionsByDatePSP).forEach(([date, pspData]) => {
        Object.entries(pspData).forEach(([psp, transactions]) => {
          // Get previous day's closing balance as opening balance
          const previousBalance = getPreviousDayClosingBalance(date, psp)
          
          // Calculate daily financial metrics
          let totalInflow = 0
          let totalOutflow = 0
          let commissionTotal = 0
          let transactionCount = 0
          const currencyBreakdown: Record<string, any> = {}
          
          transactions.forEach(txn => {
            transactionCount++
            
            if (txn.category === 'DEP') {
              totalInflow += txn.tlAmount
            } else if (txn.category === 'WD') {
              totalOutflow += txn.tlAmount
            }
            
            commissionTotal += txn.commission
            
            // Track currency breakdown
            const currency = txn.baseCurrency
            if (!currencyBreakdown[currency]) {
              currencyBreakdown[currency] = {
                amount: 0,
                exchangeRate: txn.exchangeRate,
                tlAmount: 0
              }
            }
            currencyBreakdown[currency].amount += txn.amount
            currencyBreakdown[currency].tlAmount += txn.tlAmount
          })
          
          // Calculate net amount and balances
          const netAmount = totalInflow - totalOutflow - commissionTotal
          const allocationAmount = getAllocationAmount(date, psp)
          const rolloverAmount = netAmount - allocationAmount
          const closingBalance = previousBalance + rolloverAmount
          
          const dailyBalance: DailyBalance = {
            date,
            psp,
            openingBalance: previousBalance,
            totalInflow,
            totalOutflow,
            commissionTotal,
            netAmount,
            closingBalance,
            allocationAmount,
            rolloverAmount,
            transactionCount,
            createdAt: new Date().toISOString(),
            lastUpdate: new Date().toISOString(),
            reconciled: true,
            currencyBreakdown
          }
          
          newDailyBalances.push(dailyBalance)
        })
      })
      
      // Sort by date descending
      newDailyBalances.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      
      setDailyBalances(newDailyBalances)
      
      toast.success('Daily balances calculated', {
        description: `Processed ${newDailyBalances.length} daily balance records`
      })
      
    } catch (error) {
      toast.error('Calculation failed', {
        description: 'Failed to calculate daily balances'
      })
    } finally {
      setIsCalculating(false)
    }
  }

  const getPreviousDayClosingBalance = (date: string, psp: string): number => {
    // In a real system, this would query the previous day's closing balance
    // For demo purposes, return a mock opening balance
    const mockOpeningBalances: Record<string, number> = {
      'PayPal': 2500000,
      'Stripe': 1800000,
      'Iyzico': 3200000,
      'Square': 950000,
      'Adyen': 1450000
    }
    return mockOpeningBalances[psp] || 1000000
  }

  const getAllocationAmount = (date: string, psp: string): number => {
    const allocation = pspAllocations.find(a => a.date === date && a.psp === psp)
    return allocation?.allocationAmount || 0
  }

  // Generate ledger entries from transactions and balances
  const generateLedgerEntries = () => {
    const entries: LedgerEntry[] = []
    let entryId = 1
    
    // Generate entries for each transaction
    mockTransactions.forEach(transaction => {
      // Opening balance entry (first entry of the day for each PSP)
      const openingEntry: LedgerEntry = {
        id: `LE-${String(entryId++).padStart(4, '0')}`,
        date: transaction.date,
        type: 'opening',
        description: `Opening Balance - ${transaction.psp}`,
        reference: `OB-${transaction.date}-${transaction.psp}`,
        debit: 0,
        credit: getPreviousDayClosingBalance(transaction.date, transaction.psp),
        runningBalance: getPreviousDayClosingBalance(transaction.date, transaction.psp),
        psp: transaction.psp,
        currency: 'TL',
        createdBy: 'system',
        createdAt: new Date().toISOString()
      }
      
      // Transaction entry
      const transactionEntry: LedgerEntry = {
        id: `LE-${String(entryId++).padStart(4, '0')}`,
        date: transaction.date,
        type: transaction.category === 'DEP' ? 'deposit' : 'withdrawal',
        description: `${transaction.category === 'DEP' ? 'Deposit' : 'Withdrawal'} - ${transaction.clientName}`,
        reference: transaction.id,
        debit: transaction.category === 'WD' ? transaction.tlAmount : 0,
        credit: transaction.category === 'DEP' ? transaction.tlAmount : 0,
        runningBalance: openingEntry.runningBalance + (transaction.category === 'DEP' ? transaction.tlAmount : -transaction.tlAmount),
        psp: transaction.psp,
        currency: transaction.baseCurrency,
        exchangeRate: transaction.exchangeRate,
        createdBy: 'system',
        createdAt: new Date().toISOString()
      }
      
      // Commission entry (if applicable)
      if (transaction.commission > 0) {
        const commissionEntry: LedgerEntry = {
          id: `LE-${String(entryId++).padStart(4, '0')}`,
          date: transaction.date,
          type: 'commission',
          description: `Commission - ${transaction.psp}`,
          reference: transaction.id,
          debit: transaction.commission,
          credit: 0,
          runningBalance: transactionEntry.runningBalance - transaction.commission,
          psp: transaction.psp,
          currency: 'TL',
          createdBy: 'system',
          createdAt: new Date().toISOString()
        }
        entries.push(commissionEntry)
      }
      
      entries.push(openingEntry, transactionEntry)
    })
    
    // Sort entries by date and time
    entries.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    
    setLedgerEntries(entries)
  }

  // Calculate summary statistics
  const calculateLedgerSummaries = () => {
    const summaries: LedgerSummary[] = []
    
    // Group daily balances by date
    const balancesByDate: Record<string, DailyBalance[]> = {}
    dailyBalances.forEach(balance => {
      if (!balancesByDate[balance.date]) {
        balancesByDate[balance.date] = []
      }
      balancesByDate[balance.date].push(balance)
    })
    
    Object.entries(balancesByDate).forEach(([date, balances]) => {
      const summary: LedgerSummary = {
        date,
        totalPSPs: balances.length,
        totalOpeningBalance: balances.reduce((sum, b) => sum + b.openingBalance, 0),
        totalInflow: balances.reduce((sum, b) => sum + b.totalInflow, 0),
        totalOutflow: balances.reduce((sum, b) => sum + b.totalOutflow, 0),
        totalCommission: balances.reduce((sum, b) => sum + b.commissionTotal, 0),
        totalNetAmount: balances.reduce((sum, b) => sum + b.netAmount, 0),
        totalAllocations: balances.reduce((sum, b) => sum + b.allocationAmount, 0),
        totalRollovers: balances.reduce((sum, b) => sum + b.rolloverAmount, 0),
        totalClosingBalance: balances.reduce((sum, b) => sum + b.closingBalance, 0),
        reconciliationStatus: balances.every(b => b.reconciled) ? 'complete' : 'pending'
      }
      summaries.push(summary)
    })
    
    // Sort by date descending
    summaries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    
    setLedgerSummaries(summaries)
  }

  // Allocation Management
  const handleAllocationUpdate = () => {
    if (!canModifyAllocations) {
      toast.error('Permission denied', { description: 'You do not have permission to modify allocations' })
      return
    }

    const amount = parseFloat(allocationForm.amount)
    if (!amount || amount < 0) {
      toast.error('Invalid amount', { description: 'Please enter a valid allocation amount' })
      return
    }

    const newAllocation: PSPAllocation = {
      date: selectedDate.toISOString().split('T')[0],
      psp: allocationForm.psp,
      allocationAmount: amount,
      maxAllocation: amount * 2, // Business rule: max allocation is 2x current
      utilizationRate: 0, // Will be calculated based on usage
      createdAt: new Date().toISOString(),
      createdBy: user?.username || 'unknown',
      lastUpdate: new Date().toISOString(),
      updatedBy: user?.username || 'unknown',
      reason: allocationForm.reason,
      isActive: true,
      approvalStatus: 'approved' // In real system, this might require approval workflow
    }

    setPspAllocations(prev => [...prev.filter(a => !(a.date === newAllocation.date && a.psp === newAllocation.psp)), newAllocation])
    setIsAllocationDialogOpen(false)
    setAllocationForm({ psp: '', amount: '', reason: '' })
    
    // Recalculate balances after allocation change
    calculateDailyBalances()
    
    toast.success('Allocation updated', {
      description: `${allocationForm.psp} allocation set to ₺${amount.toLocaleString()}`
    })
  }

  // Utility functions
  const formatCurrency = (amount: number): string => {
    return `₺${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatDateTime = (date: string): string => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getReconciliationBadge = (status: string) => {
    switch (status) {
      case 'complete':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Reconciled
          </Badge>
        )
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
      case 'discrepancy':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Discrepancy
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTypeBadge = (type: string) => {
    const configs = {
      opening: { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Opening' },
      deposit: { color: 'bg-green-100 text-green-800 border-green-200', label: 'Deposit' },
      withdrawal: { color: 'bg-red-100 text-red-800 border-red-200', label: 'Withdrawal' },
      commission: { color: 'bg-amber-100 text-amber-800 border-amber-200', label: 'Commission' },
      allocation: { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Allocation' },
      rollover: { color: 'bg-purple-100 text-purple-800 border-purple-200', label: 'Rollover' },
      closing: { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Closing' }
    }
    
    const config = configs[type as keyof typeof configs] || { color: 'bg-gray-100 text-gray-800 border-gray-200', label: type }
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    )
  }

  // Export functionality
  const handleExport = () => {
    if (!canExport) {
      toast.error('Permission denied', { description: 'You do not have permission to export ledger data' })
      return
    }

    const headers = [
      'Date', 'PSP', 'Opening Balance', 'Total Inflow', 'Total Outflow', 
      'Commission', 'Net Amount', 'Allocation', 'Rollover', 'Closing Balance',
      'Transaction Count', 'Reconciled'
    ]

    const csvData = [
      headers.join(','),
      ...dailyBalances.map(balance => [
        balance.date,
        balance.psp,
        balance.openingBalance,
        balance.totalInflow,
        balance.totalOutflow,
        balance.commissionTotal,
        balance.netAmount,
        balance.allocationAmount,
        balance.rolloverAmount,
        balance.closingBalance,
        balance.transactionCount,
        balance.reconciled ? 'Yes' : 'No'
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvData], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ledger-export-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)

    toast.success('Export completed', { 
      description: `Ledger data exported successfully`
    })
  }

  // Filter daily balances
  const filteredDailyBalances = dailyBalances.filter(balance => {
    const balanceDate = new Date(balance.date)
    const startDate = new Date(filters.startDate)
    const endDate = new Date(filters.endDate)
    
    const matchesDateRange = balanceDate >= startDate && balanceDate <= endDate
    const matchesPSP = filters.psp === 'all' || balance.psp === filters.psp
    const matchesReconciled = filters.reconciled === 'all' || 
      (filters.reconciled === 'reconciled' && balance.reconciled) ||
      (filters.reconciled === 'pending' && !balance.reconciled)
    
    return matchesDateRange && matchesPSP && matchesReconciled
  })

  // Get current day summary
  const todaySummary = ledgerSummaries.find(s => s.date === new Date().toISOString().split('T')[0])

  return (
    <main className="flex-1 p-6 space-y-6 bg-muted/20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>Financial Ledger</h1>
          <p className="text-muted-foreground">
            Comprehensive daily financial tracking with PSP allocation management and real-time position monitoring
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <CalendarIcon className="w-4 h-4 mr-2" />
                {selectedDate.toLocaleDateString()}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
              />
            </PopoverContent>
          </Popover>
          
          {canRecalculate && (
            <Button variant="outline" size="sm" onClick={calculateDailyBalances} disabled={isCalculating}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isCalculating ? 'animate-spin' : ''}`} />
              {isCalculating ? 'Calculating...' : 'Recalculate'}
            </Button>
          )}
          
          {canExport && (
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export Ledger
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Today's Closing Balance</p>
                <p className="text-2xl font-semibold">
                  {formatCurrency(todaySummary?.totalClosingBalance || 0)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {todaySummary?.totalPSPs || 0} PSPs active
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Net Inflow</p>
                <p className="text-2xl font-semibold">
                  {formatCurrency((todaySummary?.totalInflow || 0) - (todaySummary?.totalOutflow || 0))}
                </p>
                <p className="text-sm text-muted-foreground">
                  In: {formatCurrency(todaySummary?.totalInflow || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-amber-100 rounded-lg">
                <CreditCard className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Commission Earned</p>
                <p className="text-2xl font-semibold">
                  {formatCurrency(todaySummary?.totalCommission || 0)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Across all PSPs
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Building className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Allocations</p>
                <p className="text-2xl font-semibold">
                  {formatCurrency(todaySummary?.totalAllocations || 0)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Rollover: {formatCurrency(todaySummary?.totalRollovers || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="daily">Daily Balances</TabsTrigger>
          <TabsTrigger value="psp">PSP Management</TabsTrigger>
          <TabsTrigger value="ledger">General Ledger</TabsTrigger>
          <TabsTrigger value="summary">Summary Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>PSP</Label>
                    <Select value={filters.psp} onValueChange={(value) => setFilters(prev => ({ ...prev, psp: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All PSPs</SelectItem>
                        {pspConfig.filter(psp => psp.isActive).map(psp => (
                          <SelectItem key={psp.name} value={psp.name}>{psp.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Reconciliation</Label>
                    <Select value={filters.reconciled} onValueChange={(value) => setFilters(prev => ({ ...prev, reconciled: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="reconciled">Reconciled</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Daily Balances Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Daily Financial Balances
              </CardTitle>
              <CardDescription>
                Comprehensive daily financial tracking by PSP with automated calculations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>PSP</TableHead>
                      <TableHead className="text-right">Opening Balance</TableHead>
                      <TableHead className="text-right">Inflow</TableHead>
                      <TableHead className="text-right">Outflow</TableHead>
                      <TableHead className="text-right">Commission</TableHead>
                      <TableHead className="text-right">Net Amount</TableHead>
                      <TableHead className="text-right">Allocation</TableHead>
                      <TableHead className="text-right">Rollover</TableHead>
                      <TableHead className="text-right">Closing Balance</TableHead>
                      <TableHead>Transactions</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDailyBalances.map((balance, index) => (
                      <TableRow key={`${balance.date}-${balance.psp}`}>
                        <TableCell className="font-medium">
                          {formatDate(balance.date)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{balance.psp}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(balance.openingBalance)}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          +{formatCurrency(balance.totalInflow)}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          -{formatCurrency(balance.totalOutflow)}
                        </TableCell>
                        <TableCell className="text-right text-amber-600">
                          {formatCurrency(balance.commissionTotal)}
                        </TableCell>
                        <TableCell className={`text-right font-medium ${
                          balance.netAmount >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {balance.netAmount >= 0 ? '+' : ''}{formatCurrency(balance.netAmount)}
                        </TableCell>
                        <TableCell className="text-right text-blue-600">
                          {formatCurrency(balance.allocationAmount)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(balance.rolloverAmount)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(balance.closingBalance)}
                        </TableCell>
                        <TableCell>
                          <div className="text-center">
                            <span className="font-medium">{balance.transactionCount}</span>
                            <div className="text-xs text-muted-foreground">txns</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getReconciliationBadge(balance.reconciled ? 'complete' : 'pending')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="psp" className="space-y-6">
          {/* PSP Management Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">PSP Allocation Management</h3>
              <p className="text-sm text-muted-foreground">
                Manage fund allocations across payment service providers
              </p>
            </div>
            {canModifyAllocations && (
              <Dialog open={isAllocationDialogOpen} onOpenChange={setIsAllocationDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Set Allocation
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>PSP Allocation</DialogTitle>
                    <DialogDescription>
                      Set or update allocation amount for a specific PSP
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>PSP</Label>
                      <Select value={allocationForm.psp} onValueChange={(value) => setAllocationForm(prev => ({ ...prev, psp: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select PSP" />
                        </SelectTrigger>
                        <SelectContent>
                          {pspConfig.filter(psp => psp.isActive).map(psp => (
                            <SelectItem key={psp.name} value={psp.name}>{psp.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Allocation Amount</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={allocationForm.amount}
                        onChange={(e) => setAllocationForm(prev => ({ ...prev, amount: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Reason</Label>
                      <Textarea
                        value={allocationForm.reason}
                        onChange={(e) => setAllocationForm(prev => ({ ...prev, reason: e.target.value }))}
                        placeholder="Reason for allocation change..."
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setIsAllocationDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAllocationUpdate}>
                      <Save className="w-4 h-4 mr-2" />
                      Save Allocation
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* PSP Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {pspConfig.filter(psp => psp.isActive).map(psp => {
              const pspBalances = dailyBalances.filter(b => b.psp === psp.name)
              const totalVolume = pspBalances.reduce((sum, b) => sum + b.totalInflow, 0)
              const totalCommission = pspBalances.reduce((sum, b) => sum + b.commissionTotal, 0)
              const totalAllocations = pspBalances.reduce((sum, b) => sum + b.allocationAmount, 0)
              const avgUtilization = pspBalances.length > 0 ? 
                (totalAllocations / (totalVolume || 1)) * 100 : 0
              
              return (
                <Card key={psp.name}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building className="w-5 h-5" />
                        {psp.name}
                      </div>
                      <Badge variant={avgUtilization > 80 ? "default" : "secondary"}>
                        {avgUtilization.toFixed(1)}% utilized
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Total Volume</p>
                        <p className="font-medium">{formatCurrency(totalVolume)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Commission Rate</p>
                        <p className="font-medium">{psp.commissionRate}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Commission Earned</p>
                        <p className="font-medium text-amber-600">
                          {formatCurrency(totalCommission)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total Allocations</p>
                        <p className="font-medium text-blue-600">
                          {formatCurrency(totalAllocations)}
                        </p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Performance</span>
                        <span className="font-medium">{avgUtilization.toFixed(1)}%</span>
                      </div>
                      <Progress value={Math.min(avgUtilization, 100)} className="h-2" />
                    </div>
                    
                    {canModifyAllocations && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => {
                          setAllocationForm({ psp: psp.name, amount: '', reason: '' })
                          setIsAllocationDialogOpen(true)
                        }}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Manage Allocation
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="ledger" className="space-y-6">
          {/* General Ledger */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                General Ledger Entries
              </CardTitle>
              <CardDescription>
                Detailed financial transaction records with audit trail
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Entry ID</TableHead>
                      <TableHead>Date/Time</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>PSP</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ledgerEntries.slice(0, 50).map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-mono text-sm">{entry.id}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDateTime(entry.createdAt)}
                        </TableCell>
                        <TableCell>
                          {getTypeBadge(entry.type)}
                        </TableCell>
                        <TableCell>{entry.description}</TableCell>
                        <TableCell className="font-mono text-sm">{entry.reference}</TableCell>
                        <TableCell>
                          {entry.psp ? (
                            <Badge variant="outline">{entry.psp}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {entry.debit > 0 ? (
                            <span className="text-red-600">{formatCurrency(entry.debit)}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {entry.credit > 0 ? (
                            <span className="text-green-600">{formatCurrency(entry.credit)}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(entry.runningBalance)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-6">
          {/* Summary Reports */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Daily Summary Reports
              </CardTitle>
              <CardDescription>
                Aggregated financial summaries with reconciliation status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>PSPs</TableHead>
                      <TableHead className="text-right">Opening Balance</TableHead>
                      <TableHead className="text-right">Net Inflow</TableHead>
                      <TableHead className="text-right">Commission</TableHead>
                      <TableHead className="text-right">Allocations</TableHead>
                      <TableHead className="text-right">Rollovers</TableHead>
                      <TableHead className="text-right">Closing Balance</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ledgerSummaries.map((summary) => (
                      <TableRow key={summary.date}>
                        <TableCell className="font-medium">
                          {formatDate(summary.date)}
                        </TableCell>
                        <TableCell>
                          <div className="text-center">
                            <span className="font-medium">{summary.totalPSPs}</span>
                            <div className="text-xs text-muted-foreground">active</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(summary.totalOpeningBalance)}
                        </TableCell>
                        <TableCell className={`text-right font-medium ${
                          (summary.totalInflow - summary.totalOutflow) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {(summary.totalInflow - summary.totalOutflow) >= 0 ? '+' : ''}
                          {formatCurrency(summary.totalInflow - summary.totalOutflow)}
                        </TableCell>
                        <TableCell className="text-right text-amber-600">
                          {formatCurrency(summary.totalCommission)}
                        </TableCell>
                        <TableCell className="text-right text-blue-600">
                          {formatCurrency(summary.totalAllocations)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(summary.totalRollovers)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(summary.totalClosingBalance)}
                        </TableCell>
                        <TableCell>
                          {getReconciliationBadge(summary.reconciliationStatus)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  )
}