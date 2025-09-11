import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  Filter,
  Download,
  Upload,
  Plus,
  Eye,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  RefreshCw,
  FileText,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  Activity,
  Users,
  CreditCard,
  Building2,
  Globe,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Settings,
  X,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/apiClient';
import { formatCurrency, formatCurrencyPositive } from '../utils/currencyUtils';
import Modal from '../components/Modal';
import TransactionDetailView from '../components/TransactionDetailView';
import TransactionEditForm from '../components/TransactionEditForm';
// Removed old ProfessionalLayout imports - using modern design system
import DailyTransactionSummary from '../components/DailyTransactionSummary';
import BulkUSDRates from '../components/BulkUSDRates';
import { RevenueChart } from '../components/modern/RevenueChart';
import { MetricCard, ProgressRing, MiniChart } from '../components/DataVisualization';
import { 
  UnifiedCard, 
  UnifiedButton, 
  UnifiedBadge, 
  UnifiedSection, 
  UnifiedGrid 
} from '../design-system';
import { 
  EnhancedSearch, 
  FloatingAction, 
  Breadcrumb, 
  DataExport, 
  BulkActions,
  QuickActions,
  useKeyboardShortcuts,
  COMMON_SHORTCUTS,
  TableSkeleton,
  CardSkeleton
} from '../components/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

interface Transaction {
  id: number;
  client_name: string;
  company?: string;
  payment_method?: string;
  category: string;
  amount: number;
  commission: number;
  net_amount: number;
  currency?: string;
  psp?: string;
  created_at?: string;
  notes?: string;
  date?: string;
  updated_at?: string;
  // TL Amount fields for foreign currency transactions
  amount_tl?: number;
  commission_tl?: number;
  net_amount_tl?: number;
  amount_try?: number;
  commission_try?: number;
  net_amount_try?: number;
  exchange_rate?: number;
}

interface TransactionsResponse {
  transactions: Transaction[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    pages: number;
  };
}

export default function Transactions() {
  const { t } = useLanguage();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    psp: '',
    company: '',
    payment_method: '',
    currency: '',
    status: '',
    date_from: '',
    date_to: '',
    amount_min: '',
    amount_max: '',
    commission_min: '',
    commission_max: '',
    sort_by: 'created_at',
    sort_order: 'desc',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 25,
    total: 0,
    pages: 0,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [expandedFilterSections, setExpandedFilterSections] = useState({
    basic: true,
    advanced: false,
    amounts: false,
    dates: false,
  });
  const [exporting, setExporting] = useState(false);
  const [showBulkRates, setShowBulkRates] = useState(true);
  const bulkRatesRef = useRef<HTMLDivElement>(null);
  const [importing, setImporting] = useState(false);
  
  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [dropdownOptions, setDropdownOptions] = useState<{
    categories: string[];
    psps: string[];
    payment_methods: string[];
    companies: string[];
    currencies: string[];
  }>({
    categories: [],
    psps: [],
    payment_methods: [],
    companies: [],
    currencies: [],
  });
  
  // Bulk delete functionality
  const [selectedTransactions, setSelectedTransactions] = useState<number[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  
  // New enhanced UI states
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingData, setIsLoadingData] = useState(false);

  // File input reference for import
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Main data loading effect - simplified and reliable
  useEffect(() => {
    console.log('🔄 Transactions: Main data loading effect triggered', {
      isAuthenticated,
      authLoading,
      transactionsLength: transactions.length
    });

    if (isAuthenticated && !authLoading) {
      // Always load data when authenticated and not loading
      console.log('🔄 Transactions: Loading data...');
      fetchTransactions();
      fetchDropdownOptions();
    } else if (!isAuthenticated && !authLoading) {
      // Clear data when not authenticated
      console.log('🔄 Transactions: Clearing data - not authenticated');
      setTransactions([]);
      setError(null);
    }
  }, [isAuthenticated, authLoading]);

  // Debug: Log transactions state changes
  useEffect(() => {
    console.log('🔄 Transactions: Transactions state changed:', transactions.length, 'transactions');
  }, [transactions]);

  // Debug: Log loading state changes
  useEffect(() => {
    console.log('🔄 Transactions: Loading state changed:', { loading, isLoadingData });
  }, [loading, isLoadingData]);

  // Debug: Log dropdown options changes
  useEffect(() => {
    console.log('🔄 Transactions: Dropdown options changed:', dropdownOptions);
  }, [dropdownOptions]);

  // Force data loading on component mount
  useEffect(() => {
    console.log('🔄 Transactions: Component mounted, ensuring data load...');
    const timer = setTimeout(() => {
      if (isAuthenticated && !authLoading) {
        console.log('🔄 Transactions: Mount timer - loading data...');
        fetchTransactions();
        fetchDropdownOptions();
      }
    }, 200); // Slightly longer delay to ensure everything is settled
    
    return () => clearTimeout(timer);
  }, []); // Only run on mount

  // Immediate call to fetch dropdown options on mount
  useEffect(() => {
    console.log('🔄 Transactions: Immediate dropdown options fetch on mount');
    fetchDropdownOptions();
  }, []); // Run immediately on mount

  // Additional effect to ensure dropdown options are loaded
  useEffect(() => {
    if (isAuthenticated && !authLoading && dropdownOptions.currencies.length === 0) {
      console.log('🔄 Transactions: Dropdown options empty, refetching...');
      fetchDropdownOptions();
    }
  }, [isAuthenticated, authLoading, dropdownOptions.currencies.length]);

  // Data loading when navigating to transactions page
  useEffect(() => {
    console.log('🔄 Transactions: Navigation effect triggered', {
      pathname: location.pathname,
      isAuthenticated,
      authLoading
    });
    
    if (location.pathname === '/transactions' && isAuthenticated && !authLoading) {
      console.log('🔄 Transactions: Navigating to transactions page, refreshing data...');
      fetchTransactions();
      fetchDropdownOptions();
    }
  }, [location.pathname, isAuthenticated, authLoading]);

  // Handle filter and pagination changes
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      console.log('🔄 Transactions: Filters/pagination changed, refetching...');
      fetchTransactions();
    }
  }, [filters, pagination.page]);

  // Add a refresh mechanism that can be called externally
  useEffect(() => {
    const handleRefresh = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('🔄 Transactions page: Received transactionsUpdated event', customEvent?.detail);
      if (isAuthenticated && !authLoading) {
        console.log('🔄 Transactions page: Refreshing transactions...');
        // Reset to page 1 when new transactions are created to show the latest
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchTransactions();
      } else {
        console.log('🔄 Transactions page: Not authenticated or still loading, skipping refresh');
      }
    };

    const handleWindowFocus = () => {
      console.log('🔄 Transactions: Window focused, checking if refresh needed...');
      if (location.pathname === '/transactions' && isAuthenticated && !authLoading) {
        console.log('🔄 Transactions: Window focused on transactions page, refreshing data...');
        fetchTransactions();
      }
    };

    // Listen for transaction updates from other components
    window.addEventListener('transactionsUpdated', handleRefresh);
    window.addEventListener('focus', handleWindowFocus);
    
    return () => {
      window.removeEventListener('transactionsUpdated', handleRefresh);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [isAuthenticated, authLoading, location.pathname]);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      ...COMMON_SHORTCUTS.SEARCH,
      action: () => {
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        searchInput?.focus();
      }
    },
    {
      ...COMMON_SHORTCUTS.NEW,
      action: () => navigate('/transactions/add')
    },
    {
      key: 'e',
      ctrlKey: true,
      action: () => setExporting(true)
    },
    {
      key: 'i',
      ctrlKey: true,
      action: () => triggerFileInput()
    }
  ]);

  const fetchDropdownOptions = async () => {
    try {
      console.log('🔄 Transactions: Fetching dropdown options...');
      console.log('🔄 Transactions: API base URL:', (api as any).defaults?.baseURL);
      console.log('🔄 Transactions: Making API call to /api/v1/transactions/dropdown-options');
      
      const response = await api.get('/api/v1/transactions/dropdown-options');
      console.log('🔄 Transactions: Dropdown options response status:', response.status);
      console.log('🔄 Transactions: Response headers:', response.headers);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔄 Transactions: Raw dropdown options data:', data);
        if (data) {
          // Extract just the 'value' property from each option object
          const processedOptions = {
            currencies: (data.currency || []).map((option: any) => option.value),
            payment_methods: (data.payment_method || []).map((option: any) => option.value),
            categories: (data.category || []).map((option: any) => option.value),
            psps: (data.psp || []).map((option: any) => option.value),
            companies: (data.company || []).map((option: any) => option.value),
          };
          console.log('🔄 Transactions: Processed dropdown options:', processedOptions);
          setDropdownOptions(processedOptions);
        } else {
          console.warn('🔄 Transactions: No data received from dropdown options API');
        }
      } else {
        console.error('Failed to fetch dropdown options, status:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Error fetching dropdown options:', error);
      console.error('Error details:', {
        message: (error as Error).message,
        stack: (error as Error).stack,
        name: (error as Error).name
      });
      
      // Fallback to hardcoded options if API fails
      console.log('🔄 Transactions: Using fallback hardcoded options');
      const fallbackOptions = {
        currencies: ['TL', 'USD', 'EUR'] as string[],
        payment_methods: ['Bank', 'Credit card', 'Tether'] as string[],
        categories: ['DEP', 'WD'] as string[],
        psps: ['SİPAY', 'TETHER', 'KUYUMCU', '#60 CASHPAY', '#61 CRYPPAY', '#62 CRYPPAY'] as string[],
        companies: ['ORDER', 'ROI', 'ROİ'] as string[]
      };
      console.log('🔄 Transactions: Setting fallback options:', fallbackOptions);
      setDropdownOptions(fallbackOptions);
    }
  };

  const handleViewDetails = async (transaction: Transaction) => {
    try {
      const response = await api.get(`/api/v1/transactions/${transaction.id}`);
      if (response.ok) {
        const result = await response.json();
        setSelectedTransaction(result.transaction);
        setViewModalOpen(true);
      } else {
        console.error('Failed to fetch transaction details');
      }
    } catch (error) {
      console.error('Error fetching transaction details:', error);
    }
  };

  const handleEditTransaction = async (transaction: Transaction) => {
    try {
      const response = await api.get(`/api/v1/transactions/${transaction.id}`);
      if (response.ok) {
        const result = await response.json();
        setSelectedTransaction(result.transaction);
        setEditModalOpen(true);
      } else {
        console.error('Failed to fetch transaction for editing');
      }
    } catch (error) {
      console.error('Error fetching transaction for editing:', error);
    }
  };

  const handleSaveTransaction = (updatedTransaction: Transaction) => {
    // Close the modal first
    setEditModalOpen(false);
    setSelectedTransaction(null);
    
    // Refresh the entire transactions list to get the latest data including converted amounts
    fetchTransactions();
    
    // Broadcast event to notify other components to refresh
    window.dispatchEvent(new CustomEvent('transactionsUpdated', {
      detail: { 
        action: 'update',
        transactionId: updatedTransaction.id
      }
    }));
  };

  const handleDeleteTransaction = async (transactionId: number) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    try {
      const response = await api.delete(`/api/v1/transactions/${transactionId}`);
      if (response.ok) {
        // Remove from local state
        setTransactions(prev => prev.filter(t => t.id !== transactionId));
      } else {
        console.error('Failed to delete transaction');
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedTransactions.length} selected transactions? This action cannot be undone.`)) {
      return;
    }

    try {
      setBulkDeleting(true);
      
      // Delete transactions one by one
      const deletePromises = selectedTransactions.map(async (transactionId) => {
        try {
          const response = await api.delete(`/api/v1/transactions/${transactionId}`);
          return response.ok;
        } catch (error) {
          console.error(`Error deleting transaction ${transactionId}:`, error);
          return false;
        }
      });

      const results = await Promise.all(deletePromises);
      const successCount = results.filter(Boolean).length;
      const failedCount = selectedTransactions.length - successCount;

      // Update local state
      setTransactions(prev => prev.filter(t => !selectedTransactions.includes(t.id)));
      setSelectedTransactions([]);

      // Show result message
      if (failedCount === 0) {
        setSuccess(`Successfully deleted ${successCount} transactions!`);
      } else {
        setSuccess(`Deleted ${successCount} transactions. ${failedCount} failed to delete.`);
      }

      // Refresh the list
      fetchTransactions();
      
      // Broadcast event to notify other components to refresh
      window.dispatchEvent(new CustomEvent('transactionsUpdated', {
        detail: { 
          action: 'delete',
          count: successCount,
          message: `Deleted ${successCount} transactions`
        }
      }));
    } catch (error) {
      console.error('Error during bulk delete:', error);
      setError('An error occurred during bulk delete. Please try again.');
    } finally {
      setBulkDeleting(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      console.log('🔄 Transactions: Fetching transactions data...');
      setLoading(true);
      setError(null);
      setIsLoadingData(true);

      // Check authentication first
      if (!isAuthenticated) {
        console.log('🔄 Transactions: Not authenticated, skipping fetch');
        setTransactions([]);
        return;
      }

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        per_page: pagination.per_page.toString(),
        sort_by: filters.sort_by,
        sort_order: filters.sort_order,
      });

      if (filters.search) params.append('search', filters.search);
      if (filters.category) params.append('category', filters.category);
      if (filters.psp) params.append('psp', filters.psp);
      if (filters.company) params.append('company', filters.company);
      if (filters.payment_method) params.append('payment_method', filters.payment_method);
      if (filters.currency) params.append('currency', filters.currency);
      if (filters.status) params.append('status', filters.status);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);
      if (filters.amount_min) params.append('amount_min', filters.amount_min);
      if (filters.amount_max) params.append('amount_max', filters.amount_max);
      if (filters.commission_min) params.append('commission_min', filters.commission_min);
      if (filters.commission_max) params.append('commission_max', filters.commission_max);

      // Add cache-busting parameter to ensure fresh data
      params.append('_t', Date.now().toString());

      console.log('🔄 Transactions: Fetching transactions...');
      const response = await api.get(`/api/v1/transactions/?${params}`);

      if (response.status === 401) {
        console.log('🔄 Transactions: Authentication failed, clearing data');
        setTransactions([]);
        setError('Authentication required. Please log in again.');
        return;
      }

      const data = await api.parseResponse(response);

      if (response.ok && data) {
        // Ensure we have valid transaction data
        const validTransactions = Array.isArray(data.transactions) ? data.transactions : [];
        
        // Log for debugging
        console.log(`Fetched ${validTransactions.length} transactions`);
        
        setTransactions(validTransactions);
        setPagination(prev => ({
          ...prev,
          total: data.pagination?.total || 0,
          pages: data.pagination?.pages || 0,
        }));
        
        // Clear any previous errors
        setError(null);
      } else {
        console.error('Transaction fetch failed:', data);
        setError(data?.message || 'Failed to load transactions');
        setTransactions([]);
      }
    } catch (error) {
      console.error('🔄 Transactions: Error fetching transactions:', error);
      setError('Failed to load transactions');
      setTransactions([]);
    } finally {
      console.log('🔄 Transactions: Setting loading states to false');
      setLoading(false);
      setIsLoadingData(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
    setSelectedTransactions([]); // Reset selected transactions when filters change
  };

  const toggleFilterSection = (section: keyof typeof expandedFilterSections) => {
    setExpandedFilterSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      search: '',
      category: '',
      psp: '',
      company: '',
      payment_method: '',
      currency: '',
      status: '',
      date_from: '',
      date_to: '',
      amount_min: '',
      amount_max: '',
      commission_min: '',
      commission_max: '',
      sort_by: 'created_at',
      sort_order: 'desc',
    });
    setPagination(prev => ({ ...prev, page: 1 }));
    setSelectedTransactions([]);
  };

  const getActiveFilterCount = () => {
    return Object.values(filters).filter(value => 
      value && value !== 'created_at' && value !== 'desc'
    ).length;
  };

  const applyQuickFilter = (filterType: string) => {
    switch (filterType) {
      case 'today':
        const today = new Date().toISOString().split('T')[0];
        setFilters(prev => ({
          ...prev,
          date_from: today,
          date_to: today,
        }));
        break;
      case 'thisWeek':
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        const endOfWeek = new Date();
        endOfWeek.setDate(endOfWeek.getDate() + (6 - endOfWeek.getDay()));
        setFilters(prev => ({
          ...prev,
          date_from: startOfWeek.toISOString().split('T')[0],
          date_to: endOfWeek.toISOString().split('T')[0],
        }));
        break;
      case 'deposits':
        setFilters(prev => ({
          ...prev,
          category: 'DEP',
        }));
        break;
      case 'withdrawals':
        setFilters(prev => ({
          ...prev,
          category: 'WD',
        }));
        break;
      case 'highValue':
        setFilters(prev => ({
          ...prev,
          amount_min: '10000',
        }));
        break;
    }
    setPagination(prev => ({ ...prev, page: 1 }));
    setSelectedTransactions([]);
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      // Implement export functionality
      const csvContent = generateCSV();
      downloadCSV(csvContent, 'transactions.csv');
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setExporting(false);
    }
  };

  const generateCSV = () => {
    const headers = [
      'Client',
      'Company',
      'Payment',
      'Category',
      'Amount',
      'Commission',
      'Net Amount',
      'Currency',
      'PSP',
      'Date',
    ];
    const rows = transactions.map(t => [
      t.client_name || 'Unknown',
      t.company || 'N/A',
      t.payment_method || 'N/A',
      t.category || 'N/A',
      t.amount,
      t.commission,
      t.net_amount,
      t.currency || 'TL',
      t.psp || 'Unknown',
      new Date(t.created_at || t.date || '').toLocaleDateString(),
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      setError(null);
      setSuccess(null);
      
      // Check file type
      if (!file.name.endsWith('.csv')) {
        setError('Please select a CSV file');
        return;
      }

      // Read file content
      const text = await file.text();
      const lines = text.split('\n');
      
      if (lines.length < 2) {
        setError('CSV file must have at least a header row and one data row');
        return;
      }

      // Parse CSV with improved validation
      const headers = lines[0].split(',').map(h => h.trim());
      const dataRows = lines.slice(1).filter(line => line.trim());
      
      // Validate headers - aligned with backend expectations
      const requiredHeaders = ['Client', 'Company', 'Payment', 'Category', 'Amount', 'Commission', 'Net Amount', 'Currency', 'PSP', 'Date'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      
      if (missingHeaders.length > 0) {
        setError(`Missing required headers: ${missingHeaders.join(', ')}`);
        return;
      }

      // Process data rows with improved validation
      const processedTransactions = dataRows.map((line, index) => {
        const values = line.split(',').map(v => v.trim());
        const row: any = {};
        
        headers.forEach((header, i) => {
          row[header.toLowerCase().replace(/\s+/g, '_')] = values[i] || '';
        });

        // Convert amount fields to numbers with validation
        const amount = parseFloat(row.amount) || 0;
        const commission = parseFloat(row.commission) || 0;
        const netAmount = parseFloat(row.net_amount) || 0;

        // Validate category
        let category = (row.category || 'DEP').toUpperCase();
        if (category === 'WITHDRAW' || category === 'WITHDRAWAL' || category === 'ÇEKME') {
          category = 'WD';
        } else if (category === 'DEPOSIT' || category === 'YATIRMA') {
          category = 'DEP';
        } else if (category !== 'DEP' && category !== 'WD') {
          category = 'DEP'; // Default to DEP for unknown categories
        }

        // Handle WD (withdraw) transactions - amounts should be negative
        let finalAmount = amount;
        let finalCommission = commission;
        let finalNetAmount = netAmount;
        
        if (category === 'WD' && amount > 0) {
          finalAmount = -amount;
          finalCommission = -commission;
          finalNetAmount = -netAmount;
        }

        return {
          client_name: row.client || 'Unknown',
          company: row.company || '',
          payment_method: row.payment || '',
          category: category,
          amount: finalAmount,
          commission: finalCommission,
          net_amount: finalNetAmount,
          currency: row.currency || '₺',
          psp: row.psp || 'Unknown',
          date: row.date || new Date().toISOString().split('T')[0],
          notes: `Imported from CSV - Row ${index + 2}`,
        };
      });

      // Show preview and confirmation
      const confirmed = window.confirm(
        `Found ${processedTransactions.length} transactions to import.\n\n` +
        `First transaction preview:\n` +
        `Client: ${processedTransactions[0]?.client_name}\n` +
        `Category: ${processedTransactions[0]?.category}\n` +
        `Amount: ${processedTransactions[0]?.amount} ${processedTransactions[0]?.currency}\n\n` +
        `Do you want to proceed with the import?`
      );

      if (confirmed) {
        // Call the backend API with proper error handling
        try {
          const response = await api.post('/api/v1/transactions/bulk-import', { 
            transactions: processedTransactions 
          });

          if (response.ok) {
            const result = await api.parseResponse(response);
            
            // Show detailed success message with import statistics
            let message = `Import completed successfully!\n\n`;
            message += `📊 Import Summary:\n`;
            message += `✅ Successfully imported: ${result.data.successful_imports} transactions\n`;
            message += `❌ Failed imports: ${result.data.failed_imports} transactions\n`;
            message += `⚠️ Duplicates skipped: ${result.data.skipped_duplicates} transactions\n`;
            message += `📝 Total rows processed: ${result.data.total_rows}\n`;
            
            // Add warnings if any
            if (result.data.warnings && result.data.warnings.length > 0) {
              message += `\n⚠️ Warnings:\n`;
              result.data.warnings.slice(0, 5).forEach((warning: string) => {
                message += `• ${warning}\n`;
              });
              if (result.data.warnings.length > 5) {
                message += `• ... and ${result.data.warnings.length - 5} more warnings\n`;
              }
            }
            
            // Add errors if any
            if (result.data.errors && result.data.errors.length > 0) {
              message += `\n❌ Errors:\n`;
              result.data.errors.slice(0, 5).forEach((error: string) => {
                message += `• ${error}\n`;
              });
              if (result.data.errors.length > 5) {
                message += `• ... and ${result.data.errors.length - 5} more errors\n`;
              }
            }
            
            // Add summary statistics if available
            if (result.data.summary) {
              message += `\n💰 Summary:\n`;
              message += `• Total amount imported: ${result.data.summary.total_amount?.toLocaleString() || 'N/A'} ₺\n`;
              message += `• Categories imported: ${result.data.summary.categories_imported?.join(', ') || 'N/A'}\n`;
            }
            
            // Set success message
            setError(null); // Clear any previous errors
            setSuccess(message);
            
            // Refresh the transactions list
            fetchTransactions();
            
            // Broadcast event to notify other components (like Ledger) to refresh
            window.dispatchEvent(new CustomEvent('transactionsUpdated', {
              detail: { 
                action: 'import',
                count: result.data.successful_imports,
                message: 'Transactions imported successfully'
              }
            }));
          } else {
            // Handle API errors
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`;
            setError(`Import failed: ${errorMessage}`);
            console.error('Import API error:', response.status, errorData);
          }
        } catch (apiError: any) {
          console.error('Import API call error:', apiError);
          setError(`Import failed: ${apiError.message || 'Network error occurred'}`);
        }
      }

    } catch (error: any) {
      console.error('Import error:', error);
      setError(`Import error: ${error.message || 'An unexpected error occurred'}`);
    } finally {
      setImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };


  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <CheckCircle className='h-4 w-4 text-green-500' />;
      case 'pending':
        return <Clock className='h-4 w-4 text-yellow-500' />;
      case 'failed':
        return <AlertCircle className='h-4 w-4 text-red-500' />;
      default:
        return <CheckCircle className='h-4 w-4 text-green-500' />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // Loading state
  if (authLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto'></div>
          <p className='mt-4 text-gray-600'>Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-6">
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <Breadcrumb 
            items={[
              { label: 'Dashboard', href: '/' },
              { label: 'Transactions', current: true }
            ]} 
          />
        </div>

      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900">{t('transactions.title')}</h1>
                <UnifiedBadge variant="secondary" size="sm" className="bg-blue-100 text-blue-800">
                  Enhanced Filters Available
                </UnifiedBadge>
                <UnifiedBadge variant="success" size="sm" className="bg-green-100 text-green-800">
                  USD Rate Management
                </UnifiedBadge>
              </div>
              <p className="text-gray-600">{t('transactions.description')}</p>
              <div className="mt-2 p-2 bg-green-100 border border-green-300 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>📍 Bulk USD Rate Management is located below the Daily Transaction Summary section.</strong> 
                  Look for the green-themed card with "Bulk USD Rate Management" title.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <QuickActions actions={[
                {
                  id: 'add',
                  label: t('transactions.add_new'),
                  icon: <Plus className="h-4 w-4" />,
                  action: () => navigate('/transactions/add'),
                  variant: 'primary'
                },
                {
                  id: 'export',
                  label: exporting ? 'Exporting...' : 'Export',
                  icon: <Download className="h-4 w-4" />,
                  action: () => handleExport(),
                  variant: 'outline'
                },
                {
                  id: 'import',
                  label: importing ? 'Importing...' : 'Import CSV',
                  icon: <Upload className="h-4 w-4" />,
                  action: () => triggerFileInput(),
                  variant: 'outline'
                }
              ]} />
              
              {/* Bulk USD Rates Button - Positioned between Add and Bulk buttons */}
              <button
                onClick={() => {
                  console.log('Bulk rates button clicked, current state:', showBulkRates);
                  setShowBulkRates(!showBulkRates);
                  if (!showBulkRates && bulkRatesRef.current) {
                    setTimeout(() => {
                      bulkRatesRef.current?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-md border font-medium transition-colors ${
                  showBulkRates 
                    ? 'bg-green-600 hover:bg-green-700 text-white border-green-600' 
                    : 'border-green-300 text-green-600 hover:bg-green-50 bg-white'
                }`}
              >
                <DollarSign className="h-4 w-4" />
                {showBulkRates ? 'Hide USD Rates' : 'Manage USD Rates'}
              </button>
              
              {/* Debug: Refresh Dropdown Options Button */}
              <UnifiedButton
                variant="outline"
                onClick={fetchDropdownOptions}
                className="border-orange-300 text-orange-600 hover:bg-orange-50 hover:border-orange-400"
              >
                🔄 Refresh Options
              </UnifiedButton>

              {/* Prominent Filter Button */}
              <UnifiedButton
                variant={showFilters ? "primary" : "outline"}
                onClick={() => setShowFilters(!showFilters)}
                icon={<Filter className="h-4 w-4" />}
                className={`transition-all duration-200 ${
                  showFilters 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg' 
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400'
                }`}
              >
                {showFilters ? 'Hide Filters' : `Show Filters${getActiveFilterCount() > 0 ? ` (${getActiveFilterCount()})` : ''}`}
              </UnifiedButton>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleImport}
        style={{ display: 'none' }}
        id="csv-file-input"
      />

      {/* Enhanced Financial Summary Cards */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Deposits */}
          <UnifiedCard variant="elevated" className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-full -translate-y-16 translate-x-16"></div>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <UnifiedBadge variant="success" size="sm">DEP</UnifiedBadge>
              </div>
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-600">Total Deposits</p>
                <p className="text-3xl font-bold text-gray-900">
                  {loading || isLoadingData ? (
                    <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    formatCurrency(
                      transactions
                        .filter(t => t.category?.toUpperCase() === 'DEP')
                        .reduce((sum, t) => {
                          if (t.currency === 'USD' || t.currency === 'EUR') {
                            return sum + (t.amount_try || t.amount_tl || 0);
                          } else {
                            return sum + (t.amount || 0);
                          }
                        }, 0),
                      '₺'
                    )
                  )}
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    {loading || isLoadingData ? 'Loading...' : `${transactions.filter(t => t.category?.toUpperCase() === 'DEP').length} transactions`}
                  </p>
                  {!loading && !isLoadingData && transactions.length > 0 && (
                    <ProgressRing 
                      percentage={(transactions.filter(t => t.category?.toUpperCase() === 'DEP').length / transactions.length) * 100}
                      size="sm"
                      color="green"
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </UnifiedCard>

          {/* Total Withdrawals */}
          <UnifiedCard variant="elevated" className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-500/10 to-rose-500/10 rounded-full -translate-y-16 translate-x-16"></div>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg">
                  <TrendingDown className="h-6 w-6 text-white" />
                </div>
                <UnifiedBadge variant="destructive" size="sm">WD</UnifiedBadge>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">Total Withdrawals</p>
                <p className="text-3xl font-bold text-gray-900">
                  {loading || isLoadingData ? (
                    <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    formatCurrency(
                      Math.abs(transactions
                        .filter(t => t.category?.toUpperCase() === 'WD')
                        .reduce((sum, t) => {
                          if (t.currency === 'USD' || t.currency === 'EUR') {
                            return sum + (t.amount_try || t.amount_tl || 0);
                          } else {
                            return sum + (t.amount || 0);
                          }
                        }, 0)),
                      '₺'
                    )
                  )}
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    {loading || isLoadingData ? 'Loading...' : `${transactions.filter(t => t.category?.toUpperCase() === 'WD').length} transactions`}
                  </p>
                  {!loading && !isLoadingData && transactions.length > 0 && (
                    <ProgressRing 
                      percentage={(transactions.filter(t => t.category?.toUpperCase() === 'WD').length / transactions.length) * 100}
                      size="sm"
                      color="red"
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </UnifiedCard>

          {/* Net Cash */}
          <UnifiedCard variant="elevated" className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full -translate-y-16 translate-x-16"></div>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <UnifiedBadge variant="secondary" size="sm">NET</UnifiedBadge>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">Net Cash Flow</p>
                <p className="text-3xl font-bold text-gray-900">
                  {loading || isLoadingData ? (
                    <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    formatCurrency(
                      (transactions
                        .filter(t => t.category?.toUpperCase() === 'DEP')
                        .reduce((sum, t) => {
                          if (t.currency === 'USD' || t.currency === 'EUR') {
                            return sum + (t.amount_try || t.amount_tl || 0);
                          } else {
                            return sum + (t.amount || 0);
                          }
                        }, 0) -
                      transactions
                        .filter(t => t.category?.toUpperCase() === 'WD')
                        .reduce((sum, t) => {
                          if (t.currency === 'USD' || t.currency === 'EUR') {
                            return sum + (t.amount_try || t.amount_tl || 0);
                          } else {
                            return sum + (t.amount || 0);
                          }
                        }, 0)),
                      '₺'
                    )
                  )}
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    {loading || isLoadingData ? 'Loading...' : 'Deposits - Withdrawals'}
                  </p>
                  {!loading && !isLoadingData && transactions.length > 0 && (
                    <MiniChart 
                      data={transactions.slice(-7).map(t => t.amount || 0)}
                      type="line"
                      color="#3B82F6"
                      height={20}
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </UnifiedCard>

          {/* Total Commissions */}
          <UnifiedCard variant="elevated" className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-violet-500/10 rounded-full -translate-y-16 translate-x-16"></div>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <UnifiedBadge variant="outline" size="sm">COM</UnifiedBadge>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">Total Commissions</p>
                <p className="text-3xl font-bold text-gray-900">
                  {loading || isLoadingData ? (
                    <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    formatCurrency(
                      transactions
                        .reduce((sum, t) => {
                          if (t.currency === 'USD' || t.currency === 'EUR') {
                            return sum + (t.commission_try || t.commission_tl || 0);
                          } else {
                            return sum + (t.commission || 0);
                          }
                        }, 0),
                      '₺'
                    )
                  )}
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    {loading || isLoadingData ? 'Loading...' : 'All commissions earned'}
                  </p>
                  {!loading && !isLoadingData && transactions.length > 0 && (
                    <ProgressRing 
                      percentage={Math.min(100, (transactions.reduce((sum, t) => sum + (t.commission || 0), 0) / 10000) * 100)}
                      size="sm"
                      color="slate"
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </UnifiedCard>
        </div>
      </div>

      {/* Daily Transaction Summary */}
      <UnifiedCard variant="elevated" className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Daily Transaction Summary
          </CardTitle>
          <CardDescription>
            Overview of daily transaction performance and trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DailyTransactionSummary 
            transactions={transactions}
            onTransactionUpdate={fetchTransactions}
          />
        </CardContent>
      </UnifiedCard>

      {/* Bulk USD Rates Management - ALWAYS VISIBLE */}
      <div ref={bulkRatesRef} className="px-6 pb-6">
        <UnifiedCard variant="elevated" className="border-2 border-green-200 bg-green-50/30">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Bulk USD Rate Management
                </CardTitle>
                <CardDescription className="text-green-700">
                  Apply specific exchange rates to USD transactions by date to recalculate all metrics
                </CardDescription>
                <div className="mt-2 text-xs text-green-600">
                  Debug: showBulkRates = {showBulkRates ? 'true' : 'false'}
                </div>
              </div>
              <div className="text-sm text-green-600">
                Use the "Manage USD Rates" button in the header above to toggle this section
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Debug Info:</strong> This section should always be visible. 
                If you can see this, the bulk rates section is working.
              </p>
            </div>
            {showBulkRates && (
              <BulkUSDRates 
                onRatesApplied={() => {
                  fetchTransactions();
                  setShowBulkRates(false);
                }}
              />
            )}
          </CardContent>
        </UnifiedCard>
      </div>

      {/* Transaction Trends Chart */}
      <div className="px-6 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UnifiedCard variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Transaction Volume Trends
              </CardTitle>
              <CardDescription>
                Daily transaction volume over the last 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RevenueChart 
                data={transactions.map(t => ({
                  date: t.date || t.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
                  revenue: t.amount || 0,
                  transactions: 1
                })).reduce((acc, curr) => {
                  const existing = acc.find(item => item.date === curr.date);
                  if (existing) {
                    existing.revenue += curr.revenue;
                    existing.transactions += curr.transactions;
                  } else {
                    acc.push(curr);
                  }
                  return acc;
                }, [] as any[]).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())}
                type="area"
                height={250}
              />
            </CardContent>
          </UnifiedCard>

          <UnifiedCard variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Transaction Distribution
              </CardTitle>
              <CardDescription>
                Breakdown by category and payment method
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">By Category</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Deposits</span>
                      </div>
                      <div className="text-sm font-medium">
                        {transactions.filter(t => t.category === 'DEP').length}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Withdrawals</span>
                      </div>
                      <div className="text-sm font-medium">
                        {transactions.filter(t => t.category === 'WD').length}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Top Payment Methods</h4>
                  <div className="space-y-2">
                    {Object.entries(
                      transactions.reduce((acc, t) => {
                        const method = t.payment_method || 'Unknown';
                        acc[method] = (acc[method] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    )
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 3)
                      .map(([method, count]) => (
                        <div key={method} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{method}</span>
                          <div className="flex items-center gap-2">
                            <ProgressRing 
                              percentage={(count / transactions.length) * 100} 
                              size="sm" 
                              color="gray"
                            />
                            <span className="text-sm font-medium">{count}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </UnifiedCard>
        </div>
      </div>
      
      {/* Comprehensive Filter Card */}
      {showFilters && (
        <div className="px-6 pb-6 animate-in slide-in-from-top-4 duration-300">
          <UnifiedCard variant="outlined" className="overflow-hidden shadow-lg border-gray-200">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Filter className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Advanced Transaction Filters
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Refine your search with comprehensive filtering options
                      {getActiveFilterCount() > 0 && (
                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {getActiveFilterCount()} active
                        </span>
                      )}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getActiveFilterCount() > 0 && (
                    <UnifiedButton
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFilters}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Clear All
                    </UnifiedButton>
                  )}
                  <UnifiedButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFilters(false)}
                    icon={<X className="h-4 w-4" />}
                  >
                    Close
                  </UnifiedButton>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Quick Filters */}
                <div className="space-y-4">
                  <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Quick Filters
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <UnifiedButton
                      variant="outline"
                      size="sm"
                      onClick={() => applyQuickFilter('today')}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      Today
                    </UnifiedButton>
                    <UnifiedButton
                      variant="outline"
                      size="sm"
                      onClick={() => applyQuickFilter('thisWeek')}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      This Week
                    </UnifiedButton>
                    <UnifiedButton
                      variant="outline"
                      size="sm"
                      onClick={() => applyQuickFilter('deposits')}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      Deposits Only
                    </UnifiedButton>
                    <UnifiedButton
                      variant="outline"
                      size="sm"
                      onClick={() => applyQuickFilter('withdrawals')}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Withdrawals Only
                    </UnifiedButton>
                    <UnifiedButton
                      variant="outline"
                      size="sm"
                      onClick={() => applyQuickFilter('highValue')}
                      className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                    >
                      High Value (10K+)
                    </UnifiedButton>
                  </div>
                </div>

                {/* Basic Filters Section */}
                <div className="space-y-4">
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleFilterSection('basic')}
                  >
                    <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${expandedFilterSections.basic ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                      Basic Filters
                    </h3>
                    <div className="flex items-center gap-2">
                      {(filters.search || filters.category || filters.status) && (
                        <UnifiedBadge variant="secondary" size="sm">
                          {(filters.search ? 1 : 0) + (filters.category ? 1 : 0) + (filters.status ? 1 : 0)} active
                        </UnifiedBadge>
                      )}
                      <div className={`transform transition-transform ${expandedFilterSections.basic ? 'rotate-90' : ''}`}>
                        <ArrowUpRight className="h-4 w-4 text-gray-500" />
                      </div>
                    </div>
                  </div>
                  
                  {expandedFilterSections.basic && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pl-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Search</label>
                        <EnhancedSearch
                          placeholder="Search transactions..."
                          onSearch={(query) => {
                            setSearchQuery(query);
                            handleFilterChange('search', query);
                          }}
                          showFilter={false}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Category</label>
                        <select
                          value={filters.category}
                          onChange={e => handleFilterChange('category', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                        >
                          <option value="">All Categories</option>
                          {dropdownOptions.categories?.map((category: string) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Status</label>
                        <select
                          value={filters.status}
                          onChange={e => handleFilterChange('status', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                        >
                          <option value="">All Status</option>
                          <option value="completed">Completed</option>
                          <option value="pending">Pending</option>
                          <option value="failed">Failed</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Advanced Filters Section */}
                <div className="space-y-4">
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleFilterSection('advanced')}
                  >
                    <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${expandedFilterSections.advanced ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                      Advanced Filters
                    </h3>
                    <div className="flex items-center gap-2">
                      {(filters.psp || filters.company || filters.payment_method || filters.currency) && (
                        <UnifiedBadge variant="secondary" size="sm">
                          {(filters.psp ? 1 : 0) + (filters.company ? 1 : 0) + (filters.payment_method ? 1 : 0) + (filters.currency ? 1 : 0)} active
                        </UnifiedBadge>
                      )}
                      <div className={`transform transition-transform ${expandedFilterSections.advanced ? 'rotate-90' : ''}`}>
                        <ArrowUpRight className="h-4 w-4 text-gray-500" />
                      </div>
                    </div>
                  </div>
                  
                  {expandedFilterSections.advanced && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pl-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">PSP</label>
                        <select
                          value={filters.psp}
                          onChange={e => handleFilterChange('psp', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                        >
                          <option value="">All PSPs</option>
                          {dropdownOptions.psps?.map((psp: string) => (
                            <option key={psp} value={psp}>
                              {psp}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Company</label>
                        <select
                          value={filters.company}
                          onChange={e => handleFilterChange('company', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                        >
                          <option value="">All Companies</option>
                          {dropdownOptions.companies?.map((company: string) => (
                            <option key={company} value={company}>
                              {company}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Payment Method</label>
                        <select
                          value={filters.payment_method}
                          onChange={e => handleFilterChange('payment_method', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                        >
                          <option value="">All Methods</option>
                          {dropdownOptions.payment_methods?.map((method: string) => (
                            <option key={method} value={method}>
                              {method}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Currency</label>
                        <select
                          value={filters.currency}
                          onChange={e => handleFilterChange('currency', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                        >
                          <option value="">All Currencies</option>
                          {dropdownOptions.currencies?.map((currency: string) => (
                            <option key={currency} value={currency}>
                              {currency}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Amount Filters Section */}
                <div className="space-y-4">
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleFilterSection('amounts')}
                  >
                    <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${expandedFilterSections.amounts ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                      Amount Filters
                    </h3>
                    <div className="flex items-center gap-2">
                      {(filters.amount_min || filters.amount_max || filters.commission_min || filters.commission_max) && (
                        <UnifiedBadge variant="secondary" size="sm">
                          {(filters.amount_min ? 1 : 0) + (filters.amount_max ? 1 : 0) + (filters.commission_min ? 1 : 0) + (filters.commission_max ? 1 : 0)} active
                        </UnifiedBadge>
                      )}
                      <div className={`transform transition-transform ${expandedFilterSections.amounts ? 'rotate-90' : ''}`}>
                        <ArrowUpRight className="h-4 w-4 text-gray-500" />
                      </div>
                    </div>
                  </div>
                  
                  {expandedFilterSections.amounts && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pl-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Min Amount</label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={filters.amount_min}
                          onChange={e => handleFilterChange('amount_min', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Max Amount</label>
                        <Input
                          type="number"
                          placeholder="1000000.00"
                          value={filters.amount_max}
                          onChange={e => handleFilterChange('amount_max', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Min Commission</label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={filters.commission_min}
                          onChange={e => handleFilterChange('commission_min', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Max Commission</label>
                        <Input
                          type="number"
                          placeholder="10000.00"
                          value={filters.commission_max}
                          onChange={e => handleFilterChange('commission_max', e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Date Filters Section */}
                <div className="space-y-4">
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleFilterSection('dates')}
                  >
                    <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${expandedFilterSections.dates ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                      Date & Sorting
                    </h3>
                    <div className="flex items-center gap-2">
                      {(filters.date_from || filters.date_to || filters.sort_by !== 'created_at' || filters.sort_order !== 'desc') && (
                        <UnifiedBadge variant="secondary" size="sm">
                          {(filters.date_from ? 1 : 0) + (filters.date_to ? 1 : 0) + (filters.sort_by !== 'created_at' ? 1 : 0) + (filters.sort_order !== 'desc' ? 1 : 0)} active
                        </UnifiedBadge>
                      )}
                      <div className={`transform transition-transform ${expandedFilterSections.dates ? 'rotate-90' : ''}`}>
                        <ArrowUpRight className="h-4 w-4 text-gray-500" />
                      </div>
                    </div>
                  </div>
                  
                  {expandedFilterSections.dates && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pl-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Date From</label>
                        <Input
                          type="date"
                          value={filters.date_from}
                          onChange={e => handleFilterChange('date_from', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Date To</label>
                        <Input
                          type="date"
                          value={filters.date_to}
                          onChange={e => handleFilterChange('date_to', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Sort By</label>
                        <select
                          value={filters.sort_by}
                          onChange={e => handleFilterChange('sort_by', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                        >
                          <option value="created_at">Date</option>
                          <option value="amount">Amount</option>
                          <option value="client_name">Client</option>
                          <option value="psp">PSP</option>
                          <option value="commission">Commission</option>
                          <option value="net_amount">Net Amount</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Sort Order</label>
                        <select
                          value={filters.sort_order}
                          onChange={e => handleFilterChange('sort_order', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                        >
                          <option value="desc">Descending</option>
                          <option value="asc">Ascending</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Active Filters Summary */}
                {getActiveFilterCount() > 0 && (
                  <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900">Active Filters</h4>
                    <div className="flex flex-wrap gap-2">
                      {filters.search && (
                        <UnifiedBadge variant="secondary" size="sm" className="bg-blue-100 text-blue-800">
                          Search: "{filters.search}"
                        </UnifiedBadge>
                      )}
                      {filters.category && (
                        <UnifiedBadge variant="secondary" size="sm" className="bg-green-100 text-green-800">
                          Category: {filters.category}
                        </UnifiedBadge>
                      )}
                      {filters.psp && (
                        <UnifiedBadge variant="secondary" size="sm" className="bg-purple-100 text-purple-800">
                          PSP: {filters.psp}
                        </UnifiedBadge>
                      )}
                      {filters.company && (
                        <UnifiedBadge variant="secondary" size="sm" className="bg-orange-100 text-orange-800">
                          Company: {filters.company}
                        </UnifiedBadge>
                      )}
                      {filters.payment_method && (
                        <UnifiedBadge variant="secondary" size="sm" className="bg-indigo-100 text-indigo-800">
                          Method: {filters.payment_method}
                        </UnifiedBadge>
                      )}
                      {filters.currency && (
                        <UnifiedBadge variant="secondary" size="sm" className="bg-cyan-100 text-cyan-800">
                          Currency: {filters.currency}
                        </UnifiedBadge>
                      )}
                      {filters.status && (
                        <UnifiedBadge variant="secondary" size="sm" className="bg-yellow-100 text-yellow-800">
                          Status: {filters.status}
                        </UnifiedBadge>
                      )}
                      {filters.date_from && (
                        <UnifiedBadge variant="secondary" size="sm" className="bg-gray-100 text-gray-800">
                          From: {filters.date_from}
                        </UnifiedBadge>
                      )}
                      {filters.date_to && (
                        <UnifiedBadge variant="secondary" size="sm" className="bg-gray-100 text-gray-800">
                          To: {filters.date_to}
                        </UnifiedBadge>
                      )}
                      {filters.amount_min && (
                        <UnifiedBadge variant="secondary" size="sm" className="bg-emerald-100 text-emerald-800">
                          Min: {filters.amount_min}
                        </UnifiedBadge>
                      )}
                      {filters.amount_max && (
                        <UnifiedBadge variant="secondary" size="sm" className="bg-emerald-100 text-emerald-800">
                          Max: {filters.amount_max}
                        </UnifiedBadge>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    {getActiveFilterCount() > 0 ? (
                      <span className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        {getActiveFilterCount()} filter{getActiveFilterCount() !== 1 ? 's' : ''} applied
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                        No filters applied
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <UnifiedButton
                      variant="outline"
                      onClick={clearAllFilters}
                      disabled={getActiveFilterCount() === 0}
                    >
                      Clear All
                    </UnifiedButton>
                    <UnifiedButton
                      variant="primary"
                      onClick={fetchTransactions}
                      icon={<RefreshCw className="h-4 w-4" />}
                      iconPosition="left"
                    >
                      Apply Filters
                    </UnifiedButton>
                  </div>
                </div>
              </div>
            </CardContent>
          </UnifiedCard>
        </div>
      )}

      {/* Modern Transactions Table */}
      <div className="px-6 pb-6">
        <UnifiedCard variant="elevated">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold">Transactions</CardTitle>
                <CardDescription>Manage and view all transaction records</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <UnifiedBadge variant="outline">
                  {transactions.length} total
                </UnifiedBadge>
                <UnifiedButton
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    console.log('Manual refresh triggered');
                    fetchTransactions();
                  }}
                  icon={<RefreshCw className={`h-4 w-4 ${loading || isLoadingData ? 'animate-spin' : ''}`} />}
                  disabled={loading || isLoadingData}
                >
                  {loading || isLoadingData ? 'Refreshing...' : 'Refresh'}
                </UnifiedButton>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Bulk Actions */}
            {transactions.length > 0 && (
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedTransactions.length === transactions.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTransactions(transactions.map(t => t.id));
                          } else {
                            setSelectedTransactions([]);
                          }
                        }}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Select All ({transactions.length})
                      </span>
                    </label>
                    {selectedTransactions.length > 0 && (
                      <span className="text-sm text-gray-600">
                        {selectedTransactions.length} transaction(s) selected
                      </span>
                    )}
                  </div>
                  <DataExport
                    data={transactions}
                    filename="transactions"
                    onExport={(format) => {
                      console.log(`Exporting as ${format}`);
                      // Implement export logic here
                    }}
                  />
                </div>
              </div>
            )}
            {loading || isLoadingData ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
                <p className="text-gray-600 text-lg">Loading transactions...</p>
                <p className="text-sm text-gray-500 mt-2">
                  Loading: {loading ? 'true' : 'false'}, isLoadingData: {isLoadingData ? 'true' : 'false'}
                </p>
              </div>
            ) : success ? (
              <div className="p-12 text-center">
                <div className="text-green-500 mb-6">
                  <CheckCircle className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Import Successful!
                </h3>
                <div className="text-gray-600 mb-6 whitespace-pre-line text-left max-w-2xl mx-auto">
                  {success}
                </div>
                <UnifiedButton
                  variant="primary"
                  onClick={() => setSuccess(null)}
                >
                  Continue
                </UnifiedButton>
              </div>
            ) : error ? (
              <div className="p-12 text-center">
                <div className="text-red-500 mb-6">
                  <AlertCircle className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Error Loading Transactions
                </h3>
                <p className="text-gray-600 mb-6">{error}</p>
                <UnifiedButton
                  variant="primary"
                  onClick={fetchTransactions}
                >
                  Try Again
                </UnifiedButton>
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-gray-400 mb-6">
                  <FileText className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  No Transactions Found
                </h3>
                <p className="text-gray-600 text-lg">
                  {filters.search || filters.category || filters.status
                    ? 'No transactions match your filters.'
                    : 'No transactions are currently available.'}
                </p>
                <div className="mt-4 text-sm text-gray-500">
                  <p>Debug info:</p>
                  <p>Transactions length: {transactions.length}</p>
                  <p>Loading: {loading ? 'true' : 'false'}</p>
                  <p>isLoadingData: {isLoadingData ? 'true' : 'false'}</p>
                  <p>Error: {error || 'none'}</p>
                </div>
                <div className="mt-4">
                  <UnifiedButton
                    variant="outline"
                    onClick={() => {
                      console.log('Retry fetch triggered');
                      fetchTransactions();
                    }}
                    icon={<RefreshCw className="h-4 w-4" />}
                  >
                    Retry
                  </UnifiedButton>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                        <input
                          type="checkbox"
                          checked={selectedTransactions.length === transactions.length && transactions.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTransactions(transactions.map(t => t.id));
                            } else {
                              setSelectedTransactions([]);
                            }
                          }}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment Method
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Commission
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Net Amount
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Currency
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        PSP
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map(transaction => (
                      <tr key={transaction.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <input
                            type="checkbox"
                            checked={selectedTransactions.includes(transaction.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTransactions(prev => [...prev, transaction.id]);
                              } else {
                                setSelectedTransactions(prev => prev.filter(id => id !== transaction.id));
                              }
                            }}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3">
                              {transaction.client_name?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {transaction.client_name || 'Unknown'}
                              </div>
                              {transaction.company && (
                                <div className="text-xs text-gray-500">
                                  {transaction.company}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {transaction.payment_method || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <UnifiedBadge 
                            variant={transaction.category === 'DEP' ? 'success' : 'destructive'}
                            size="sm"
                          >
                            {transaction.category || 'N/A'}
                          </UnifiedBadge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrencyPositive(transaction.amount, transaction.currency || '₺')}
                            {transaction.currency === 'USD' || transaction.currency === 'EUR' ? (
                              <div className="text-xs text-gray-500 mt-1">
                                ({formatCurrencyPositive(transaction.amount_try || transaction.amount_tl || 0, '₺')})
                              </div>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm text-gray-900">
                            {formatCurrencyPositive(transaction.commission, transaction.currency || '₺')}
                            {transaction.currency === 'USD' || transaction.currency === 'EUR' ? (
                              <div className="text-xs text-gray-500 mt-1">
                                ({formatCurrencyPositive(transaction.commission_try || transaction.commission_tl || 0, '₺')})
                              </div>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrencyPositive(transaction.net_amount, transaction.currency || '₺')}
                            {transaction.currency === 'USD' || transaction.currency === 'EUR' ? (
                              <div className="text-xs text-gray-500 mt-1">
                                ({formatCurrencyPositive(transaction.net_amount_try || transaction.net_amount_tl || 0, '₺')})
                              </div>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <UnifiedBadge variant="outline" size="sm">
                            {transaction.currency || 'TL'}
                          </UnifiedBadge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {transaction.psp || 'Unknown'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center justify-center space-x-1">
                            <UnifiedButton
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(transaction)}
                              icon={<Eye className="h-4 w-4" />}
                              className="text-blue-600 hover:text-blue-900 hover:bg-blue-50"
                            >
                              View
                            </UnifiedButton>
                            <UnifiedButton
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditTransaction(transaction)}
                              icon={<Edit className="h-4 w-4" />}
                              className="text-green-600 hover:text-green-900 hover:bg-green-50"
                            >
                              Edit
                            </UnifiedButton>
                            <UnifiedButton
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTransaction(transaction.id)}
                              icon={<Trash2 className="h-4 w-4" />}
                              className="text-red-600 hover:text-red-900 hover:bg-red-50"
                            >
                              Delete
                            </UnifiedButton>
                          </div>
                        </td>
                      </tr>
                    ))}
                    
                    {/* Daily Summary Row */}
                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-t-2 border-gray-300">
                      <td colSpan={4} className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-700 flex items-center">
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Daily Summary
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-sm font-semibold text-gray-700">
                          Total Amount: {formatCurrency(
                            transactions.reduce((sum, t) => {
                              if (t.currency === 'USD' || t.currency === 'EUR') {
                                return sum + (t.amount_try || t.amount_tl || 0);
                              } else {
                                return sum + (t.amount || 0);
                              }
                            }, 0),
                            '₺'
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-sm font-semibold text-emerald-700">
                          Total Commissions: {formatCurrency(
                            transactions.reduce((sum, t) => {
                              if (t.currency === 'USD' || t.currency === 'EUR') {
                                return sum + (t.commission_try || t.commission_tl || 0);
                              } else {
                                return sum + (t.commission || 0);
                              }
                            }, 0),
                            '₺'
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-sm font-semibold text-gray-700">
                          Total Net: {formatCurrency(
                            transactions.reduce((sum, t) => {
                              if (t.currency === 'USD' || t.currency === 'EUR') {
                                return sum + (t.net_amount_try || t.net_amount_tl || 0);
                              } else {
                                return sum + (t.net_amount || 0);
                              }
                            }, 0),
                            '₺'
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="text-sm font-semibold text-gray-700">
                          {transactions.length} transactions
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </UnifiedCard>
      </div>

      {/* Modern Pagination */}
      {transactions.length > 0 && pagination.pages > 1 && (
        <div className="px-6 pb-6">
          <UnifiedCard variant="outlined">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {(pagination.page - 1) * pagination.per_page + 1} to{' '}
                  {Math.min(
                    pagination.page * pagination.per_page,
                    pagination.total
                  )}{' '}
                  of {pagination.total} results
                </div>
                <div className="flex items-center space-x-2">
                  <UnifiedButton
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    icon={<ArrowDownRight className="h-4 w-4" />}
                    iconPosition="left"
                  >
                    Previous
                  </UnifiedButton>
                  <span className="text-sm text-gray-700 px-3">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <UnifiedButton
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    icon={<ArrowUpRight className="h-4 w-4" />}
                    iconPosition="right"
                  >
                    Next
                  </UnifiedButton>
                </div>
              </div>
            </CardContent>
          </UnifiedCard>
        </div>
      )}

      {/* View Details Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedTransaction(null);
        }}
        title="Transaction Details"
        size="lg"
      >
        {selectedTransaction && (
          <TransactionDetailView transaction={selectedTransaction} />
        )}
      </Modal>

      {/* Edit Transaction Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedTransaction(null);
        }}
        title="Edit Transaction"
        size="xl"
      >
        {selectedTransaction && (
          <TransactionEditForm
            transaction={selectedTransaction}
            onSave={handleSaveTransaction}
            onCancel={() => {
              setEditModalOpen(false);
              setSelectedTransaction(null);
            }}
            dropdownOptions={dropdownOptions}
          />
        )}
      </Modal>

      {/* Bulk Actions */}
      <BulkActions
        selectedCount={selectedTransactions.length}
        totalCount={transactions.length}
        actions={[
          {
            id: 'edit',
            label: 'Edit Selected',
            icon: <Edit className="h-4 w-4" />,
            action: () => console.log('Edit selected transactions'),
            variant: 'default'
          },
          {
            id: 'export',
            label: 'Export Selected',
            icon: <Download className="h-4 w-4" />,
            action: () => console.log('Export selected transactions'),
            variant: 'outline'
          },
          {
            id: 'delete',
            label: 'Delete Selected',
            icon: <Trash2 className="h-4 w-4" />,
            action: () => handleBulkDelete(),
            variant: 'destructive'
          }
        ]}
        onSelectAll={() => setSelectedTransactions(transactions.map(t => t.id))}
        onClearSelection={() => setSelectedTransactions([])}
      />

      {/* Floating Action Button */}
      <FloatingAction
        onClick={() => navigate('/transactions/add')}
        label="Add Transaction"
        icon={<Plus className="h-5 w-5" />}
      />
    </>
  );
}
