import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Checkbox } from '../components/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Progress } from '../components/ui/progress'
import { Separator } from '../components/ui/separator'
import { Alert, AlertDescription } from '../components/ui/alert'
import { useAuth } from '../contexts/AuthContext'
import { usePSP } from '../contexts/PSPContext'
import { toast } from 'sonner@2.0.3'
import { 
  Search, 
  Filter, 
  Plus, 
  Download, 
  Upload, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  CalendarDays,
  TrendingUp,
  FileSpreadsheet,
  DollarSign,
  Users,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Banknote,
  Building,
  LineChart,
  Activity
} from 'lucide-react'

// Transaction Data Model
interface Transaction {
  // Identification
  id: string
  autoIncrement: number
  
  // Client Information
  clientName: string
  company?: string
  
  // Financial Data (15,2 decimal precision)
  amount: number
  commission: number
  netAmount: number
  
  // Transaction Details
  date: string
  category: 'DEP' | 'WD' // Deposit/Withdrawal
  paymentMethod: string
  psp: string // Payment Service Provider
  
  // Currency Support
  baseCurrency: 'TRY' | 'USD' | 'EUR'
  tryAmount: number // Turkish Lira conversion
  exchangeRate: number
  
  // Metadata
  createdAt: string
  lastUpdate: string
  creatorUserId: string
  notes?: string
  
  // Status
  status: 'completed' | 'pending' | 'failed'
}

// Client Analytics
interface ClientAnalytics {
  clientName: string
  totalVolume: number
  totalCommission: number
  transactionCount: number
  averageTransactionValue: number
  firstTransactionDate: string
  lastTransactionDate: string
  segmentType: 'VIP' | 'Premium' | 'Regular' | 'Standard'
  currencyDistribution: Record<string, number>
  pspDistribution: Record<string, number>
}

// Exchange Rate Service
const exchangeRateService = {
  async getCurrentRates(): Promise<Record<string, number>> {
    // Simulate Yahoo Finance API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          USD: 34.25 + (Math.random() - 0.5) * 0.5, // 34.0 - 34.5 range
          EUR: 37.48 + (Math.random() - 0.5) * 0.5, // 37.2 - 37.7 range
          TRY: 1.0
        })
      }, 1000)
    })
  },
  
  validateRate(currency: string, rate: number): boolean {
    switch (currency) {
      case 'USD': return rate >= 20 && rate <= 50
      case 'EUR': return rate >= 20 && rate <= 60
      case 'TRY': return rate === 1.0
      default: return false
    }
  }
}

const paymentMethods = [
  'Credit Card',
  'Tether',
  'IBAN'
]

// Mock transaction data with proper structure
const mockTransactions: Transaction[] = [
  {
    id: 'TXN-001',
    autoIncrement: 1,
    clientName: 'Acme Corporation',
    company: 'Technology Solutions',
    amount: 25000,
    commission: 27.50, // 0.11% for CPO PY KK
    netAmount: 24972.50,
    date: '2024-01-15',
    category: 'DEP',
    paymentMethod: 'Credit Card',
    psp: 'CPO PY KK',
    baseCurrency: 'USD',
    tryAmount: 856250,
    exchangeRate: 34.25,
    createdAt: '2024-01-15T10:30:00Z',
    lastUpdate: '2024-01-15T10:30:00Z',
    creatorUserId: 'admin',
    notes: 'Monthly subscription payment',
    status: 'completed'
  },
  {
    id: 'TXN-002',
    autoIncrement: 2,
    clientName: 'Tech Solutions Ltd',
    company: 'Software Development',
    amount: 15000,
    commission: 0, // Withdrawals always have 0% commission
    netAmount: 15000,
    date: '2024-01-15',
    category: 'WD',
    paymentMethod: 'IBAN',
    psp: 'CPO',
    baseCurrency: 'EUR',
    tryAmount: 562200,
    exchangeRate: 37.48,
    createdAt: '2024-01-15T09:15:00Z',
    lastUpdate: '2024-01-15T09:15:00Z',
    creatorUserId: 'manager',
    notes: 'Customer refund request',
    status: 'completed'
  },
  {
    id: 'TXN-003',
    autoIncrement: 3,
    clientName: 'Global Trading Inc',
    company: 'Financial Services',
    amount: 850000,
    commission: 680.00, // 0.08% for ATATP
    netAmount: 849320.00,
    date: '2024-01-15',
    category: 'DEP',
    paymentMethod: 'IBAN',
    psp: 'ATATP',
    baseCurrency: 'TRY',
    tryAmount: 850000,
    exchangeRate: 1.0,
    createdAt: '2024-01-15T08:45:00Z',
    lastUpdate: '2024-01-15T08:45:00Z',
    creatorUserId: 'admin',
    status: 'pending'
  },
  {
    id: 'TXN-004',
    autoIncrement: 4,
    clientName: 'E-commerce Solutions',
    company: 'Retail Technology',
    amount: 5000,
    commission: 6.00, // 0.12% for SİPAY
    netAmount: 4994.00,
    date: '2024-01-14',
    category: 'DEP',
    paymentMethod: 'Credit Card',
    psp: 'SİPAY',
    baseCurrency: 'USD',
    tryAmount: 171250,
    exchangeRate: 34.25,
    createdAt: '2024-01-14T16:20:00Z',
    lastUpdate: '2024-01-14T16:20:00Z',
    creatorUserId: 'operator',
    status: 'completed'
  },
  {
    id: 'TXN-005',
    autoIncrement: 5,
    clientName: 'Manufacturing Corp',
    company: 'Industrial Solutions',
    amount: 75000,
    commission: 0, // Withdrawal - always 0% commission
    netAmount: 75000,
    date: '2024-01-14',
    category: 'WD',
    paymentMethod: 'IBAN',
    psp: 'FILBOX KK',
    baseCurrency: 'EUR',
    tryAmount: 2811000,
    exchangeRate: 37.48,
    createdAt: '2024-01-14T14:30:00Z',
    lastUpdate: '2024-01-14T14:30:00Z',
    creatorUserId: 'admin',
    notes: 'Quarterly profit distribution',
    status: 'completed'
  }
]

export default function TransactionsPage() {
  const { user, hasPermission } = useAuth()
  const { psps, getActivePsps, getPspByName } = usePSP()
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({
    USD: 34.25,
    EUR: 37.48,
    TRY: 1.0
  })
  
  const [filters, setFilters] = useState({
    category: 'all',
    currency: 'all',
    psp: 'all',
    status: 'all',
    paymentMethod: 'all',
    dateRange: 'all',
    company: 'all'
  })

  // Form state for new transaction
  const [newTransaction, setNewTransaction] = useState({
    clientName: '',
    company: '',
    amount: '',
    category: 'DEP' as 'DEP' | 'WD',
    baseCurrency: 'TRY' as 'TRY' | 'USD' | 'EUR',
    psp: '',
    paymentMethod: '',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  })

  const canCreate = hasPermission('transactions.create') || hasPermission('*')
  const canUpdate = hasPermission('transactions.update') || hasPermission('*')
  const canDelete = hasPermission('transactions.delete') || hasPermission('*')
  const canView = hasPermission('transactions.view') || hasPermission('*')

  // Load exchange rates on component mount
  useEffect(() => {
    loadExchangeRates()
  }, [])

  const loadExchangeRates = async () => {
    try {
      const rates = await exchangeRateService.getCurrentRates()
      setExchangeRates(rates)
    } catch (error) {
      toast.error('Failed to load exchange rates', {
        description: 'Using cached rates for transactions'
      })
    }
  }

  // Commission Calculation Engine
  const calculateCommission = (amount: number, category: 'DEP' | 'WD', psp: string): number => {
    // CRITICAL BUSINESS RULE: Withdrawals ALWAYS have 0% commission
    if (category === 'WD') return 0
    
    // For deposits, use PSP-specific rate from context
    const pspConfig = getPspByName(psp)
    const commissionRate = pspConfig ? pspConfig.commissionRate : 0
    
    return (amount * commissionRate)
  }

  const calculateTRYAmount = (amount: number, currency: string): number => {
    const rate = exchangeRates[currency] || 1
    return amount * rate
  }

  // Format functions
  const formatCurrency = (amount: number, currency: string): string => {
    const symbols = { TRY: '₺', USD: '$', EUR: '€' }
    const symbol = symbols[currency as keyof typeof symbols] || currency
    return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="outline" className="gap-1">
            <CheckCircle className="w-3 h-3" />
            Completed
          </Badge>
        )
      case 'pending':
        return (
          <Badge variant="outline" className="gap-1">
            <Clock className="w-3 h-3" />
            Pending
          </Badge>
        )
      case 'failed':
        return (
          <Badge variant="outline" className="gap-1">
            <XCircle className="w-3 h-3" />
            Failed
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getCategoryBadge = (category: 'DEP' | 'WD') => {
    if (category === 'DEP') {
      return (
        <Badge variant="outline" className="gap-1">
          <ArrowDownRight className="w-3 h-3" />
          Deposit
        </Badge>
      )
    } else {
      return (
        <Badge variant="outline" className="gap-1">
          <ArrowUpRight className="w-3 h-3" />
          Withdrawal
        </Badge>
      )
    }
  }

  // Filtering and search
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.psp.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (transaction.company || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = filters.category === 'all' || transaction.category === filters.category
    const matchesCurrency = filters.currency === 'all' || transaction.baseCurrency === filters.currency
    const matchesPsp = filters.psp === 'all' || transaction.psp === filters.psp
    const matchesStatus = filters.status === 'all' || transaction.status === filters.status
    const matchesPaymentMethod = filters.paymentMethod === 'all' || transaction.paymentMethod === filters.paymentMethod
    const matchesCompany = filters.company === 'all' || transaction.company === filters.company

    return matchesSearch && matchesCategory && matchesCurrency && matchesPsp && 
           matchesStatus && matchesPaymentMethod && matchesCompany
  })

  // Get unique values for filters
  const uniqueCurrencies = [...new Set(transactions.map(t => t.baseCurrency))]
  const uniquePSPs = [...new Set(transactions.map(t => t.psp))]
  const uniqueCompanies = [...new Set(transactions.map(t => t.company).filter(Boolean))]
  const activePsps = getActivePsps()

  // Analytics calculations
  const totalVolume = transactions.reduce((sum, t) => sum + t.tryAmount, 0)
  const totalCommissions = transactions.reduce((sum, t) => sum + t.commission, 0)
  const avgTransactionValue = transactions.length > 0 ? totalVolume / transactions.length : 0
  
  const depositCount = transactions.filter(t => t.category === 'DEP').length
  const withdrawalCount = transactions.filter(t => t.category === 'WD').length
  
  const completedTransactions = transactions.filter(t => t.status === 'completed').length
  const pendingTransactions = transactions.filter(t => t.status === 'pending').length
  const failedTransactions = transactions.filter(t => t.status === 'failed').length

  // Transaction handlers
  const handleViewTransaction = (transaction: Transaction) => {
    if (!canView) {
      toast.error('Permission denied', { description: 'You do not have permission to view transaction details' })
      return
    }
    setSelectedTransaction(transaction)
    setIsViewDialogOpen(true)
  }

  const handleDeleteTransaction = (id: string) => {
    if (!canDelete) {
      toast.error('Permission denied', { description: 'You do not have permission to delete transactions' })
      return
    }

    setTransactions(prev => prev.filter(t => t.id !== id))
    toast.success('Transaction deleted', { description: 'Transaction has been removed from the system' })
  }

  const handleAddTransaction = () => {
    if (!canCreate) {
      toast.error('Permission denied', { description: 'You do not have permission to create transactions' })
      return
    }

    const amount = parseFloat(newTransaction.amount)
    if (!amount || amount <= 0) {
      toast.error('Validation failed', { description: 'Amount must be a positive number' })
      return
    }

    const exchangeRate = exchangeRates[newTransaction.baseCurrency] || 1
    const tryAmount = calculateTRYAmount(amount, newTransaction.baseCurrency)
    const commission = calculateCommission(amount, newTransaction.category, newTransaction.psp)
    const netAmount = amount - commission

    const transaction: Transaction = {
      id: `TXN-${String(Date.now()).slice(-6)}`,
      autoIncrement: transactions.length + 1,
      clientName: newTransaction.clientName.trim(),
      company: newTransaction.company.trim(),
      amount,
      commission,
      netAmount,
      date: newTransaction.date,
      category: newTransaction.category,
      paymentMethod: newTransaction.paymentMethod,
      psp: newTransaction.psp,
      baseCurrency: newTransaction.baseCurrency,
      tryAmount,
      exchangeRate,
      createdAt: new Date().toISOString(),
      lastUpdate: new Date().toISOString(),
      creatorUserId: user?.username || 'unknown',
      notes: newTransaction.notes.trim(),
      status: 'pending'
    }

    setTransactions(prev => [transaction, ...prev])
    setIsAddDialogOpen(false)
    setNewTransaction({
      clientName: '',
      company: '',
      amount: '',
      category: 'DEP',
      baseCurrency: 'TRY',
      psp: '',
      paymentMethod: '',
      notes: '',
      date: new Date().toISOString().split('T')[0]
    })

    toast.success('Transaction created', {
      description: `${transaction.category} of ${formatCurrency(amount, newTransaction.baseCurrency)} has been added`
    })
  }

  return (
    <main className="flex-1 p-6 space-y-6 bg-muted/20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2">
            <CreditCard className="w-8 h-8" />
            Transactions
          </h1>
          <p className="text-muted-foreground">
            Manage and monitor all financial transactions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={!canCreate}>
                <Plus className="w-4 h-4 mr-2" />
                New Transaction
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Transaction</DialogTitle>
                <DialogDescription>
                  Create a new transaction record
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="client-name">Client Name</Label>
                    <Input
                      id="client-name"
                      placeholder="Enter client name"
                      value={newTransaction.clientName}
                      onChange={(e) => setNewTransaction(prev => ({ ...prev, clientName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      placeholder="Enter company"
                      value={newTransaction.company}
                      onChange={(e) => setNewTransaction(prev => ({ ...prev, company: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      value={newTransaction.amount}
                      onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select value={newTransaction.baseCurrency} onValueChange={(value) => setNewTransaction(prev => ({ ...prev, baseCurrency: value as 'TRY' | 'USD' | 'EUR' }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TRY">Turkish Lira (₺)</SelectItem>
                        <SelectItem value="USD">US Dollar ($)</SelectItem>
                        <SelectItem value="EUR">Euro (€)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={newTransaction.category} onValueChange={(value) => setNewTransaction(prev => ({ ...prev, category: value as 'DEP' | 'WD' }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DEP">Deposit</SelectItem>
                        <SelectItem value="WD">Withdrawal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="psp">PSP</Label>
                    <Select value={newTransaction.psp} onValueChange={(value) => setNewTransaction(prev => ({ ...prev, psp: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select PSP" />
                      </SelectTrigger>
                      <SelectContent>
                        {activePsps.map((psp) => (
                          <SelectItem key={psp.id} value={psp.name}>
                            {psp.name} ({(psp.commissionRate * 100).toFixed(3)}%)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="payment-method">Payment Method</Label>
                    <Select value={newTransaction.paymentMethod} onValueChange={(value) => setNewTransaction(prev => ({ ...prev, paymentMethod: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map((method) => (
                          <SelectItem key={method} value={method}>
                            {method}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newTransaction.date}
                      onChange={(e) => setNewTransaction(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any notes or comments"
                    value={newTransaction.notes}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddTransaction}>
                  Create Transaction
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs defaultValue="transactions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4" />
            All Transactions
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <LineChart className="w-4 h-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="recent" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Recent Activity
          </TabsTrigger>
        </TabsList>

        {/* All Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2 flex-1 min-w-[300px]">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1"
                  />
                </div>
                
                <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger className="w-[140px] h-10">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="DEP">Deposits</SelectItem>
                    <SelectItem value="WD">Withdrawals</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.currency} onValueChange={(value) => setFilters(prev => ({ ...prev, currency: value }))}>
                  <SelectTrigger className="w-[120px] h-10">
                    <SelectValue placeholder="Currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Currencies</SelectItem>
                    {uniqueCurrencies.map(currency => (
                      <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="w-[120px] h-10">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.psp} onValueChange={(value) => setFilters(prev => ({ ...prev, psp: value }))}>
                  <SelectTrigger className="w-[140px] h-10">
                    <SelectValue placeholder="PSP" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All PSPs</SelectItem>
                    {uniquePSPs.map(psp => (
                      <SelectItem key={psp} value={psp}>{psp}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Transactions Table */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                Complete list of all transactions with detailed information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="h-12 px-6 text-left align-middle">Client</TableHead>
                      <TableHead className="h-12 px-6 text-left align-middle">Category</TableHead>
                      <TableHead className="h-12 px-6 text-left align-middle">Company</TableHead>
                      <TableHead className="h-12 px-6 text-right align-middle">Amount</TableHead>
                      <TableHead className="h-12 px-6 text-right align-middle">Commission</TableHead>
                      <TableHead className="h-12 px-6 text-right align-middle">Net Amount</TableHead>
                      <TableHead className="h-12 px-6 text-center align-middle">Currency</TableHead>
                      <TableHead className="h-12 px-6 text-left align-middle">PSP</TableHead>
                      <TableHead className="h-12 px-6 text-center align-middle">Status</TableHead>
                      <TableHead className="h-12 px-6 text-center align-middle">Date</TableHead>
                      <TableHead className="h-12 px-6 text-center align-middle w-32">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id} className="group hover:bg-muted/50">
                        <TableCell className="px-6 py-4 align-middle">
                          <div>
                            <p className="font-medium">{transaction.clientName}</p>
                            <p className="text-xs text-muted-foreground">{transaction.id}</p>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4 align-middle">
                          {getCategoryBadge(transaction.category)}
                        </TableCell>
                        <TableCell className="px-6 py-4 align-middle">
                          <p className="text-sm">{transaction.company || '-'}</p>
                        </TableCell>
                        <TableCell className="px-6 py-4 align-middle text-right">
                          <p className="font-mono">
                            {formatCurrency(transaction.amount, transaction.baseCurrency)}
                          </p>
                        </TableCell>
                        <TableCell className="px-6 py-4 align-middle text-right">
                          <p className="font-mono text-sm">
                            {formatCurrency(transaction.commission, transaction.baseCurrency)}
                          </p>
                        </TableCell>
                        <TableCell className="px-6 py-4 align-middle text-right">
                          <p className="font-mono">
                            {formatCurrency(transaction.netAmount, transaction.baseCurrency)}
                          </p>
                        </TableCell>
                        <TableCell className="px-6 py-4 align-middle text-center">
                          <Badge variant="secondary">
                            {transaction.baseCurrency}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-6 py-4 align-middle">
                          <p className="text-sm font-medium">{transaction.psp}</p>
                          <p className="text-xs text-muted-foreground">{transaction.paymentMethod}</p>
                        </TableCell>
                        <TableCell className="px-6 py-4 align-middle text-center">
                          {getStatusBadge(transaction.status)}
                        </TableCell>
                        <TableCell className="px-6 py-4 align-middle text-center">
                          <p className="text-sm">{new Date(transaction.date).toLocaleDateString()}</p>
                        </TableCell>
                        <TableCell className="px-6 py-4 align-middle">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewTransaction(transaction)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              {canUpdate && (
                                <DropdownMenuItem>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                              )}
                              {canDelete && (
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => handleDeleteTransaction(transaction.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Total Volume</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{formatCurrency(totalVolume, 'TRY')}</div>
                <p className="text-xs text-muted-foreground">
                  Across all transactions
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Total Commissions</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{formatCurrency(totalCommissions, 'TRY')}</div>
                <p className="text-xs text-muted-foreground">
                  Revenue from commissions
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Average Transaction</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{formatCurrency(avgTransactionValue, 'TRY')}</div>
                <p className="text-xs text-muted-foreground">
                  Per transaction average
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Total Transactions</CardTitle>
                <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{transactions.length}</div>
                <p className="text-xs text-muted-foreground">
                  {depositCount} deposits, {withdrawalCount} withdrawals
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Transaction Status Overview</CardTitle>
                <CardDescription>
                  Breakdown of transaction statuses
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Completed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>{completedTransactions}</span>
                    <Progress value={(completedTransactions / transactions.length) * 100} className="w-20" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <span>Pending</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>{pendingTransactions}</span>
                    <Progress value={(pendingTransactions / transactions.length) * 100} className="w-20" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span>Failed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>{failedTransactions}</span>
                    <Progress value={(failedTransactions / transactions.length) * 100} className="w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Currency Distribution</CardTitle>
                <CardDescription>
                  Transaction volume by currency
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {uniqueCurrencies.map((currency) => {
                  const currencyTransactions = transactions.filter(t => t.baseCurrency === currency)
                  const currencyVolume = currencyTransactions.reduce((sum, t) => sum + t.amount, 0)
                  const percentage = (currencyTransactions.length / transactions.length) * 100
                  
                  return (
                    <div key={currency} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{currency}</Badge>
                        <span>{formatCurrency(currencyVolume, currency)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>{currencyTransactions.length}</span>
                        <Progress value={percentage} className="w-20" />
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Recent Activity Tab */}
        <TabsContent value="recent" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transaction Activity</CardTitle>
              <CardDescription>
                Latest transactions and system events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.slice(0, 10).map((transaction) => (
                  <div key={transaction.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0">
                      {transaction.category === 'DEP' ? (
                        <ArrowDownRight className="h-5 w-5 text-green-600" />
                      ) : (
                        <ArrowUpRight className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm">{transaction.clientName}</p>
                        {getCategoryBadge(transaction.category)}
                        {getStatusBadge(transaction.status)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(transaction.amount, transaction.baseCurrency)} via {transaction.psp}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{new Date(transaction.createdAt).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">
                        by {transaction.creatorUserId}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Transaction Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>
              Complete information for transaction {selectedTransaction?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Transaction ID</Label>
                    <p className="text-sm font-mono">{selectedTransaction.id}</p>
                  </div>
                  <div>
                    <Label>Client Name</Label>
                    <p className="text-sm">{selectedTransaction.clientName}</p>
                  </div>
                  <div>
                    <Label>Company</Label>
                    <p className="text-sm">{selectedTransaction.company || '-'}</p>
                  </div>
                  <div>
                    <Label>Category</Label>
                    <div className="mt-1">
                      {getCategoryBadge(selectedTransaction.category)}
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label>Amount</Label>
                    <p className="text-sm font-mono">
                      {formatCurrency(selectedTransaction.amount, selectedTransaction.baseCurrency)}
                    </p>
                  </div>
                  <div>
                    <Label>Commission</Label>
                    <p className="text-sm font-mono">
                      {formatCurrency(selectedTransaction.commission, selectedTransaction.baseCurrency)}
                    </p>
                  </div>
                  <div>
                    <Label>Net Amount</Label>
                    <p className="text-sm font-mono">
                      {formatCurrency(selectedTransaction.netAmount, selectedTransaction.baseCurrency)}
                    </p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <div className="mt-1">
                      {getStatusBadge(selectedTransaction.status)}
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>PSP</Label>
                    <p className="text-sm">{selectedTransaction.psp}</p>
                  </div>
                  <div>
                    <Label>Payment Method</Label>
                    <p className="text-sm">{selectedTransaction.paymentMethod}</p>
                  </div>
                  <div>
                    <Label>Currency</Label>
                    <p className="text-sm">{selectedTransaction.baseCurrency}</p>
                  </div>
                  <div>
                    <Label>Exchange Rate</Label>
                    <p className="text-sm font-mono">{selectedTransaction.exchangeRate}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label>Date</Label>
                    <p className="text-sm">{new Date(selectedTransaction.date).toLocaleString()}</p>
                  </div>
                  <div>
                    <Label>Created At</Label>
                    <p className="text-sm">{new Date(selectedTransaction.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <Label>Last Update</Label>
                    <p className="text-sm">{new Date(selectedTransaction.lastUpdate).toLocaleString()}</p>
                  </div>
                  <div>
                    <Label>Created By</Label>
                    <p className="text-sm">{selectedTransaction.creatorUserId}</p>
                  </div>
                </div>
              </div>
              
              {selectedTransaction.notes && (
                <>
                  <Separator />
                  <div>
                    <Label>Notes</Label>
                    <p className="text-sm mt-1 p-3 bg-muted rounded-md">{selectedTransaction.notes}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  )
}