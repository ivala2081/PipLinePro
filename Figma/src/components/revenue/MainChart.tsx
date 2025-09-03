import React from 'react'
import { ResponsiveContainer, LineChart, Line, AreaChart, Area, BarChart, Bar, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts'
import { useTranslation } from '../../contexts/TranslationContext'
import { CustomTooltip } from './CustomTooltip'

interface MainChartProps {
  data: any[]
  chartType: string
}

export function MainChart({ data, chartType }: MainChartProps) {
  const { t, formatCurrency } = useTranslation()

  const chartProps = {
    margin: { top: 20, right: 30, left: 20, bottom: 20 }
  }

  switch (chartType) {
    case 'area':
      return (
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={data} {...chartProps}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05}/>
              </linearGradient>
              <linearGradient id="commissionGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
            <XAxis 
              dataKey="month" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              dy={10}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={formatCurrency}
              dx={-10}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="totalRevenue" 
              stroke="hsl(var(--primary))" 
              strokeWidth={3}
              fill="url(#revenueGradient)"
              name={t('chart.totalRevenue')}
            />
            <Area 
              type="monotone" 
              dataKey="commission" 
              stroke="hsl(var(--chart-3))" 
              strokeWidth={2}
              fill="url(#commissionGradient)"
              name={t('chart.commission')}
            />
          </AreaChart>
        </ResponsiveContainer>
      )
    case 'bar':
      return (
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data} {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
            <XAxis 
              dataKey="month" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={formatCurrency}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="deposits" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} name={t('chart.deposits')} />
            <Bar dataKey="commission" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} name={t('chart.commission')} />
          </BarChart>
        </ResponsiveContainer>
      )
    case 'composed':
      return (
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={data} {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
            <XAxis 
              dataKey="month" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={formatCurrency}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="totalRevenue" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} name={t('chart.totalRevenue')} />
            <Line 
              type="monotone" 
              dataKey="growth" 
              stroke="hsl(var(--chart-3))" 
              strokeWidth={3}
              dot={{ r: 6, fill: 'hsl(var(--chart-3))' }}
              name={t('chart.growthRate')}
            />
            <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 2" />
          </ComposedChart>
        </ResponsiveContainer>
      )
    default:
      return (
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data} {...chartProps}>
            <defs>
              <linearGradient id="primaryGlow" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
            <XAxis 
              dataKey="month" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              dy={10}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={formatCurrency}
              dx={-10}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="totalRevenue" 
              stroke="url(#primaryGlow)"
              strokeWidth={4}
              dot={{ r: 8, fill: 'hsl(var(--primary))', strokeWidth: 3, stroke: 'hsl(var(--background))' }}
              activeDot={{ r: 10, fill: 'hsl(var(--primary))', strokeWidth: 3, stroke: 'hsl(var(--background))' }}
              name={t('chart.totalRevenue')}
            />
            <Line 
              type="monotone" 
              dataKey="netRevenue" 
              stroke="hsl(var(--chart-1))" 
              strokeWidth={3}
              strokeDasharray="5 5"
              dot={{ r: 6, fill: 'hsl(var(--chart-1))' }}
              name={t('chart.netRevenue')} 
            />
            <Line 
              type="monotone" 
              dataKey="commission" 
              stroke="hsl(var(--chart-3))" 
              strokeWidth={2}
              dot={{ r: 5, fill: 'hsl(var(--chart-3))' }}
              name={t('chart.commission')} 
            />
          </LineChart>
        </ResponsiveContainer>
      )
  }
}