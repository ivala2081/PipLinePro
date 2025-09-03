import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { TreasuryMetrics } from '../components/TreasuryMetrics'
import { RevenueChart } from '../components/RevenueChart'
import { ExchangeRateWidget } from '../components/ExchangeRateWidget'
import { RecentTransactions } from '../components/RecentTransactions'
import { PSPPerformance } from '../components/PSPPerformance'
import { ClientSegmentation } from '../components/ClientSegmentation'
import { QuickActions } from '../components/QuickActions'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from '../contexts/TranslationContext'
import { 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Activity, 
  BarChart3, 
  DollarSign,
  Users,
  Building,
  Target,
  Calendar,
  ArrowUpRight,
  RefreshCw,
  Settings,
  Eye,
  TrendingDown,
  AlertTriangle,
  Info,
  Database,
  Shield,
  Zap
} from 'lucide-react'

export default function DashboardPage() {
  const { user } = useAuth()
  const { t, formatCurrency } = useTranslation()
  const [activeView, setActiveView] = useState('overview')
  const [refreshing, setRefreshing] = useState(false)

  const quickStats = [
    {
      label: t('dashboard.totalRevenue'),
      value: formatCurrency(4567300),
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign
    },
    {
      label: t('revenue.activeClients'),
      value: '118',
      change: '+8 new',
      trend: 'up',
      icon: Users
    },
    {
      label: t('transactions.totalTransactions'),
      value: '1,976',
      change: '+287',
      trend: 'up',
      icon: Activity
    },
    {
      label: t('revenue.commission'),
      value: formatCurrency(318400),
      change: '+18.1%',
      trend: 'up',
      icon: Target
    }
  ]

  const systemAlerts = [
    {
      type: 'success' as const,
      message: 'Daily balance reconciliation completed successfully',
      time: '2 minutes ago',
      priority: 'low'
    },
    {
      type: 'info' as const,
      message: 'USD exchange rate updated: 1 USD = 34.25 TL (+0.15)',
      time: '15 minutes ago',
      priority: 'medium'
    },
    {
      type: 'warning' as const,
      message: 'High transaction volume detected - monitor PSP capacity',
      time: '1 hour ago',
      priority: 'high'
    }
  ]

  const systemHealth = {
    overall: 99.8,
    database: 100,
    api: 99.5,
    psps: 98.2,
    security: 100
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 2000)
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4" />
      case 'warning': return <AlertTriangle className="w-4 h-4" />
      case 'info': return <Info className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }

  return (
    <main className="flex-1 p-6 space-y-8 bg-background">
      {/* Minimal Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-medium text-foreground">
              {t('dashboard.title')}
            </h1>
            <Badge variant="outline" className="text-sm">
              <CheckCircle className="w-3 h-3 mr-1" />
              {t('dashboard.systemOperational')}
            </Badge>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            {t('dashboard.welcome', { username: user?.username || 'User' })}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? t('common.loading') : t('common.refresh')}
          </Button>
          <Button variant="ghost" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            {t('nav.settings')}
          </Button>
        </div>
      </div>

      {/* Minimal Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat, index) => (
          <Card key={index} className="border border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 border border-border rounded-md">
                  <stat.icon className="w-4 h-4 text-foreground" />
                </div>
                <div className="flex items-center gap-1 text-sm">
                  {stat.trend === 'up' ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span className="text-muted-foreground">{stat.change}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-medium text-foreground">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Clean Tabs */}
      <Tabs value={activeView} onValueChange={setActiveView} className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <TabsList className="grid w-fit grid-cols-3">
            <TabsTrigger value="overview">
              <BarChart3 className="w-4 h-4 mr-2" />
              {t('revenue.overview')}
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <Activity className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="monitoring">
              <Eye className="w-4 h-4 mr-2" />
              Monitoring
            </TabsTrigger>
          </TabsList>
          
          <div className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-8">
          {/* Clean Revenue Analytics Section */}
          <Card className="border border-border">
            <CardHeader className="border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-3">
                    <BarChart3 className="w-5 h-5" />
                    {t('dashboard.revenueAnalytics')}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {t('dashboard.revenueAnalyticsDesc')}
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <ArrowUpRight className="w-4 h-4 mr-2" />
                  View Details
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <RevenueChart />
            </CardContent>
          </Card>

          {/* Clean Grid Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* Left Column */}
            <div className="xl:col-span-4 space-y-6">
              <QuickActions />
              <ExchangeRateWidget />
            </div>

            {/* Middle Column */}
            <div className="xl:col-span-5 space-y-6">
              <RecentTransactions />
              <ClientSegmentation />
            </div>

            {/* Right Column */}
            <div className="xl:col-span-3 space-y-6">
              <PSPPerformance />

              {/* Clean System Activity */}
              <Card className="border border-border">
                <CardHeader className="border-b border-border pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    {t('dashboard.systemActivity')}
                  </CardTitle>
                  <CardDescription>
                    {t('dashboard.systemActivityDesc')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {systemAlerts.map((alert, index) => (
                      <div 
                        key={index} 
                        className="flex items-start gap-3 p-3 border border-border rounded-md"
                      >
                        <div className="mt-0.5">
                          {getAlertIcon(alert.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground">
                            {alert.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {alert.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="pt-4 mt-4 border-t border-border">
                    <Button variant="ghost" size="sm" className="w-full">
                      <Eye className="w-4 h-4 mr-2" />
                      View All Alerts
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border border-border">
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Performance Metrics
                </CardTitle>
                <CardDescription>
                  Key performance indicators and growth trends
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <TreasuryMetrics />
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Market Analysis
                </CardTitle>
                <CardDescription>
                  Market trends and competitive analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border border-border rounded-md">
                    <span className="text-sm">Market Position</span>
                    <Badge variant="outline">Leading</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border border-border rounded-md">
                    <span className="text-sm">Growth Rate</span>
                    <span className="text-sm font-medium">+24.5%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 border border-border rounded-md">
                    <span className="text-sm">Market Share</span>
                    <span className="text-sm font-medium">15.8%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <Card className="border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CheckCircle className="w-4 h-4" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-2">
                  <div className="text-3xl font-medium text-foreground">
                    {systemHealth.overall}%
                  </div>
                  <p className="text-sm text-muted-foreground">Overall Uptime</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Database className="w-4 h-4" />
                  Database
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-2">
                  <div className="text-3xl font-medium text-foreground">
                    {systemHealth.database}%
                  </div>
                  <p className="text-sm text-muted-foreground">Performance</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Zap className="w-4 h-4" />
                  API Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-2">
                  <div className="text-3xl font-medium text-foreground">
                    {systemHealth.api}%
                  </div>
                  <p className="text-sm text-muted-foreground">Response Time</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building className="w-4 h-4" />
                  PSP Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-2">
                  <div className="text-3xl font-medium text-foreground">
                    {systemHealth.psps}%
                  </div>
                  <p className="text-sm text-muted-foreground">Availability</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="w-4 h-4" />
                  Security
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-2">
                  <div className="text-3xl font-medium text-foreground">
                    {systemHealth.security}%
                  </div>
                  <p className="text-sm text-muted-foreground">Protection</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  )
}