import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Progress } from '../components/ui/progress'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  Area,
  AreaChart
} from 'recharts'
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  CreditCard, 
  Target,
  Calendar,
  Download,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  Activity
} from 'lucide-react'

// Mock data for analytics
const revenueData = [
  { month: 'Jan', revenue: 2400000, transactions: 324, commission: 69600 },
  { month: 'Feb', revenue: 2100000, transactions: 298, commission: 60900 },
  { month: 'Mar', revenue: 2800000, transactions: 445, commission: 81200 },
  { month: 'Apr', revenue: 3200000, transactions: 523, commission: 92800 },
  { month: 'May', revenue: 2900000, transactions: 467, commission: 84100 },
  { month: 'Jun', revenue: 3400000, transactions: 589, commission: 98600 }
]

const pspPerformanceData = [
  { name: 'PayPal', volume: 1250000, transactions: 234, commission: 36250, share: 35 },
  { name: 'Stripe', volume: 980000, transactions: 189, commission: 28420, share: 28 },
  { name: 'Iyzico', volume: 750000, transactions: 156, commission: 21750, share: 22 },
  { name: 'Square', volume: 420000, transactions: 89, commission: 12180, share: 15 }
]

const clientSegmentData = [
  { segment: 'VIP', clients: 342, volume: 1850000, color: '#8B5CF6' },
  { segment: 'Premium', clients: 589, volume: 1450000, color: '#F59E0B' },
  { segment: 'Regular', clients: 674, volume: 890000, color: '#3B82F6' },
  { segment: 'Standard', clients: 242, volume: 320000, color: '#6B7280' }
]

const currencyDistribution = [
  { currency: 'TRY', amount: 2840000, percentage: 65, color: '#10B981' },
  { currency: 'USD', amount: 985000, percentage: 22, color: '#3B82F6' },
  { currency: 'EUR', amount: 567000, percentage: 13, color: '#F59E0B' }
]

const dailyActivityData = [
  { date: '15 Jan', deposits: 12, withdrawals: 8, volume: 340000 },
  { date: '16 Jan', deposits: 15, withdrawals: 6, volume: 420000 },
  { date: '17 Jan', deposits: 9, withdrawals: 11, volume: 280000 },
  { date: '18 Jan', deposits: 18, withdrawals: 7, volume: 530000 },
  { date: '19 Jan', deposits: 14, withdrawals: 9, volume: 380000 },
  { date: '20 Jan', deposits: 21, withdrawals: 5, volume: 610000 },
  { date: '21 Jan', deposits: 16, withdrawals: 12, volume: 450000 }
]

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('6m')
  const [selectedMetric, setSelectedMetric] = useState('revenue')

  const formatCurrency = (amount: number): string => {
    return `₺${(amount / 1000).toFixed(0)}K`
  }

  const formatLargeCurrency = (amount: number): string => {
    return `₺${(amount / 1000000).toFixed(1)}M`
  }

  const calculateGrowth = (current: number, previous: number): number => {
    return ((current - previous) / previous) * 100
  }

  return (
    <main className="flex-1 p-6 space-y-6 bg-muted/20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive business intelligence and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="1m">Last month</SelectItem>
              <SelectItem value="3m">Last 3 months</SelectItem>
              <SelectItem value="6m">Last 6 months</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">₺16.8M</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+12.5%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Transactions</p>
                <p className="text-2xl font-bold">2,835</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+8.2%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Clients</p>
                <p className="text-2xl font-bold">1,847</p>
                <div className="flex items-center mt-1">
                  <TrendingDown className="w-3 h-3 text-red-500 mr-1" />
                  <span className="text-sm text-red-600">-2.1%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Commission</p>
                <p className="text-2xl font-bold">2.9%</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+0.3%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="psp">PSP Analysis</TabsTrigger>
          <TabsTrigger value="clients">Client Insights</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Revenue & Transaction Trends
                </CardTitle>
                <CardDescription>
                  Monthly revenue and transaction volume analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs fill-muted-foreground" />
                      <YAxis className="text-xs fill-muted-foreground" tickFormatter={formatLargeCurrency} />
                      <Tooltip 
                        formatter={(value: number) => [formatLargeCurrency(value), '']}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--primary))"
                        fillOpacity={0.1}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Currency Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5" />
                  Currency Distribution
                </CardTitle>
                <CardDescription>
                  Transaction volume by currency
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={currencyDistribution}
                        dataKey="percentage"
                        nameKey="currency"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ currency, percentage }) => `${currency} ${percentage}%`}
                      >
                        {currencyDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Daily Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Daily Activity
                </CardTitle>
                <CardDescription>
                  Recent transaction activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyActivityData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs fill-muted-foreground" />
                      <YAxis className="text-xs fill-muted-foreground" />
                      <Tooltip />
                      <Bar dataKey="deposits" fill="hsl(var(--chart-1))" name="Deposits" />
                      <Bar dataKey="withdrawals" fill="hsl(var(--chart-2))" name="Withdrawals" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="psp" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* PSP Performance Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>PSP Performance Comparison</CardTitle>
                <CardDescription>
                  Transaction volume and commission analysis by payment service provider
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pspPerformanceData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" className="text-xs fill-muted-foreground" />
                      <YAxis className="text-xs fill-muted-foreground" tickFormatter={formatCurrency} />
                      <Tooltip formatter={(value: number) => [formatCurrency(value), '']} />
                      <Bar dataKey="volume" fill="hsl(var(--chart-1))" name="Volume" />
                      <Bar dataKey="commission" fill="hsl(var(--chart-3))" name="Commission" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* PSP Market Share */}
            <Card>
              <CardHeader>
                <CardTitle>Market Share</CardTitle>
                <CardDescription>
                  PSP allocation by transaction volume
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {pspPerformanceData.map((psp) => (
                  <div key={psp.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{psp.name}</span>
                      <Badge variant="outline">{psp.share}%</Badge>
                    </div>
                    <Progress value={psp.share} className="h-2" />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{formatCurrency(psp.volume)}</span>
                      <span>{psp.transactions} transactions</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* PSP Efficiency */}
            <Card>
              <CardHeader>
                <CardTitle>Efficiency Metrics</CardTitle>
                <CardDescription>
                  Commission rate and transaction performance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {pspPerformanceData.map((psp) => {
                  const commissionRate = (psp.commission / psp.volume) * 100
                  const avgTransactionSize = psp.volume / psp.transactions
                  
                  return (
                    <div key={psp.name} className="p-3 rounded-lg bg-muted/30">
                      <h4 className="font-medium mb-2">{psp.name}</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Avg Commission</p>
                          <p className="font-medium">{commissionRate.toFixed(2)}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Avg Transaction</p>
                          <p className="font-medium">{formatCurrency(avgTransactionSize)}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="clients" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Client Segmentation */}
            <Card>
              <CardHeader>
                <CardTitle>Client Segmentation</CardTitle>
                <CardDescription>
                  Client distribution by transaction volume
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={clientSegmentData}
                        dataKey="clients"
                        nameKey="segment"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ segment, clients }) => `${segment}: ${clients}`}
                      >
                        {clientSegmentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Client Value Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Client Value Analysis</CardTitle>
                <CardDescription>
                  Revenue contribution by client segment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {clientSegmentData.map((segment) => {
                  const avgValue = segment.volume / segment.clients
                  const percentage = (segment.volume / clientSegmentData.reduce((sum, s) => sum + s.volume, 0)) * 100
                  
                  return (
                    <div key={segment.segment} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: segment.color }}
                          />
                          <span className="font-medium">{segment.segment}</span>
                        </div>
                        <Badge variant="outline">{percentage.toFixed(1)}%</Badge>
                      </div>
                      <Progress value={percentage} className="h-2" />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{segment.clients} clients</span>
                        <span>Avg: {formatCurrency(avgValue)}</span>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Top Performing Clients */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Top Performing Clients</CardTitle>
                <CardDescription>
                  Highest value clients by transaction volume
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: 'Global Trading Inc', volume: 1250000, transactions: 45, segment: 'VIP' },
                    { name: 'Tech Solutions Ltd', volume: 980000, transactions: 38, segment: 'VIP' },
                    { name: 'Investment Group', volume: 750000, transactions: 29, segment: 'Premium' },
                    { name: 'Finance Corp', volume: 650000, transactions: 24, segment: 'Premium' },
                    { name: 'Business Partners', volume: 420000, transactions: 18, segment: 'Regular' }
                  ].map((client, index) => (
                    <div key={client.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium">{client.name}</p>
                          <p className="text-sm text-muted-foreground">{client.transactions} transactions</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(client.volume)}</p>
                        <Badge variant="outline" className="text-xs">{client.segment}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Growth Trends */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Growth Trends</CardTitle>
                <CardDescription>
                  Month-over-month growth analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs fill-muted-foreground" />
                      <YAxis className="text-xs fill-muted-foreground" />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="transactions" 
                        stroke="hsl(var(--chart-1))" 
                        strokeWidth={2}
                        name="Transactions"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="commission" 
                        stroke="hsl(var(--chart-3))" 
                        strokeWidth={2}
                        name="Commission (in K)"
                        domain={[0, 100]}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Forecasting */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Forecast</CardTitle>
                <CardDescription>
                  Projected performance for next quarter
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">₺18.2M</p>
                  <p className="text-sm text-muted-foreground">Projected Q2 Revenue</p>
                  <Badge className="mt-2 bg-green-100 text-green-800">+8.3% growth</Badge>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Confidence Level</span>
                    <span className="text-sm font-medium">87%</span>
                  </div>
                  <Progress value={87} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Key Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Key Insights</CardTitle>
                <CardDescription>
                  Data-driven business recommendations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { title: 'Peak Transaction Hours', value: '2-4 PM UTC', trend: 'up' },
                  { title: 'Best Performing PSP', value: 'PayPal', trend: 'up' },
                  { title: 'Growing Currency', value: 'USD Transactions', trend: 'up' },
                  { title: 'Client Retention', value: '94.2%', trend: 'down' }
                ].map((insight, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <span className="text-sm">{insight.title}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{insight.value}</span>
                      {insight.trend === 'up' ? (
                        <TrendingUp className="w-3 h-3 text-green-500" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-red-500" />
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  )
}