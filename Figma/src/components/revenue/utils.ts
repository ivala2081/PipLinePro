export const formatPercentage = (value: number): string => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
}

export const calculateSummaryMetrics = (data: any[]) => {
  const currentMonth = data[data.length - 1]
  const previousMonth = data[data.length - 2]
  const totalRevenue = data.reduce((sum, month) => sum + month.totalRevenue, 0)
  const totalCommission = data.reduce((sum, month) => sum + month.commission, 0)
  const avgGrowthRate = data.reduce((sum, month) => sum + month.growth, 0) / data.length
  const totalTransactions = data.reduce((sum, month) => sum + month.transactions, 0)

  const revenueGrowth = ((currentMonth.totalRevenue - previousMonth.totalRevenue) / previousMonth.totalRevenue) * 100
  const commissionGrowth = ((currentMonth.commission - previousMonth.commission) / previousMonth.commission) * 100

  return {
    currentMonth,
    previousMonth,
    totalRevenue,
    totalCommission,
    avgGrowthRate,
    totalTransactions,
    revenueGrowth,
    commissionGrowth
  }
}

export const preparePSPData = (currentMonth: any, PSP_COLORS: Record<string, string>) => {
  return Object.entries(currentMonth.psps).map(([psp, value]) => ({
    name: psp,
    value: value as number,
    color: PSP_COLORS[psp as keyof typeof PSP_COLORS],
    percentage: ((value as number) / currentMonth.totalRevenue) * 100
  }))
}

export const prepareCurrencyData = (currentMonth: any) => {
  return Object.entries(currentMonth.currencies).map(([currency, value]) => ({
    name: currency,
    value: value as number,
    percentage: ((value as number) / currentMonth.totalRevenue) * 100
  }))
}