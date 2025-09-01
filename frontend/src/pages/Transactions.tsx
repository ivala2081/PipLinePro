import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/apiClient';
import { formatCurrency } from '../utils/currencyUtils';
import Modal from '../components/Modal';
import TransactionDetailView from '../components/TransactionDetailView';
import TransactionEditForm from '../components/TransactionEditForm';
import { PageHeader, Section, ContentArea } from '../components/ProfessionalLayout';
import { Button as ProfessionalButton } from '../components/ProfessionalButtons';
import DailyTransactionSummary from '../components/DailyTransactionSummary';

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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    psp_id: '',
    status: '',
    date_from: '',
    date_to: '',
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
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  
  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [dropdownOptions, setDropdownOptions] = useState({
    categories: [],
    psps: [],
    payment_methods: [],
    companies: [],
  });
  
  // Bulk delete functionality
  const [selectedTransactions, setSelectedTransactions] = useState<number[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // File input reference for import
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      fetchTransactions();
      fetchDropdownOptions();
    }
  }, [isAuthenticated, authLoading, filters, pagination.page]);

  const fetchDropdownOptions = async () => {
    try {
      const response = await api.get('/api/v1/transactions/dropdown-options');
      if (response.ok) {
        const result = await response.json();
        setDropdownOptions(result);
      } else {
        console.error('Failed to fetch dropdown options');
      }
    } catch (error) {
      console.error('Error fetching dropdown options:', error);
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
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        per_page: pagination.per_page.toString(),
        sort_by: filters.sort_by,
        sort_order: filters.sort_order,
      });

      if (filters.search) params.append('search', filters.search);
      if (filters.category) params.append('category', filters.category);
      if (filters.psp_id) params.append('psp', filters.psp_id);
      if (filters.status) params.append('status', filters.status);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);

      const response = await api.get(`/api/v1/transactions/?${params}`);

      if (response.status === 401) {
        return;
      }

      const data = await api.parseResponse(response);

      if (response.ok && data) {
        setTransactions(data.transactions || []);
        setPagination(prev => ({
          ...prev,
          total: data.pagination?.total || 0,
          pages: data.pagination?.pages || 0,
        }));
      } else {
        setError(data?.message || 'Failed to load transactions');
        setTransactions([]);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError('Failed to load transactions');
      setTransactions([]);
    } finally {
      setLoading(false);
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
    <div className='space-y-6'>
      {/* Enhanced Header */}
      <PageHeader
        title={t('transactions.title')}
        subtitle={t('transactions.description')}
        actions={
          <div className='flex items-center gap-3'>
            <ProfessionalButton
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className='h-4 w-4' />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </ProfessionalButton>
            <button
              onClick={triggerFileInput}
              disabled={importing}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full border border-blue-200 transition-colors duration-200"
            >
              <Upload className='h-4 w-4' />
              {importing ? 'Importing...' : 'Import CSV'}
            </button>
            <ProfessionalButton
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2"
            >
              <Download className='h-4 w-4' />
              {exporting ? 'Exporting...' : 'Export'}
            </ProfessionalButton>
            <ProfessionalButton
              variant="primary"
              size="sm"
              onClick={() => navigate('/transactions/add')}
              className="flex items-center gap-2"
            >
              <Plus className='h-4 w-4' />
              {t('transactions.add_new')}
            </ProfessionalButton>
          </div>
        }
      />

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleImport}
        style={{ display: 'none' }}
        id="csv-file-input"
      />

      {/* Financial Summary Cards */}
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6'>
        <h3 className='text-lg font-semibold text-gray-900 mb-4'>📊 Financial Summary</h3>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        {/* Total Deposits */}
        <div className='bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200'>
          <div className='flex items-center justify-between mb-2'>
            <div className='w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center'>
              <TrendingUp className='h-5 w-5 text-white' />
            </div>
            <span className='text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full'>
              DEP
            </span>
          </div>
          <div className='space-y-1'>
            <p className='text-sm font-medium text-green-700'>Tot DEP</p>
            <p className='text-2xl font-bold text-green-800'>
              {loading ? (
                <span className='animate-pulse bg-green-200 rounded h-8 w-24 block'></span>
              ) : (
                formatCurrency(
                  transactions
                    .filter(t => t.category?.toUpperCase() === 'DEP')
                    .reduce((sum, t) => {
                      // Use converted TL amount if available, otherwise use original amount for TL transactions
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
            <p className='text-xs text-green-600'>
              {loading ? 'Loading...' : `${transactions.filter(t => t.category?.toUpperCase() === 'DEP').length} transactions`}
            </p>
          </div>
        </div>

        {/* Total Withdrawals */}
        <div className='bg-gradient-to-br from-red-50 to-rose-100 border border-red-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200'>
          <div className='flex items-center justify-between mb-2'>
            <div className='w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center'>
              <TrendingDown className='h-5 w-5 text-white' />
            </div>
            <span className='text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded-full'>
              WD
            </span>
          </div>
          <div className='space-y-1'>
            <p className='text-sm font-medium text-red-700'>Tot WD</p>
            <p className='text-2xl font-bold text-red-800'>
              {loading ? (
                <span className='animate-pulse bg-red-200 rounded h-8 w-24 block'></span>
              ) : (
                formatCurrency(
                  Math.abs(transactions
                    .filter(t => t.category?.toUpperCase() === 'WD')
                    .reduce((sum, t) => {
                      // Use converted TL amount if available, otherwise use original amount for TL transactions
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
            <p className='text-xs text-red-600'>
              {loading ? 'Loading...' : `${transactions.filter(t => t.category?.toUpperCase() === 'WD').length} transactions`}
            </p>
          </div>
        </div>

        {/* Net Cash */}
        <div className='bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200'>
          <div className='flex items-center justify-between mb-2'>
            <div className='w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center'>
              <DollarSign className='h-5 w-5 text-white' />
            </div>
            <span className='text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full'>
              NET
            </span>
          </div>
          <div className='space-y-1'>
            <p className='text-sm font-medium text-blue-700'>Net Cash</p>
            <p className='text-2xl font-bold text-blue-800'>
              {loading ? (
                <span className='animate-pulse bg-blue-200 rounded h-8 w-24 block'></span>
              ) : (
                formatCurrency(
                  (transactions
                    .filter(t => t.category?.toUpperCase() === 'DEP')
                    .reduce((sum, t) => {
                      // Use converted TL amount if available, otherwise use original amount for TL transactions
                      if (t.currency === 'USD' || t.currency === 'EUR') {
                        return sum + (t.amount_try || t.amount_tl || 0);
                      } else {
                        return sum + (t.amount || 0);
                      }
                    }, 0) -
                  transactions
                    .filter(t => t.category?.toUpperCase() === 'WD')
                    .reduce((sum, t) => {
                      // Use converted TL amount if available, otherwise use original amount for TL transactions
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
            <p className='text-xs text-blue-600'>
              {loading ? 'Loading...' : 'Tot DEP - Tot WD'}
            </p>
          </div>
        </div>

        {/* Total Commissions */}
        <div className='bg-gradient-to-br from-purple-50 to-violet-100 border border-purple-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200'>
          <div className='flex items-center justify-between mb-2'>
            <div className='w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center'>
              <FileText className='h-5 w-5 text-white' />
            </div>
            <span className='text-xs font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-full'>
              COM
            </span>
          </div>
          <div className='space-y-1'>
            <p className='text-sm font-medium text-purple-700'>Tot Commissions</p>
            <p className='text-2xl font-bold text-purple-800'>
              {loading ? (
                <span className='animate-pulse bg-purple-200 rounded h-8 w-24 block'></span>
              ) : (
                formatCurrency(
                  transactions
                    .reduce((sum, t) => {
                      // Use converted TL commission if available, otherwise use original commission for TL transactions
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
            <p className='text-xs text-purple-600'>
              {loading ? 'Loading...' : 'All paid commissions'}
            </p>
          </div>
        </div>
        </div>
      </div>

      {/* Daily Transaction Summary */}
      <Section title="" subtitle="">
        <DailyTransactionSummary 
          transactions={transactions}
          onTransactionUpdate={fetchTransactions}
        />
      </Section>
      
      {/* Filters Section */}
      {showFilters && (
        <Section title="Advanced Filters" subtitle="Refine your transaction search">
          <div className='card'>
            <div className='p-6'>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Search
                  </label>
                  <div className='relative'>
                    <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                    <input
                      type='text'
                      value={filters.search}
                      onChange={e => handleFilterChange('search', e.target.value)}
                      className='form-input w-full pl-10'
                      placeholder='Search transactions...'
                    />
                  </div>
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Category
                  </label>
                  <select
                    value={filters.category}
                    onChange={e => handleFilterChange('category', e.target.value)}
                    className='form-select w-full'
                  >
                    <option value=''>All Categories</option>
                    <option value='WD'>Withdrawal</option>
                    <option value='DEP'>Deposit</option>
                  </select>
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={e => handleFilterChange('status', e.target.value)}
                    className='form-select w-full'
                  >
                    <option value=''>All Status</option>
                    <option value='completed'>Completed</option>
                    <option value='pending'>Pending</option>
                    <option value='failed'>Failed</option>
                  </select>
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Sort By
                  </label>
                  <select
                    value={filters.sort_by}
                    onChange={e => handleFilterChange('sort_by', e.target.value)}
                    className='form-select w-full'
                  >
                    <option value='created_at'>Date</option>
                    <option value='amount'>Amount</option>
                    <option value='client_name'>Client</option>
                    <option value='psp'>PSP</option>
                  </select>
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Date From
                  </label>
                  <input
                    type='date'
                    value={filters.date_from}
                    onChange={e =>
                      handleFilterChange('date_from', e.target.value)
                    }
                    className='form-input w-full'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Date To
                  </label>
                  <input
                    type='date'
                    value={filters.date_to}
                    onChange={e => handleFilterChange('date_to', e.target.value)}
                    className='form-input w-full'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Sort Order
                  </label>
                  <select
                    value={filters.sort_order}
                    onChange={e =>
                      handleFilterChange('sort_order', e.target.value)
                    }
                    className='form-select w-full'
                  >
                    <option value='desc'>Descending</option>
                    <option value='asc'>Ascending</option>
                  </select>
                </div>
                <div className='flex items-end'>
                  <button
                    onClick={fetchTransactions}
                    className='btn btn-primary w-full'
                  >
                    <RefreshCw className='h-4 w-4' />
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Section>
      )}

      {/* Transactions Table */}
      <Section title="Transactions" subtitle="List of all transactions">
        <ContentArea>
          {/* Bulk Actions */}
          {transactions.length > 0 && (
            <div className="mb-4 flex items-center justify-between bg-gray-50 p-4 rounded-lg border">
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
              {selectedTransactions.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkDeleting}
                  className="btn btn-danger flex items-center space-x-2"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>
                    {bulkDeleting ? 'Deleting...' : `Delete ${selectedTransactions.length} Selected`}
                  </span>
                </button>
              )}
            </div>
          )}
          {loading ? (
            <div className='p-8 text-center'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4'></div>
              <p className='text-gray-600'>{t('common.loading')}</p>
            </div>
          ) : success ? (
            <div className='p-8 text-center'>
              <div className='text-green-500 mb-4'>
                <CheckCircle className='h-12 w-12 mx-auto' />
              </div>
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                Import Successful!
              </h3>
              <div className='text-gray-600 mb-4 whitespace-pre-line text-left max-w-2xl mx-auto'>
                {success}
              </div>
              <button 
                onClick={() => setSuccess(null)} 
                className='btn btn-primary'
              >
                Continue
              </button>
            </div>
          ) : error ? (
            <div className='p-8 text-center'>
              <div className='text-red-500 mb-4'>
                <AlertCircle className='h-12 w-12 mx-auto' />
              </div>
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                Error Loading Transactions
              </h3>
              <p className='text-gray-600 mb-4'>{error}</p>
              <button onClick={fetchTransactions} className='btn btn-primary'>
                Try Again
              </button>
            </div>
          ) : transactions.length === 0 ? (
            <div className='p-8 text-center'>
              <div className='text-gray-400 mb-4'>
                <FileText className='h-12 w-12 mx-auto' />
              </div>
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                No Transactions Found
              </h3>
              <p className='text-gray-600'>
                {filters.search || filters.category || filters.status
                  ? 'No transactions match your filters.'
                  : 'No transactions are currently available.'}
              </p>
            </div>
          ) : (
            <>
              <div className='overflow-x-auto bg-white rounded-lg shadow'>
                <table className='min-w-full divide-y divide-gray-200'>
                  <thead className='bg-gray-50'>
                    <tr>
                      <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12'>
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
                      <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6'>
                        Client
                      </th>

                      <th className='px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8'>
                        Payment Method
                      </th>
                      <th className='px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8'>
                        Category
                      </th>
                      <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8'>
                        Amount
                      </th>
                      <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8'>
                        Commission
                      </th>
                      <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8'>
                        Net Amount
                      </th>
                      <th className='px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12'>
                        Currency
                      </th>
                      <th className='px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8'>
                        PSP
                      </th>
                      <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8'>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className='bg-white divide-y divide-gray-200'>
                    {transactions.map(transaction => (
                      <tr key={transaction.id} className='hover:bg-gray-50 transition-colors duration-150'>
                        <td className='px-4 py-4 whitespace-nowrap text-center'>
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
                        <td className='px-4 py-4 whitespace-nowrap'>
                          <div className='text-sm font-medium text-gray-900'>
                            {transaction.client_name || 'Unknown'}
                          </div>
                          {transaction.company && (
                            <div className='text-xs text-gray-500 mt-1'>
                              {transaction.company}
                            </div>
                          )}
                        </td>

                        <td className='px-3 py-4 whitespace-nowrap'>
                          <div className='text-sm text-gray-900 max-w-24 truncate' title={transaction.payment_method || 'N/A'}>
                            {transaction.payment_method || 'N/A'}
                          </div>
                        </td>
                        <td className='px-3 py-4 whitespace-nowrap'>
                          <div className='text-sm font-medium text-gray-900'>
                            {transaction.category || 'N/A'}
                          </div>
                        </td>
                        <td className='px-4 py-4 whitespace-nowrap text-right'>
                          <div className='text-sm font-medium text-gray-900'>
                            {formatCurrency(transaction.amount, transaction.currency || '₺')}
                            {transaction.currency === 'USD' || transaction.currency === 'EUR' ? (
                              <div className='text-xs text-gray-500 mt-1'>
                                ({formatCurrency(transaction.amount_try || transaction.amount_tl || 0, '₺')})
                              </div>
                            ) : null}
                          </div>
                        </td>
                        <td className='px-4 py-4 whitespace-nowrap text-right'>
                          <div className='text-sm text-gray-900'>
                            {formatCurrency(transaction.commission, transaction.currency || '₺')}
                            {transaction.currency === 'USD' || transaction.currency === 'EUR' ? (
                              <div className='text-xs text-gray-500 mt-1'>
                                ({formatCurrency(transaction.commission_try || transaction.commission_tl || 0, '₺')})
                              </div>
                            ) : null}
                          </div>
                        </td>
                        <td className='px-4 py-4 whitespace-nowrap text-right'>
                          <div className='text-sm font-medium text-gray-900'>
                            {formatCurrency(transaction.net_amount, transaction.currency || '₺')}
                            {transaction.currency === 'USD' || transaction.currency === 'EUR' ? (
                              <div className='text-xs text-gray-500 mt-1'>
                                ({formatCurrency(transaction.net_amount_try || transaction.net_amount_tl || 0, '₺')})
                              </div>
                            ) : null}
                          </div>
                        </td>
                        <td className='px-3 py-4 whitespace-nowrap text-center'>
                          <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
                            {transaction.currency || 'TL'}
                          </span>
                        </td>
                        <td className='px-3 py-4 whitespace-nowrap'>
                          <div className='text-sm text-gray-900'>
                            {transaction.psp || 'Unknown'}
                          </div>
                        </td>
                        <td className='px-4 py-4 whitespace-nowrap'>
                          <div className='flex items-center justify-center space-x-1'>
                            <button 
                              onClick={() => handleViewDetails(transaction)}
                              className='text-blue-600 hover:text-blue-900 p-2 rounded-md hover:bg-blue-50 transition-colors duration-150'
                              title='View Details'
                            >
                              <Eye className='h-4 w-4' />
                            </button>
                            <button 
                              onClick={() => handleEditTransaction(transaction)}
                              className='text-green-600 hover:text-green-900 p-2 rounded-md hover:bg-green-50 transition-colors duration-150'
                              title='Edit Transaction'
                            >
                              <Edit className='h-4 w-4' />
                            </button>
                            <button 
                              onClick={() => handleDeleteTransaction(transaction.id)}
                              className='text-red-600 hover:text-red-900 p-2 rounded-md hover:bg-red-50 transition-colors duration-150'
                              title='Delete Transaction'
                            >
                              <Trash2 className='h-4 w-4' />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    
                    {/* Daily Summary Row */}
                    <tr className='bg-gray-100 border-t-2 border-gray-300'>
                      <td colSpan={4} className='px-4 py-3'>
                        <div className='text-sm font-semibold text-gray-700'>
                          Daily Summary
                        </div>
                      </td>
                      <td className='px-4 py-3 text-right'>
                        <div className='text-sm font-semibold text-gray-700'>
                          Total Amount: {formatCurrency(
                            transactions.reduce((sum, t) => {
                              // Use converted TL amount if available, otherwise use original amount for TL transactions
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
                      <td className='px-4 py-3 text-right'>
                        <div className='text-sm font-semibold text-emerald-700'>
                          Daily Total Commissions: {formatCurrency(
                            transactions.reduce((sum, t) => {
                              // Use converted TL commission if available, otherwise use original commission for TL transactions
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
                      <td className='px-4 py-3 text-right'>
                        <div className='text-sm font-semibold text-gray-700'>
                          Total Net: {formatCurrency(
                            transactions.reduce((sum, t) => {
                              // Use converted TL net amount if available, otherwise use original net amount for TL transactions
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
                      <td className='px-4 py-3 text-center'>
                        <div className='text-sm font-semibold text-gray-700'>
                          {transactions.length} transactions
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className='px-6 py-4 border-t border-gray-200 bg-gray-50'>
                  <div className='flex items-center justify-between'>
                    <div className='text-sm text-gray-700'>
                      Showing {(pagination.page - 1) * pagination.per_page + 1} to{' '}
                      {Math.min(
                        pagination.page * pagination.per_page,
                        pagination.total
                      )}{' '}
                      of {pagination.total} results
                    </div>
                    <div className='flex items-center space-x-2'>
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className='btn btn-secondary btn-sm'
                      >
                        Previous
                      </button>
                      <span className='text-sm text-gray-700'>
                        Page {pagination.page} of {pagination.pages}
                      </span>
                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.pages}
                        className='btn btn-secondary btn-sm'
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </ContentArea>
      </Section>

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
    </div>
  );
}
