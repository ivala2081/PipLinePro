import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { useTranslation } from '../contexts/TranslationContext'
import { TrendingUp, TrendingDown, RefreshCw, DollarSign, Euro, Banknote } from 'lucide-react'

interface ExchangeRate {
  currency: string
  symbol: string
  rate: number
  change: number
  changePercent: number
  icon: React.ReactNode
}

export function ExchangeRateWidget() {
  const { t, formatCurrency } = useTranslation()
  const [rates, setRates] = useState<ExchangeRate[]>([
    {
      currency: 'USD/TL',
      symbol: '$',
      rate: 34.25,
      change: 0.15,
      changePercent: 0.44,
      icon: <DollarSign className="w-4 h-4" />
    },
    {
      currency: 'EUR/TL',
      symbol: '€',
      rate: 37.12,
      change: -0.08,
      changePercent: -0.22,
      icon: <Euro className="w-4 h-4" />
    },
    {
      currency: 'GBP/TL',
      symbol: '£',
      rate: 43.58,
      change: 0.23,
      changePercent: 0.53,
      icon: <Banknote className="w-4 h-4" />
    }
  ])

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRates(prevRates => 
        prevRates.map(rate => {
          const changeAmount = (Math.random() - 0.5) * 0.1
          const newRate = Math.max(0, rate.rate + changeAmount)
          const change = newRate - rate.rate
          const changePercent = (change / rate.rate) * 100
          
          return {
            ...rate,
            rate: parseFloat(newRate.toFixed(2)),
            change: parseFloat(change.toFixed(2)),
            changePercent: parseFloat(changePercent.toFixed(2))
          }
        })
      )
      setLastUpdate(new Date())
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setRates(prevRates => 
        prevRates.map(rate => ({
          ...rate,
          rate: rate.rate + (Math.random() - 0.5) * 0.2,
          change: (Math.random() - 0.5) * 0.3,
          changePercent: (Math.random() - 0.5) * 1.5
        }))
      )
      setLastUpdate(new Date())
      setIsRefreshing(false)
    }, 1000)
  }

  return (
    <Card className="border border-border">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              {t('common.exchangeRates') || 'Exchange Rates'}
            </CardTitle>
            <CardDescription className="mt-1">
              {t('common.realTimeRates') || 'Real-time currency exchange rates'}
            </CardDescription>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 hover:bg-muted rounded-md transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-4">
          {rates.map((rate, index) => (
            <div key={rate.currency} className="flex items-center justify-between p-3 border border-border rounded-md">
              <div className="flex items-center gap-3">
                <div className="p-2 border border-border rounded-md">
                  {rate.icon}
                </div>
                <div>
                  <div className="text-sm font-medium">{rate.currency}</div>
                  <div className="text-xl font-medium">₺{rate.rate.toFixed(2)}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 mb-1">
                  {rate.changePercent >= 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span className="text-sm">
                    {rate.changePercent >= 0 ? '+' : ''}{rate.changePercent.toFixed(2)}%
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {rate.change >= 0 ? '+' : ''}₺{rate.change.toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>{t('common.lastUpdated') || 'Last updated'}</span>
          <span>{lastUpdate.toLocaleTimeString()}</span>
        </div>
      </CardContent>
    </Card>
  )
}