import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { useTranslation } from '../contexts/TranslationContext'
import { 
  ArrowRightLeft, 
  ArrowUpRight, 
  ArrowDownRight, 
  ExternalLink,
  TrendingUp,
  TrendingDown
} from 'lucide-react'

interface Transaction {
  id: string
  client: string
  company: string
  type: 'deposit' | 'withdrawal'
  amount: number
  currency: string
  commission: number
  psp: string
  status: 'completed' | 'pending' | 'failed'
  date: string
  time: string
}

export function RecentTransactions() {
  const { t, formatCurrency, formatDateTime } = useTranslation()

  const transactions: Transaction[] = [
    {
      id: 'TXN-001247',
      client: 'Ahmet Yılmaz',
      company: 'Tech Solutions Ltd.',
      type: 'deposit',
      amount: 125000,
      currency: 'TRY',
      commission: 3625,
      psp: 'PayPal',
      status: 'completed',
      date: '2024-01-15',
      time: '14:23'
    },
    {
      id: 'TXN-001246',
      client: 'Sarah Johnson',
      company: 'Global Imports Inc.',
      type: 'withdrawal',
      amount: 850,
      currency: 'USD',
      commission: 0,
      psp: 'Stripe',
      status: 'completed',
      date: '2024-01-15',
      time: '13:45'
    },
    {
      id: 'TXN-001245',
      client: 'Maria Rodriguez',
      company: 'Export Partners SA',
      type: 'deposit',
      amount: 2100,
      currency: 'EUR',
      commission: 60.90,
      psp: 'Iyzico',
      status: 'pending',
      date: '2024-01-15',
      time: '12:18'
    },
    {
      id: 'TXN-001244',
      client: 'David Chen',
      company: 'Manufacturing Co.',
      type: 'deposit',
      amount: 95000,
      currency: 'TRY',
      commission: 2755,
      psp: 'Square',
      status: 'completed',
      date: '2024-01-15',
      time: '11:34'
    },
    {
      id: 'TXN-001243',
      client: 'Emma Thompson',
      company: 'Consulting Group',
      type: 'withdrawal',
      amount: 1200,
      currency: 'USD',
      commission: 0,
      psp: 'Adyen',
      status: 'failed',
      date: '2024-01-15',
      time: '10:52'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'border-green-200 text-green-800'
      case 'pending': return 'border-yellow-200 text-yellow-800'
      case 'failed': return 'border-red-200 text-red-800'
      default: return 'border-gray-200 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return t('transactions.completed')
      case 'pending': return t('transactions.pending')
      case 'failed': return t('transactions.failed')
      default: return status
    }
  }

  const getTypeIcon = (type: string) => {
    return type === 'deposit' ? 
      <ArrowDownRight className="w-4 h-4" /> : 
      <ArrowUpRight className="w-4 h-4" />
  }

  const getTypeText = (type: string) => {
    return type === 'deposit' ? t('transactions.deposit') : t('transactions.withdrawal')
  }

  return (
    <Card className="border border-border">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4" />
              {t('nav.transactions')}
            </CardTitle>
            <CardDescription className="mt-1">
              {t('common.recentActivity') || 'Recent transaction activity and status updates'}
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm">
            <ExternalLink className="w-4 h-4 mr-2" />
            {t('common.viewAll') || 'View All'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-3">
          {transactions.map((transaction, index) => (
            <div key={transaction.id} className="flex items-center justify-between p-3 border border-border rounded-md">
              <div className="flex items-center gap-3">
                <div className="p-2 border border-border rounded-md">
                  {getTypeIcon(transaction.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{transaction.client}</span>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getStatusColor(transaction.status)}`}
                    >
                      {getStatusText(transaction.status)}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {transaction.company} • {transaction.psp}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDateTime(`${transaction.date}T${transaction.time}`)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">
                  {transaction.type === 'deposit' ? '+' : '-'}
                  {formatCurrency(transaction.amount, transaction.currency)}
                </div>
                {transaction.commission > 0 && (
                  <div className="text-sm text-muted-foreground">
                    {t('transactions.commission')}: {formatCurrency(transaction.commission, transaction.currency)}
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  {transaction.id}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-border">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-muted-foreground">{t('common.totalDeposits') || 'Total Deposits'}: </span>
              <span className="font-medium">
                {formatCurrency(222100)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              <span className="text-muted-foreground">{t('common.totalWithdrawals') || 'Total Withdrawals'}: </span>
              <span className="font-medium">
                {formatCurrency(2050)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}