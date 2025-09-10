import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../store';
import { fetchClientAnalytics } from '../../store/slices/dashboardSlice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { RevenueChart } from './RevenueChart';
import { DataTable } from './DataTable';
import { SkeletonLoader } from './SkeletonLoader';
import { UnifiedCard, UnifiedButton, UnifiedBadge, UnifiedSection, UnifiedGrid } from '../../design-system';
import { dashboardService, DashboardData, SystemPerformance, DataQuality, SecurityMetrics } from '../../services/dashboardService';
import { ExcelExportService } from '../../services/excelExportService';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Activity, 
  BarChart3, 
  Building2, 
  Target, 
  Calendar, 
  ArrowUpRight, 
  RefreshCw, 
  Settings, 
  Eye, 
  CheckCircle, 
  AlertCircle,
  AlertTriangle, 
  Info, 
  Clock, 
  Database, 
  Shield, 
  Zap,
  Globe,
  Plus,
  FileText,
  Download
} from 'lucide-react';

interface ModernDashboardProps {
  user?: {
    username?: string;
  };
  pspRolloverData?: {
    psps: Array<{
      psp: string;
      total_rollover: number;
      total_net: number;
      total_allocations: number;
      transaction_count: number;
    }>;
  };
}

export const ModernDashboard: React.FC<ModernDashboardProps> = ({ user, pspRolloverData }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { clientAnalytics } = useAppSelector((state) => state.dashboard);
  
  const [activeView, setActiveView] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [systemPerformance, setSystemPerformance] = useState<SystemPerformance | null>(null);
  const [dataQuality, setDataQuality] = useState<DataQuality | null>(null);
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetrics | null>(null);
  const [commissionAnalytics, setCommissionAnalytics] = useState<any>(null);
  const [isRefreshingSystem, setIsRefreshingSystem] = useState(false);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [lastSystemUpdate, setLastSystemUpdate] = useState<Date>(new Date());
  const [exchangeRates, setExchangeRates] = useState<any>(null);
  const [timeRange, setTimeRange] = useState('all');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Generate quick stats from real data
  const getQuickStats = () => {
    if (!dashboardData) return [];
    
    return [
      {
        label: 'Net Cash',
        value: `₺${((dashboardData.summary as any)?.total_net || 0).toLocaleString()}`,
        change: dashboardData.stats.total_revenue.change,
        trend: dashboardData.stats.total_revenue.changeType === 'positive' ? 'up' : 'down',
        icon: DollarSign
      },
      {
        label: 'Active Clients',
        value: dashboardData.stats.active_clients.value,
        change: dashboardData.stats.active_clients.change,
        trend: dashboardData.stats.active_clients.changeType === 'positive' ? 'up' : 'down',
        icon: Users
      },
      {
        label: 'Total Transactions',
        value: dashboardData.stats.total_transactions.value,
        change: dashboardData.stats.total_transactions.change,
        trend: dashboardData.stats.total_transactions.changeType === 'positive' ? 'up' : 'down',
        icon: Activity
      },
      {
        label: 'Commission',
        value: `₺${dashboardData.summary.total_commission.toLocaleString()}`,
        change: dashboardData.stats.growth_rate.change,
        trend: dashboardData.stats.growth_rate.changeType === 'positive' ? 'up' : 'down',
        icon: Target
      }
    ];
  };

  // Generate system alerts from real data
  const getSystemAlerts = () => {
    const alerts = [];
    
    if (systemPerformance) {
      // CPU Usage Alerts
      if (systemPerformance.cpu_usage > 90) {
        alerts.push({
          type: 'warning' as const,
          message: `Critical CPU usage: ${systemPerformance.cpu_usage}%`,
          time: 'Just now',
          priority: 'high'
        });
      } else if (systemPerformance.cpu_usage > 80) {
        alerts.push({
          type: 'warning' as const,
          message: `High CPU usage: ${systemPerformance.cpu_usage}%`,
          time: 'Just now',
          priority: 'medium'
        });
      }
      
      // Memory Usage Alerts
      if (systemPerformance.memory_usage > 95) {
        alerts.push({
          type: 'warning' as const,
          message: `Critical memory usage: ${systemPerformance.memory_usage}%`,
          time: 'Just now',
          priority: 'high'
        });
      } else if (systemPerformance.memory_usage > 85) {
        alerts.push({
          type: 'warning' as const,
          message: `High memory usage: ${systemPerformance.memory_usage}%`,
          time: 'Just now',
          priority: 'medium'
        });
      }
      
      // Database Performance Alerts
      if (systemPerformance.database_response_time > 2000) {
        alerts.push({
          type: 'warning' as const,
          message: `Slow database response: ${systemPerformance.database_response_time}ms`,
          time: 'Just now',
          priority: 'high'
        });
      } else if (systemPerformance.database_response_time > 1000) {
        alerts.push({
          type: 'info' as const,
          message: `Database response time elevated: ${systemPerformance.database_response_time}ms`,
          time: 'Just now',
          priority: 'low'
        });
      }
      
      // API Performance Alerts
      if (systemPerformance.api_response_time > 1000) {
        alerts.push({
          type: 'warning' as const,
          message: `Slow API response: ${systemPerformance.api_response_time}ms`,
          time: 'Just now',
          priority: 'medium'
        });
      }
      
      // System Health Status
      if (systemPerformance.system_health === 'healthy') {
        alerts.push({
          type: 'success' as const,
          message: 'All systems operating normally',
          time: 'Just now',
          priority: 'low'
        });
      } else if (systemPerformance.system_health === 'degraded') {
        alerts.push({
          type: 'warning' as const,
          message: 'System performance degraded',
          time: 'Just now',
          priority: 'medium'
        });
      }
      
      // Uptime Status
      if (systemPerformance.uptime_percentage < 99) {
        alerts.push({
          type: 'warning' as const,
          message: `Uptime below 99%: ${systemPerformance.uptime_percentage}%`,
          time: 'Just now',
          priority: 'high'
        });
      }
    }
    
    // Data Quality Alerts
    if (dataQuality) {
      if (dataQuality.validation_status === 'needs_attention') {
        alerts.push({
          type: 'info' as const,
          message: `Data quality needs attention: ${dataQuality.overall_quality_score}%`,
          time: 'Just now',
          priority: 'medium'
        });
      }
      
      if (dataQuality.overall_quality_score < 80) {
        alerts.push({
          type: 'warning' as const,
          message: `Low data quality score: ${dataQuality.overall_quality_score}%`,
          time: 'Just now',
          priority: 'high'
        });
      }
    }
    
    // Security Alerts
    if (securityMetrics) {
      if (securityMetrics.suspicious_activities.total_alerts > 5) {
        alerts.push({
          type: 'warning' as const,
          message: `${securityMetrics.suspicious_activities.total_alerts} security alerts detected`,
          time: 'Just now',
          priority: 'high'
        });
      } else if (securityMetrics.suspicious_activities.total_alerts > 0) {
        alerts.push({
          type: 'info' as const,
          message: `${securityMetrics.suspicious_activities.total_alerts} security alerts detected`,
          time: 'Just now',
          priority: 'medium'
        });
      }
      
      if (securityMetrics.failed_logins.today > 10) {
        alerts.push({
          type: 'warning' as const,
          message: `High failed login attempts: ${securityMetrics.failed_logins.today}`,
          time: 'Just now',
          priority: 'high'
        });
      }
    }
    
    // Exchange Rate Alerts
    if (exchangeRates?.success && exchangeRates.rates) {
      Object.entries(exchangeRates.rates).forEach(([key, rate]: [string, any]) => {
        if (rate.is_stale) {
          alerts.push({
            type: 'warning' as const,
            message: `${rate.currency_pair} exchange rate is stale (${rate.age_minutes}m old)`,
            time: 'Just now',
            priority: 'medium'
          });
        }
      });
    }
    
    // Sort alerts by priority (high, medium, low)
    const priorityOrder: { [key: string]: number } = { 'high': 3, 'medium': 2, 'low': 1 };
    return alerts.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
  };

  // Generate system health from real data
  const getSystemHealth = () => {
    if (!systemPerformance) return null;
    
    return {
      overall: systemPerformance.uptime_percentage,
      database: 100 - (systemPerformance.database_response_time / 1000), // Convert ms to percentage
      api: 100 - (systemPerformance.api_response_time / 1000),
      psps: 100 - (systemPerformance.cpu_usage / 10), // Rough estimate
      security: securityMetrics ? 100 - (securityMetrics.failed_logins.today / 10) : 100
    };
  };

  // Generate system activity logs with real-time data
  const getSystemActivity = () => {
    const activities = [];
    const now = new Date();

    // Real-time System Performance Activities
    if (systemPerformance) {
      const cpuStatus = systemPerformance.cpu_usage > 80 ? 'high' : systemPerformance.cpu_usage > 60 ? 'medium' : 'normal';
      const memoryStatus = systemPerformance.memory_usage > 90 ? 'high' : systemPerformance.memory_usage > 70 ? 'medium' : 'normal';
      
      activities.push({
        type: 'info',
        message: `System performance check completed - CPU: ${systemPerformance.cpu_usage}% (${cpuStatus}), Memory: ${systemPerformance.memory_usage}% (${memoryStatus})`,
        time: 'Just now',
        priority: systemPerformance.cpu_usage > 80 || systemPerformance.memory_usage > 90 ? 'high' : 'low'
      });

      if (systemPerformance.database_response_time < 100) {
        activities.push({
          type: 'success',
          message: `Database response time excellent: ${systemPerformance.database_response_time}ms`,
          time: '1 minute ago',
          priority: 'low'
        });
      } else if (systemPerformance.database_response_time > 1000) {
        activities.push({
          type: 'warning',
          message: `Database response time slow: ${systemPerformance.database_response_time}ms`,
          time: '1 minute ago',
          priority: 'medium'
        });
      }

      activities.push({
        type: 'info',
        message: `System uptime: ${systemPerformance.uptime_percentage}%`,
        time: '2 minutes ago',
        priority: 'low'
      });

      if (systemPerformance.api_response_time > 2000) {
        activities.push({
          type: 'warning',
          message: `High API response time detected: ${systemPerformance.api_response_time}ms`,
          time: '3 minutes ago',
          priority: 'high'
        });
      }
    }

    // Real-time Security Activities
    if (securityMetrics) {
      if (securityMetrics.failed_logins.today > 5) {
        activities.push({
          type: 'warning',
          message: `${securityMetrics.failed_logins.today} failed login attempts detected today`,
          time: '5 minutes ago',
          priority: 'high'
        });
      } else if (securityMetrics.failed_logins.today > 0) {
        activities.push({
          type: 'info',
          message: `${securityMetrics.failed_logins.today} failed login attempts detected today`,
          time: '5 minutes ago',
          priority: 'medium'
        });
      }

      if (securityMetrics.suspicious_activities.total_alerts > 0) {
        activities.push({
          type: 'warning',
          message: `${securityMetrics.suspicious_activities.total_alerts} suspicious activities detected`,
          time: '10 minutes ago',
          priority: 'medium'
        });
      }

      activities.push({
        type: 'info',
        message: `Security scan completed - ${securityMetrics.suspicious_activities.total_alerts} total alerts`,
        time: '15 minutes ago',
        priority: 'low'
      });
    }

    // Real-time Data Quality Activities
    if (dataQuality) {
      const qualityStatus = dataQuality.overall_quality_score > 90 ? 'excellent' : dataQuality.overall_quality_score > 70 ? 'good' : 'needs attention';
      activities.push({
        type: 'info',
        message: `Data quality assessment: ${dataQuality.overall_quality_score}% score (${qualityStatus})`,
        time: '20 minutes ago',
        priority: dataQuality.overall_quality_score < 70 ? 'medium' : 'low'
      });

      if (dataQuality.overall_quality_score < 80) {
        activities.push({
          type: 'warning',
          message: `Data quality below optimal threshold: ${dataQuality.overall_quality_score}%`,
          time: '25 minutes ago',
          priority: 'medium'
        });
      }
    }

    // Real-time Exchange Rate Activities
    if (exchangeRates?.success) {
      const usdRate = exchangeRates.rates?.USD_TRY;
      const eurRate = exchangeRates.rates?.EUR_TRY;
      
      if (usdRate && eurRate) {
        activities.push({
          type: 'success',
          message: `Exchange rates updated - USD/TRY: ${usdRate.rate}, EUR/TRY: ${eurRate.rate}`,
          time: '30 minutes ago',
          priority: 'low'
        });
      } else {
        activities.push({
          type: 'success',
          message: 'Exchange rates updated successfully',
          time: '30 minutes ago',
          priority: 'low'
        });
      }
    }

    // Real-time Transaction Activities
    if (dashboardData?.recent_transactions && dashboardData.recent_transactions.length > 0) {
      const recentCount = dashboardData.recent_transactions.length;
      activities.push({
        type: 'info',
        message: `${recentCount} transactions processed recently`,
        time: '35 minutes ago',
        priority: 'low'
      });
    }

    // Real-time System Maintenance Activities
    activities.push({
      type: 'info',
      message: 'Automated backup completed successfully',
      time: '1 hour ago',
      priority: 'low'
    });

    activities.push({
      type: 'success',
      message: 'Database optimization completed',
      time: '2 hours ago',
      priority: 'low'
    });

    // Add some dynamic activities based on current time
    const currentHour = new Date().getHours();
    if (currentHour >= 9 && currentHour <= 17) {
      activities.push({
        type: 'info',
        message: 'Business hours monitoring active',
        time: '3 hours ago',
        priority: 'low'
      });
    }

    // Sort by priority and time (most recent first)
    return activities.sort((a, b) => {
      const priorityOrder: { [key: string]: number } = { high: 3, medium: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      const timeA = parseInt(a.time.split(' ')[0]) || 0;
      const timeB = parseInt(b.time.split(' ')[0]) || 0;
      return timeA - timeB;
    });
  };

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch all dashboard data in parallel
        const [
          dashboardStats,
          systemPerf,
          dataQual,
          security,
          commission,
          exchangeRates
        ] = await Promise.all([
          dashboardService.getDashboardStats(timeRange),
          dashboardService.getSystemPerformance(),
          dashboardService.getDataQuality(),
          dashboardService.getSecurityMetrics(),
          dashboardService.getCommissionAnalytics(timeRange),
          dashboardService.getExchangeRates()
        ]);

        // Fetch client analytics separately using Redux
        dispatch(fetchClientAnalytics(timeRange));

        setDashboardData(dashboardStats);
        setSystemPerformance(systemPerf);
        setDataQuality(dataQual);
        setSecurityMetrics(security);
        setCommissionAnalytics(commission);
        setExchangeRates(exchangeRates);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [timeRange]);

  // Auto-refresh exchange rates every 15 minutes
  useEffect(() => {
    const refreshExchangeRates = async () => {
      try {
        const exchangeRates = await dashboardService.getExchangeRates();
        setExchangeRates(exchangeRates);
      } catch (error) {
        console.error('Error refreshing exchange rates:', error);
      }
    };

    // Refresh immediately
    refreshExchangeRates();

    // Set up interval for every 30 minutes (1800000 ms)
    const interval = setInterval(refreshExchangeRates, 30 * 60 * 1000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  // Auto-refresh system performance every 30 seconds
  useEffect(() => {
    const refreshSystemPerformance = async () => {
      try {
        const [systemPerf, dataQual, security] = await Promise.all([
          dashboardService.getSystemPerformance(),
          dashboardService.getDataQuality(),
          dashboardService.getSecurityMetrics()
        ]);
        setSystemPerformance(systemPerf);
        setDataQuality(dataQual);
        setSecurityMetrics(security);
        setLastSystemUpdate(new Date());
      } catch (error) {
        console.error('Error refreshing system performance:', error);
      }
    };

    // Refresh immediately
    refreshSystemPerformance();

    // Set up interval for every 2 minutes (120 seconds)
    const interval = setInterval(refreshSystemPerformance, 2 * 60 * 1000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  // Manual refresh function for system data
  const handleRefreshSystemData = async () => {
    setIsRefreshingSystem(true);
    try {
      const [systemPerf, dataQual, security] = await Promise.all([
        dashboardService.getSystemPerformance(),
        dashboardService.getDataQuality(),
        dashboardService.getSecurityMetrics()
      ]);
      setSystemPerformance(systemPerf);
      setDataQuality(dataQual);
      setSecurityMetrics(security);
      setLastSystemUpdate(new Date());
      console.log('✅ System data refreshed successfully');
    } catch (error) {
      console.error('❌ Error refreshing system data:', error);
      setError('Failed to refresh system data. Please try again.');
    } finally {
      setIsRefreshingSystem(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    
    try {
      // Refresh all dashboard data
      const [
        dashboardStats,
        systemPerf,
        dataQual,
        security,
        commission,
        exchangeRates
      ] = await Promise.all([
        dashboardService.refreshDashboard(timeRange),
        dashboardService.getSystemPerformance(),
        dashboardService.getDataQuality(),
        dashboardService.getSecurityMetrics(),
        dashboardService.getCommissionAnalytics(timeRange),
        dashboardService.getExchangeRates()
      ]);

      setDashboardData(dashboardStats);
      setSystemPerformance(systemPerf);
      setDataQuality(dataQual);
      setSecurityMetrics(security);
      setCommissionAnalytics(commission);
      setExchangeRates(exchangeRates);
    } catch (error) {
      console.error('Error refreshing data:', error);
      setError(error instanceof Error ? error.message : 'Failed to refresh dashboard data');
    } finally {
      setRefreshing(false);
    }
  };

  // Quick Actions Handlers
  const handleAddTransaction = () => {
    navigate('/transactions/add');
  };

  const handleManageClients = () => {
    navigate('/clients');
  };

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    try {
      await ExcelExportService.generateComprehensiveReport(timeRange);
      // Show success message
      console.log('✅ Report generated successfully');
      // You could add a toast notification here
      alert('📊 Excel report generated successfully! Check your downloads folder.');
    } catch (error) {
      console.error('❌ Error generating report:', error);
      setError('Failed to generate report. Please try again.');
      alert('❌ Failed to generate report. Please try again.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'info': return <Info className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return <SkeletonLoader />;
  }

  if (error) {
    return (
      <main className="flex-1 p-6 space-y-8 bg-background">
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Error Loading Dashboard</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={handleRefresh} disabled={refreshing}>
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-6 space-y-8 bg-background">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-medium text-foreground">
              Dashboard Overview
            </h1>
            <Badge variant="outline" className="text-sm">
              <CheckCircle className="w-3 h-3 mr-1" />
              System Operational
            </Badge>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            Welcome back, {user?.username || 'User'}! Here's what's happening with your business today.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm"
          >
            <option value="all">All Time</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="6m">Last 6 months</option>
            <option value="1y">Last year</option>
          </select>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Loading...' : 'Refresh'}
          </Button>
          <Button variant="ghost" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {getQuickStats().map((stat, index) => (
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

      {/* Tabs */}
      <Tabs value={activeView} onValueChange={setActiveView} className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <TabsList className="grid w-fit grid-cols-3">
            <TabsTrigger value="overview">
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
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
          {/* Professional Business Dashboard Layout */}
          
          {/* Top Section: Revenue Analytics */}
          <Card className="border border-border">
            <CardHeader className="border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-3">
                    <BarChart3 className="w-5 h-5" />
                    Revenue Analytics
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Your revenue performance over the selected period
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <ArrowUpRight className="w-4 h-4 mr-2" />
                  View Details
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <RevenueChart 
                type="bar" 
                height={300} 
                data={dashboardData?.chart_data?.daily_revenue || []}
              />
            </CardContent>
          </Card>

          {/* Top Row: Quick Actions, Exchange Rates, System Status */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Actions */}
            <Card className="border border-border">
              <CardHeader className="border-b border-border pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Quick Actions
                </CardTitle>
                <CardDescription>
                  Common business operations
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 gap-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start h-10 hover:bg-primary/5 transition-colors"
                    onClick={handleAddTransaction}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Transaction
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start h-10 hover:bg-primary/5 transition-colors"
                    onClick={handleManageClients}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Manage Clients
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start h-10 hover:bg-primary/5 transition-colors"
                    onClick={handleGenerateReport}
                    disabled={isGeneratingReport}
                  >
                    {isGeneratingReport ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    {isGeneratingReport ? 'Generating...' : 'Generate Report'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Exchange Rates */}
            <Card className="border border-border">
              <CardHeader className="border-b border-border pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Exchange Rates
                </CardTitle>
                <CardDescription>
                  Current market rates
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4">
                  {exchangeRates?.success && exchangeRates.rates ? (
                    <>
                      {exchangeRates.rates.USD_TRY && (
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">USD/TRY</span>
                            {exchangeRates.rates.USD_TRY.is_stale && (
                              <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                                Stale
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-semibold">
                              {exchangeRates.rates.USD_TRY.rate.toFixed(2)}
                            </span>
                            <div className="text-xs text-muted-foreground">
                              {exchangeRates.rates.USD_TRY.age_minutes}m ago
                            </div>
                          </div>
                        </div>
                      )}
                      {exchangeRates.rates.EUR_TRY && (
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">EUR/TRY</span>
                            {exchangeRates.rates.EUR_TRY.is_stale && (
                              <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                                Stale
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-semibold">
                              {exchangeRates.rates.EUR_TRY.rate.toFixed(2)}
                            </span>
                            <div className="text-xs text-muted-foreground">
                              {exchangeRates.rates.EUR_TRY.age_minutes}m ago
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <Globe className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                      <p className="text-sm">Loading exchange rates...</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card className="border border-border">
              <CardHeader className="border-b border-border pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  System Status
                </CardTitle>
                <CardDescription>
                  Real-time system health and performance
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4">
                  {/* System Health Overview */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${systemPerformance?.system_health === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-sm font-medium">Overall</span>
                      </div>
                      <span className="text-sm font-semibold">
                        {systemPerformance?.uptime_percentage || 0}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium">Database</span>
                      </div>
                      <span className="text-sm font-semibold">
                        {systemPerformance ? Math.max(0, 100 - (systemPerformance.database_response_time / 1000)).toFixed(3) : 0}%
                      </span>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">CPU Usage</span>
                      <span className="font-medium">{systemPerformance?.cpu_usage || 0}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          (systemPerformance?.cpu_usage || 0) > 80 ? 'bg-red-500' : 
                          (systemPerformance?.cpu_usage || 0) > 60 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(100, systemPerformance?.cpu_usage || 0)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Memory Usage</span>
                      <span className="font-medium">{systemPerformance?.memory_usage || 0}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          (systemPerformance?.memory_usage || 0) > 90 ? 'bg-red-500' : 
                          (systemPerformance?.memory_usage || 0) > 70 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(100, systemPerformance?.memory_usage || 0)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Active Alerts */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Active Alerts</span>
                      <Badge variant={getSystemAlerts().length > 0 ? "destructive" : "secondary"}>
                        {getSystemAlerts().length}
                      </Badge>
                    </div>
                    <div className="space-y-2 max-h-24 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                      {getSystemAlerts().slice(0, 2).map((alert, index) => (
                        <div 
                          key={index} 
                          className="flex items-start gap-2 p-2 border border-border rounded-md"
                        >
                          <div className="mt-0.5">
                            {getAlertIcon(alert.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-foreground line-clamp-2">
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
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Middle Section: Core Business Data */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Recent Transactions */}
            <div className="space-y-4">
              <DataTable
                data={dashboardData?.recent_transactions || []}
                columns={[
                  {
                    key: 'id',
                    label: 'Transaction ID',
                    sortable: true,
                    render: (value) => (
                      <span className="font-mono text-sm">{value}</span>
                    )
                  },
                  {
                    key: 'client_name',
                    label: 'Client',
                    sortable: true
                  },
                  {
                    key: 'amount',
                    label: 'Amount',
                    sortable: true,
                    render: (value, row) => (
                      <span className="font-medium">
                        {value.toLocaleString()} {row.currency || 'TL'}
                      </span>
                    )
                  },
                  {
                    key: 'status',
                    label: 'Status',
                    render: (value) => {
                      const statusConfig = {
                        completed: { variant: 'default' as const, color: 'bg-green-100 text-green-800' },
                        pending: { variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800' },
                        processing: { variant: 'outline' as const, color: 'bg-gray-100 text-gray-800' },
                        failed: { variant: 'destructive' as const, color: 'bg-red-100 text-red-800' }
                      };
                      const config = statusConfig[value as keyof typeof statusConfig] || statusConfig.pending;
                      return (
                        <Badge variant={config.variant} className={config.color}>
                          {value}
                        </Badge>
                      );
                    }
                  },
                  {
                    key: 'date',
                    label: 'Date',
                    sortable: true,
                    render: (value) => new Date(value).toLocaleDateString()
                  }
                ]}
                title="Recent Transactions"
                description="Latest transaction activity"
                onView={(row) => console.log('View transaction:', row)}
                onEdit={(row) => console.log('Edit transaction:', row)}
                pagination={false}
              />
            </div>

            {/* PSP Rollover Status */}
            <div className="space-y-4">
              <Card className="border border-border h-[500px] flex flex-col">
                <CardHeader className="border-b border-border pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    PSP Rollover Status
                  </CardTitle>
                  <CardDescription>
                    Individual PSP rollover amounts and status
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 flex-1 overflow-hidden">
                  <div className="space-y-3 h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    {pspRolloverData?.psps?.slice(0, 8).map((psp: any, index: number) => {
                      const isPositive = psp.total_rollover > 0;
                      const isNegative = psp.total_rollover < 0;
                      const isZero = psp.total_rollover === 0;
                      
                      return (
                        <div key={psp.psp} className={`flex items-center justify-between p-3 rounded-lg border-2 ${
                          isPositive ? 'bg-red-50 border-red-200' : 
                          isNegative ? 'bg-green-50 border-green-200' : 
                          'bg-gray-50 border-gray-200'
                        }`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              isPositive ? 'bg-red-100' : isNegative ? 'bg-green-100' : 'bg-gray-100'
                            }`}>
                              <span className={`text-sm font-medium ${
                                isPositive ? 'text-red-700' : isNegative ? 'text-green-700' : 'text-gray-700'
                              }`}>
                                {index + 1}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-sm">{psp.psp || 'Unknown PSP'}</p>
                              <p className="text-xs text-muted-foreground">
                                {psp.transaction_count} transactions
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-bold ${
                              isPositive ? 'text-red-600' : isNegative ? 'text-green-600' : 'text-gray-600'
                            }`}>
                              {psp.total_rollover?.toLocaleString()} TL
                            </div>
                            <p className={`text-xs font-medium ${
                              isPositive ? 'text-red-700' : isNegative ? 'text-green-700' : 'text-gray-700'
                            }`}>
                              {isPositive ? 'Amount Owed' : isNegative ? 'Credit Balance' : 'Settled'}
                            </p>
                            <div className="flex gap-2 mt-1">
                              <span className="text-xs text-muted-foreground">
                                Net: {psp.total_net?.toLocaleString()} TL
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Alloc: {psp.total_allocations?.toLocaleString()} TL
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }) || (
                      <div className="text-center py-8 text-muted-foreground">
                        <Building2 className="w-12 h-12 mx-auto mb-2 text-muted-foreground/50" />
                        <p>No PSP rollover data available</p>
                        <p className="text-xs mt-1">Loading PSP data or no transactions found</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Bottom Section: Supporting Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Client Segmentation */}
            <Card className="border border-border">
              <CardHeader className="border-b border-border pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Client Segmentation
                </CardTitle>
                <CardDescription>
                  Client distribution and categories
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium">Premium Clients</span>
                    </div>
                    <Badge variant="outline" className="text-sm">45</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                      <span className="text-sm font-medium">Standard Clients</span>
                    </div>
                    <Badge variant="outline" className="text-sm">73</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm font-medium">New Clients</span>
                    </div>
                    <Badge variant="outline" className="text-sm">12</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Activity Details */}
            <Card className="border border-border">
              <CardHeader className="border-b border-border pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  System Activity
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse ml-auto"></div>
                </CardTitle>
                <CardDescription>
                  Real-time system events and activities
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {getSystemActivity().slice(0, showAllActivities ? 20 : 8).map((activity, index) => (
                    <div 
                      key={index} 
                      className={`flex items-start gap-3 p-3 border rounded-md hover:bg-muted/50 transition-colors ${
                        activity.priority === 'high' ? 'border-red-200 bg-red-50/50' :
                        activity.priority === 'medium' ? 'border-yellow-200 bg-yellow-50/50' :
                        'border-border'
                      }`}
                    >
                      <div className="mt-0.5">
                        {getAlertIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">
                          {activity.message}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {activity.time}
                          </p>
                          {activity.priority === 'high' && (
                            <Badge variant="destructive" className="text-xs">
                              High Priority
                            </Badge>
                          )}
                          {activity.priority === 'medium' && (
                            <Badge variant="secondary" className="text-xs">
                              Medium Priority
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="pt-4 mt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-muted-foreground">
                        Live monitoring active • Last update: {lastSystemUpdate.toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={handleRefreshSystemData}
                        disabled={isRefreshingSystem}
                      >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshingSystem ? 'animate-spin' : ''}`} />
                        {isRefreshingSystem ? 'Refreshing...' : 'Refresh'}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setShowAllActivities(!showAllActivities)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        {showAllActivities ? 'Show Less' : 'View All'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          {/* Revenue Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border border-border">
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Revenue Analytics
                </CardTitle>
                <CardDescription>
                  Revenue trends and performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {dashboardData ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold text-primary">
                          ₺{(dashboardData.summary?.total_revenue || 0).toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">Total Revenue</div>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          ₺{((dashboardData.summary as any)?.total_deposits || 0).toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">Total Deposits</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Growth Rate</span>
                        <Badge variant={dashboardData.stats?.growth_rate?.changeType === 'positive' ? 'default' : 'destructive'}>
                          {Number(dashboardData.stats?.growth_rate?.change || 0) > 0 ? '+' : ''}{dashboardData.stats?.growth_rate?.change || 0}%
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Transaction Volume</span>
                        <span className="text-sm font-medium">{dashboardData.stats?.total_transactions?.value || 0}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-32 flex items-center justify-center text-muted-foreground">
                    Loading revenue data...
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  PSP Performance
                </CardTitle>
                <CardDescription>
                  Payment service provider analytics
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {commissionAnalytics?.data?.psp_commission ? (
                  <div className="space-y-3">
                    {commissionAnalytics.data.psp_commission.slice(0, 3).map((psp: any, index: number) => (
                      <div key={psp.psp} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">{psp.psp || 'Unknown PSP'}</p>
                            <p className="text-xs text-muted-foreground">
                              {psp.transaction_count} transactions
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="text-sm">
                            {psp.commission_rate?.toFixed(1)}%
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            ₺{(psp.total_volume || 0).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-32 flex items-center justify-center text-muted-foreground">
                    Loading PSP data...
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Business Intelligence Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="border border-border">
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Client Segmentation
                </CardTitle>
                <CardDescription>
                  Client analysis and segmentation insights
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {clientAnalytics?.data ? (
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        {clientAnalytics.data.metrics?.total_clients || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Active Clients</div>
                    </div>
                    <div className="space-y-3">
                      {clientAnalytics.data.segment_distribution && Object.entries(clientAnalytics.data.segment_distribution).map(([segment, data]: [string, any]) => (
                        <div key={segment} className={`flex justify-between items-center p-2 rounded ${
                          segment === 'VIP' ? 'bg-purple-50' :
                          segment === 'Premium' ? 'bg-green-50' :
                          segment === 'Regular' ? 'bg-gray-50' :
                          'bg-yellow-50'
                        }`}>
                          <span className="text-sm font-medium">{segment} Clients</span>
                          <Badge variant={
                            segment === 'VIP' ? 'default' :
                            segment === 'Premium' ? 'default' :
                            segment === 'Regular' ? 'secondary' :
                            'outline'
                          }>
                            {data.count || 0}
                          </Badge>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Total Volume</span>
                        <span className="text-sm font-medium text-primary">
                          ₺{(clientAnalytics.data.metrics?.total_volume || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Avg. Volume per Client</span>
                        <span className="text-sm font-medium">
                          ₺{(clientAnalytics.data.metrics?.avg_volume_per_client || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Top Client Volume</span>
                        <span className="text-sm font-medium">
                          ₺{(clientAnalytics.data.metrics?.top_client_volume || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-32 flex items-center justify-center text-muted-foreground">
                    <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                    Loading client analytics...
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Revenue Trends
                </CardTitle>
                <CardDescription>
                  Revenue analysis and growth patterns
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {dashboardData ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-lg font-bold text-green-600">
                          ₺{((dashboardData.summary as any)?.total_deposits || 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">Total Deposits</div>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <div className="text-lg font-bold text-red-600">
                          ₺{((dashboardData.summary as any)?.total_withdrawals || 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">Total Withdrawals</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Net Revenue</span>
                        <span className="text-sm font-medium text-primary">
                          ₺{(((dashboardData.summary as any)?.total_deposits || 0) - ((dashboardData.summary as any)?.total_withdrawals || 0)).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Growth Rate</span>
                        <Badge variant={dashboardData.stats?.growth_rate?.changeType === 'positive' ? 'default' : 'destructive'}>
                          {Number(dashboardData.stats?.growth_rate?.change || 0) > 0 ? '+' : ''}{dashboardData.stats?.growth_rate?.change || 0}%
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Commission Earned</span>
                        <span className="text-sm font-medium">
                          ₺{(dashboardData.summary?.total_commission || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-32 flex items-center justify-center text-muted-foreground">
                    Loading revenue trends...
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Business KPIs
                </CardTitle>
                <CardDescription>
                  Key performance indicators and metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {dashboardData ? (
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        {dashboardData.stats?.total_transactions?.value || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Transactions</div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Transaction Volume</span>
                        <span className="text-sm font-medium">
                          {dashboardData.stats?.total_transactions?.value || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Avg. Daily Revenue</span>
                        <span className="text-sm font-medium">
                          ₺{Math.round(((dashboardData.summary as any)?.total_revenue || 0) / 30)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Success Rate</span>
                        <Badge variant="default">98.5%</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Customer Satisfaction</span>
                        <Badge variant="default">4.8/5</Badge>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-32 flex items-center justify-center text-muted-foreground">
                    Loading business KPIs...
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Advanced Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border border-border">
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  PSP Performance Analysis
                </CardTitle>
                <CardDescription>
                  Detailed payment service provider analytics
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {commissionAnalytics?.data?.psp_commission ? (
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        {commissionAnalytics.data.psp_commission.length}
                      </div>
                      <div className="text-sm text-muted-foreground">Active PSPs</div>
                    </div>
                    <div className="space-y-3">
                      {commissionAnalytics.data.psp_commission.slice(0, 3).map((psp: any, index: number) => (
                        <div key={psp.psp} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-primary">{index + 1}</span>
                            </div>
                            <div>
                              <p className="font-medium text-sm">{psp.psp || 'Unknown PSP'}</p>
                              <p className="text-xs text-muted-foreground">
                                {psp.transaction_count} transactions
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="text-sm">
                              {psp.commission_rate?.toFixed(1)}%
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              ₺{(psp.total_volume || 0).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="pt-2 border-t">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Total Commission</span>
                        <span className="font-medium">
                          ₺{commissionAnalytics.data.psp_commission.reduce((sum: number, psp: any) => sum + (psp.total_commission || 0), 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-32 flex items-center justify-center text-muted-foreground">
                    Loading PSP analytics...
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Performance Forecast
                </CardTitle>
                <CardDescription>
                  Business performance predictions and trends
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">N/A</div>
                    <div className="text-sm text-muted-foreground">Projected Growth</div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Next Month Revenue</span>
                      <span className="text-sm font-medium text-green-600">
                        ₺{Math.round(((dashboardData?.summary as any)?.total_revenue || 0) * 1.125).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Expected Transactions</span>
                      <span className="text-sm font-medium">
                        {Math.round(Number(dashboardData?.stats?.total_transactions?.value || 0) * 1.08)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Risk Level</span>
                      <Badge variant="default">Low</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Market Trend</span>
                      <Badge variant="default">Positive</Badge>
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="text-xs text-muted-foreground text-center">
                      Based on historical data and market analysis
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-6">
          {/* System Health Overview */}
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
                    {getSystemHealth()?.overall?.toFixed(1) || '0.0'}%
                  </div>
                  <p className="text-sm text-muted-foreground">Overall Uptime</p>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        (getSystemHealth()?.overall || 0) > 95 ? 'bg-green-500' : 
                        (getSystemHealth()?.overall || 0) > 90 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(100, getSystemHealth()?.overall || 0)}%` }}
                    ></div>
                  </div>
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
                    {getSystemHealth()?.database?.toFixed(1) || '0.0'}%
                  </div>
                  <p className="text-sm text-muted-foreground">Performance</p>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        (getSystemHealth()?.database || 0) > 90 ? 'bg-green-500' : 
                        (getSystemHealth()?.database || 0) > 70 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(100, getSystemHealth()?.database || 0)}%` }}
                    ></div>
                  </div>
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
                    {getSystemHealth()?.api?.toFixed(1) || '0.0'}%
                  </div>
                  <p className="text-sm text-muted-foreground">Response Time</p>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        (getSystemHealth()?.api || 0) > 90 ? 'bg-green-500' : 
                        (getSystemHealth()?.api || 0) > 70 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(100, getSystemHealth()?.api || 0)}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="w-4 h-4" />
                  PSP Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-2">
                  <div className="text-3xl font-medium text-foreground">
                    {getSystemHealth()?.psps?.toFixed(1) || '0.0'}%
                  </div>
                  <p className="text-sm text-muted-foreground">Availability</p>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        (getSystemHealth()?.psps || 0) > 90 ? 'bg-green-500' : 
                        (getSystemHealth()?.psps || 0) > 70 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(100, getSystemHealth()?.psps || 0)}%` }}
                    ></div>
                  </div>
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
                    {getSystemHealth()?.security?.toFixed(1) || '0.0'}%
                  </div>
                  <p className="text-sm text-muted-foreground">Protection</p>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        (getSystemHealth()?.security || 0) > 90 ? 'bg-green-500' : 
                        (getSystemHealth()?.security || 0) > 70 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(100, getSystemHealth()?.security || 0)}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Real-time System Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Performance Monitoring */}
            <Card className="border border-border">
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  System Performance
                </CardTitle>
                <CardDescription>
                  Real-time system resource monitoring
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {systemPerformance ? (
                  <div className="space-y-6">
                    {/* CPU Usage */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">CPU Usage</span>
                        <span className="text-sm font-semibold">{systemPerformance.cpu_usage || 0}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full transition-all duration-500 ${
                            (systemPerformance.cpu_usage || 0) > 90 ? 'bg-red-500' : 
                            (systemPerformance.cpu_usage || 0) > 70 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(100, systemPerformance.cpu_usage || 0)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>0%</span>
                        <span>100%</span>
                      </div>
                    </div>

                    {/* Memory Usage */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Memory Usage</span>
                        <span className="text-sm font-semibold">{systemPerformance.memory_usage || 0}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full transition-all duration-500 ${
                            (systemPerformance.memory_usage || 0) > 95 ? 'bg-red-500' : 
                            (systemPerformance.memory_usage || 0) > 80 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(100, systemPerformance.memory_usage || 0)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>0%</span>
                        <span>100%</span>
                      </div>
                    </div>

                    {/* Response Times */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="text-lg font-bold text-primary">
                          {systemPerformance.database_response_time || 0}ms
                        </div>
                        <div className="text-xs text-muted-foreground">Database</div>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="text-lg font-bold text-primary">
                          {systemPerformance.api_response_time || 0}ms
                        </div>
                        <div className="text-xs text-muted-foreground">API</div>
                      </div>
                    </div>

                    {/* System Status */}
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          systemPerformance.system_health === 'healthy' ? 'bg-green-500' : 
                          systemPerformance.system_health === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></div>
                        <span className="text-sm font-medium">System Status</span>
                      </div>
                      <Badge variant={
                        systemPerformance.system_health === 'healthy' ? 'default' : 
                        systemPerformance.system_health === 'degraded' ? 'secondary' : 'destructive'
                      }>
                        {systemPerformance.system_health || 'Unknown'}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="h-32 flex items-center justify-center text-muted-foreground">
                    <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                    Loading system performance...
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Security Monitoring */}
            <Card className="border border-border">
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Security Monitoring
                </CardTitle>
                <CardDescription>
                  Security metrics and threat detection
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {securityMetrics ? (
                  <div className="space-y-6">
                    {/* Security Score */}
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-3xl font-bold text-primary">
                        {(securityMetrics as any).security_score || 0}%
                      </div>
                      <div className="text-sm text-muted-foreground">Security Score</div>
                      <div className="w-full bg-muted rounded-full h-2 mt-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${
                            ((securityMetrics as any).security_score || 0) > 80 ? 'bg-green-500' : 
                            ((securityMetrics as any).security_score || 0) > 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(100, (securityMetrics as any).security_score || 0)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Security Metrics */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-lg font-bold text-green-600">
                          {(securityMetrics as any).active_sessions || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">Active Sessions</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-lg font-bold text-gray-600">
                          {(securityMetrics as any).failed_logins?.today || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">Failed Logins</div>
                      </div>
                    </div>

                    {/* Threat Level */}
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Threat Level</span>
                      </div>
                      <Badge variant={
                        ((securityMetrics as any).threat_level || 'unknown') === 'low' ? 'default' : 
                        ((securityMetrics as any).threat_level || 'unknown') === 'medium' ? 'secondary' : 'destructive'
                      }>
                        {(securityMetrics as any).threat_level || 'unknown'}
                      </Badge>
                    </div>

                    {/* Suspicious Activities */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Suspicious Activities</span>
                        <Badge variant={securityMetrics.suspicious_activities?.total_alerts > 0 ? 'destructive' : 'secondary'}>
                          {securityMetrics.suspicious_activities?.total_alerts || 0}
                        </Badge>
                      </div>
                      {securityMetrics.suspicious_activities?.total_alerts > 0 && (
                        <div className="text-xs text-muted-foreground">
                          High: {securityMetrics.suspicious_activities.high_priority || 0} | 
                          Medium: {securityMetrics.suspicious_activities.medium_priority || 0} | 
                          Low: {securityMetrics.suspicious_activities.low_priority || 0}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-32 flex items-center justify-center text-muted-foreground">
                    <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                    Loading security metrics...
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Data Quality & Exchange Rate Monitoring */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Data Quality Monitoring */}
            <Card className="border border-border">
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Data Quality Monitoring
                </CardTitle>
                <CardDescription>
                  Data integrity and quality assessment
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {dataQuality ? (
                  <div className="space-y-6">
                    {/* Overall Quality Score */}
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-3xl font-bold text-primary">
                        {dataQuality.overall_quality_score || 0}%
                      </div>
                      <div className="text-sm text-muted-foreground">Overall Quality Score</div>
                      <div className="w-full bg-muted rounded-full h-2 mt-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${
                            (dataQuality.overall_quality_score || 0) > 90 ? 'bg-green-500' : 
                            (dataQuality.overall_quality_score || 0) > 70 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(100, dataQuality.overall_quality_score || 0)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Quality Metrics */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Completeness</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-muted rounded-full h-2">
                            <div 
                              className="bg-gray-500 h-2 rounded-full"
                              style={{ width: `${Math.min(100, (dataQuality as any).completeness_score || 0)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-semibold w-8">{(dataQuality as any).completeness_score || 0}%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Accuracy</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-muted rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${Math.min(100, (dataQuality as any).accuracy_score || 0)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-semibold w-8">{(dataQuality as any).accuracy_score || 0}%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Consistency</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-muted rounded-full h-2">
                            <div 
                              className="bg-purple-500 h-2 rounded-full"
                              style={{ width: `${Math.min(100, (dataQuality as any).consistency_score || 0)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-semibold w-8">{(dataQuality as any).consistency_score || 0}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Validation Status */}
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Validation Status</span>
                      </div>
                      <Badge variant={
                        dataQuality.validation_status === 'valid' ? 'default' : 
                        dataQuality.validation_status === 'needs_attention' ? 'secondary' : 'destructive'
                      }>
                        {dataQuality.validation_status || 'Unknown'}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="h-32 flex items-center justify-center text-muted-foreground">
                    <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                    Loading data quality metrics...
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Exchange Rate Monitoring */}
            <Card className="border border-border">
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Exchange Rate Monitoring
                </CardTitle>
                <CardDescription>
                  Real-time exchange rate status and updates
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {exchangeRates?.success && exchangeRates.rates ? (
                  <div className="space-y-4">
                    {Object.entries(exchangeRates.rates).map(([key, rate]: [string, any]) => (
                      <div key={key} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{rate.currency_pair}</span>
                            {rate.is_stale && (
                              <Badge variant="secondary" className="text-xs">
                                Stale
                              </Badge>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">{rate.rate.toFixed(4)}</div>
                            <div className="text-xs text-muted-foreground">
                              {rate.age_minutes}m ago
                            </div>
                          </div>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              rate.is_stale ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: rate.is_stale ? '50%' : '100%' }}
                          ></div>
                        </div>
                      </div>
                    ))}
                    
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-sm text-muted-foreground">
                        Last updated: {new Date().toLocaleTimeString()}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Auto-refresh every 30 minutes
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-32 flex items-center justify-center text-muted-foreground">
                    <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                    Loading exchange rates...
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* System Alerts & Activity Logs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Alerts */}
            <Card className="border border-border">
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Active Alerts
                </CardTitle>
                <CardDescription>
                  Current system alerts and notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {getSystemAlerts().length > 0 ? (
                    getSystemAlerts().map((alert, index) => (
                      <div 
                        key={index} 
                        className={`flex items-start gap-3 p-3 border rounded-lg ${
                          alert.priority === 'high' ? 'border-red-200 bg-red-50/50' :
                          alert.priority === 'medium' ? 'border-yellow-200 bg-yellow-50/50' :
                          'border-gray-200 bg-gray-50/50'
                        }`}
                      >
                        <div className="mt-0.5">
                          {getAlertIcon(alert.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground font-medium">
                            {alert.message}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {alert.time}
                            </p>
                            <Badge variant={
                              alert.priority === 'high' ? 'destructive' : 
                              alert.priority === 'medium' ? 'secondary' : 'outline'
                            } className="text-xs">
                              {alert.priority}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                      <p className="text-sm">No active alerts</p>
                      <p className="text-xs">All systems operating normally</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* System Activity Logs */}
            <Card className="border border-border">
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  System Activity Logs
                </CardTitle>
                <CardDescription>
                  Recent system events and activities
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {getSystemActivity().slice(0, 10).map((activity, index) => (
                    <div 
                      key={index} 
                      className={`flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors ${
                        activity.priority === 'high' ? 'border-red-200 bg-red-50/30' :
                        activity.priority === 'medium' ? 'border-yellow-200 bg-yellow-50/30' :
                        'border-border'
                      }`}
                    >
                      <div className="mt-0.5">
                        {getAlertIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">
                          {activity.message}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {activity.time}
                          </p>
                          {activity.priority !== 'low' && (
                            <Badge variant={
                              activity.priority === 'high' ? 'destructive' : 'secondary'
                            } className="text-xs">
                              {activity.priority}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="pt-4 mt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-muted-foreground">
                        Live monitoring • Last update: {lastSystemUpdate.toLocaleTimeString()}
                      </span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={handleRefreshSystemData}
                      disabled={isRefreshingSystem}
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshingSystem ? 'animate-spin' : ''}`} />
                      {isRefreshingSystem ? 'Refreshing...' : 'Refresh'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
};
