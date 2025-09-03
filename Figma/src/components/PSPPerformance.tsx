import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { useTranslation } from '../contexts/TranslationContext'
import { Building } from 'lucide-react'

interface PSPMetrics {
  name: string
  revenue: number
  commission: number
  transactions: number
  commissionRate: number
  marketShare: number
  status: 'active' | 'maintenance' | 'offline'
  performance: number
}

export function PSPPerformance() {
  const { t, formatCurrency } = useTranslation()

  const pspMetrics: PSPMetrics[] = [
    {
      name: 'PayPal',
      revenue: 1370200,
      commission: 39732,
      transactions: 547,
      commissionRate: 2.90,
      marketShare: 30.0,
      status: 'active',
      performance: 98.5
    },
    {
      name: 'Stripe',
      revenue: 1096000,
      commission: 31784,
      transactions: 432,
      commissionRate: 2.90,
      marketShare: 24.0,
      status: 'active',
      performance: 99.2
    },
    {
      name: 'Iyzico',
      revenue: 914200,
      commission: 26512,
      transactions: 389,
      commissionRate: 2.90,
      marketShare: 20.0,
      status: 'active',
      performance: 97.8
    },
    {
      name: 'Square',
      revenue: 685500,
      commission: 19880,
      transactions: 298,
      commissionRate: 2.90,
      marketShare: 15.0,
      status: 'maintenance',
      performance: 85.3
    },
    {
      name: 'Adyen',
      revenue: 501400,
      commission: 14541,
      transactions: 215,
      commissionRate: 2.90,
      marketShare: 11.0,
      status: 'active',
      performance: 96.7
    }
  ]

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return t('common.active') || 'Active'
      case 'maintenance': return t('common.maintenance') || 'Maintenance'
      case 'offline': return t('common.offline') || 'Offline'
      default: return status
    }
  }

  const totalRevenue = pspMetrics.reduce((sum, psp) => sum + psp.revenue, 0)

  return (
    <Card className="border border-border">
      <CardHeader className="border-b border-border">
        <CardTitle className="flex items-center gap-2">
          <Building className="w-4 h-4" />
          {t('transactions.pspPerformance')}
        </CardTitle>
        <CardDescription className="mt-1">
          {t('transactions.pspPerformanceDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-4">
          {pspMetrics.map((psp, index) => (
            <div key={psp.name} className="p-3 border border-border rounded-md">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="text-sm font-medium">{psp.name}</div>
                  <Badge variant="outline" className="text-xs">
                    {getStatusText(psp.status)}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{formatCurrency(psp.revenue)}</div>
                  <div className="text-xs text-muted-foreground">
                    {psp.marketShare.toFixed(1)}% {t('transactions.marketShare')}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                <div>
                  <div className="text-muted-foreground mb-1">
                    {t('transactions.commission')}
                  </div>
                  <div className="font-medium">{formatCurrency(psp.commission)}</div>
                  <div className="text-xs text-muted-foreground">
                    {psp.commissionRate}% {t('dashboard.commissionRate')}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">
                    {t('transactions.transactions')}
                  </div>
                  <div className="font-medium">{psp.transactions.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">
                    {t('common.thisMonth') || 'This month'}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t('common.performance') || 'Performance'}
                  </span>
                  <span className="font-medium">
                    {psp.performance.toFixed(1)}%
                  </span>
                </div>
                <Progress value={psp.performance} className="h-2" />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-border">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-sm text-muted-foreground mb-1">
                {t('common.totalRevenue') || 'Total Revenue'}
              </div>
              <div className="font-medium">{formatCurrency(totalRevenue)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">
                {t('common.averageRate') || 'Avg Rate'}
              </div>
              <div className="font-medium">2.90%</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">
                {t('common.totalTransactions') || 'Total Txns'}
              </div>
              <div className="font-medium">
                {pspMetrics.reduce((sum, psp) => sum + psp.transactions, 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}