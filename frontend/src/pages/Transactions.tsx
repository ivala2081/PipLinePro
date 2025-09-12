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
import Clients from './clients';
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
        
        // Debug pagination data
        console.log('🔍 Pagination Debug:', {
          total: data.pagination?.total || 0,
          pages: data.pagination?.pages || 0,
          per_page: pagination.per_page,
          current_page: pagination.page,
          transactions_length: validTransactions.length
        });
        
        
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
      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleImport}
        style={{ display: 'none' }}
        id="csv-file-input"
      />

        {/* Clients Analytics Content */}
          <Clients />
        </div>
    </>
  );
}