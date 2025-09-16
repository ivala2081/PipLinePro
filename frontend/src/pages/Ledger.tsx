import { useState, useEffect } from 'react';
import {
  Building,
  Search,
  Filter,
  Plus,
  Download,
  Upload,
  Eye,
  Edit,
  Trash2,
  DollarSign,
  TrendingUp,
  Calendar,
  CreditCard,
  Activity,
  BarChart3,
  PieChart,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  Globe,
  Zap,
  LayoutGrid,
  Table,
  LineChart,
  Save,
  AlertTriangle,
  Shield,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { api } from '../utils/apiClient';
import { formatCurrency } from '../utils/currencyUtils';
import { 
  UnifiedCard, 
  UnifiedButton, 
  UnifiedBadge, 
  UnifiedSection, 
  UnifiedGrid 
} from '../design-system';
import { Breadcrumb } from '../components/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import StandardMetricsCard from '../components/StandardMetricsCard';
import MetricCard from '../components/MetricCard';
import { LedgerPageSkeleton } from '../components/EnhancedSkeletonLoaders';

interface PSPData {
  psp: string;
  total_amount: number;
  total_commission: number;
  total_net: number;
  transaction_count: number;
  commission_rate: number;
}

interface PSPOverviewData {
  psp: string;
  total_deposits: number;
  total_withdrawals: number;
  total_net: number;
  total_allocations: number;
  total_rollover: number;
  transaction_count: number;
  average_transaction: number;
  last_activity: string;
}

interface PSPLedgerData {
  deposit: number;
  withdraw: number;
  toplam: number;
  komisyon: number;
  net: number;
  allocation: number;
  rollover: number;
  transaction_count: number;  // Add transaction count field
}

interface DayData {
  date: string;
  date_str: string;
  psps: { [key: string]: PSPLedgerData };
  totals: {
    total_psp: number;
    toplam: number;
    net: number;
    komisyon: number;
    carry_over: number;
  };
}

export default function Ledger() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [pspData, setPspData] = useState<PSPData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pspFilter, setPspFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'ledger' | 'analytics' | 'risk-monitoring'>('overview');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPsp, setSelectedPsp] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [detailsData, setDetailsData] = useState<any>(null);
  const [ledgerData, setLedgerData] = useState<DayData[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [allocationSaving, setAllocationSaving] = useState<{[key: string]: boolean}>({});
  const [allocationSaved, setAllocationSaved] = useState<{[key: string]: boolean}>({});
  const [tempAllocations, setTempAllocations] = useState<{[key: string]: number}>({});
  const [pspOverviewData, setPspOverviewData] = useState<PSPOverviewData[]>([]);

  // Consolidated data fetching effect
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      console.log('🔄 Ledger: Component mounted, fetching data...');
      
      // Clear any previous errors when component mounts
      setError(null);
      
      // Always fetch PSP data first
      fetchPSPData();
      
      // Fetch ledger data if on relevant tabs
      if (activeTab === 'ledger' || activeTab === 'overview') {
        fetchLedgerData();
      }
    }
  }, [isAuthenticated, authLoading, activeTab]);

  // Listen for transaction updates to automatically refresh ledger data
  useEffect(() => {
    const handleTransactionsUpdate = (event: any) => {
      console.log('🔄 Ledger: Received transaction update event', event.detail);
      console.log('🔄 Ledger: Event type:', event.detail?.action);
      console.log('🔄 Ledger: Transaction count:', event.detail?.count);
      
      // Refresh both PSP data and ledger data when transactions are updated
      if (isAuthenticated && !authLoading) {
        console.log('🔄 Ledger: Refreshing data due to transaction updates...');
        console.log('🔄 Ledger: Current active tab:', activeTab);
        
        // Force refresh to get latest data after transaction updates
        fetchPSPData(true);
        
        // Also refresh ledger data if we're on a tab that uses it
        if (activeTab === 'ledger' || activeTab === 'overview') {
          console.log('🔄 Ledger: Refreshing ledger data for tab:', activeTab);
          fetchLedgerData(true);
        } else {
          console.log('🔄 Ledger: Not on ledger/overview tab, skipping ledger refresh');
        }
      } else {
        console.log('🔄 Ledger: Not authenticated or still loading, skipping refresh');
      }
    };

    // Add event listener
    window.addEventListener('transactionsUpdated', handleTransactionsUpdate);
    
    // Cleanup
    return () => {
      window.removeEventListener('transactionsUpdated', handleTransactionsUpdate);
    };
  }, [isAuthenticated, authLoading, activeTab]);

  // Cleanup effect to clear cache when component unmounts
  useEffect(() => {
    return () => {
      // Clear cache when component unmounts to prevent stale data
      api.clearCacheForUrl('psp_summary_stats');
      api.clearCacheForUrl('ledger-data');
    };
  }, []);

  const fetchPSPData = async (forceRefresh = false) => {
    try {
      console.log('🔄 Ledger: Starting PSP data fetch...', { forceRefresh });
      setLoading(true);
      setError(null);

      // Clear cache if forcing refresh
      if (forceRefresh) {
        api.clearCacheForUrl('psp_summary_stats');
      }

      const response = await api.get('/api/v1/transactions/psp_summary_stats', undefined, !forceRefresh);
      console.log('🔄 Ledger: PSP API response received:', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      });

      if (response.status === 401) {
        console.log('🔄 Ledger: Unauthorized, redirect will be handled by AuthContext');
        // User is not authenticated, redirect will be handled by AuthContext
        return;
      }

      const data = await api.parseResponse(response);
      console.log('🔄 Ledger: PSP data parsed:', data);

      if (response.ok && data) {
        // Handle the correct API response format
        // Backend now returns: [{ psp, total_amount, total_commission, total_net, transaction_count, commission_rate }]
        const pspStats = Array.isArray(data) ? data : [];
        console.log('🔄 Ledger: PSP stats array:', pspStats);

        // Transform backend data to frontend format (if needed)
        const transformedData: PSPData[] = pspStats.map((item: any) => ({
          psp: item.psp || 'Unknown',
          total_amount: item.total_amount || 0,
          total_commission: item.total_commission || 0,
          total_net: item.total_net || 0,
          transaction_count: item.transaction_count || 0,
          commission_rate: item.commission_rate || 0,
        }));

        console.log('🔄 Ledger: Transformed PSP data:', transformedData);
        setPspData(transformedData);
        console.log('🔄 Ledger: PSP data set successfully');
      } else {
        console.error('🔄 Ledger: PSP API response not ok or no data:', { response, data });
        setError(data?.message || 'Failed to load PSP data');
        setPspData([]); // Ensure it's always an array
      }
    } catch (error) {
      console.error('🔄 Ledger: Error fetching PSP data:', error);
      setError(`Failed to load PSP data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setPspData([]); // Ensure it's always an array
    } finally {
      setLoading(false);
      console.log('🔄 Ledger: PSP data fetch completed');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Force refresh both PSP and ledger data
      await Promise.all([
        fetchPSPData(true),
        fetchLedgerData(true)
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleExport = () => {
    try {
      // Prepare CSV data for export
      const headers = [
        'Date',
        'PSP',
        'Deposits',
        'Withdrawals',
        'Total',
        'Commission',
        'Net',
        'Allocation',
        'Rollover',
        'Risk Level'
      ];

      const rows: (string | number)[][] = [];
      
      // Add ledger data rows
      ledgerData.forEach((dayData) => {
        Object.entries(dayData.psps).forEach(([psp, pspData]) => {
          const rolloverAmount = (pspData.net || 0) - (pspData.allocation || 0);
          const riskLevel = getRolloverRiskLevel(rolloverAmount, pspData.net || 0);
          
          rows.push([
            dayData.date_str,
            psp,
            pspData.deposit || 0,
            pspData.withdraw || 0,
            pspData.toplam || 0,
            pspData.komisyon || 0,
            pspData.net || 0,
            pspData.allocation || 0,
            rolloverAmount,
            riskLevel
          ]);
        });
      });

      // Create CSV content
      const csvContent = [headers, ...rows].map(row => 
        row.map((cell: string | number) => `"${cell}"`).join(',')
      ).join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ledger_export_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  // Rollover Risk Assessment Functions
  const getRolloverRiskLevel = (rolloverAmount: number, netAmount: number): string => {
    if (netAmount === 0) return 'Normal';
    
    const rolloverRatio = rolloverAmount / netAmount;
    
    if (rolloverRatio > 0.3) return 'Critical';
    if (rolloverRatio > 0.2) return 'High';
    if (rolloverRatio > 0.1) return 'Medium';
    return 'Normal';
  };

  const getRolloverRiskColor = (riskLevel: string): string => {
    switch (riskLevel) {
      case 'Critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'High': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'Medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const getRolloverRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Critical': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'High': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'Medium': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default: return <Shield className="h-4 w-4 text-green-600" />;
    }
  };

  const getRolloverWarningMessage = (riskLevel: string, rolloverAmount: number): string => {
    switch (riskLevel) {
      case 'Critical': return `High rollover risk: ₺${rolloverAmount.toLocaleString()} outstanding`;
      case 'High': return `Elevated rollover: ₺${rolloverAmount.toLocaleString()} pending`;
      case 'Medium': return `Moderate rollover: ₺${rolloverAmount.toLocaleString()} to monitor`;
      default: return `Healthy rollover level`;
    }
  };

  // Advanced Risk Analysis Functions
  const calculateRiskScore = (rolloverAmount: number, netAmount: number, daysOutstanding: number): number => {
    if (netAmount === 0) return 0;
    
    const rolloverRatio = rolloverAmount / netAmount;
    const timeMultiplier = Math.min(daysOutstanding / 30, 2); // Cap at 2x for time factor
    
    // Base risk score (0-100)
    let baseScore = rolloverRatio * 100;
    
    // Apply time multiplier
    baseScore *= timeMultiplier;
    
    // Apply severity penalties
    if (rolloverRatio > 0.5) baseScore *= 1.5; // 50%+ rollover gets penalty
    if (rolloverRatio > 0.8) baseScore *= 2;   // 80%+ rollover gets severe penalty
    
    return Math.min(Math.round(baseScore), 100);
  };

  const getRiskTrend = (pspName: string): 'increasing' | 'decreasing' | 'stable' => {
    // Analyze last 3 days of data for trend
    const recentData = ledgerData.slice(0, 3);
    const trends: number[] = [];
    
    recentData.forEach(dayData => {
      if (dayData.psps[pspName]) {
        const pspData = dayData.psps[pspName];
        const rolloverAmount = (pspData.net || 0) - (pspData.allocation || 0);
        const riskScore = calculateRiskScore(rolloverAmount, pspData.net || 0, 0);
        trends.push(riskScore);
      }
    });
    
    if (trends.length < 2) return 'stable';
    
    const recentTrend = trends[0] - trends[trends.length - 1];
    if (recentTrend > 10) return 'decreasing';
    if (recentTrend < -10) return 'increasing';
    return 'stable';
  };

  const getRiskMitigationRecommendations = (riskLevel: string, rolloverAmount: number, daysOutstanding: number): string[] => {
    const recommendations: string[] = [];
    
    if (riskLevel === 'Critical') {
      recommendations.push('Immediate payment request to PSP');
      recommendations.push('Suspend new transactions until resolved');
      recommendations.push('Escalate to senior management');
      if (daysOutstanding > 7) {
        recommendations.push('Consider legal action if necessary');
      }
    } else if (riskLevel === 'High') {
      recommendations.push('Send payment reminder within 24 hours');
      recommendations.push('Monitor daily until resolved');
      recommendations.push('Prepare escalation plan');
    } else if (riskLevel === 'Medium') {
      recommendations.push('Send weekly payment reminder');
      recommendations.push('Monitor weekly progress');
      recommendations.push('Set up automated follow-up');
    }
    
    if (daysOutstanding > 14) {
      recommendations.push('Review PSP relationship status');
    }
    
    return recommendations;
  };

  const calculatePortfolioRiskMetrics = () => {
    const metrics = {
      totalRiskScore: 0,
      averageRiskScore: 0,
      riskDistribution: { low: 0, medium: 0, high: 0, critical: 0 },
      totalExposure: 0,
      riskConcentration: 0,
      daysToResolution: 0
    };
    
    let totalPSPs = 0;
    let totalRiskScore = 0;
    let totalExposure = 0;
    const riskScores: number[] = [];
    
    ledgerData.forEach(dayData => {
      Object.entries(dayData.psps).forEach(([psp, pspData]) => {
        const rolloverAmount = (pspData.net || 0) - (pspData.allocation || 0);
        const riskLevel = getRolloverRiskLevel(rolloverAmount, pspData.net || 0);
        const daysOutstanding = Math.ceil((Date.now() - new Date(dayData.date).getTime()) / (1000 * 60 * 60 * 24));
        const riskScore = calculateRiskScore(rolloverAmount, pspData.net || 0, daysOutstanding);
        
        totalPSPs++;
        totalRiskScore += riskScore;
        totalExposure += rolloverAmount;
        riskScores.push(riskScore);
        
        // Count risk distribution
        if (riskScore < 25) metrics.riskDistribution.low++;
        else if (riskScore < 50) metrics.riskDistribution.medium++;
        else if (riskScore < 75) metrics.riskDistribution.high++;
        else metrics.riskDistribution.critical++;
      });
    });
    
    metrics.totalRiskScore = totalRiskScore;
    metrics.averageRiskScore = totalPSPs > 0 ? Math.round(totalRiskScore / totalPSPs) : 0;
    metrics.totalExposure = totalExposure;
    metrics.riskConcentration = totalExposure > 0 ? (Math.max(...riskScores) / totalExposure) * 100 : 0;
    metrics.daysToResolution = Math.ceil(totalExposure / 10000); // Rough estimate based on typical daily resolution capacity
    
    return metrics;
  };

  const fetchLedgerData = async (forceRefresh = false) => {
    setLedgerLoading(true);
    try {
      console.log('🔄 Ledger: Fetching ledger data...', { forceRefresh });
      
      // Clear cache if forcing refresh
      if (forceRefresh) {
        api.clearCacheForUrl('ledger-data');
      }
      
      const response = await api.get('/api/v1/analytics/ledger-data', undefined, !forceRefresh);
      console.log('🔄 Ledger: Response status:', response.status);
      
      if (response.ok) {
        const data = await api.parseResponse(response);
        console.log('🔄 Ledger: Raw API response:', data);
        
        const ledgerData = data.ledger_data || [];
        console.log('🔄 Ledger: Processed ledger data:', ledgerData);
        console.log('🔄 Ledger: Data length:', ledgerData.length);
        
        if (ledgerData.length > 0) {
          console.log('🔄 Ledger: First day data:', ledgerData[0]);
          console.log('🔄 Ledger: PSPs in first day:', Object.keys(ledgerData[0].psps || {}));
        }
        
        setLedgerData(ledgerData);
        
        // Initialize tempAllocations with current allocation values
        const initialTempAllocations: {[key: string]: number} = {};
        ledgerData.forEach((day: DayData) => {
          Object.entries(day.psps).forEach(([psp, pspData]) => {
            const key = `${day.date}-${psp}`;
            const typedPspData = pspData as PSPLedgerData;
            initialTempAllocations[key] = typedPspData.allocation || 0;
          });
        });
        setTempAllocations(initialTempAllocations);
        
        // Calculate PSP overview data
        calculatePSPOverviewData(ledgerData);
        
        // Check for validation errors
        if (data?.validation_errors) {
          console.warn('Data validation warnings:', data.validation_errors);
          setError(`Data loaded with warnings: ${data.validation_errors.join(', ')}`);
        } else {
          // Clear any previous errors on successful load
          setError(null);
        }
      } else {
        const errorMessage = 'Failed to fetch ledger data';
        console.error('Failed to fetch ledger data:', errorMessage);
        setError(errorMessage);
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Network error occurred';
      console.error('Error fetching ledger data:', error);
      setError(`Failed to load ledger data: ${errorMessage}`);
      setLedgerData([]); // Clear data on error
    } finally {
      setLedgerLoading(false);
    }
  };

  const calculatePSPOverviewData = (data: DayData[]) => {
    const pspMap = new Map<string, PSPOverviewData>();

    data.forEach(day => {
      Object.entries(day.psps).forEach(([psp, pspData]) => {
        if (!pspMap.has(psp)) {
          pspMap.set(psp, {
            psp,
            total_deposits: 0,
            total_withdrawals: 0,
            total_net: 0,
            total_allocations: 0,
            total_rollover: 0,
            transaction_count: 0,
            average_transaction: 0,
            last_activity: day.date_str
          });
        }

        const overview = pspMap.get(psp)!;
        overview.total_deposits += pspData.deposit;
        overview.total_withdrawals += pspData.withdraw;
        overview.total_net += pspData.net;
        overview.total_allocations += pspData.allocation;
        
        // Use actual transaction count from backend
        overview.transaction_count += pspData.transaction_count || 1;
        
        overview.last_activity = day.date_str; // Keep the most recent date
      });
    });

    // Calculate average transaction amounts
    pspMap.forEach(overview => {
      overview.average_transaction = overview.transaction_count > 0 
        ? overview.total_net / overview.transaction_count 
        : 0;
      
      // Calculate rollover as net - allocations (this should now be consistent)
      overview.total_rollover = overview.total_net - overview.total_allocations;
    });

    const overviewArray = Array.from(pspMap.values());
    setPspOverviewData(overviewArray);
  };

  const handleAllocationChange = (date: string, psp: string, allocation: number) => {
    const key = `${date}-${psp}`;
    setTempAllocations(prev => ({ ...prev, [key]: allocation }));
  };

  const testCSRF = async () => {
    try {
      console.log('🧪 Testing CSRF with simple endpoint...');
      const response = await api.post('/api/v1/analytics/test-csrf', {
        test: 'data',
        timestamp: new Date().toISOString()
      });
      
      if (response.ok) {
        const data = await api.parseResponse(response);
        console.log('✅ CSRF test successful:', data);
        alert('CSRF test successful!');
      } else {
        console.error('❌ CSRF test failed:', response.status);
        alert('CSRF test failed!');
      }
    } catch (error) {
      console.error('💥 CSRF test error:', error);
      alert('CSRF test error!');
    }
  };

  const handleSaveAllocation = async (date: string, psp: string) => {
    const key = `${date}-${psp}`;
    const allocation = tempAllocations[key] || 0;
    
    setAllocationSaving(prev => ({ ...prev, [key]: true }));
    setAllocationSaved(prev => ({ ...prev, [key]: false }));

    try {
      console.log('🔄 Saving allocation:', { date, psp, allocation });
      
      const response = await api.post('/api/v1/analytics/update-allocation', {
        date,
        psp,
        allocation
      });

      console.log('📡 Allocation save response:', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      });

      if (response.ok) {
        const responseData = await api.parseResponse(response);
        console.log('✅ Allocation saved successfully:', responseData);
        
        setAllocationSaved(prev => ({ ...prev, [key]: true }));
        
        // Refresh ledger data from backend to get updated rollover calculations
        await fetchLedgerData(true);
        
        // Clear saved status after 2 seconds
        setTimeout(() => {
          setAllocationSaved(prev => ({ ...prev, [key]: false }));
        }, 2000);
      } else {
        // Try to get error details
        try {
          const errorData = await response.json();
          console.error('❌ Failed to update allocation:', errorData);
        } catch (parseError) {
          console.error('❌ Failed to parse error response:', parseError);
        }
      }
    } catch (error) {
      console.error('💥 Error updating allocation:', error);
    } finally {
      setAllocationSaving(prev => ({ ...prev, [key]: false }));
    }
  };

  const handlePspDetails = async (psp: string) => {
    setSelectedPsp(psp);
    setSelectedDate(null);
    setShowDetailsModal(true);
    
    try {
      // Fetch PSP-specific transaction details
      const response = await api.get(`/api/v1/transactions?psp=${encodeURIComponent(psp)}&per_page=100`);
      if (response.ok) {
        const data = await api.parseResponse(response);
        setDetailsData({
          type: 'psp',
          psp: psp,
          transactions: data.transactions || [],
          total: data.total || 0
        });
      }
    } catch (error) {
      console.error('Error fetching PSP details:', error);
      setDetailsData({
        type: 'psp',
        psp: psp,
        transactions: [],
        total: 0,
        error: 'Failed to load details'
      });
    }
  };

  const handleDailyDetails = async (date: string, psp: string) => {
    setSelectedDate(date);
    setSelectedPsp(psp);
    setShowDetailsModal(true);
    
    try {
      // Fetch daily transaction details for specific PSP
      const response = await api.get(`/api/v1/transactions?date=${date}&psp=${encodeURIComponent(psp)}&per_page=100`);
      if (response.ok) {
        const data = await api.parseResponse(response);
        setDetailsData({
          type: 'daily',
          date: date,
          psp: psp,
          transactions: data.transactions || [],
          total: data.total || 0
        });
      }
    } catch (error) {
      console.error('Error fetching daily details:', error);
      setDetailsData({
        type: 'daily',
        date: date,
        psp: psp,
        transactions: [],
        total: 0,
        error: 'Failed to load details'
      });
    }
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedPsp(null);
    setSelectedDate(null);
    setDetailsData(null);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getPSPColor = (psp: string) => {
    const colors = [
      'bg-gray-100 text-gray-800',
      'bg-green-100 text-green-800',
      'bg-purple-100 text-purple-800',
      'bg-orange-100 text-orange-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800',
      'bg-teal-100 text-teal-800',
      'bg-yellow-100 text-yellow-800',
    ];
    const index = psp.length % colors.length;
    return colors[index];
  };

  const getPSPIcon = (psp: string) => {
    const icons = [Building, CreditCard, Globe, Users, Zap, Activity];
    const index = psp.length % icons.length;
    return icons[index];
  };

  // Ensure pspData is always an array and handle filtering safely
  const filteredData = Array.isArray(pspData)
    ? pspData.filter(entry => {
        const matchesSearch = entry.psp
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        const matchesPSP = pspFilter === 'all' || entry.psp === pspFilter;

        return matchesSearch && matchesPSP;
      })
    : [];

  const totalEntries = filteredData.length;
  const totalAmount = filteredData.reduce(
    (sum, entry) => sum + entry.total_amount,
    0
  );
  const totalCommission = filteredData.reduce(
    (sum, entry) => sum + entry.total_commission,
    0
  );
  const totalNet = filteredData.reduce(
    (sum, entry) => sum + entry.total_net,
    0
  );
  const totalTransactions = filteredData.reduce(
    (sum, entry) => sum + entry.transaction_count,
    0
  );

  const uniquePSPs = Array.isArray(pspData)
    ? [...new Set(pspData.map(entry => entry.psp))]
    : [];

  // Enhanced loading state
  if (authLoading || loading) {
    return <LedgerPageSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-red-50'>
        <div className='text-center max-w-md mx-auto p-8'>
          <div className='w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6'>
            <AlertCircle className='h-10 w-10 text-red-600' />
          </div>
          <h2 className='text-2xl font-bold text-gray-900 mb-4'>
            Error Loading Data
          </h2>
          <p className='text-gray-600 mb-6'>{error}</p>
          <button 
            onClick={() => fetchPSPData(true)} 
            className='inline-flex items-center gap-2 px-6 py-3 bg-accent-600 text-white rounded-lg hover:bg-accent-700 transition-colors duration-200'
          >
            <RefreshCw className='h-4 w-4' />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Breadcrumb Navigation */}
      <div className="mb-6">
        <Breadcrumb 
          items={[
            { label: 'Dashboard', href: '/' },
            { label: 'PSP Ledger', current: true }
          ]} 
        />
      </div>

      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Building className="h-8 w-8 text-gray-600" />
              PSP Ledger
            </h1>
            <p className="text-gray-600 mt-1">PSP transactions and balances</p>
          </div>
          <div className="flex items-center gap-3">
            <UnifiedButton 
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              icon={<RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />}
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </UnifiedButton>
            <UnifiedButton 
              variant="outline" 
              size="sm"
              onClick={handleExport}
              icon={<Download className='h-4 w-4' />}
            >
              Export
            </UnifiedButton>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Status Indicators */}
      <div className="bg-gray-50/50 border border-gray-200/60 rounded-xl p-4">
        <div className='flex items-center gap-6 text-sm text-gray-700'>
          <div className='flex items-center gap-2'>
            <div className='w-2 h-2 bg-green-500 rounded-full'></div>
            <span className="font-medium">Total Entries: {totalEntries}</span>
          </div>
          <div className='flex items-center gap-2'>
            <div className='w-2 h-2 bg-gray-500 rounded-full'></div>
            <span className="font-medium">Total Volume: {formatCurrency(totalAmount, '₺')}</span>
          </div>
        </div>
      </div>


      {/* Modern Tab Navigation */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-50/80 border border-gray-200/60 shadow-sm">
          <TabsTrigger value="overview" className="group flex items-center gap-2 transition-all duration-300 ease-in-out hover:bg-white/90 hover:shadow-md hover:scale-[1.02] data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:border data-[state=active]:border-gray-200">
            <LayoutGrid className="h-4 w-4 transition-all duration-300 ease-in-out group-hover:scale-110 group-hover:text-blue-600" />
            <span className="transition-all duration-300 ease-in-out group-hover:font-semibold">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="ledger" className="group flex items-center gap-2 transition-all duration-300 ease-in-out hover:bg-white/90 hover:shadow-md hover:scale-[1.02] data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:border data-[state=active]:border-gray-200">
            <Table className="h-4 w-4 transition-all duration-300 ease-in-out group-hover:scale-110 group-hover:text-blue-600" />
            <span className="transition-all duration-300 ease-in-out group-hover:font-semibold">Ledger</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="group flex items-center gap-2 transition-all duration-300 ease-in-out hover:bg-white/90 hover:shadow-md hover:scale-[1.02] data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:border data-[state=active]:border-gray-200">
            <LineChart className="h-4 w-4 transition-all duration-300 ease-in-out group-hover:scale-110 group-hover:text-blue-600" />
            <span className="transition-all duration-300 ease-in-out group-hover:font-semibold">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="risk-monitoring" className="group flex items-center gap-2 transition-all duration-300 ease-in-out hover:bg-white/90 hover:shadow-md hover:scale-[1.02] data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:border data-[state=active]:border-gray-200">
            <Shield className="h-4 w-4 transition-all duration-300 ease-in-out group-hover:scale-110 group-hover:text-blue-600" />
            <span className="transition-all duration-300 ease-in-out group-hover:font-semibold">Risk Monitoring</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab Content */}
        <TabsContent value="overview" className="space-y-6">
          {/* Enhanced Stats Cards Section */}
          <UnifiedCard variant="elevated" className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-gray-600" />
                PSP Overview
              </CardTitle>
              <CardDescription>
                Key performance indicators for all payment service providers (Showing all available data)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Total PSPs"
                value={formatNumber(pspOverviewData.length)}
                subtitle="Active providers"
                icon={Building}
                color="gray"
              />

              {/* Rollover Risk Overview Card */}
              {(() => {
                const riskSummary = ledgerData.reduce((summary, dayData) => {
                  Object.entries(dayData.psps).forEach(([psp, pspData]) => {
                    const rolloverAmount = (pspData.net || 0) - (pspData.allocation || 0);
                    const riskLevel = getRolloverRiskLevel(rolloverAmount, pspData.net || 0);
                    
                    if (riskLevel === 'Critical') summary.critical++;
                    else if (riskLevel === 'High') summary.high++;
                    else if (riskLevel === 'Medium') summary.medium++;
                    else summary.normal++;
                    
                    summary.totalRollover += rolloverAmount;
                  });
                  return summary;
                }, { critical: 0, high: 0, medium: 0, normal: 0, totalRollover: 0 });

                const hasRisk = riskSummary.critical > 0 || riskSummary.high > 0;
                const riskColor = hasRisk ? 'red' : 'green';
                const riskIcon = hasRisk ? AlertTriangle : Shield;
                const riskValue = hasRisk ? `${riskSummary.critical + riskSummary.high}` : '0';
                const riskSubtitle = hasRisk ? `${riskSummary.critical} critical, ${riskSummary.high} high` : 'Healthy levels';
                
                // Calculate average risk percentage
                const totalPSPs = riskSummary.critical + riskSummary.high + riskSummary.medium + riskSummary.normal;
                const avgRisk = totalPSPs > 0 ? (riskSummary.critical + riskSummary.high) / totalPSPs : 0;

                return (
                  <MetricCard
                    title="Rollover Risk"
                    value={riskValue}
                    subtitle={riskSubtitle}
                    icon={riskIcon}
                    color={riskColor}
                  />
                );
              })()}

              <MetricCard
                title={t('ledger.total_allocations')}
                value={formatCurrency(pspOverviewData.reduce((sum, psp) => sum + psp.total_allocations, 0), '₺')}
                subtitle="Funds allocated"
                icon={CreditCard}
                color="orange"
              />

              <MetricCard
                title={t('ledger.total_rollover')}
                value={formatCurrency(pspOverviewData.reduce((sum, psp) => sum + psp.total_rollover, 0), '₺')}
                subtitle="Available balance"
                icon={Activity}
                color="purple"
              />
              </div>
            </CardContent>
          </UnifiedCard>

          {/* PSP Overview Cards Section */}
          <UnifiedCard variant="elevated" className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-gray-600" />
                PSP Overview Cards
              </CardTitle>
              <CardDescription>
                {`${pspOverviewData.length} PSP${pspOverviewData.length !== 1 ? 's' : ''} - All available data`}
              </CardDescription>
            </CardHeader>
            <CardContent>
            {ledgerLoading ? (
              <div className='flex items-center justify-center py-12'>
                <div className='flex items-center gap-3'>
                  <RefreshCw className='h-6 w-6 animate-spin text-accent-600' />
                  <span className='text-gray-600'>Loading PSP overview data...</span>
                </div>
              </div>
            ) : (
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {pspOverviewData.map((psp, index) => {
                  const PSPSpecificIcon = getPSPIcon(psp.psp) || Building;
                  // Use the rollover value that was calculated in calculatePSPOverviewData
                  const rolloverAmount = psp.total_rollover;
                  const rolloverPercentage = psp.total_net > 0 ? (rolloverAmount / psp.total_net) * 100 : 0;
                  const isRolloverPositive = rolloverAmount > 0;
                  
                  // Debug logging for all PSPs
                  console.log(`🔍 PSP Card Debug - ${psp.psp}:`, {
                    total_net: psp.total_net,
                    total_allocations: psp.total_allocations,
                    rollover_amount: rolloverAmount,
                    rollover_percentage: rolloverPercentage
                  });
                  
                  return (
                    <div key={psp.psp} className='bg-gradient-to-br from-white to-gray-50/80 rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-xl transition-all duration-300 group backdrop-blur-sm'>
                      {/* Header */}
                      <div className='flex items-center justify-between mb-6'>
                        <div className='flex items-center gap-4'>
                          <div className='w-14 h-14 bg-gradient-to-br from-gray-500 to-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg'>
                            <PSPSpecificIcon className='h-7 w-7 text-white' />
                          </div>
                          <div>
                            <h4 className='text-xl font-bold text-gray-900 group-hover:text-gray-600 transition-colors duration-200'>{psp.psp}</h4>
                            <p className='text-sm text-gray-500'>Payment Provider</p>
                          </div>
                        </div>
                        <div className='text-right'>
                          <div className={`text-lg font-bold ${isRolloverPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                            {rolloverPercentage.toFixed(1)}%
                          </div>
                          <div className='text-xs text-gray-500'>{t('ledger.rollover_rate')}</div>
                        </div>
                      </div>

                      {/* Key Metrics */}
                      <div className='space-y-4 mb-6'>
                        <div className='flex justify-between items-center p-3 bg-gradient-to-r from-emerald-50 to-emerald-100/50 rounded-xl border border-emerald-200'>
                          <span className='text-sm font-medium text-emerald-700'>Total Deposits</span>
                          <span className='text-sm font-bold text-emerald-900'>{formatCurrency(psp.total_deposits, '₺')}</span>
                        </div>
                        <div className='flex justify-between items-center p-3 bg-gradient-to-r from-red-50 to-red-100/50 rounded-xl border border-red-200'>
                          <span className='text-sm font-medium text-red-700'>Total Withdrawals</span>
                          <span className='text-sm font-bold text-red-900'>{formatCurrency(psp.total_withdrawals, '₺')}</span>
                        </div>
                        <div className='flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl border border-gray-200'>
                          <span className='text-sm font-medium text-gray-700'>Net Amount</span>
                          <span className='text-sm font-bold text-gray-900'>{formatCurrency(psp.total_net, '₺')}</span>
                        </div>
                      </div>

                      {/* Allocation & Rollover */}
                      <div className='bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl p-4 mb-6 border border-gray-200'>
                        <div className='flex justify-between items-center mb-3'>
                          <span className='text-sm font-medium text-gray-700'>{t('ledger.allocations')}</span>
                          <span className='text-sm font-bold text-orange-600'>{formatCurrency(psp.total_allocations, '₺')}</span>
                        </div>
                        <div className='flex justify-between items-center'>
                          <span className='text-sm font-medium text-gray-700'>{t('ledger.rollover')}</span>
                          <span className={`text-sm font-bold ${isRolloverPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                            {formatCurrency(rolloverAmount, '₺')}
                          </span>
                        </div>
                      </div>

                      {/* Footer Stats */}
                      <div className='flex justify-between items-center pt-4 border-t border-gray-200'>
                        <div className='text-center'>
                          <div className='text-xs text-gray-500'>Transactions</div>
                          <div className='text-sm font-bold text-gray-900'>{formatNumber(psp.transaction_count)}</div>
                        </div>
                        <div className='text-center'>
                          <div className='text-xs text-gray-500'>Avg. Transaction</div>
                          <div className='text-sm font-bold text-gray-900'>{formatCurrency(psp.average_transaction, '₺')}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {pspOverviewData.length === 0 && !ledgerLoading && (
              <div className='text-center py-12'>
                <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                  <Building className='h-8 w-8 text-gray-400' />
                </div>
                <h3 className='text-lg font-medium text-gray-900 mb-2'>No PSP Data Available</h3>
                <p className='text-gray-500'>No payment service provider data found for the selected period.</p>
              </div>
            )}
            </CardContent>
          </UnifiedCard>
        </TabsContent>

        <TabsContent value="ledger" className="space-y-6">
          {/* Enhanced Filters Section */}
          <UnifiedCard variant="elevated" className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-gray-600" />
                Filters & Search
              </CardTitle>
              <CardDescription>
                Search and filter PSP ledger data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between'>
                <div className='flex flex-col sm:flex-row gap-4 flex-1'>
                  <div className='relative flex-1 max-w-md'>
                    <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                    <input
                      type='text'
                      placeholder='Search PSPs...'
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className='w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent transition-colors duration-200'
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2"
                  >
                    <Filter className='h-4 w-4' />
                    Filters
                  </Button>
                </div>
                <div className='flex gap-3'>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button variant="default" size="sm" className="flex items-center gap-2">
                    <Download className='h-4 w-4' />
                    Export
                  </Button>
                </div>
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className='mt-6 pt-6 border-t border-gray-100'>
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>Date Range</label>
                      <select className='w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent'>
                        <option value='7'>Last 7 days</option>
                        <option value='30' selected>Last 30 days</option>
                        <option value='90'>Last 90 days</option>
                        <option value='365'>Last year</option>
                      </select>
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>Commission Rate</label>
                      <select className='w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent'>
                        <option value=''>All rates</option>
                        <option value='low'>Low (&lt; 2%)</option>
                        <option value='medium'>Medium (2-5%)</option>
                        <option value='high'>High (&gt; 5%)</option>
                      </select>
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>Status</label>
                      <select className='w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent'>
                        <option value=''>All statuses</option>
                        <option value='active'>Active</option>
                        <option value='inactive'>Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </UnifiedCard>

          {/* Enhanced Rollover Risk Summary with Predictive Alerts */}
          {(() => {
            const riskSummary = ledgerData.reduce((summary, dayData) => {
              Object.entries(dayData.psps).forEach(([psp, pspData]) => {
                const rolloverAmount = (pspData.net || 0) - (pspData.allocation || 0);
                const riskLevel = getRolloverRiskLevel(rolloverAmount, pspData.net || 0);
                
                if (riskLevel === 'Critical') summary.critical++;
                else if (riskLevel === 'High') summary.high++;
                else if (riskLevel === 'Medium') summary.medium++;
                else summary.normal++;
                
                summary.totalRollover += rolloverAmount;
              });
              return summary;
            }, { critical: 0, high: 0, medium: 0, normal: 0, totalRollover: 0 });

            const portfolioMetrics = calculatePortfolioRiskMetrics();
            const hasRisk = riskSummary.critical > 0 || riskSummary.high > 0;
            const isHighRiskPortfolio = portfolioMetrics.averageRiskScore > 70;

            if (hasRisk || isHighRiskPortfolio) {
              return (
                <div className={`${isHighRiskPortfolio ? 'bg-red-50/50 border-red-200/60' : 'bg-orange-50/50 border-orange-200/60'} border rounded-xl p-4 mb-6`}>
                  <div className='flex items-center gap-4 text-sm'>
                    <div className='flex items-center gap-2'>
                      {isHighRiskPortfolio ? (
                        <AlertTriangle className='h-5 w-5 text-red-600' />
                      ) : (
                        <AlertTriangle className='h-5 w-5 text-orange-600' />
                      )}
                      <span className={`font-semibold ${isHighRiskPortfolio ? 'text-red-700' : 'text-orange-700'}`}>
                        {isHighRiskPortfolio ? '🚨 CRITICAL PORTFOLIO RISK' : '⚠️ Rollover Risk Alert'}
                      </span>
                    </div>
                    <div className={`flex items-center gap-6 ${isHighRiskPortfolio ? 'text-red-700' : 'text-orange-700'}`}>
                      {riskSummary.critical > 0 && (
                        <div className='flex items-center gap-2'>
                          <div className='w-3 h-3 bg-red-500 rounded-full'></div>
                          <span className="font-medium">{riskSummary.critical} Critical Risk PSPs</span>
                        </div>
                      )}
                      {riskSummary.high > 0 && (
                        <div className='flex items-center gap-2'>
                          <div className='w-3 h-3 bg-orange-500 rounded-full'></div>
                          <span className="font-medium">{riskSummary.high} High Risk PSPs</span>
                        </div>
                      )}
                      {riskSummary.medium > 0 && (
                        <div className='flex items-center gap-2'>
                          <div className='w-3 h-3 bg-yellow-500 rounded-full'></div>
                          <span className="font-medium">{riskSummary.medium} Medium Risk PSPs</span>
                        </div>
                      )}
                      <div className='flex items-center gap-2'>
                        <div className='w-3 h-3 bg-red-600 rounded-full'></div>
                        <span className="font-medium">Total Outstanding: {formatCurrency(riskSummary.totalRollover, '₺')}</span>
                      </div>
                      {isHighRiskPortfolio && (
                        <div className='flex items-center gap-2'>
                          <div className='w-3 h-3 bg-red-600 rounded-full'></div>
                          <span className="font-medium">Portfolio Risk Score: {portfolioMetrics.averageRiskScore}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {isHighRiskPortfolio && (
                    <div className='mt-3 p-3 bg-red-100/50 rounded-lg border border-red-200/50'>
                      <div className='text-sm text-red-800'>
                        <strong>🚨 IMMEDIATE ACTION REQUIRED:</strong> Portfolio risk level is critically high. 
                        Review all PSP relationships and implement emergency risk mitigation measures.
                      </div>
                    </div>
                  )}
                </div>
              );
            }
            return null;
          })()}

          {/* Ledger Data Section */}
          <UnifiedCard variant="elevated" className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Table className="h-5 w-5 text-gray-600" />
                Ledger Data
              </CardTitle>
              <CardDescription>
                Daily PSP transaction and balance information
              </CardDescription>
            </CardHeader>
            <CardContent>
            {/* Ledger Data Loading */}
            {ledgerLoading && (
              <div className='flex items-center justify-center py-12'>
                <div className='flex items-center gap-3'>
                  <RefreshCw className='h-6 w-6 animate-spin text-accent-600' />
                  <span className='text-gray-600'>Loading ledger data...</span>
                </div>
              </div>
            )}

            {/* Ledger Data */}
            {!ledgerLoading && ledgerData.length > 0 && (
              <div className='space-y-6'>
                {ledgerData.map((dayData, dayIndex) => (
                  <div key={dayIndex} className='bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden'>
                    {/* Day Header */}
                    <div className='bg-gray-50 border-b border-gray-100 px-6 py-4'>
                      <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
                        <div className='flex-1'>
                          <h3 className='text-lg font-semibold text-gray-900'>{dayData.date_str}</h3>
                          <div className='flex items-center gap-4 mt-1 text-sm text-gray-600'>
                            <span>{dayData.totals.total_psp} PSP</span>
                            <span>•</span>
                            <span>{formatCurrency(dayData.totals.toplam, '₺')}</span>
                          </div>
                        </div>
                        <div className='flex gap-8'>
                          <div className='text-right'>
                            <div className='text-base font-semibold text-gray-900'>
                              {formatCurrency(dayData.totals.net, '₺')}
                            </div>
                            <div className='text-xs text-gray-600 uppercase tracking-wide'>Net</div>
                          </div>
                          <div className='text-right'>
                            <div className='text-base font-semibold text-gray-900'>
                              {formatCurrency(dayData.totals.komisyon, '₺')}
                            </div>
                            <div className='text-xs text-gray-600 uppercase tracking-wide'>Commission</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* PSP Table */}
                    <div className='overflow-x-auto'>
                      <table className='w-full'>
                        <thead className='bg-gray-50 border-b border-gray-100'>
                          <tr>
                            <th className='px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                              PSP
                            </th>
                            <th className='px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                              Deposit
                            </th>
                            <th className='px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                              Withdraw
                            </th>
                            <th className='px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                              Total
                            </th>
                            <th className='px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                              Commission
                            </th>
                            <th className='px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                              Net
                            </th>
                            <th className='px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                              {t('ledger.allocations')}
                            </th>
                            <th className='px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                              {t('ledger.rollover')}
                            </th>
                            <th className='px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                              Risk Level
                            </th>
                            <th className='px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                              Status
                            </th>
                            <th className='px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className='divide-y divide-gray-100'>
                          {Object.entries(dayData.psps).map(([psp, pspData], pspIndex) => {
                            const PSPSpecificIcon = getPSPIcon(psp) || Building;
                            const typedPspData = pspData as PSPLedgerData;
                            const currentAllocation: number = tempAllocations[`${dayData.date}-${psp}`] ?? typedPspData.allocation ?? 0;
                            const rolloverAmount = typedPspData.net - currentAllocation;
                            const netAmount = typedPspData.net;
                            
                            // Determine status
                            let status = 'unpaid';
                            let statusClass = 'bg-red-100 text-red-800';
                            if (rolloverAmount <= 0) {
                              status = 'paid';
                              statusClass = 'bg-green-100 text-green-800';
                            } else if (rolloverAmount < (netAmount * 0.1)) {
                              status = 'almost-paid';
                              statusClass = 'bg-gray-100 text-gray-800';
                            }

                            return (
                              <tr key={pspIndex} className='hover:bg-gray-50 transition-colors duration-200'>
                                <td className='px-6 py-4'>
                                  <div className='flex items-center gap-3'>
                                    <div className='flex-shrink-0'>
                                      <div className='w-8 h-8 bg-gradient-to-br from-accent-500 to-accent-600 rounded-lg flex items-center justify-center'>
                                        <PSPSpecificIcon className='h-4 w-4 text-white' />
                                      </div>
                                    </div>
                                    <div>
                                      <div className='text-sm font-medium text-gray-900'>{psp}</div>
                                      <div className='text-xs text-gray-500'>
                                        {new Date(dayData.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className='px-6 py-4 text-right'>
                                  <div className='text-sm font-medium text-green-600'>
                                    {formatCurrency(typedPspData.deposit, '₺')}
                                  </div>
                                </td>
                                <td className='px-6 py-4 text-right'>
                                  <div className='text-sm font-medium text-red-600'>
                                    {formatCurrency(typedPspData.withdraw, '₺')}
                                  </div>
                                </td>
                                <td className='px-6 py-4 text-right'>
                                  <div className='text-sm font-medium text-gray-900'>
                                    {formatCurrency(typedPspData.toplam, '₺')}
                                  </div>
                                </td>
                                <td className='px-6 py-4 text-right'>
                                  <div className='text-sm font-medium text-purple-600'>
                                    {formatCurrency(typedPspData.komisyon, '₺')}
                                  </div>
                                </td>
                                <td className='px-6 py-4 text-right'>
                                  <div className='text-sm font-semibold text-green-600'>
                                    {formatCurrency(typedPspData.net, '₺')}
                                  </div>
                                </td>
                                <td className='px-6 py-4 text-right'>
                                  <div className='flex items-center gap-3'>
                                    <div className='relative'>
                                      <input
                                        type='number'
                                        step='0.01'
                                        className='w-28 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-right font-medium bg-white shadow-sm transition-all duration-200'
                                        value={tempAllocations[`${dayData.date}-${psp}`] !== undefined ? tempAllocations[`${dayData.date}-${psp}`] : typedPspData.allocation || ''}
                                        onChange={(e) => handleAllocationChange(dayData.date, psp, parseFloat(e.target.value) || 0)}
                                        placeholder='0.00'
                                      />
                                      <div className='absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none'>
                                        <span className='text-gray-500 text-xs font-medium'>₺</span>
                                      </div>
                                    </div>
                                    
                                    <div className='flex items-center gap-2'>
                                      <button
                                        onClick={() => handleSaveAllocation(dayData.date, psp)}
                                        disabled={allocationSaving[`${dayData.date}-${psp}`] || (tempAllocations[`${dayData.date}-${psp}`] === typedPspData.allocation)}
                                        className={`
                                          inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200
                                          ${allocationSaving[`${dayData.date}-${psp}`] 
                                            ? 'bg-gray-400 text-white cursor-not-allowed' 
                                            : (tempAllocations[`${dayData.date}-${psp}`] !== typedPspData.allocation)
                                            ? 'bg-gray-600 text-white hover:bg-gray-700 hover:shadow-md transform hover:scale-105'
                                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                          }
                                          disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                                        `}
                                      >
                                        {allocationSaving[`${dayData.date}-${psp}`] ? (
                                          <>
                                            <RefreshCw className='h-4 w-4 animate-spin' />
                                            <span>Saving...</span>
                                          </>
                                        ) : allocationSaved[`${dayData.date}-${psp}`] ? (
                                          <>
                                            <CheckCircle className='h-4 w-4' />
                                            <span>Saved</span>
                                          </>
                                        ) : (tempAllocations[`${dayData.date}-${psp}`] !== typedPspData.allocation) ? (
                                          <>
                                            <Save className='h-4 w-4' />
                                            <span>Apply</span>
                                          </>
                                        ) : (
                                          <>
                                            <Save className='h-4 w-4' />
                                            <span>Apply</span>
                                          </>
                                        )}
                                      </button>
                                      
                                      {(tempAllocations[`${dayData.date}-${psp}`] !== typedPspData.allocation && !allocationSaving[`${dayData.date}-${psp}`]) && (
                                        <button
                                          onClick={() => handleAllocationChange(dayData.date, psp, typedPspData.allocation || 0)}
                                          className='inline-flex items-center gap-1 px-2 py-2 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200'
                                          title='Reset to original value'
                                        >
                                          <RefreshCw className='h-3 w-3' />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className='px-6 py-4 text-right'>
                                  <div 
                                    className={`text-sm font-medium ${rolloverAmount > 0 ? 'text-red-600' : 'text-purple-600'}`} 
                                    title={
                                      rolloverAmount > 0 
                                        ? getRolloverWarningMessage(getRolloverRiskLevel(rolloverAmount, netAmount), rolloverAmount)
                                        : tempAllocations[`${dayData.date}-${psp}`] !== undefined && tempAllocations[`${dayData.date}-${psp}`] !== typedPspData.allocation 
                                          ? 'Preview - Click Apply to save changes' 
                                          : 'No rollover amount'
                                    }
                                  >
                                    <div className='flex items-center justify-end gap-2'>
                                      {rolloverAmount > 0 && (
                                        <AlertTriangle className='h-4 w-4 text-red-500' />
                                      )}
                                      <span>{formatCurrency(rolloverAmount, '₺')}</span>
                                    {tempAllocations[`${dayData.date}-${psp}`] !== undefined && tempAllocations[`${dayData.date}-${psp}`] !== typedPspData.allocation && (
                                      <span className='ml-1 text-xs text-gray-500'>*</span>
                                    )}
                                    </div>
                                  </div>
                                </td>
                                <td className='px-6 py-4 text-center'>
                                  {(() => {
                                    const riskLevel = getRolloverRiskLevel(rolloverAmount, netAmount);
                                    const riskColor = getRolloverRiskColor(riskLevel);
                                    const riskIcon = getRolloverRiskIcon(riskLevel);
                                    
                                    return (
                                      <div className='flex items-center justify-center'>
                                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-full border ${riskColor}`}>
                                          {riskIcon}
                                          <span>{riskLevel}</span>
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </td>
                                <td className='px-6 py-4 text-center'>
                                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusClass}`}>
                                    {status === 'paid' ? 'Paid' : status === 'almost-paid' ? 'Almost Paid' : 'Unpaid'}
                                  </span>
                                </td>
                                <td className='px-6 py-4 text-center'>
                                  <button 
                                    onClick={() => handlePspDetails(psp)}
                                    className='inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors duration-200'
                                  >
                                    <Eye className='h-3 w-3' />
                                    Details
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Day Summary */}
                    <div className='bg-gray-50 border-t border-gray-100 px-6 py-4'>
                      <div className='grid grid-cols-2 md:grid-cols-4 gap-6'>
                        <div>
                          <div className='text-xs text-gray-600 uppercase tracking-wide font-medium'>Total Volume</div>
                          <div className='text-sm font-semibold text-gray-900'>{formatCurrency(dayData.totals.toplam, '₺')}</div>
                        </div>
                        <div>
                          <div className='text-xs text-gray-600 uppercase tracking-wide font-medium'>Net Position</div>
                          <div className='text-sm font-semibold text-gray-900'>{formatCurrency(dayData.totals.net, '₺')}</div>
                        </div>
                        <div>
                          <div className='text-xs text-gray-600 uppercase tracking-wide font-medium'>Commission</div>
                          <div className='text-sm font-semibold text-gray-900'>{formatCurrency(dayData.totals.komisyon, '₺')}</div>
                        </div>
                        <div>
                          <div className='text-xs text-gray-600 uppercase tracking-wide font-medium'>Carry Over</div>
                          <div className='text-sm font-semibold text-gray-900'>{formatCurrency(dayData.totals.carry_over, '₺')}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* No Data */}
            {!ledgerLoading && ledgerData.length === 0 && (
              <div className='text-center py-12'>
                <div className='text-gray-500'>
                  <Building className='h-12 w-12 mx-auto mb-4 text-gray-300' />
                  <p className='text-lg font-medium text-gray-900 mb-2'>No ledger data found</p>
                  <p className='text-gray-600'>Try adjusting your filters or date range.</p>
                  
                  {/* Error Display */}
                  {error && (
                    <div className='mt-4 p-4 bg-red-50 border border-red-200 rounded-lg'>
                      <p className='text-red-800 font-medium'>Error:</p>
                      <p className='text-red-700 text-sm'>{error}</p>
                    </div>
                  )}
                  
                  {/* Additional Information */}
                  <div className='mt-4 p-4 bg-gray-100 rounded-lg text-left text-sm'>
                    <p className='font-medium text-gray-700 mb-2'>Additional Info:</p>
                    <p>Active Tab: {activeTab}</p>
                    <p>Ledger Loading: {ledgerLoading ? 'Yes' : 'No'}</p>
                    <p>Ledger Data Length: {ledgerData.length}</p>
                    <p>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
                    <p>Auth Loading: {authLoading ? 'Yes' : 'No'}</p>
                  </div>
                  
                  <div className='mt-4'>
                    <button 
                      onClick={() => fetchLedgerData(true)}
                      className='btn btn-primary'
                    >
                      <RefreshCw className='h-4 w-4 mr-2' />
                      Refresh Ledger Data
                    </button>
                  </div>
                </div>
              </div>
            )}
            </CardContent>
          </UnifiedCard>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Analytics KPIs Section */}
          <UnifiedCard variant="elevated" className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-gray-600" />
                {t('ledger.key_performance_indicators')}
              </CardTitle>
              <CardDescription>
                {t('ledger.psp_performance_metrics')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className='bg-white rounded-xl p-6 shadow-sm border border-gray-100'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-gray-600'>{t('ledger.total_psps')}</p>
                    <p className='text-3xl font-bold text-gray-900'>{formatNumber(totalEntries)}</p>
                    <p className='text-sm text-gray-500 mt-1'>{t('ledger.active_providers')}</p>
                  </div>
                  <div className='p-3 bg-gray-50 rounded-lg'>
                    <Building className='h-6 w-6 text-gray-600' />
                  </div>
                </div>
              </div>

              <div className='bg-white rounded-xl p-6 shadow-sm border border-gray-100'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-gray-600'>{t('ledger.total_volume')}</p>
                    <p className='text-3xl font-bold text-gray-900'>{formatCurrency(totalAmount, '₺')}</p>
                    <p className='text-sm text-gray-500 mt-1'>{t('ledger.gross_amount')}</p>
                  </div>
                  <div className='p-3 bg-green-50 rounded-lg'>
                    <DollarSign className='h-6 w-6 text-green-600' />
                  </div>
                </div>
              </div>

              <div className='bg-white rounded-xl p-6 shadow-sm border border-gray-100'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-gray-600'>{t('ledger.total_commission')}</p>
                    <p className='text-3xl font-bold text-gray-900'>{formatCurrency(totalCommission, '₺')}</p>
                    <p className='text-sm text-gray-500 mt-1'>{t('ledger.fees_earned')}</p>
                  </div>
                  <div className='p-3 bg-yellow-50 rounded-lg'>
                    <TrendingUp className='h-6 w-6 text-yellow-600' />
                  </div>
                </div>
              </div>

              <div className='bg-white rounded-xl p-6 shadow-sm border border-gray-100'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-gray-600'>{t('ledger.net_position')}</p>
                    <p className='text-3xl font-bold text-gray-900'>{formatCurrency(totalNet, '₺')}</p>
                    <p className='text-sm text-gray-500 mt-1'>{t('ledger.after_fees')}</p>
                  </div>
                  <div className='p-3 bg-purple-50 rounded-lg'>
                    <Activity className='h-6 w-6 text-purple-600' />
                  </div>
                </div>
              </div>
              </div>
            </CardContent>
          </UnifiedCard>

          {/* Performance Insights Section */}
          <UnifiedCard variant="elevated" className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-gray-600" />
                {t('ledger.performance_insights')}
              </CardTitle>
              <CardDescription>
                {t('ledger.detailed_psp_analysis')}
              </CardDescription>
            </CardHeader>
            <CardContent>
            <div className='bg-white rounded-xl p-6 shadow-sm border border-gray-100'>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                <div className='text-center'>
                  <div className='text-2xl font-bold text-accent-600 mb-2'>
                    {totalAmount > 0 ? ((totalCommission / totalAmount) * 100).toFixed(2) : '0'}%
                  </div>
                  <p className='text-sm text-gray-600'>{t('ledger.commission_rate')}</p>
                </div>
                <div className='text-center'>
                  <div className='text-2xl font-bold text-success-600 mb-2'>
                    {totalEntries > 0 ? formatCurrency(totalAmount / totalEntries, '₺') : 'N/A'}
                  </div>
                  <p className='text-sm text-gray-600'>{t('ledger.average_psp_volume')}</p>
                </div>
                <div className='text-center'>
                  <div className='text-2xl font-bold text-warning-600 mb-2'>
                    {totalTransactions > 0 ? formatCurrency(totalAmount / totalTransactions, '₺') : 'N/A'}
                  </div>
                  <p className='text-sm text-gray-600'>{t('ledger.average_transaction_value')}</p>
                </div>
              </div>
            </div>
            </CardContent>
          </UnifiedCard>
        </TabsContent>

        <TabsContent value="risk-monitoring" className="space-y-6">
          {/* Risk Overview Dashboard */}
          <UnifiedCard variant="elevated" className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-gray-600" />
                Rollover Risk Dashboard
              </CardTitle>
              <CardDescription>
                Comprehensive monitoring and analysis of PSP rollover risks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {(() => {
                const riskSummary = ledgerData.reduce((summary, dayData) => {
                  Object.entries(dayData.psps).forEach(([psp, pspData]) => {
                    const rolloverAmount = (pspData.net || 0) - (pspData.allocation || 0);
                    const riskLevel = getRolloverRiskLevel(rolloverAmount, pspData.net || 0);
                    
                    if (riskLevel === 'Critical') summary.critical++;
                    else if (riskLevel === 'High') summary.high++;
                    else if (riskLevel === 'Medium') summary.medium++;
                    else summary.normal++;
                    
                    summary.totalRollover += rolloverAmount;
                    summary.affectedPSPs.add(psp);
                  });
                  return summary;
                }, { 
                  critical: 0, 
                  high: 0, 
                  medium: 0, 
                  normal: 0, 
                  totalRollover: 0,
                  affectedPSPs: new Set<string>()
                });

                return (
                  <>
                    <div className='bg-gradient-to-br from-red-50 to-red-100/50 rounded-2xl p-6 shadow-sm border border-red-200 hover:shadow-md transition-all duration-200'>
                      <div className='flex items-center justify-between'>
                        <div className='space-y-2'>
                          <p className='text-sm font-medium text-red-700'>Critical Risk</p>
                          <p className='text-3xl font-bold text-red-900'>{riskSummary.critical}</p>
                          <p className='text-xs text-red-600'>Immediate attention required</p>
    </div>
                        <div className='p-4 bg-white/80 rounded-xl shadow-sm'>
                          <AlertTriangle className='h-7 w-7 text-red-600' />
                        </div>
                      </div>
                    </div>

                    <div className='bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-2xl p-6 shadow-sm border border-orange-200 hover:shadow-md transition-all duration-200'>
                      <div className='flex items-center justify-between'>
                        <div className='space-y-2'>
                          <p className='text-sm font-medium text-orange-700'>High Risk</p>
                          <p className='text-3xl font-bold text-orange-900'>{riskSummary.high}</p>
                          <p className='text-xs text-orange-600'>Monitor closely</p>
                        </div>
                        <div className='p-4 bg-white/80 rounded-xl shadow-sm'>
                          <AlertTriangle className='h-7 w-7 text-orange-600' />
                        </div>
                      </div>
                    </div>

                    <div className='bg-gradient-to-br from-yellow-50 to-yellow-100/50 rounded-2xl p-6 shadow-sm border border-yellow-200 hover:shadow-md transition-all duration-200'>
                      <div className='flex items-center justify-between'>
                        <div className='space-y-2'>
                          <p className='text-sm font-medium text-yellow-700'>Medium Risk</p>
                          <p className='text-3xl font-bold text-yellow-900'>{riskSummary.medium}</p>
                          <p className='text-xs text-yellow-600'>Keep an eye on</p>
                        </div>
                        <div className='p-4 bg-white/80 rounded-xl shadow-sm'>
                          <AlertTriangle className='h-7 w-7 text-yellow-600' />
                        </div>
                      </div>
                    </div>

                    <div className='bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl p-6 shadow-sm border border-green-200 hover:shadow-md transition-all duration-200'>
                      <div className='flex items-center justify-between'>
                        <div className='space-y-2'>
                          <p className='text-sm font-medium text-green-700'>Total Outstanding</p>
                          <p className='text-3xl font-bold text-green-900'>{formatCurrency(riskSummary.totalRollover, '₺')}</p>
                          <p className='text-xs text-green-600'>Across {riskSummary.affectedPSPs.size} PSPs</p>
                        </div>
                        <div className='p-4 bg-white/80 rounded-xl shadow-sm'>
                          <DollarSign className='h-7 w-7 text-green-600' />
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
              </div>
            </CardContent>
          </UnifiedCard>

            {/* High Risk PSPs Table */}
            <UnifiedCard variant="elevated" className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  High Risk PSPs
                </CardTitle>
                <CardDescription>
                  PSPs requiring immediate attention due to elevated rollover rates
                </CardDescription>
              </CardHeader>
              <CardContent>
              <div className='bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden'>
                <div className='overflow-x-auto'>
                  <table className='w-full'>
                    <thead className='bg-gray-50 border-b border-gray-100'>
                      <tr>
                        <th className='px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                          PSP Name
                        </th>
                        <th className='px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                          Net Amount
                        </th>
                        <th className='px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                          Allocation
                        </th>
                        <th className='px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                          Rollover Amount
                        </th>
                        <th className='px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                          Risk Level
                        </th>
                        <th className='px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                          Risk Score
                        </th>
                        <th className='px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                          Trend
                        </th>
                        <th className='px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                          Days Outstanding
                        </th>
                        <th className='px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-gray-100'>
                      {(() => {
                        const highRiskPSPs = ledgerData.reduce((acc, dayData) => {
                          Object.entries(dayData.psps).forEach(([psp, pspData]) => {
                            const rolloverAmount = (pspData.net || 0) - (pspData.allocation || 0);
                            const riskLevel = getRolloverRiskLevel(rolloverAmount, pspData.net || 0);
                            
                            if (riskLevel === 'Critical' || riskLevel === 'High') {
                              if (!acc.has(psp)) {
                                acc.set(psp, {
                                  psp,
                                  netAmount: pspData.net || 0,
                                  allocation: pspData.allocation || 0,
                                  rolloverAmount,
                                  riskLevel,
                                  date: dayData.date,
                                  dateStr: dayData.date_str
                                });
                              }
                            }
                          });
                          return acc;
                        }, new Map<string, any>());

                        return Array.from(highRiskPSPs.values()).map((pspData, index) => (
                          <tr key={index} className='hover:bg-gray-50 transition-colors duration-200'>
                            <td className='px-6 py-4'>
                              <div className='flex items-center gap-3'>
                                <div className='flex-shrink-0'>
                                  <div className='w-8 h-8 bg-gradient-to-br from-accent-500 to-accent-600 rounded-lg flex items-center justify-center'>
                                    <Building className='h-4 w-4 text-white' />
                                  </div>
                                </div>
                                <div>
                                  <div className='text-sm font-medium text-gray-900'>{pspData.psp}</div>
                                  <div className='text-xs text-gray-500'>{pspData.dateStr}</div>
                                </div>
                              </div>
                            </td>
                            <td className='px-6 py-4 text-right'>
                              <div className='text-sm font-medium text-gray-900'>
                                {formatCurrency(pspData.netAmount, '₺')}
                              </div>
                            </td>
                            <td className='px-6 py-4 text-right'>
                              <div className='text-sm font-medium text-gray-600'>
                                {formatCurrency(pspData.allocation, '₺')}
                              </div>
                            </td>
                            <td className='px-6 py-4 text-right'>
                              <div className='text-sm font-medium text-red-600'>
                                <div className='flex items-center justify-end gap-2'>
                                  <AlertTriangle className='h-4 w-4 text-red-500' />
                                  <span>{formatCurrency(pspData.rolloverAmount, '₺')}</span>
                                </div>
                              </div>
                            </td>
                            <td className='px-6 py-4 text-center'>
                              <div className='flex items-center justify-center'>
                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-full border ${getRolloverRiskColor(pspData.riskLevel)}`}>
                                  {getRolloverRiskIcon(pspData.riskLevel)}
                                  <span>{pspData.riskLevel}</span>
                                </div>
                              </div>
                            </td>
                            <td className='px-6 py-4 text-center'>
                              <div className='text-sm font-medium'>
                                {(() => {
                                  const daysOutstanding = Math.ceil((Date.now() - new Date(pspData.date).getTime()) / (1000 * 60 * 60 * 24));
                                  const riskScore = calculateRiskScore(pspData.rolloverAmount, pspData.netAmount, daysOutstanding);
                                  return (
                                    <div className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                                      riskScore > 75 ? 'bg-red-100 text-red-700' : 
                                      riskScore > 50 ? 'bg-orange-100 text-orange-700' : 
                                      riskScore > 25 ? 'bg-yellow-100 text-yellow-700' : 
                                      'bg-green-100 text-green-700'
                                    }`}>
                                      {riskScore}
                                    </div>
                                  );
                                })()}
                              </div>
                            </td>
                            <td className='px-6 py-4 text-center'>
                              <div className='text-sm font-medium'>
                                {(() => {
                                  const trend = getRiskTrend(pspData.psp);
                                  return (
                                    <div className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                                      trend === 'increasing' ? 'bg-red-100 text-red-700' : 
                                      trend === 'decreasing' ? 'bg-green-100 text-green-700' : 
                                      'bg-gray-100 text-gray-700'
                                    }`}>
                                      {trend === 'increasing' ? '↗' : trend === 'decreasing' ? '↘' : '→'}
                                      <span className='ml-1'>{trend}</span>
                                    </div>
                                  );
                                })()}
                              </div>
                            </td>
                            <td className='px-6 py-4 text-center'>
                              <div className='text-sm text-gray-600'>
                                {Math.ceil((Date.now() - new Date(pspData.date).getTime()) / (1000 * 60 * 60 * 24))} days
                              </div>
                            </td>
                            <td className='px-6 py-4 text-center'>
                              <button 
                                onClick={() => handleDailyDetails(pspData.date, pspData.psp)}
                                className='inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors duration-200'
                              >
                                <Eye className='h-3 w-3' />
                                View Details
                              </button>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
              </CardContent>
            </UnifiedCard>

            {/* Advanced Risk Analytics */}
            <UnifiedCard variant="elevated" className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-gray-600" />
                  Advanced Risk Analytics
                </CardTitle>
                <CardDescription>
                  Predictive risk scoring and portfolio analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                {/* Portfolio Risk Metrics */}
                <div className='bg-white rounded-xl p-6 shadow-sm border border-gray-100'>
                  <h3 className='text-lg font-semibold text-gray-900 mb-4'>Portfolio Risk Metrics</h3>
                  {(() => {
                    const metrics = calculatePortfolioRiskMetrics();
                    return (
                      <div className='space-y-4'>
                        <div className='grid grid-cols-2 gap-4'>
                          <div className='text-center p-3 bg-gray-50 rounded-lg'>
                            <div className='text-2xl font-bold text-gray-600'>{metrics.averageRiskScore}</div>
                            <div className='text-xs text-gray-600'>Avg Risk Score</div>
                          </div>
                          <div className='text-center p-3 bg-red-50 rounded-lg'>
                            <div className='text-2xl font-bold text-red-600'>{formatCurrency(metrics.totalExposure, '₺')}</div>
                            <div className='text-xs text-red-600'>Total Exposure</div>
                          </div>
                        </div>
                        <div className='space-y-2'>
                          <div className='flex justify-between text-sm'>
                            <span className='text-gray-600'>Risk Distribution:</span>
                            <span className='font-medium'>Low: {metrics.riskDistribution.low} | Med: {metrics.riskDistribution.medium} | High: {metrics.riskDistribution.high} | Critical: {metrics.riskDistribution.critical}</span>
                          </div>
                          <div className='flex justify-between text-sm'>
                            <span className='text-gray-600'>Risk Concentration:</span>
                            <span className='font-medium'>{metrics.riskConcentration.toFixed(1)}%</span>
                          </div>
                          <div className='flex justify-between text-sm'>
                            <span className='text-gray-600'>Est. Days to Resolution:</span>
                            <span className='font-medium'>{metrics.daysToResolution} days</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Risk Trend Analysis */}
                <div className='bg-white rounded-xl p-6 shadow-sm border border-gray-100'>
                  <h3 className='text-lg font-semibold text-gray-900 mb-4'>Risk Trend Analysis</h3>
                  <div className='space-y-4'>
                    <div className='text-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg'>
                      <TrendingUp className='h-8 w-8 text-gray-600 mx-auto mb-2' />
                      <h4 className='font-medium text-gray-900'>Real-time Trend Detection</h4>
                      <p className='text-sm text-gray-700'>Analyzing risk patterns across all PSPs</p>
                    </div>
                    <div className='space-y-2'>
                      <div className='flex items-center justify-between text-sm'>
                        <span className='text-gray-600'>Trending Up:</span>
                        <span className='text-red-600 font-medium'>
                          {(() => {
                            const increasingPSPs = Array.from(new Set(ledgerData.flatMap(day => 
                              Object.keys(day.psps).filter(psp => getRiskTrend(psp) === 'increasing')
                            )));
                            return increasingPSPs.length;
                          })()} PSPs
                        </span>
                      </div>
                      <div className='flex items-center justify-between text-sm'>
                        <span className='text-gray-600'>Trending Down:</span>
                        <span className='text-green-600 font-medium'>
                          {(() => {
                            const decreasingPSPs = Array.from(new Set(ledgerData.flatMap(day => 
                              Object.keys(day.psps).filter(psp => getRiskTrend(psp) === 'decreasing')
                            )));
                            return decreasingPSPs.length;
                          })()} PSPs
                        </span>
                      </div>
                      <div className='flex items-center justify-between text-sm'>
                        <span className='text-gray-600'>Stable:</span>
                        <span className='text-gray-600 font-medium'>
                          {(() => {
                            const stablePSPs = Array.from(new Set(ledgerData.flatMap(day => 
                              Object.keys(day.psps).filter(psp => getRiskTrend(psp) === 'stable')
                            )));
                            return stablePSPs.length;
                          })()} PSPs
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              </CardContent>
            </UnifiedCard>

            {/* Risk Mitigation Recommendations */}
            <UnifiedCard variant="elevated" className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-gray-600" />
                  Risk Mitigation Recommendations
                </CardTitle>
                <CardDescription>
                  Actionable insights and recommendations for risk management
                </CardDescription>
              </CardHeader>
              <CardContent>
              <div className='bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden'>
                <div className='p-6'>
                  <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                    {(() => {
                      const highRiskPSPs = ledgerData.reduce((acc, dayData) => {
                        Object.entries(dayData.psps).forEach(([psp, pspData]) => {
                          const rolloverAmount = (pspData.net || 0) - (pspData.allocation || 0);
                          const riskLevel = getRolloverRiskLevel(rolloverAmount, pspData.net || 0);
                          const daysOutstanding = Math.ceil((Date.now() - new Date(dayData.date).getTime()) / (1000 * 60 * 60 * 24));
                          
                          if (riskLevel === 'Critical' || riskLevel === 'High') {
                            if (!acc.has(psp)) {
                              acc.set(psp, {
                                psp,
                                riskLevel,
                                rolloverAmount,
                                daysOutstanding,
                                recommendations: getRiskMitigationRecommendations(riskLevel, rolloverAmount, daysOutstanding)
                              });
                            }
                          }
                        });
                        return acc;
                      }, new Map<string, any>());

                      return Array.from(highRiskPSPs.values()).map((pspData, index) => (
                        <div key={index} className='border border-gray-200 rounded-lg p-4'>
                          <div className='flex items-center justify-between mb-3'>
                            <div className='flex items-center gap-2'>
                              <div className={`w-3 h-3 rounded-full ${
                                pspData.riskLevel === 'Critical' ? 'bg-red-500' : 'bg-orange-500'
                              }`}></div>
                              <h4 className='font-medium text-gray-900'>{pspData.psp}</h4>
                            </div>
                            <div className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${
                              getRolloverRiskColor(pspData.riskLevel)
                            }`}>
                              {getRolloverRiskIcon(pspData.riskLevel)}
                              <span>{pspData.riskLevel}</span>
                            </div>
                          </div>
                          <div className='space-y-2 mb-3'>
                            <div className='text-sm text-gray-600'>
                              Outstanding: <span className='font-medium text-red-600'>{formatCurrency(pspData.rolloverAmount, '₺')}</span>
                            </div>
                            <div className='text-sm text-gray-600'>
                              Days Outstanding: <span className='font-medium'>{pspData.daysOutstanding} days</span>
                            </div>
                          </div>
                          <div>
                            <h5 className='text-sm font-medium text-gray-700 mb-2'>Recommended Actions:</h5>
                            <ul className='space-y-1'>
                              {pspData.recommendations.map((rec: string, recIndex: number) => (
                                <li key={recIndex} className='text-xs text-gray-600 flex items-start gap-2'>
                                  <div className='w-1.5 h-1.5 bg-accent-500 rounded-full mt-1.5 flex-shrink-0'></div>
                                  <span>{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
              </CardContent>
            </UnifiedCard>

            {/* Predictive Risk Alerts */}
            <UnifiedCard variant="elevated" className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-gray-600" />
                  Predictive Risk Alerts
                </CardTitle>
                <CardDescription>
                  AI-powered risk prediction and early warning system
                </CardDescription>
              </CardHeader>
              <CardContent>
              <div className='bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-6 shadow-sm border border-purple-200'>
                <div className='flex items-center gap-4 mb-4'>
                  <div className='p-3 bg-purple-100 rounded-lg'>
                    <Zap className='h-6 w-6 text-purple-600' />
                  </div>
                  <div>
                    <h3 className='text-lg font-semibold text-purple-900'>Smart Risk Prediction</h3>
                    <p className='text-sm text-purple-700'>Advanced algorithms analyze patterns to predict potential risks</p>
                  </div>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  <div className='bg-white/80 rounded-lg p-4 text-center'>
                    <div className='text-2xl font-bold text-purple-600 mb-1'>
                      {(() => {
                        const portfolioMetrics = calculatePortfolioRiskMetrics();
                        return portfolioMetrics.averageRiskScore > 70 ? 'High' : portfolioMetrics.averageRiskScore > 40 ? 'Medium' : 'Low';
                      })()}
                    </div>
                    <div className='text-sm text-purple-700'>Portfolio Risk Level</div>
                  </div>
                  <div className='bg-white/80 rounded-lg p-4 text-center'>
                    <div className='text-2xl font-bold text-purple-600 mb-1'>
                      {(() => {
                        const criticalPSPs = ledgerData.reduce((count, dayData) => {
                          Object.entries(dayData.psps).forEach(([psp, pspData]) => {
                            const rolloverAmount = (pspData.net || 0) - (pspData.allocation || 0);
                            if (getRolloverRiskLevel(rolloverAmount, pspData.net || 0) === 'Critical') count++;
                          });
                          return count;
                        }, 0);
                        return criticalPSPs > 0 ? 'Active' : 'None';
                      })()}
                    </div>
                    <div className='text-sm text-purple-700'>Critical Alerts</div>
                  </div>
                  <div className='bg-white/80 rounded-lg p-4 text-center'>
                    <div className='text-2xl font-bold text-purple-600 mb-1'>
                      {(() => {
                        const portfolioMetrics = calculatePortfolioRiskMetrics();
                        return portfolioMetrics.daysToResolution;
                      })()}
                    </div>
                    <div className='text-sm text-purple-700'>Days to Resolution</div>
                  </div>
                </div>
                <div className='mt-4 p-3 bg-white/80 rounded-lg'>
                  <div className='text-sm text-purple-800'>
                    <strong>Next Action:</strong> {(() => {
                      const portfolioMetrics = calculatePortfolioRiskMetrics();
                      if (portfolioMetrics.averageRiskScore > 70) {
                        return 'Immediate review of all high-risk PSPs required';
                      } else if (portfolioMetrics.averageRiskScore > 40) {
                        return 'Weekly risk review recommended';
                      } else {
                        return 'Monthly risk assessment sufficient';
                      }
                    })()}
                  </div>
                </div>
              </div>
              </CardContent>
            </UnifiedCard>
          </TabsContent>
        </Tabs>
      </div>

      {/* Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {detailsData?.type === 'psp' 
                  ? `PSP Details: ${detailsData.psp}` 
                  : `Daily Details: ${detailsData?.date} - ${detailsData?.psp}`
                }
              </h3>
              <button
                onClick={closeDetailsModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {detailsData?.error ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <p className="text-red-600">{detailsData.error}</p>
                </div>
              ) : detailsData?.transactions?.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600">Total Transactions</div>
                      <div className="text-2xl font-bold text-gray-900">{detailsData.transactions.length}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600">Total Amount</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {formatCurrency(
                          detailsData.transactions.reduce((sum: number, t: any) => sum + (t.amount || 0), 0),
                          '₺'
                        )}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600">Total Commission</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {formatCurrency(
                          detailsData.transactions.reduce((sum: number, t: any) => sum + (t.commission || 0), 0),
                          '₺'
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Commission
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Net Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Category
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {detailsData.transactions.map((transaction: any, index: number) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(transaction.date || transaction.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(transaction.amount || 0, '₺')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(transaction.commission || 0, '₺')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(transaction.net_amount || 0, '₺')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                transaction.category === 'DEP' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {transaction.category === 'DEP' ? 'Deposit' : 'Withdrawal'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                transaction.status === 'completed' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {transaction.status || 'Pending'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No transactions found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
