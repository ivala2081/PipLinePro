import React from 'react'
import { useTranslation } from '../../contexts/TranslationContext'

interface CustomTooltipProps {
  active?: boolean
  payload?: any[]
  label?: string
}

export function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  const { formatCurrency } = useTranslation()

  if (active && payload && payload.length) {
    return (
      <div className="bg-card/95 backdrop-blur-sm border border-border/50 rounded-xl p-4 shadow-xl">
        <p className="font-medium text-foreground mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium text-foreground">
              {typeof entry.value === 'number' ? formatCurrency(entry.value) : entry.value}
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}