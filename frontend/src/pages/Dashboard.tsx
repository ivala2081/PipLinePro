import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import {
  DollarSign,
  TrendingUp,
  Users,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Activity,
  Calendar,
  PieChart,
  Eye,
  Download,
  RefreshCw,
  LineChart,
  Building2,
  Globe,
  Clock,
  X,
  User,
  Shield,
  Database,
  Wifi,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Zap,
  Server,
  HardDrive,
  Cpu,
  Network,
  Lock,
  Unlock,
  Activity as ActivityIcon,
  Award,
  Star,
  RefreshCw as RefreshIcon,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useUniqueToast } from '../hooks/useUniqueToast';
import { useAppDispatch, useAppSelector } from '../store';
import { 
  fetchDashboardData, 
  fetchSecondaryData, 
  setActiveTab, 
  setTimeRange,
  setRefreshing,
  clearError 
} from '../store/slices/dashboardSlice';
import { useExchangeRates } from '../hooks/useExchangeRates';
import ExchangeRatesDisplay from '../components/ExchangeRatesDisplay';
import TopPerformersCard from '../components/TopPerformersCard';
import ExchangeRatesWidget from '../components/ExchangeRatesWidget';
import DashboardTabNavigation from '../components/DashboardTabNavigation';
import usePerformanceMonitor from '../hooks/usePerformanceMonitor';
import { DashboardSkeleton } from '../components/SkeletonLoader';
import StandardMetricsCard from '../components/StandardMetricsCard';
import { 
  DashboardPageSkeleton, 
  TableSkeleton, 
  ChartSkeleton,
  ProgressiveLoader 
} from '../components/EnhancedSkeletonLoaders';

import {
  PageHeader,
  Section,
  CardGrid,
  GridContainer,
  ContentArea,
  Row,
  Column,
  Divider,
  Spacer
} from '../components/ProfessionalLayout';
import { Button } from '../components/ProfessionalButtons';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from 'recharts';

const Dashboard = memo(() => {
  const { t } = useLanguage();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  // Early return for loading state - must be done BEFORE calling other hooks
  if (authLoading) {
    return <DashboardPageSkeleton />;
  }
  
  const { showUniqueSuccess, showUniqueError, showUniqueInfo } = useUniqueToast();
  const dispatch = useAppDispatch();
  
  // Performance monitoring
  usePerformanceMonitor('Dashboard');
  
  // Redux state
  const {
    dashboardData,
    topPerformers,
    revenueTrends,
    systemPerformance,
    dataQuality,
    integrationStatus,
    securityMetrics,
    volumeAnalysis,
    clientAnalytics,
    commissionAnalytics,
    loading,
    error,
    refreshing,
    timeRange,
    activeTab,
    lastFetchTime
  } = useAppSelector(state => state.dashboard);

  // Local state for exchange rates modal
  const [showExchangeRatesModal, setShowExchangeRatesModal] = useState(false);
  
  // Enhanced loading states
  const [loadingStep, setLoadingStep] = useState(0);
  const loadingSteps = [
    'Initializing dashboard...',
    'Loading financial data...',
    'Fetching analytics...',
    'Preparing charts...',
    'Finalizing display...'
  ];

  // Exchange Rates Integration
  const currentDate = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const { rates, loading: ratesLoading, error: ratesError, refreshRates } = useExchangeRates(currentDate);

  // Show exchange rate notifications
  useEffect(() => {
    if (ratesError && !ratesLoading) {
      showUniqueError('exchange-rates-error', 'Exchange Rate Error', ratesError);
    }
  }, [ratesError, ratesLoading, showUniqueError]);

  useEffect(() => {
    if (rates && Object.keys(rates).length > 0 && !ratesLoading && !ratesError) {
      const rateValues = Object.values(rates);
      if (rateValues.length > 0) {
        const currentRate = rateValues[0];
        const rateAge = new Date().getTime() - new Date(currentRate.updated_at).getTime();
        const ageInMinutes = Math.floor(rateAge / (1000 * 60));
        
        if (ageInMinutes > 30) {
          showUniqueInfo('exchange-rates-stale', 'Exchange Rates Warning', `Currency rates are ${ageInMinutes} minutes old. Consider refreshing.`);
        }
      }
    }
  }, [rates, ratesLoading, ratesError, showUniqueInfo]);

  const CACHE_DURATION = 60000; // 1 minute cache

  // Memoized handlers
  const handleFetchDashboardData = useCallback(async (forceRefresh = false) => {
    try {
      const now = Date.now();
      
      // Check if we need to fetch new data
      if (!forceRefresh && (now - lastFetchTime) < CACHE_DURATION) {
        console.log('📦 Using cached dashboard data');
        return;
      }

      // Progressive loading steps
      setLoadingStep(0);
      await new Promise(resolve => setTimeout(resolve, 200));
      
      setLoadingStep(1);
      // Fetch essential data
      await dispatch(fetchDashboardData(timeRange));

      setLoadingStep(2);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setLoadingStep(3);
      // Fetch secondary data in background
      dispatch(fetchSecondaryData(timeRange));
      
      setLoadingStep(4);
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  }, [dispatch, timeRange, lastFetchTime]);

  const handleRefresh = useCallback(async () => {
    try {
      showUniqueInfo('dashboard-refresh', 'Refreshing Dashboard', 'Loading latest data...');
      dispatch(setRefreshing(true));
      await handleFetchDashboardData(true);
      showUniqueSuccess('dashboard-refresh', 'Dashboard Refreshed', 'All data has been updated successfully');
    } catch (error) {
      showUniqueError('dashboard-refresh', 'Refresh Failed', 'Failed to refresh dashboard data');
    } finally {
      dispatch(setRefreshing(false));
    }
  }, [dispatch, handleFetchDashboardData, showUniqueInfo, showUniqueSuccess, showUniqueError]);

  const handleTabChange = useCallback((tab: 'overview' | 'analytics' | 'performance' | 'monitoring' | 'financial') => {
    dispatch(setActiveTab(tab));
  }, [dispatch]);

  const handleTimeRangeChange = useCallback((range: string) => {
    dispatch(setTimeRange(range));
  }, [dispatch]);

  const handleExchangeRatesRefresh = useCallback(async () => {
    try {
      showUniqueInfo('exchange-rates-refresh', 'Refreshing Exchange Rates', 'Updating currency rates...');
      
      const now = new Date();
      const currentDate = now.getFullYear() + '-' + 
        String(now.getMonth() + 1).padStart(2, '0') + '-' + 
        String(now.getDate()).padStart(2, '0');
      
      const success = await refreshRates({ date: currentDate });
      
      if (success) {
        showUniqueSuccess('exchange-rates-refresh', 'Exchange Rates Updated', 'Currency rates have been successfully refreshed');
      } else {
        showUniqueError('exchange-rates-refresh', 'Refresh Failed', 'Failed to update exchange rates. Please try again.');
      }
    } catch (error) {
      showUniqueError('exchange-rates-refresh', 'Refresh Error', 'An error occurred while refreshing exchange rates');
    }
  }, [refreshRates, showUniqueInfo, showUniqueSuccess, showUniqueError]);

  const handleViewAllRates = useCallback(() => {
    setShowExchangeRatesModal(true);
  }, []);

  const handleCloseRatesModal = useCallback(() => {
    setShowExchangeRatesModal(false);
  }, []);

  const handleClearError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Memoized utility functions
  const formatCurrency = useCallback((amount: number, currency: string = '₺') => {
    // Map internal currency codes to valid ISO 4217 currency codes
    const CURRENCY_MAP: { [key: string]: string } = {
      '₺': 'TRY',  // Turkish Lira symbol -> ISO code
      '$': 'USD',  // US Dollar symbol
      '€': 'EUR',  // Euro symbol  
      '£': 'GBP',  // British Pound symbol
      // Legacy support
      'TL': 'TRY', // Turkish Lira legacy -> ISO code
      'TRY': 'TRY', // Already correct
      'USD': 'USD',
      'EUR': 'EUR',
      'GBP': 'GBP',
    };
    
    const validCurrency = CURRENCY_MAP[currency] || currency;
    
    try {
      // Use ISO code for validation but show preferred symbol
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: validCurrency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
      
      // Replace currency codes with preferred symbols [[memory:5971629]]
      return formatted
        .replace(/TRY/g, '₺')
        .replace(/USD/g, '$')
        .replace(/EUR/g, '€')
        .replace(/GBP/g, '£');
    } catch (error) {
      // Fallback formatting if currency code is invalid
      console.warn(`Invalid currency code: ${currency}, using fallback formatting`);
      return `${currency}${amount.toLocaleString()}`;
    }
  }, []);

  const formatNumber = useCallback((num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  }, []);

  // Memoized top performers data
  const topPerformersData = useMemo(() => {
    if (!topPerformers) return null;
    
    return {
      volumeLeaders: {
        title: t('dashboard.top_5_by_volume'),
        description: t('dashboard.highest_deposit_volume'),
        data: topPerformers.volume_leaders,
        icon: <BarChart3 className='h-4 w-4 text-white' />,
        iconBgColor: 'bg-blue-600',
        showVolume: true
      },
      countLeaders: {
        title: t('dashboard.top_5_by_count'),
        description: t('dashboard.most_active_transaction'),
        data: topPerformers.count_leaders,
        icon: <Activity className='h-4 w-4 text-white' />,
        iconBgColor: 'bg-green-600',
        showVolume: false
      }
    };
  }, [topPerformers, t]);

  // Main data fetching effect - only run when authentication changes
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      handleFetchDashboardData();
    }
  }, [isAuthenticated, authLoading]); // Removed handleFetchDashboardData from dependencies

  // Listen for transaction updates to automatically refresh dashboard data
  useEffect(() => {
    const handleTransactionsUpdate = (event: any) => {
      console.log('🔄 Dashboard: Received transaction update event', event.detail);
      
      // Refresh dashboard data when transactions are updated
      if (isAuthenticated && !authLoading) {
        console.log('🔄 Dashboard: Refreshing data due to transaction updates...');
        handleFetchDashboardData();
      }
    };

    // Add event listener
    window.addEventListener('transactionsUpdated', handleTransactionsUpdate);
    
    // Cleanup
    return () => {
      window.removeEventListener('transactionsUpdated', handleTransactionsUpdate);
    };
  }, [isAuthenticated, authLoading]); // Removed handleFetchDashboardData from dependencies

  // Auto-refresh exchange rates every 15 minutes
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      const interval = setInterval(() => {
        const currentDate = new Date().toISOString().slice(0, 10);
        refreshRates({ date: currentDate });
      }, 900000);
      
      return () => clearInterval(interval);
    }
    return undefined;
  }, [isAuthenticated, authLoading, refreshRates]);



  return (
    <ContentArea spacing="xl">
      {/* Enhanced Page Header */}
      <PageHeader
        title={t('dashboard.title')}
        subtitle={t('dashboard.description')}
        actions={
          <div className='flex items-center gap-3'>
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="secondary"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? t('common.refreshing') : t('common.refresh')}
            </Button>
          </div>
        }
      />



      {/* Tab Navigation */}
      <DashboardTabNavigation 
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />

      {/* Progressive Loading State */}
      {refreshing && (
        <Section>
          <ProgressiveLoader 
            steps={loadingSteps}
            currentStep={loadingStep}
          />
        </Section>
      )}

      {/* Error State */}
      {error && (
        <Section>
          <div className='bg-red-50 border border-red-200 rounded-xl p-6'>
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 bg-red-100 rounded-full flex items-center justify-center'>
                <X className='h-5 w-5 text-red-600' />
              </div>
              <div>
                <h3 className='text-lg font-semibold text-red-800'>Error Loading Dashboard</h3>
                <p className='text-red-700 mt-1'>{error}</p>
              </div>
              <Button
                onClick={handleClearError}
                variant="ghost"
                size="sm"
                className='ml-auto text-red-400 hover:text-red-600'
              >
                <X className='h-5 w-5' />
              </Button>
            </div>
          </div>
        </Section>
      )}

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <ContentArea>
          {/* Enhanced Stats Cards */}
          {dashboardData && (
            <Section title="Key Metrics" subtitle="Business overview" spacing="lg">
              <CardGrid cols={4} gap="lg">
                <StandardMetricsCard
                  title={t('dashboard.total_revenue')}
                  value={formatCurrency(dashboardData.summary.total_revenue, '₺')}
                  change={dashboardData.stats.total_revenue.change}
                  changeType="positive"
                  icon={DollarSign}
                  color="blue"
                  variant="default"
                />
                
                <StandardMetricsCard
                  title={t('dashboard.total_transactions')}
                  value={formatNumber(dashboardData.summary.transaction_count)}
                  change={dashboardData.stats.total_transactions.change}
                  changeType="positive"
                  icon={CreditCard}
                  color="green"
                  variant="default"
                />
                
                <StandardMetricsCard
                  title={t('dashboard.active_clients')}
                  value={formatNumber(dashboardData.summary.active_clients)}
                  change={dashboardData.stats.active_clients.change}
                  changeType="positive"
                  icon={Users}
                  color="purple"
                  variant="default"
                />
                
                <StandardMetricsCard
                  title={t('dashboard.total_commissions')}
                  value={formatCurrency(dashboardData.summary.total_commission, '₺')}
                  change={`${((dashboardData.summary.total_commission / dashboardData.summary.total_revenue) * 100).toFixed(2)}%`}
                  changeType="positive"
                  icon={TrendingUp}
                  color="teal"
                  variant="default"
                />
              </CardGrid>
            </Section>
          )}

          {/* Exchange Rates Widget */}
          <Section title="Exchange Rates" subtitle="Current rates" spacing="lg">
            <ExchangeRatesWidget
              rates={rates}
              loading={ratesLoading}
              error={ratesError}
              onRefresh={handleExchangeRatesRefresh}
              onViewAll={handleViewAllRates}
              formatCurrency={formatCurrency}
            />
          </Section>



          {/* Top Performers */}
          {topPerformersData && (
            <Section title="Top Performers" subtitle="Best performers" spacing="lg">
              <CardGrid cols={2} gap="lg">
                <TopPerformersCard
                  {...topPerformersData.volumeLeaders}
                  formatCurrency={formatCurrency}
                />
                <TopPerformersCard
                  {...topPerformersData.countLeaders}
                  formatCurrency={formatCurrency}
                />
              </CardGrid>
            </Section>
          )}
        </ContentArea>
      )}

      {/* Analytics Tab Content */}
      {activeTab === 'analytics' && (
        <ContentArea>
          {/* Revenue Trends Chart */}
          {revenueTrends && (
            <Section title="Revenue Trends" subtitle="Performance over time" spacing="lg">
              <div className='business-chart'>
                <div className='business-chart-header'>
                  <div>
                    <h3 className='business-chart-title'>Revenue Trends</h3>
                    <p className='business-chart-subtitle'>Revenue performance over time</p>
                  </div>
                  <div className='business-chart-actions'>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleRefresh()}
                      disabled={refreshing}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                      {refreshing ? 'Refreshing...' : 'Refresh'}
                    </Button>
                    <Button variant="outline" size="sm">
                      <Eye className='w-4 h-4 mr-2' />
                      View Details
                    </Button>
                  </div>
                </div>
                <div className='h-80'>
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={revenueTrends.data.daily_revenue}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                      <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(value) => formatCurrency(value, '₺')} />
                      <Tooltip 
                        formatter={(value: number) => [formatCurrency(value, '₺'), 'Revenue']}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
                <div className='business-chart-legend'>
                  <div className='business-chart-legend-item'>
                    <div className='business-chart-legend-color bg-blue-500'></div>
                    <span className='business-chart-legend-label'>Revenue</span>
                    <span className='business-chart-legend-value'>₺{revenueTrends.data.metrics.total_revenue?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </Section>
          )}

          {/* Client Analytics */}
          {clientAnalytics && (
            <Section title="Client Analytics" subtitle="Client performance and commission analysis" spacing="lg">
              <CardGrid cols={2} gap="lg">
                <div className='bg-white rounded-2xl shadow-sm border border-gray-200 p-6'>
                  <h3 className='text-lg font-semibold text-gray-900 mb-4'>Top Clients by Volume</h3>
                  <div className='space-y-3'>
                    {clientAnalytics.data.client_analytics?.slice(0, 5).map((client: any, index: number) => (
                      <div key={client.client_name} className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
                        <div className='flex items-center gap-3'>
                          <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center'>
                            <span className='text-sm font-medium text-blue-700'>{index + 1}</span>
                          </div>
                          <div>
                            <p className='font-medium text-gray-900'>{client.client_name}</p>
                            <p className='text-sm text-gray-500'>{client.transaction_count} transactions</p>
                          </div>
                        </div>
                        <span className='font-semibold text-gray-900'>{formatCurrency(client.total_volume, '₺')}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className='bg-white rounded-2xl shadow-sm border border-gray-200 p-6'>
                  <h3 className='text-lg font-semibold text-gray-900 mb-4'>Commission Analysis</h3>
                  <div className='space-y-3'>
                    {commissionAnalytics?.data.psp_commission?.slice(0, 5).map((psp: any, index: number) => (
                      <div key={psp.psp} className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
                        <div className='flex items-center gap-3'>
                          <div className='w-8 h-8 bg-green-100 rounded-full flex items-center justify-center'>
                            <span className='text-sm font-medium text-green-700'>{index + 1}</span>
                          </div>
                          <div>
                            <p className='font-medium text-gray-900'>{psp.psp}</p>
                            <p className='text-sm text-gray-500'>{formatCurrency(psp.total_commission, '₺')} commission</p>
                          </div>
                        </div>
                        <span className='font-semibold text-gray-900'>{psp.commission_rate.toFixed(2)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardGrid>
            </Section>
          )}
        </ContentArea>
      )}

      {/* Performance Tab Content */}
      {activeTab === 'performance' && (
        <ContentArea>
          {/* System Performance Metrics */}
          {systemPerformance && (
            <Section title="System Performance" subtitle="Real-time monitoring" spacing="lg">
              <CardGrid cols={3} gap="lg">
                <StandardMetricsCard
                  title="CPU Usage"
                  value={`${systemPerformance.cpu_usage?.toFixed(1)}%`}
                  subtitle="System performance"
                  icon={Server}
                  color="blue"
                  variant="default"
                />
                
                <StandardMetricsCard
                  title="Memory Usage"
                  value={`${systemPerformance.memory_usage?.toFixed(1)}%`}
                  subtitle="RAM utilization"
                  icon={HardDrive}
                  color="green"
                  variant="default"
                />
                
                <StandardMetricsCard
                  title="System Health"
                  value={systemPerformance.system_health === 'healthy' ? 'Healthy' : systemPerformance.system_health === 'warning' ? 'Warning' : 'Critical'}
                  subtitle="Overall status"
                  icon={Network}
                  color={systemPerformance.system_health === 'healthy' ? 'green' : systemPerformance.system_health === 'warning' ? 'orange' : 'red'}
                  variant="default"
                />
              </CardGrid>
            </Section>
          )}

          {/* Data Quality Metrics */}
          {dataQuality && (
            <Section title="Data Quality Metrics" subtitle="Comprehensive data quality assessment" spacing="lg">
              <CardGrid cols={4} gap="lg">
                <StandardMetricsCard
                  title="Client Completeness"
                  value={`${dataQuality.client_completeness?.toFixed(1)}%`}
                  icon={Users}
                  color="blue"
                  variant="compact"
                />
                
                <StandardMetricsCard
                  title="Amount Completeness"
                  value={`${dataQuality.amount_completeness?.toFixed(1)}%`}
                  icon={DollarSign}
                  color="green"
                  variant="compact"
                />
                
                <StandardMetricsCard
                  title="Date Completeness"
                  value={`${dataQuality.date_completeness?.toFixed(1)}%`}
                  icon={Calendar}
                  color="purple"
                  variant="compact"
                />
                
                <StandardMetricsCard
                  title="Overall Score"
                  value={`${dataQuality.overall_quality_score?.toFixed(1)}%`}
                  icon={Award}
                  color="orange"
                  variant="compact"
                />
              </CardGrid>
            </Section>
          )}
        </ContentArea>
      )}

      {/* Monitoring Tab Content */}
      {activeTab === 'monitoring' && (
        <ContentArea>
          {/* Security Metrics */}
          {securityMetrics && (
            <Section title="Security & Monitoring" subtitle="System security and integration status" spacing="lg">
              <CardGrid cols={2} gap="lg">
                {/* Security Status */}
                <StandardMetricsCard
                  title="Security Status"
                  value={securityMetrics.failed_logins.today}
                  subtitle={`${securityMetrics.suspicious_activities.total_alerts} alerts, ${securityMetrics.session_management.active_sessions} sessions`}
                  icon={Shield}
                  color="danger"
                  variant="default"
                />

                {/* Integration Status */}
                <StandardMetricsCard
                  title="Integration Status"
                  value={integrationStatus ? (integrationStatus.bank_connections.status === 'connected' && integrationStatus.psp_connections.status === 'connected' ? 'All Connected' : 'Issues Detected') : 'Unknown'}
                  subtitle={integrationStatus ? `Bank: ${integrationStatus.bank_connections.status}, PSP: ${integrationStatus.psp_connections.status}` : 'Status unavailable'}
                  icon={ActivityIcon}
                  color={integrationStatus && integrationStatus.bank_connections.status === 'connected' && integrationStatus.psp_connections.status === 'connected' ? 'success' : 'warning'}
                  variant="default"
                />
              </CardGrid>
            </Section>
          )}

          {/* Volume Analysis */}
          {volumeAnalysis && (
            <Section title="Transaction Volume Analysis" subtitle="Daily transaction volume trends" spacing="lg">
              <div className='business-chart'>
                <div className='business-chart-header'>
                  <div>
                    <h3 className='business-chart-title'>Transaction Volume Analysis</h3>
                    <p className='business-chart-subtitle'>Daily transaction volume trends</p>
                  </div>
                  <div className='business-chart-actions'>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleRefresh()}
                      disabled={refreshing}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                      {refreshing ? 'Refreshing...' : 'Refresh'}
                    </Button>
                    <Button variant="outline" size="sm">
                      <Eye className='w-4 h-4 mr-2' />
                      View Details
                    </Button>
                  </div>
                </div>
                <div className='h-80'>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={volumeAnalysis.data.daily_volume}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
                      <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(value) => formatCurrency(value, '₺')} />
                      <Tooltip 
                        formatter={(value: number) => [formatCurrency(value, '₺'), 'Volume']}
                        labelFormatter={(label) => `Day: ${label}`}
                      />
                      <Bar dataKey="volume" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className='business-chart-legend'>
                  <div className='business-chart-legend-item'>
                    <div className='business-chart-legend-color bg-green-500'></div>
                    <span className='business-chart-legend-label'>Volume</span>
                    <span className='business-chart-legend-value'>₺{volumeAnalysis.data.insights.total_volume?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </Section>
          )}
        </ContentArea>
      )}

      {/* Financial Analytics Tab Content */}
      {activeTab === 'financial' && (
        <ContentArea>
          {/* Financial Summary */}
          {dashboardData && (
            <Section title={t('dashboard.financial_overview')} subtitle={t('dashboard.comprehensive_financial_metrics')} spacing="lg">
              <CardGrid cols={4} gap="lg">
                {/* Total Revenue */}
                <StandardMetricsCard
                  title={t('dashboard.total_revenue')}
                  value={formatCurrency(dashboardData.summary.total_revenue, '₺')}
                  subtitle={t('dashboard.all_time')}
                  icon={TrendingUp}
                  color="success"
                  variant="default"
                />

                {/* Total Commission */}
                <StandardMetricsCard
                  title={t('dashboard.total_commission')}
                  value={formatCurrency(dashboardData.summary.total_commission, '₺')}
                  subtitle={t('dashboard.earned')}
                  icon={DollarSign}
                  color="primary"
                  variant="default"
                />

                {/* Active Clients */}
                <StandardMetricsCard
                  title={t('dashboard.active_clients')}
                  value={dashboardData.summary.active_clients}
                  subtitle={t('dashboard.this_month')}
                  icon={Users}
                  color="purple"
                  variant="default"
                />

                {/* Total Transactions */}
                <StandardMetricsCard
                  title={t('dashboard.total_transactions')}
                  value={formatNumber(dashboardData.summary.transaction_count)}
                  subtitle={t('dashboard.all_time')}
                  icon={CreditCard}
                  color="orange"
                  variant="default"
                />
              </CardGrid>
            </Section>
          )}

          {/* Commission Analysis Chart */}
          {commissionAnalytics && (
            <Section title={t('dashboard.commission_distribution')} subtitle={t('dashboard.commission_analysis')} spacing="lg">
              <div className='bg-white rounded-2xl shadow-sm border border-gray-200 p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-lg font-semibold text-gray-900'>Commission Distribution</h3>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleRefresh()}
                    disabled={refreshing}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                  </Button>
                </div>
                <div className='h-80'>
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={commissionAnalytics.data.psp_commission?.map((item: any, index: number) => ({
                          name: item.psp,
                          value: item.total_commission,
                          fill: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]
                        }))}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {commissionAnalytics.data.psp_commission?.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [formatCurrency(value, '₺'), 'Commission']} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Section>
          )}
        </ContentArea>
      )}

      {/* Loading State */}
      {loading && !dashboardData && <DashboardSkeleton />}

      {/* Exchange Rates Modal */}
      {showExchangeRatesModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden'>
            <div className='flex items-center justify-between p-6 border-b border-gray-200'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-sm'>
                  <Globe className='h-5 w-5 text-white' />
                </div>
                <div>
                  <h2 className='text-2xl font-bold text-gray-900'>Exchange Rates Management</h2>
                  <p className='text-sm text-gray-600'>View and manage all currency exchange rates</p>
                </div>
              </div>
              <Button
                onClick={handleCloseRatesModal}
                variant="ghost"
                size="sm"
                className='p-2 text-gray-400 hover:text-gray-600'
              >
                <X className='h-6 w-6' />
              </Button>
            </div>
            <div className='p-6 overflow-y-auto max-h-[calc(90vh-120px)]'>
              <ExchangeRatesDisplay 
                date={new Date().toISOString().slice(0, 10)}
                showSource={true}
                showQuality={true}
                showManualOverride={true}
              />
            </div>
          </div>
        </div>
      )}
    </ContentArea>
  );
});

Dashboard.displayName = 'Dashboard';

export default Dashboard;
