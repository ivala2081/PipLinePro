import React from 'react'
import { Card, CardContent } from '../ui/card'
import { ArrowUpRight, ArrowDownRight, CircleDollarSign, Coins, Activity, TrendingUpDown } from 'lucide-react'
import { useTranslation } from '../../contexts/TranslationContext'
import { formatPercentage } from './utils'

interface KPICardsProps {
  totalRevenue: number
  totalCommission: number
  totalTransactions: number
  avgGrowthRate: number
  revenueGrowth: number
  commissionGrowth: number
  currentMonth: any
}

export function KPICards({ 
  totalRevenue, 
  totalCommission, 
  totalTransactions, 
  avgGrowthRate,
  revenueGrowth,
  commissionGrowth,
  currentMonth 
}: KPICardsProps) {
  const { t, formatCurrency } = useTranslation()

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/30">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent" />
        <CardContent className="relative p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 backdrop-blur-sm rounded-xl border border-blue-200/50">
              <CircleDollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-700/80 dark:text-blue-300/80">{t('revenue.totalRevenue')}</p>
              <p className="text-2xl font-semibold text-blue-900 dark:text-blue-100 mb-1">
                {formatCurrency(totalRevenue)}
              </p>
              <div className="flex items-center gap-1">
                {revenueGrowth >= 0 ? (
                  <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-500" />
                )}
                <span className={`text-sm font-medium ${revenueGrowth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {formatPercentage(revenueGrowth)}
                </span>
                <span className="text-xs text-muted-foreground">{t('dashboard.vsLastMonth')}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/50 dark:to-emerald-900/30">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent" />
        <CardContent className="relative p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 backdrop-blur-sm rounded-xl border border-emerald-200/50">
              <Coins className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-emerald-700/80 dark:text-emerald-300/80">{t('revenue.commission')}</p>
              <p className="text-2xl font-semibold text-emerald-900 dark:text-emerald-100 mb-1">
                {formatCurrency(totalCommission)}
              </p>
              <div className="flex items-center gap-1">
                {commissionGrowth >= 0 ? (
                  <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-500" />
                )}
                <span className={`text-sm font-medium ${commissionGrowth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {formatPercentage(commissionGrowth)}
                </span>
                <span className="text-xs text-muted-foreground">{t('dashboard.vsLastMonth')}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/50 dark:to-purple-900/30">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent" />
        <CardContent className="relative p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 backdrop-blur-sm rounded-xl border border-purple-200/50">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-purple-700/80 dark:text-purple-300/80">{t('revenue.transactions')}</p>
              <p className="text-2xl font-semibold text-purple-900 dark:text-purple-100 mb-1">
                {totalTransactions.toLocaleString()}
              </p>
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-foreground">
                  {formatCurrency(currentMonth.avgTransactionSize)}
                </span>
                <span className="text-xs text-muted-foreground">{t('dashboard.avgSize')}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/50 dark:to-amber-900/30">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent" />
        <CardContent className="relative p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 backdrop-blur-sm rounded-xl border border-amber-200/50">
              <TrendingUpDown className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-700/80 dark:text-amber-300/80">{t('revenue.avgGrowth')}</p>
              <p className="text-2xl font-semibold text-amber-900 dark:text-amber-100 mb-1">
                {formatPercentage(avgGrowthRate)}
              </p>
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-foreground">
                  {currentMonth.commissionRate.toFixed(2)}%
                </span>
                <span className="text-xs text-muted-foreground">{t('dashboard.commissionRate')}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}