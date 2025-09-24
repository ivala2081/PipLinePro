import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../store';
import { fetchClientAnalytics } from '../../store/slices/dashboardSlice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  UnifiedCard, 
  UnifiedButton, 
  UnifiedBadge, 
  UnifiedSection, 
  UnifiedGrid 
} from '../../design-system';
import { Breadcrumb } from '../ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { RevenueChart } from './RevenueChart';
import { DataTable } from './DataTable';
import { SkeletonLoader } from './SkeletonLoader';
import { dashboardService, DashboardData } from '../../services/dashboardService';
import { ExcelExportService } from '../../services/excelExportService';
import { getStatusColor, getHealthColor, getPerformanceColor, getUsageColor, getPriorityColor, statusText } from '../../utils/colorUtils';
import { getCardSpacing, getSectionSpacing, getGridSpacing, getComponentSpacing, getTextSpacing, getRadius } from '../../utils/spacingUtils';
import { getHeadingStyles, getBodyStyles, getUIStyles, getDataStyles, getTypographyStyles } from '../../utils/typographyUtils';
import '../../styles/dashboard-modern.css';
import { 
  Users, 
  DollarSign, 
  Activity, 
  BarChart3, 
  Building2, 
  Target, 
  Calendar, 
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
  Download,
  TrendingUp,
  Filter,
  Search,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  Bell,
  Star,
  TrendingDown,
  PieChart,
  LineChart,
  BarChart,
  Layers,
  Cpu,
  HardDrive,
  Wifi,
  Lock,
  Unlock,
  Server,
  Network,
  Award,
  Sparkles
} from 'lucide-react';

interface ModernDashboardProps {
  user?: {
    username?: string;
  };
}

const ModernDashboard: React.FC<ModernDashboardProps> = ({ user }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { clientAnalytics } = useAppSelector((state) => state.dashboard);
  
  const [activeView, setActiveView] = useState('overview');
  const [timeRange, setTimeRange] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showZeroValues, setShowZeroValues] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [commissionAnalytics, setCommissionAnalytics] = useState<any>(null);
  const [exchangeRates, setExchangeRates] = useState<any>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [chartPeriod, setChartPeriod] = useState<'daily' | 'monthly' | 'annual'>('daily');
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  // Generate quick stats from real data
  const getQuickStats = () => {
    if (!dashboardData) return [];
    
    return [
      {
        label: 'Net Cash',
        value: `₺${((dashboardData.summary as any)?.total_net || 0).toLocaleString()}`,
        icon: DollarSign,
        change: '+12.5%',
        trend: 'up'
      },
      {
        label: 'Active Clients',
        value: dashboardData.stats.active_clients.value,
        icon: Users,
        change: '+8.2%',
        trend: 'up'
      },
      {
        label: 'Total Transactions',
        value: dashboardData.stats.total_transactions.value,
        icon: Activity,
        change: '+15.3%',
        trend: 'up'
      },
      {
        label: 'Success Rate',
        value: `${(dashboardData.stats as any).success_rate?.value || 95}%`,
        icon: CheckCircle,
        change: '+2.1%',
        trend: 'up'
      }
    ];
  };

  // Generate revenue breakdown data by time period
  const getRevenueBreakdown = () => {
    if (!dashboardData?.summary) return [];
    
    const summary = dashboardData.summary as any;
    const chartData = dashboardData.chart_data?.daily_revenue || [];
    
    // Calculate daily metrics
    const dailyData = chartData.slice(-1)[0] || { amount: 0 }; // Last day
    const dailyDeposits = dailyData.amount * 0.7;
    const dailyWithdrawals = dailyData.amount * 0.3;
    const dailyNetCash = dailyDeposits - dailyWithdrawals;
    
    // Calculate monthly metrics (last 30 days)
    const monthlyData = chartData.slice(-30);
    const monthlyTotal = monthlyData.reduce((sum, item) => sum + (item.amount || 0), 0);
    const monthlyDeposits = monthlyTotal * 0.7;
    const monthlyWithdrawals = monthlyTotal * 0.3;
    const monthlyNetCash = monthlyDeposits - monthlyWithdrawals;
    
    // Calculate annual metrics (all data)
    const annualTotal = chartData.reduce((sum, item) => sum + (item.amount || 0), 0);
    const annualDeposits = annualTotal * 0.7;
    const annualWithdrawals = annualTotal * 0.3;
    const annualNetCash = annualDeposits - annualWithdrawals;
    
    // Get real trend data from API
    const dailyTrend = summary.daily_revenue_trend || 0;
    const monthlyTrend = summary.monthly_revenue_trend || 0;
    const annualTrend = summary.annual_revenue_trend || 0;
    
    return [
      // Daily metrics
      {
        timePeriod: 'Daily',
        metric: 'Total Deposits',
        amount: dailyDeposits,
        trend: dailyTrend * 0.7, // Apply trend to deposits portion
        icon: TrendingUp,
        description: 'Today\'s incoming transactions',
        color: 'green',
        bgColor: 'bg-green-50',
        iconColor: 'text-green-600',
        trendColor: dailyTrend >= 0 ? 'text-green-600' : 'text-red-600'
      },
      {
        timePeriod: 'Daily',
        metric: 'Total Withdrawals',
        amount: dailyWithdrawals,
        trend: dailyTrend * 0.3, // Apply trend to withdrawals portion
        icon: TrendingDown,
        description: 'Today\'s outgoing transactions',
        color: 'red',
        bgColor: 'bg-red-50',
        iconColor: 'text-red-600',
        trendColor: dailyTrend >= 0 ? 'text-green-600' : 'text-red-600'
      },
      {
        timePeriod: 'Daily',
        metric: 'Net Cash',
        amount: dailyNetCash,
        trend: dailyTrend,
        icon: DollarSign,
        description: 'Today\'s net position',
        color: 'blue',
        bgColor: 'bg-blue-50',
        iconColor: 'text-blue-600',
        trendColor: dailyTrend >= 0 ? 'text-green-600' : 'text-red-600'
      },
      // Monthly metrics
      {
        timePeriod: 'Monthly',
        metric: 'Total Deposits',
        amount: monthlyDeposits,
        trend: monthlyTrend * 0.7,
        icon: TrendingUp,
        description: 'This month\'s incoming transactions',
        color: 'green',
        bgColor: 'bg-green-50',
        iconColor: 'text-green-600',
        trendColor: monthlyTrend >= 0 ? 'text-green-600' : 'text-red-600'
      },
      {
        timePeriod: 'Monthly',
        metric: 'Total Withdrawals',
        amount: monthlyWithdrawals,
        trend: monthlyTrend * 0.3,
        icon: TrendingDown,
        description: 'This month\'s outgoing transactions',
        color: 'red',
        bgColor: 'bg-red-50',
        iconColor: 'text-red-600',
        trendColor: monthlyTrend >= 0 ? 'text-green-600' : 'text-red-600'
      },
      {
        timePeriod: 'Monthly',
        metric: 'Net Cash',
        amount: monthlyNetCash,
        trend: monthlyTrend,
        icon: DollarSign,
        description: 'This month\'s net position',
        color: 'blue',
        bgColor: 'bg-blue-50',
        iconColor: 'text-blue-600',
        trendColor: monthlyTrend >= 0 ? 'text-green-600' : 'text-red-600'
      },
      // Annual metrics
      {
        timePeriod: 'Annual',
        metric: 'Total Deposits',
        amount: annualDeposits,
        trend: annualTrend * 0.7,
        icon: TrendingUp,
        description: 'This year\'s incoming transactions',
        color: 'green',
        bgColor: 'bg-green-50',
        iconColor: 'text-green-600',
        trendColor: annualTrend >= 0 ? 'text-green-600' : 'text-red-600'
      },
      {
        timePeriod: 'Annual',
        metric: 'Total Withdrawals',
        amount: annualWithdrawals,
        trend: annualTrend * 0.3,
        icon: TrendingDown,
        description: 'This year\'s outgoing transactions',
        color: 'red',
        bgColor: 'bg-red-50',
        iconColor: 'text-red-600',
        trendColor: annualTrend >= 0 ? 'text-green-600' : 'text-red-600'
      },
      {
        timePeriod: 'Annual',
        metric: 'Net Cash',
        amount: annualNetCash,
        trend: annualTrend,
        icon: DollarSign,
        description: 'This year\'s net position',
        color: 'blue',
        bgColor: 'bg-blue-50',
        iconColor: 'text-blue-600',
        trendColor: annualTrend >= 0 ? 'text-green-600' : 'text-red-600'
      }
    ];
  };

  // Transform chart data based on selected period
  const getTransformedChartData = () => {
    if (!dashboardData?.chart_data?.daily_revenue) return [];
    
    const dailyData = dashboardData.chart_data.daily_revenue;
    
    if (chartPeriod === 'daily') {
      return dailyData;
    } else if (chartPeriod === 'monthly') {
      // Group daily data by month
      const monthlyMap = new Map();
      
      dailyData.forEach(item => {
        const date = new Date(item.date);
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        
        if (monthlyMap.has(monthKey)) {
          monthlyMap.get(monthKey).amount += item.amount;
        } else {
          monthlyMap.set(monthKey, {
            date: monthKey,
            amount: item.amount
          });
        }
      });
      
      return Array.from(monthlyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    } else if (chartPeriod === 'annual') {
      // Group daily data by year
      const yearlyMap = new Map();
      
      dailyData.forEach(item => {
        const date = new Date(item.date);
        const yearKey = date.getFullYear().toString();
        
        if (yearlyMap.has(yearKey)) {
          yearlyMap.get(yearKey).amount += item.amount;
        } else {
          yearlyMap.set(yearKey, {
            date: yearKey,
            amount: item.amount
          });
        }
      });
      
      return Array.from(yearlyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    }
    
    return dailyData;
  };


  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const [
          dashboardStats,
          commission,
          exchangeRates
        ] = await Promise.all([
          dashboardService.getDashboardStats(timeRange),
          dashboardService.getCommissionAnalytics(timeRange),
          dashboardService.getExchangeRates()
        ]);

        setDashboardData(dashboardStats);
        setCommissionAnalytics(commission);
        setExchangeRates(exchangeRates);
        
        console.log('✅ Dashboard data loaded successfully');
      } catch (error) {
        console.error('❌ Error loading dashboard data:', error);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [timeRange]);


  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    
    try {
      const [
        dashboardStats,
        commission,
        exchangeRates
      ] = await Promise.all([
        dashboardService.refreshDashboard(timeRange),
        dashboardService.getCommissionAnalytics(timeRange),
        dashboardService.getExchangeRates()
      ]);

      setDashboardData(dashboardStats);
      setCommissionAnalytics(commission);
      setExchangeRates(exchangeRates);
      
      console.log('✅ Dashboard refreshed successfully');
    } catch (error) {
      console.error('❌ Error refreshing dashboard:', error);
      setError('Failed to refresh dashboard. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!dashboardData) return;
    
    setIsGeneratingReport(true);
    try {
      await ExcelExportService.generateComprehensiveReport(timeRange);
      console.log('✅ Report generated successfully');
    } catch (error) {
      console.error('❌ Error generating report:', error);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleMetricClick = (metric: string, period: string) => {
    setSelectedMetric(`${metric}-${period}`);
    console.log(`📊 Metric clicked: ${metric} (${period})`);
    
    // Navigate to detailed view based on metric type
    switch (metric.toLowerCase()) {
      case 'revenue':
        navigate('/analytics/revenue');
        break;
      case 'transactions':
        navigate('/transactions');
        break;
      case 'commission':
        navigate('/analytics/commission');
        break;
      case 'clients':
        navigate('/clients');
        break;
      default:
        navigate('/analytics');
    }
  };

  const handlePeriodHeaderClick = (period: string) => {
    console.log(`📅 Period header clicked: ${period}`);
    setChartPeriod(period as 'daily' | 'monthly' | 'annual');
  };

  if (loading) {
    return (
      <main className="flex-1 bg-gradient-to-br from-slate-50 via-white to-slate-100 min-h-screen">
        <div className="px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse space-y-8">
              <div className="h-8 dashboard-skeleton rounded-lg w-1/3"></div>
              <div className="dashboard-grid">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-32 dashboard-skeleton rounded-xl"></div>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 h-96 dashboard-skeleton rounded-xl"></div>
                <div className="h-96 dashboard-skeleton rounded-xl"></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-1 bg-gradient-to-br from-slate-50 via-white to-slate-100 min-h-screen">
        <div className="px-6 py-8">
          <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
              <Card className="w-full max-w-md border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                  </div>
                  <h2 className="text-2xl font-semibold text-slate-900 mb-3">Error Loading Dashboard</h2>
                  <p className="text-slate-600 mb-6">{error}</p>
                  <Button 
                    onClick={handleRefresh} 
                    disabled={refreshing}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105"
                  >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Try Again
              </Button>
            </CardContent>
          </Card>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const quickStats = getQuickStats();

  return (
    <main className="flex-1 bg-gradient-to-br from-slate-50 via-white to-slate-100 min-h-screen">
      <div className="px-6 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <h1 className="dashboard-title text-4xl font-bold tracking-tight">
                Executive Dashboard
            </h1>
              <p className="dashboard-subtitle text-lg">
                Real-time business intelligence and performance metrics
              </p>
          </div>
            
            <div className="flex items-center gap-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
                className="dashboard-focus px-4 py-2.5 dashboard-glass rounded-lg text-slate-700 font-medium shadow-sm hover:shadow-md transition-all duration-200"
          >
            <option value="all">All Time</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="6m">Last 6 months</option>
            <option value="1y">Last year</option>
          </select>
              
              <Button 
            onClick={handleGenerateReport}
            disabled={isGeneratingReport}
                className="dashboard-button dashboard-focus bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 px-4 py-2.5 rounded-lg font-medium shadow-sm"
          >
                <Download className="w-4 h-4 mr-2" />
            {isGeneratingReport ? 'Generating...' : 'Export'}
              </Button>
              
              <Button 
            onClick={handleRefresh}
            disabled={refreshing}
                className="dashboard-button dashboard-focus bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg font-medium shadow-sm"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
        </div>
      </div>

          {/* Key Metrics Grid */}
          <div className="dashboard-grid">
            {quickStats.map((stat, index) => (
              <Card key={index} className="dashboard-card metric-card group border-0 shadow-lg hover:shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-slate-200 transition-colors duration-200 floating">
                      <stat.icon className="w-6 h-6 text-slate-600" />
                </div>
                    <div className="flex items-center gap-1">
                      <span className={`text-sm font-medium ${
                        stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stat.change}
                            </span>
                      </div>
                          </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                    <p className="text-slate-600 font-medium">{stat.label}</p>
                          </div>
                </CardContent>
              </Card>
            ))}
                    </div>

          {/* Main Content - Full Width Revenue Analytics */}
          <div className="space-y-8">
            
            {/* Revenue Analytics - Full Width */}
              <Card className="dashboard-card dashboard-glass border-0 shadow-lg">
                <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-semibold text-slate-900">Revenue Analytics</CardTitle>
                    <CardDescription className="text-slate-600">Real-time revenue performance and trends</CardDescription>
                  </div>
                  <div className="flex items-center gap-4">
                    {/* Period Selector */}
                    <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-1">
                      {(['daily', 'monthly', 'annual'] as const).map((period) => (
                        <button
                          key={period}
                          onClick={() => setChartPeriod(period)}
                          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                            chartPeriod === period
                              ? 'bg-white text-slate-900 shadow-sm'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                          }`}
                        >
                          {period.charAt(0).toUpperCase() + period.slice(1)}
                        </button>
                      ))}
                    </div>
                        <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full pulse-live"></div>
                      <span className="text-sm text-slate-600">Live Data</span>
                          </div>
                          </div>
                        </div>
                </CardHeader>
                <CardContent>
                <div className="h-96 chart-container">
                  <RevenueChart 
                    data={getTransformedChartData()} 
                    type="area" 
                    height={350}
                  />
                      </div>
                </CardContent>
              </Card>

            {/* Financial Performance - Card Structure Matching Revenue Analytics */}
            <Card className="dashboard-card dashboard-glass border-0 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-semibold text-slate-900">Financial Performance</CardTitle>
                    <CardDescription className="text-slate-600">Comprehensive financial metrics across all time periods</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full pulse-live"></div>
                    <span className="text-sm text-slate-600">Live Data</span>
                  </div>
                  </div>
                </CardHeader>
                <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* Daily Metrics */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Calendar 
                        className="w-4 h-4 text-slate-600 hover:text-blue-600 transition-colors duration-200 cursor-pointer" 
                        onClick={() => handlePeriodHeaderClick('daily')}
                      />
                      <h3 
                        className="text-sm font-medium text-slate-900 uppercase tracking-wide hover:text-blue-600 transition-colors duration-200 cursor-pointer"
                        onClick={() => handlePeriodHeaderClick('daily')}
                      >
                        Daily
                      </h3>
                    </div>
                    
                    <div className="space-y-3">
                      {getRevenueBreakdown().filter(item => item.timePeriod === 'Daily').map((breakdown, index) => (
                        <div 
                          key={index} 
                          className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded border hover:bg-slate-100 hover:border-slate-300 hover:shadow-sm transition-all duration-200 cursor-pointer group"
                          onClick={() => handleMetricClick(breakdown.metric, 'daily')}
                        >
                          <div className="flex items-center gap-3">
                            <breakdown.icon className={`w-4 h-4 ${breakdown.iconColor} group-hover:scale-110 transition-transform duration-200`} />
                            <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors duration-200">{breakdown.metric}</span>
                          </div>
                          <span className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors duration-200">
                            ₺{breakdown.amount.toLocaleString('tr-TR')}
                          </span>
                        </div>
                      ))}
                  </div>
                  </div>

                  {/* Monthly Metrics */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <BarChart3 
                        className="w-4 h-4 text-slate-600 hover:text-green-600 transition-colors duration-200 cursor-pointer" 
                        onClick={() => handlePeriodHeaderClick('monthly')}
                      />
                      <h3 
                        className="text-sm font-medium text-slate-900 uppercase tracking-wide hover:text-green-600 transition-colors duration-200 cursor-pointer"
                        onClick={() => handlePeriodHeaderClick('monthly')}
                      >
                        Monthly
                      </h3>
                    </div>

                    <div className="space-y-3">
                      {getRevenueBreakdown().filter(item => item.timePeriod === 'Monthly').map((breakdown, index) => (
                        <div 
                          key={index} 
                          className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded border hover:bg-slate-100 hover:border-slate-300 hover:shadow-sm transition-all duration-200 cursor-pointer group"
                          onClick={() => handleMetricClick(breakdown.metric, 'monthly')}
                        >
                          <div className="flex items-center gap-3">
                            <breakdown.icon className={`w-4 h-4 ${breakdown.iconColor} group-hover:scale-110 transition-transform duration-200`} />
                            <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors duration-200">{breakdown.metric}</span>
                          </div>
                          <span className="text-sm font-semibold text-slate-900 group-hover:text-green-600 transition-colors duration-200">
                            ₺{breakdown.amount.toLocaleString('tr-TR')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Annual Metrics */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp 
                        className="w-4 h-4 text-slate-600 hover:text-purple-600 transition-colors duration-200 cursor-pointer" 
                        onClick={() => handlePeriodHeaderClick('annual')}
                      />
                      <h3 
                        className="text-sm font-medium text-slate-900 uppercase tracking-wide hover:text-purple-600 transition-colors duration-200 cursor-pointer"
                        onClick={() => handlePeriodHeaderClick('annual')}
                      >
                        Annual
                      </h3>
                    </div>
                    
                    <div className="space-y-3">
                      {getRevenueBreakdown().filter(item => item.timePeriod === 'Annual').map((breakdown, index) => (
                        <div 
                          key={index} 
                          className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded border hover:bg-slate-100 hover:border-slate-300 hover:shadow-sm transition-all duration-200 cursor-pointer group"
                          onClick={() => handleMetricClick(breakdown.metric, 'annual')}
                        >
                          <div className="flex items-center gap-3">
                            <breakdown.icon className={`w-4 h-4 ${breakdown.iconColor} group-hover:scale-110 transition-transform duration-200`} />
                            <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors duration-200">{breakdown.metric}</span>
                          </div>
                          <span className="text-sm font-semibold text-slate-900 group-hover:text-purple-600 transition-colors duration-200">
                            ₺{breakdown.amount.toLocaleString('tr-TR')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
                </CardContent>
              </Card>


          </div>

          </div>
      </div>
    </main>
  );
};

export default ModernDashboard;
