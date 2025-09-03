import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { useTranslation } from '../contexts/TranslationContext'
import { Users, Crown, Star, User, TrendingUp } from 'lucide-react'

interface ClientSegment {
  segment: 'VIP' | 'Premium' | 'Regular' | 'Standard'
  count: number
  totalVolume: number
  avgTransaction: number
  commission: number
  primaryCurrency: string
  primaryPsp: string
  icon: React.ReactNode
}

export function ClientSegmentation() {
  const { t, formatCurrency } = useTranslation()

  const segments: ClientSegment[] = [
    {
      segment: 'VIP',
      count: 8,
      totalVolume: 2850000,
      avgTransaction: 356250,
      commission: 82650,
      primaryCurrency: 'USD',
      primaryPsp: 'PayPal',
      icon: <Crown className="w-4 h-4" />
    },
    {
      segment: 'Premium',
      count: 24,
      totalVolume: 1680000,
      avgTransaction: 70000,
      commission: 48720,
      primaryCurrency: 'EUR',
      primaryPsp: 'Stripe',
      icon: <Star className="w-4 h-4" />
    },
    {
      segment: 'Regular',
      count: 52,
      totalVolume: 890000,
      avgTransaction: 17115,
      commission: 25810,
      primaryCurrency: 'TL',
      primaryPsp: 'Iyzico',
      icon: <User className="w-4 h-4" />
    },
    {
      segment: 'Standard',
      count: 34,
      totalVolume: 147300,
      avgTransaction: 4332,
      commission: 4272,
      primaryCurrency: 'TL',
      primaryPsp: 'Square',
      icon: <Users className="w-4 h-4" />
    }
  ]

  const totalClients = segments.reduce((sum, segment) => sum + segment.count, 0)
  const totalVolume = segments.reduce((sum, segment) => sum + segment.totalVolume, 0)
  const totalCommission = segments.reduce((sum, segment) => sum + segment.commission, 0)

  const getSegmentText = (segment: string) => {
    switch (segment) {
      case 'VIP': return t('transactions.vip')
      case 'Premium': return t('transactions.premium')  
      case 'Regular': return t('transactions.regular')
      case 'Standard': return t('transactions.standard')
      default: return segment
    }
  }

  return (
    <Card className="border border-border">
      <CardHeader className="border-b border-border">
        <CardTitle className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          {t('transactions.clientAnalytics')}
        </CardTitle>
        <CardDescription className="mt-1">
          {t('transactions.clientAnalyticsDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-4">
          {segments.map((segment, index) => {
            const volumePercentage = (segment.totalVolume / totalVolume) * 100
            const clientPercentage = (segment.count / totalClients) * 100
            
            return (
              <div key={segment.segment} className="p-3 border border-border rounded-md">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 border border-border rounded-md">
                      {segment.icon}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{getSegmentText(segment.segment)}</div>
                      <div className="text-sm text-muted-foreground">
                        {segment.count} {t('common.clients') || 'clients'} ({clientPercentage.toFixed(1)}%)
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{formatCurrency(segment.totalVolume)}</div>
                    <div className="text-sm text-muted-foreground">
                      {volumePercentage.toFixed(1)}% {t('transactions.totalVolume')}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                  <div>
                    <div className="text-muted-foreground mb-1">
                      {t('transactions.avgTransaction')}
                    </div>
                    <div className="font-medium">{formatCurrency(segment.avgTransaction)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1">
                      {t('transactions.commission')}
                    </div>
                    <div className="font-medium">{formatCurrency(segment.commission)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs mb-3">
                  <div>
                    <span className="text-muted-foreground">{t('transactions.primaryCurrency')}: </span>
                    <Badge variant="outline" className="text-xs">
                      {segment.primaryCurrency}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('transactions.primaryPsp')}: </span>
                    <Badge variant="outline" className="text-xs">
                      {segment.primaryPsp}
                    </Badge>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">
                      {t('common.volumeShare') || 'Volume Share'}
                    </span>
                    <span className="font-medium">{volumePercentage.toFixed(1)}%</span>
                  </div>
                  <Progress value={volumePercentage} className="h-2" />
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-border">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-sm text-muted-foreground mb-1">
                {t('common.totalClients') || 'Total Clients'}
              </div>
              <div className="font-medium text-lg">{totalClients}</div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +12 {t('common.thisMonth') || 'this month'}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">
                {t('common.totalVolume') || 'Total Volume'}
              </div>
              <div className="font-medium text-lg">{formatCurrency(totalVolume)}</div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +8.5%
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">
                {t('common.totalCommission') || 'Total Commission'}
              </div>
              <div className="font-medium text-lg">{formatCurrency(totalCommission)}</div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +15.2%
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}