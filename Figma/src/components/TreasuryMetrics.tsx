import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { useTranslation } from '../contexts/TranslationContext'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  Users, 
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'

export function TreasuryMetrics() {
  const { t, formatCurrency } = useTranslation()

  const metrics = [
    {
      title: t('dashboard.totalRevenue'),
      value: 4567300,
      previousValue: 3892100,
      target: 5000000,
      icon: DollarSign
    },
    {
      title: t('dashboard.commission'),
      value: 318400,
      previousValue: 269700,
      target: 350000,
      icon: CreditCard
    },
    {
      title: t('dashboard.transactions'),
      value: 1976,
      previousValue: 1689,
      target: 2200,
      icon: Activity,
      isCount: true
    },
    {
      title: t('revenue.activeClients'),
      value: 118,
      previousValue: 108,
      target: 150,
      icon: Users,
      isCount: true
    }
  ]

  const formatValue = (value: number, isCount?: boolean) => {
    if (isCount) {
      return value.toLocaleString()
    }
    return formatCurrency(value)
  }

  const getGrowthPercentage = (current: number, previous: number) => {
    return ((current - previous) / previous) * 100
  }

  const getTargetProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100)
  }

  const formatPercentage = (percentage: number) => {
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(1)}%`
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {metrics.map((metric, index) => {
        const growth = getGrowthPercentage(metric.value, metric.previousValue)
        const targetProgress = getTargetProgress(metric.value, metric.target)
        const isPositiveGrowth = growth >= 0
        
        return (
          <Card key={index} className="border border-border">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="p-2 border border-border rounded-md">
                  <metric.icon className="w-4 h-4 text-foreground" />
                </div>
                <div className="flex items-center gap-1">
                  {isPositiveGrowth ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                  <span className="text-sm text-muted-foreground">
                    {formatPercentage(growth)}
                  </span>
                </div>
              </div>
              <CardTitle className="text-sm text-muted-foreground">
                {metric.title}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="pt-0 space-y-4">
              <div className="space-y-2">
                <div className="text-2xl font-medium text-foreground">
                  {formatValue(metric.value, metric.isCount)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('dashboard.vsLastMonth')}
                </p>
              </div>

              {/* Target Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Target Progress</span>
                  <span className="text-foreground">{targetProgress.toFixed(0)}%</span>
                </div>
                <Progress value={targetProgress} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Current</span>
                  <span>Target: {formatValue(metric.target, metric.isCount)}</span>
                </div>
              </div>

              {/* Performance Badge */}
              <div className="pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Performance</span>
                  <Badge variant="outline" className="text-xs">
                    {targetProgress >= 90 ? 'Excellent' : 
                     targetProgress >= 75 ? 'Good' : 
                     targetProgress >= 50 ? 'Fair' : 'Needs Attention'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}