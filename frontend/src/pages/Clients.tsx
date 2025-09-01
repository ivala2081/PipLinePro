import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import {
  BarChart3,
  Users,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Building2,
  FileText,
  Calendar,
  Eye,
  Edit,
  Trash2,
  Filter,
  Search,
  Download,
  AlertCircle,
  BarChart,
  User,
  Building,
  Plus,
  LineChart,
  Activity,
  X,
  Globe,
  RefreshCw,
  CheckCircle,
  Clock,
  PieChart,
  MoreHorizontal,
  Upload,
  Info
} from 'lucide-react';
import {
  BarChart as RechartsBarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
} from 'recharts';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/apiClient';
import { formatCurrency as formatCurrencyUtil } from '../utils/currencyUtils';
import { usePSPRefresh } from '../hooks/usePSPRefresh';
import Modal from '../components/Modal';
import TransactionDetailView from '../components/TransactionDetailView';
import TransactionEditForm from '../components/TransactionEditForm';
import { PageHeader, Section, ContentArea, CardGrid } from '../components/ProfessionalLayout';
import { Button } from '../components/ProfessionalButtons';

interface Client {
  client_name: string;
  company_name?: string;
  payment_method?: string;
  category?: string;
  total_amount: number;
  total_commission: number;
  total_net: number;
  transaction_count: number;
  first_transaction: string;
  last_transaction: string;
  currencies: string[];
  psps: string[];
  avg_transaction: number;
}

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
  notes?: string;
  date?: string;
  created_at?: string;
  updated_at?: string;
  amount_tl?: number;
  commission_tl?: number;
  net_amount_tl?: number;
  exchange_rate?: number;
}

interface ClientsResponse {
  clients: Client[];
  total_clients: number;
}

interface DailySummary {
  date: string;
  date_str: string;
  usd_rate: number | null;
  total_amount_tl: number;
  total_amount_usd: number;
  total_commission_tl: number;
  total_commission_usd: number;
  total_net_tl: number;
  total_net_usd: number;
  transaction_count: number;
  unique_clients: number;
  psp_summary: Array<{
    name: string;
    amount_tl: number;
    amount_usd: number;
    commission_tl: number;
    commission_usd: number;
    net_tl: number;
    net_usd: number;
    count: number;
    is_tether: boolean;
    primary_currency: 'USD' | 'TRY';
  }>;
  category_summary: Array<{
    name: string;
    amount_tl: number;
    amount_usd: number;
    commission_tl: number;
    commission_usd: number;
    net_tl: number;
    net_usd: number;
    count: number;
  }>;
  payment_method_summary: Array<{
    name: string;
    net_amount_tl: number;  // Changed from amount_tl to net_amount_tl
    net_amount_usd: number;  // Changed from amount_usd to net_amount_usd
    commission_tl: number;
    commission_usd: number;
    net_tl: number;
    net_usd: number;
    count: number;
  }>;
  transactions: Array<{
    id: number;
    client_name: string;
    company?: string;
    payment_method?: string;
    category: string;
    amount: number;
    commission: number;
    net_amount: number;
    currency: string;
    psp?: string;
    notes?: string;
    date: string;
    created_at?: string;
    updated_at?: string;
    amount_tl?: number;
    commission_tl?: number;
    net_amount_tl?: number;
    exchange_rate?: number;
  }>;
}

export default function Clients() {
  const { t } = useLanguage();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { refreshPSPDataSilent } = usePSPRefresh();

  const [clients, setClients] = useState<Client[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedTransactions, setSelectedTransactions] = useState<number[]>(
    []
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  const [clientTransactions, setClientTransactions] = useState<Record<string, Transaction[]>>({});
  const [loadingClientTransactions, setLoadingClientTransactions] = useState<Record<string, boolean>>({});
  
  // State for daily summary modal
  const [showDailySummaryModal, setShowDailySummaryModal] = useState(false);
  const [dailySummaryData, setDailySummaryData] = useState<DailySummary | null>(null);
  const [dailySummaryLoading, setDailySummaryLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  
  // State for exchange rates (removed - no longer needed with automatic yfinance integration)
  // const [showExchangeRateModal, setShowExchangeRateModal] = useState(false);
  // const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  // const [exchangeRateLoading, setExchangeRateLoading] = useState(false);



  const [dropdownOptions, setDropdownOptions] = useState({
    psps: [] as string[],
    categories: [] as string[],
    payment_methods: [] as string[],
    currencies: [] as string[],
    companies: [] as string[],
  });
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    psp: '',
    date_from: '',
    date_to: '',
    client_name: '',
    payment_method: '',
    currency: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 100, // Increased to show more transactions per page (roughly 3-4 days worth)
    total: 0,
    pages: 0,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'analytics' | 'clients'>('overview');
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewTransactionModal, setShowViewTransactionModal] = useState(false);
  const [showEditTransactionModal, setShowEditTransactionModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const [loadingDropdownOptions, setLoadingDropdownOptions] = useState(false);
  
  // Import functionality state
  const [importing, setImporting] = useState(false);
  const [showImportGuide, setShowImportGuide] = useState(false);
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [importData, setImportData] = useState<Transaction[]>([]);
  const [importPreview, setImportPreview] = useState<Transaction[]>([]);

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      fetchClients();
      fetchDropdownOptions();
    }
  }, [isAuthenticated, authLoading]);

  // Fetch transactions when transactions tab is active
  useEffect(() => {
    if (isAuthenticated && !authLoading && activeTab === 'transactions') {
      fetchTransactions();
    } else {
      // Clear selected transactions when switching away from transactions tab
      setSelectedTransactions([]);
    }
  }, [isAuthenticated, authLoading, activeTab]);

  // Refetch transactions when pagination changes
  useEffect(() => {
    if (isAuthenticated && !authLoading && activeTab === 'transactions') {
      fetchTransactions();
    }
  }, [pagination.page, pagination.per_page]);

  // Reset pagination to first page when filters change
  useEffect(() => {
    if (activeTab === 'transactions') {
      setPagination(prev => ({ ...prev, page: 1 }));
    }
  }, [filters.search, filters.client_name, filters.payment_method, filters.category, filters.psp, filters.currency]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.category && filters.category.trim() !== '') params.append('category', filters.category);
      if (filters.client_name && filters.client_name.trim() !== '') params.append('client', filters.client_name);
      if (filters.payment_method && filters.payment_method.trim() !== '') params.append('payment_method', filters.payment_method);
      if (filters.psp && filters.psp.trim() !== '') params.append('psp', filters.psp);
      if (filters.currency && filters.currency.trim() !== '') params.append('currency', filters.currency);
      
      // Debug: Log the filters being applied
      console.log('🔍 Debug - Filters being applied:', {
        category: filters.category,
        categoryTrimmed: filters.category?.trim(),
        categoryEmpty: filters.category?.trim() === '',
        willSendCategory: filters.category && filters.category.trim() !== ''
      });
      
      params.append('page', pagination.page.toString());
      params.append('per_page', pagination.per_page.toString());

      const response = await api.get(`/api/v1/transactions/?${params.toString()}`);

      if (response.ok) {
      const data = await api.parseResponse(response);
        if (data?.transactions) {
          // Debug: Log the first transaction to see what fields are present
          if (data.transactions.length > 0) {
            console.log('🔍 Debug - First transaction data:', data.transactions[0]);
            console.log('🔍 Debug - Company field:', data.transactions[0].company);
          }
          setTransactions(data.transactions);
          setPagination(prev => ({
            ...prev,
            total: data.pagination?.total || data.transactions.length,
            pages: data.pagination?.pages || prev.pages,
            page: data.pagination?.page || prev.page
          }));
        }
      } else {
        setError('Failed to fetch transactions');
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError('Error fetching transactions');
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/api/v1/transactions/clients');

      if (response.status === 401) {
        return;
      }

      const data = await api.parseResponse(response);

      if (response.ok && data) {
        const clientsData = Array.isArray(data) ? data : [];

        const transformedData: Client[] = clientsData.map((item: any) => ({
          client_name: item.client_name || 'Unknown',
          company_name: item.company_name || null,
          payment_method: item.payment_method || null,
          category: item.category || null,
          total_amount: item.total_amount || 0,
          total_commission: item.total_commission || 0,
          total_net: item.total_net || 0,
          transaction_count: item.transaction_count || 0,
          first_transaction: item.first_transaction || '',
          last_transaction: item.last_transaction || '',
          currencies: item.currencies || [],
          psps: item.psps || [],
          avg_transaction: item.avg_transaction || 0,
        }));

        setClients(transformedData);
      } else {
        setError(data?.message || 'Failed to load clients data');
        setClients([]);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      setError('Failed to load clients data');
      setClients([]);
    } finally {
      setLoading(false);
    }
  };



  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      category: '',
      psp: '',
      date_from: '',
      date_to: '',
      client_name: '',
      payment_method: '',
      currency: '',
    });
    // Reset pagination to first page when filters are reset
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const formatCurrency = (amount: number, currency?: string) => {
    // Use the shared utility for proper currency formatting
    return formatCurrencyUtil(amount, currency || 'USD');
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateHeader = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Group transactions by date
  const groupTransactionsByDate = (transactions: Transaction[]) => {
    const grouped = transactions.reduce((acc, transaction) => {
      const dateKey = transaction.date || 'Unknown';
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(transaction);
      return acc;
    }, {} as Record<string, Transaction[]>);

    return Object.entries(grouped)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([dateKey, transactions]) => ({
        dateKey,
        date: dateKey,
        transactions: transactions.sort(
          (a, b) => {
            const dateA = a.date ? new Date(a.date).getTime() : 0;
            const dateB = b.date ? new Date(b.date).getTime() : 0;
            return dateB - dateA;
          }
        ),
      }));
  };

  const handleExport = () => {
    const headers = [
      'Client Name',
      'Payment',
      'Total Amount',
      'Commissions',
      'Net Amount',
      'Transactions',
      'Currency',
      'PSP',
    ];
    const rows = sortedClients.map(client => {
      // Determine primary currency for this client
      const primaryCurrency =
        Array.isArray(client.currencies) && client.currencies.length > 0
          ? client.currencies[0]
          : 'USD';

      return [
        client.client_name || 'Unknown',
        client.payment_method || 'N/A',
        formatCurrency(client.total_amount || 0, primaryCurrency),
        formatCurrency(client.total_commission || 0, primaryCurrency),
        formatCurrency(client.total_net || 0, primaryCurrency),
        client.transaction_count || 0,
        Array.isArray(client.currencies) && client.currencies.length > 0
          ? client.currencies.join(', ')
          : 'N/A',
        Array.isArray(client.psps) ? client.psps.join(', ') : 'N/A',
      ];
    });

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clients_export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Import functionality
  const triggerFileInput = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv,.xlsx,.xls,.xlsm,.xlsb';
    fileInput.onchange = handleImport;
    fileInput.click();
  };

    const handleImport = async (event: Event) => {
    console.log('🚀 ===== IMPORT PROCESS STARTED =====');
    console.log('📅 Timestamp:', new Date().toISOString());
    
    const target = event.target as HTMLInputElement;
    console.log('🎯 Target element:', target);
    
    const file = target.files?.[0];
    console.log('📁 File object:', file);
    
    if (!file) {
      console.error('❌ No file selected');
      return;
    }
    
    console.log('📁 File details:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified).toISOString()
    });
    
    setImporting(true);
    console.log('✅ Importing state set to true');
    
    try {
      let transactions: Transaction[] = [];
      console.log('📊 Transactions array initialized');
      
      if (file.name.toLowerCase().endsWith('.csv')) {
        console.log('📄 Processing CSV file...');
        
        // Handle CSV files
        console.log('📖 Reading file content...');
        const text = await file.text();
        console.log('📖 File content length:', text.length);
        console.log('📖 First 200 characters:', text.substring(0, 200));
        
        const lines = text.split('\n');
        console.log('📊 Total lines:', lines.length);
        
        const headers = lines[0].split(',');
        console.log('📋 CSV Headers:', headers);
        console.log('📋 Header count:', headers.length);
        
        const data = lines.slice(1).filter(line => line.trim());
        console.log('📊 Data lines (after filtering):', data.length);
        
        // Debug: Show first few lines to understand structure
        if (data.length > 0) {
          console.log('📊 First data line:', data[0]);
          console.log('📊 First line values:', data[0].split(','));
          console.log('📊 First line value count:', data[0].split(',').length);
        }
        
        if (data.length === 0) {
          console.error('❌ No data lines found after filtering');
          alert('No valid data found in CSV file');
          setImporting(false);
          return;
        }
        
        console.log('🔄 Starting transaction processing loop...');
        console.log(`🔄 Will process ${data.length} lines`);
        
        transactions = data.map((line, index) => {
          try {
            console.log(`\n🔍 ===== PROCESSING LINE ${index + 1} =====`);
            console.log(`🔍 Raw line content:`, line);
            console.log(`🔍 Line length:`, line.length);
            
            const values = line.split(',');
            console.log(`🔍 Split values count:`, values.length);
            console.log(`🔍 All values:`, values);
            
            const amount = parseFloat(values[5]) || 0;
            console.log(`🔍 Parsed amount:`, amount);
            console.log(`🔍 Raw amount value:`, values[5]);
            
            // Debug logging for specific transactions
            if (values[0] && (values[0].includes('TETHER ALIM') || values[0].includes('KUR FARKI MALİYETİ'))) {
              console.log('Debug - Found special transaction:', {
                line: index + 1,
                client_name: values[0],
                amount: values[5],
                parsed_amount: amount,
                category: values[4],
                currency: values[6],
                psp: values[7],
                date: values[8]
              });
            }
            
            // CRITICAL FIX: Define category FIRST, before any other logic
            console.log(`📝 ===== CATEGORY PROCESSING =====`);
            console.log(`📝 Raw category value (values[4]):`, values[4]);
            console.log(`📝 Raw category type:`, typeof values[4]);
            console.log(`📝 Raw category length:`, values[4] ? values[4].length : 'N/A');
            
            let category: string;
            if (values[4] && values[4].trim()) {
              const rawCategory = values[4].trim().toUpperCase();
              console.log(`📝 Trimmed and uppercased: ${values[4]} -> ${rawCategory}`);
              
              // Map common variations
              const categoryMapping: { [key: string]: string } = {
                'DEPOSIT': 'DEP',
                'WITHDRAW': 'WD',
                'WITHDRAWAL': 'WD',
                'ÇEKME': 'WD',
                'YATIRMA': 'DEP',
                'WD': 'WD',
                'DEP': 'DEP'
              };
              
              console.log(`📝 Available mappings:`, Object.keys(categoryMapping));
              console.log(`📝 Looking for:`, rawCategory);
              
              category = categoryMapping[rawCategory] || 'DEP';
              console.log(`📝 Final mapped category: ${category}`);
            } else {
              category = 'DEP'; // Default value
              console.log(`📝 Using default category: ${category} (no value or empty)`);
            }
            
            console.log(`📝 Final category value:`, category);
            console.log(`📝 Category type:`, typeof category);
            
            // Validate and clean data
            const client_name = values[0]?.trim() || '';
            const company = values[1]?.trim() || '';
            const payment_method = values[2]?.trim() || '';
            const currency = values[6]?.trim() || 'TL';
            const psp = values[7]?.trim() || '';
            const date = values[8]?.trim() || new Date().toISOString().split('T')[0];
            
            // SAFETY CHECK: Ensure category is defined before validation
            if (typeof category === 'undefined') {
              console.error(`Row ${index + 1}: Category is undefined! This should never happen.`);
              category = 'DEP'; // Emergency fallback
            }
            
            // Generate warnings for data quality issues - now category is guaranteed to be defined
            if (!client_name) {
              console.warn(`Row ${index + 1}: Missing client name`);
            }
            if (amount <= 0 && category === 'DEP') {
              console.warn(`Row ${index + 1}: DEP transactions should have positive amounts, got: ${amount}`);
            }
            if (amount >= 0 && category === 'WD') {
              console.warn(`Row ${index + 1}: WD transactions typically have negative amounts, got: ${amount}`);
            }
            if (!category || !['DEP', 'WD'].includes(category)) {
              console.warn(`Row ${index + 1}: Invalid category: ${category}, defaulting to DEP`);
            }
            
            const transaction = {
              id: index + 1,
              client_name: client_name || `Unknown_Client_${index + 1}`,
              company: company || 'Unknown',
              payment_method: payment_method || 'Unknown',
              category: category,
              amount: amount,
              commission: 0, // Will be calculated by backend
              net_amount: amount, // Will be calculated by backend
              currency: currency,
              psp: psp || 'Unknown',
              date: date,
              notes: `Imported from CSV - Row ${index + 2}`
            };
            
            console.log(`✅ Transaction created successfully:`, transaction);
            console.log(`✅ Line ${index + 1} processing completed`);
            
            return transaction;
          } catch (error) {
            console.error(`❌ Error processing line ${index + 1}:`, error);
            console.error(`❌ Line content:`, line);
            // Return a safe default transaction
            return {
              id: index + 1,
              client_name: `Error_Client_${index + 1}`,
              company: 'Error',
              iban: 'Error',
              payment_method: 'Error',
              category: 'DEP',
              amount: 0,
              commission: 0,
              net_amount: 0,
              currency: 'TL',
              psp: 'Error',
              date: new Date().toISOString().split('T')[0],
              notes: `Error processing line ${index + 2}: ${error}`
            };
          }
        });
      } else if (file.name.toLowerCase().match(/\.(xlsx|xls|xlsm|xlsb)$/)) {
        // Handle Excel files
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        
        // Get the first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert sheet to JSON with headers
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length < 2) {
          alert('Excel file must have at least a header row and one data row.');
          setImporting(false);
          return;
        }
        
        const headers = jsonData[0] as string[];
        const dataRows = jsonData.slice(1) as any[][];
        
        transactions = dataRows.map((row, index) => {
          try {
            // CRITICAL FIX: Define category FIRST, before any other logic
            let category: string;
          if (row[4] && row[4].toString().trim()) {
            const rawCategory = row[4].toString().trim().toUpperCase();
            // Map common variations
            const categoryMapping: { [key: string]: string } = {
              'DEPOSIT': 'DEP',
              'WITHDRAW': 'WD',
              'WITHDRAWAL': 'WD',
              'ÇEKME': 'WD',
              'YATIRMA': 'DEP',
              'WD': 'WD',
              'DEP': 'DEP'
            };
            category = categoryMapping[rawCategory] || 'DEP';
          } else {
            category = 'DEP'; // Default value
          }
          
          // Validate and clean data
          const client_name = (row[0] || '').toString().trim();
          const company = (row[1] || '').toString().trim();
          const iban = (row[2] || '').toString().trim();
          const payment_method = (row[3] || '').toString().trim();
          const amount = parseFloat(row[5]) || 0;
          const currency = (row[8] || 'TL').toString().trim();
          const psp = (row[9] || '').toString().trim();
          const date = (row[10] || '').toString().trim() || new Date().toISOString().split('T')[0];
          
          // SAFETY CHECK: Ensure category is defined before validation
          if (typeof category === 'undefined') {
            console.error(`Row ${index + 1}: Category is undefined! This should never happen.`);
            category = 'DEP'; // Emergency fallback
          }
          
          // Generate warnings for data quality issues - now category is guaranteed to be defined
          if (!client_name) {
            console.warn(`Row ${index + 1}: Missing client name`);
          }
          if (amount <= 0 && category === 'DEP') {
            console.warn(`Row ${index + 1}: DEP transactions should have positive amounts, got: ${amount}`);
          }
          if (amount >= 0 && category === 'WD') {
            console.warn(`Row ${index + 1}: WD transactions typically have negative amounts, got: ${amount}`);
          }
          if (!category || !['DEP', 'WD'].includes(category)) {
            console.warn(`Row ${index + 1}: Invalid category: ${category}, defaulting to DEP`);
          }
          
          return {
            id: index + 1,
            client_name: client_name || `Unknown_Client_${index + 1}`,
            company: company || 'Unknown',
            iban: iban || 'Unknown',
            payment_method: payment_method || 'Unknown',
            category: category,
            amount: amount,
            commission: parseFloat(row[6]) || 0,
            net_amount: parseFloat(row[7]) || amount,
            currency: currency,
            psp: psp || 'Unknown',
            date: date,
            notes: (row[11] || `Imported from Excel - Row ${index + 2}`).toString()
          };
          } catch (error) {
            console.error(`❌ Error processing Excel row ${index + 1}:`, error);
            console.error(`❌ Row content:`, row);
            // Return a safe default transaction
            return {
              id: index + 1,
              client_name: `Error_Client_${index + 1}`,
              company: 'Error',
              iban: 'Error',
              payment_method: 'Error',
              category: 'DEP',
              amount: 0,
              commission: 0,
              net_amount: 0,
              currency: 'TL',
              psp: 'Error',
              date: new Date().toISOString().split('T')[0],
              notes: `Error processing Excel row ${index + 2}: ${error}`
            };
          }
        });
      } else {
        alert('Unsupported file format. Please use CSV, XLSX, XLS, XLSM, or XLSB files.');
        setImporting(false);
        return;
      }
      
                         console.log('\n📊 ===== IMPORT PROCESSING COMPLETED =====');
      console.log(`📊 Total transactions processed:`, transactions.length);
      console.log(`📊 Transactions array:`, transactions);
      
      if (transactions.length > 0) {
        console.log('✅ Setting import data and preview...');
        setImportData(transactions);
        setImportPreview(transactions.slice(0, 5)); // Show first 5 for preview
        setShowImportPreview(true); // Show import preview, not guide
        console.log('✅ Import preview shown successfully');
      } else {
        console.error('❌ No transactions to import');
        alert('No valid data found in the file. Please check the file format and content.');
      }
      
    } catch (error: any) {
      console.error('\n❌ ===== IMPORT ERROR OCCURRED =====');
      console.error('❌ Error type:', typeof error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      console.error('❌ Full error object:', error);
      alert(`Error importing file: ${error.message}\n\nPlease check the file format and try again.`);
    } finally {
      console.log('🔄 Setting importing state to false');
      setImporting(false);
      console.log('✅ Import process completed (success or failure)');
    }
  };

  // Handle final import of transactions to the system
  const handleFinalImport = async () => {
    if (!importData || importData.length === 0) {
      alert('No data to import');
      return;
    }

    setImporting(true);
    
    try {
      // Prepare transactions for import
      const transactionsToImport = importData.map(transaction => ({
        client_name: transaction.client_name,
        company: transaction.company || '',
        payment_method: transaction.payment_method || '',
        category: transaction.category,
        amount: transaction.amount,
        commission: transaction.commission || 0,
        net_amount: transaction.net_amount || transaction.amount,
        currency: transaction.currency || 'TL',
        psp: transaction.psp || '',
        notes: transaction.notes || '',
        date: transaction.date || new Date().toISOString().split('T')[0]
      }));

      console.log('🚀 Importing transactions:', transactionsToImport);

      // Send transactions to backend API
      const response = await api.post('/api/v1/transactions/bulk-import', {
        transactions: transactionsToImport
      });

      if (response.ok) {
        const result = await api.parseResponse(response);
        console.log('✅ Import successful:', result);
        
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
        
        // Show the detailed message
        alert(message);
        
        // Close modal
        setShowImportPreview(false);
        
        // Clear import data
        setImportData([]);
        setImportPreview([]);
        
        // Refresh the page data
        if (activeTab === 'transactions') {
          fetchTransactions();
        }
        fetchClients();
        
      } else {
        console.error('❌ Import failed:', response);
        alert(`Import failed: ${response.statusText || 'Unknown error'}`);
      }
      
    } catch (error: any) {
      console.error('❌ Import error:', error);
      alert(`Import error: ${error.message || 'Unknown error occurred'}`);
    } finally {
      setImporting(false);
    }
  };

  // Handle bulk delete of all transactions
  const handleBulkDeleteAll = async () => {
    if (confirmationCode !== '4561') {
      alert('Invalid confirmation code. Please enter 4561 to confirm deletion.');
      return;
    }
    
    if (!confirm('Are you absolutely sure you want to delete ALL transactions? This action cannot be undone!')) {
      return;
    }
    
    setDeleting(true);
    try {
      const response = await api.post('/api/v1/transactions/bulk-delete', {
        confirmation_code: confirmationCode
      });
      
      if (response.ok) {
        const result = await api.parseResponse(response);
        alert(`Successfully deleted ${result.data.deleted_count} transactions!`);
        setShowBulkDeleteModal(false);
        setConfirmationCode('');
        // Refresh data
        fetchClients();
        if (activeTab === 'transactions') {
          fetchTransactions();
        }
      } else {
        const errorData = await api.parseResponse(response);
        alert(`Bulk delete failed: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('❌ Bulk delete error:', error);
      alert(`Bulk delete failed: ${error.message || 'Unknown error'}`);
    } finally {
      setDeleting(false);
    }
  };

  // Action handlers
  const handleViewClient = (client: Client) => {
    setSelectedClient(client);
    setShowViewModal(true);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setShowEditModal(true);
  };

  const handleDeleteClient = (client: Client) => {
    setSelectedClient(client);
    setShowDeleteModal(true);
  };

  // Transaction action handlers
  const handleViewTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowViewTransactionModal(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowEditTransactionModal(true);
  };

  const handleDeleteTransaction = async (transaction: Transaction) => {
    if (
      confirm(
        `Are you sure you want to delete this transaction?\n\nClient: ${transaction.client_name}\nAmount: ${formatCurrency(transaction.amount, transaction.currency)}`
      )
    ) {
      try {
        const response = await api.delete(
          `/api/v1/transactions/${transaction.id}`
        );

        if (response.ok) {
          const data = await api.parseResponse(response);
          if (data?.success) {
            // Remove transaction from local state
            setTransactions(prev => prev.filter(t => t.id !== transaction.id));

            // Refresh PSP data automatically after successful deletion
            try {
              await refreshPSPDataSilent();
              console.log('PSP data refreshed after transaction deletion');
            } catch (pspError) {
              console.warn(
                'Failed to refresh PSP data after transaction deletion:',
                pspError
              );
              // Don't fail the deletion if PSP refresh fails
            }

            alert('Transaction deleted successfully!');
          } else {
            alert(data?.message || 'Failed to delete transaction');
          }
        } else {
          const data = await api.parseResponse(response);
          alert(data?.message || 'Failed to delete transaction');
        }
      } catch (error) {
        console.error('Error deleting transaction:', error);
        alert('Failed to delete transaction. Please try again.');
      }
    }
  };

  // Function to refresh PSP data
  const refreshPSPData = async () => {
    try {
      const response = await api.get('/api/v1/transactions/psp_summary_stats');
      if (response.ok) {
        const pspData = await api.parseResponse(response);
        // Update any PSP-related state if needed
        console.log('PSP data refreshed:', pspData);
        return pspData;
      } else {
        throw new Error('Failed to fetch PSP data');
      }
    } catch (error) {
      console.error('Error refreshing PSP data:', error);
      throw error;
    }
  };

  // Bulk delete functions
  const handleSelectTransaction = (transactionId: number, checked: boolean) => {
    if (checked) {
      setSelectedTransactions(prev => [...prev, transactionId]);
    } else {
      setSelectedTransactions(prev => prev.filter(id => id !== transactionId));
    }
  };

  const handleSelectAllTransactions = (checked: boolean) => {
    if (checked) {
      const allTransactionIds = transactions.map(t => t.id);
      setSelectedTransactions(allTransactionIds);
    } else {
      setSelectedTransactions([]);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTransactions.length === 0) {
      alert('Please select transactions to delete');
      return;
    }

    const confirmMessage = `Are you sure you want to delete ${selectedTransactions.length} transaction${selectedTransactions.length > 1 ? 's' : ''}?\n\nThis action cannot be undone.`;

    if (confirm(confirmMessage)) {
      try {
        setBulkDeleteLoading(true);

        // Delete transactions one by one
        const deletePromises = selectedTransactions.map(async transactionId => {
          try {
            const response = await api.delete(
              `/api/v1/transactions/${transactionId}`
            );
            return { id: transactionId, success: response.ok };
          } catch (error) {
            return { id: transactionId, success: false, error };
          }
        });

        const results = await Promise.all(deletePromises);
        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);

        // Remove successful deletions from local state
        setTransactions(prev =>
          prev.filter(t => !successful.some(s => s.id === t.id))
        );

        // Clear selection
        setSelectedTransactions([]);
        setShowBulkDeleteModal(false);

        // Wait a moment for backend to process all deletions, then refresh
        setTimeout(async () => {
          await fetchTransactions();

          // Refresh PSP data after bulk deletion
          try {
            await refreshPSPData();
            console.log('PSP data refreshed after bulk deletion');
          } catch (pspError) {
            console.warn(
              'Failed to refresh PSP data after bulk deletion:',
              pspError
            );
            // Don't fail the bulk deletion if PSP refresh fails
          }
        }, 500);

        // Show results
        if (successful.length > 0 && failed.length === 0) {
          alert(
            `Successfully deleted ${successful.length} transaction${successful.length > 1 ? 's' : ''}!`
          );
        } else if (successful.length > 0 && failed.length > 0) {
          alert(
            `Deleted ${successful.length} transaction${successful.length > 1 ? 's' : ''} successfully. Failed to delete ${failed.length} transaction${failed.length > 1 ? 's' : ''}.`
          );
        } else {
          alert(`Failed to delete any transactions. Please try again.`);
        }
      } catch (error) {
        console.error('Error in bulk delete:', error);
        alert('An error occurred during bulk delete. Please try again.');
      } finally {
        setBulkDeleteLoading(false);
      }
    }
  };

  const confirmDeleteClient = async () => {
    if (!selectedClient) return;

    try {
      setDeleteLoading(true);

      // Note: You'll need to implement the actual delete endpoint
      // For now, we'll simulate the deletion
      const response = await api.delete(
        `/api/v1/clients/${encodeURIComponent(selectedClient.client_name)}`
      );

      if (response.ok) {
        // Remove client from local state
        setClients(prev =>
          prev.filter(
            client => client.client_name !== selectedClient.client_name
          )
        );
        setShowDeleteModal(false);
        setSelectedClient(null);
      } else {
        const data = await api.parseResponse(response);
        alert(data?.message || 'Failed to delete client');
      }
    } catch (error) {
      console.error('Error deleting client:', error);
      alert('Failed to delete client');
    } finally {
      setDeleteLoading(false);
    }
  };

  const closeModal = () => {
    setShowViewModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setShowBulkDeleteModal(false);
    setSelectedClient(null);
  };



  const filteredClients = Array.isArray(clients)
    ? clients.filter(client => {
        const matchesSearch =
          !filters.search ||
          client.client_name
            .toLowerCase()
            .includes(filters.search.toLowerCase()) ||
          (client.company_name &&
            client.company_name
              .toLowerCase()
              .includes(filters.search.toLowerCase()));

        const matchesClientName =
          !filters.client_name ||
          client.client_name
            .toLowerCase()
            .includes(filters.client_name.toLowerCase());

        const matchesPaymentMethod =
          !filters.payment_method ||
          (client.payment_method &&
            client.payment_method
              .toLowerCase()
              .includes(filters.payment_method.toLowerCase()));

        const matchesCategory =
          !filters.category ||
          (client.category &&
            client.category
              .toLowerCase()
              .includes(filters.category.toLowerCase()));

        const matchesPSP =
          !filters.psp ||
          (Array.isArray(client.psps) &&
            client.psps.some(psp =>
              psp.toLowerCase().includes(filters.psp.toLowerCase())
            ));

        const matchesCurrency =
          !filters.currency ||
          (Array.isArray(client.currencies) &&
            client.currencies.some(currency =>
              currency.toLowerCase().includes(filters.currency.toLowerCase())
            ));

        return (
          matchesSearch &&
          matchesClientName &&
          matchesPaymentMethod &&
          matchesCategory &&
          matchesPSP &&
          matchesCurrency
        );
      })
    : [];

  // Clients are displayed in chronological order (newest transactions first)
  const sortedClients = filteredClients;

  // Calculate summary metrics
  const totalVolume = Array.isArray(clients)
    ? clients.reduce((sum, client) => sum + client.total_amount, 0)
    : 0;
  const totalCommissions = Array.isArray(clients)
    ? clients.reduce((sum, client) => sum + client.total_commission, 0)
    : 0;
  const totalTransactions = Array.isArray(clients)
    ? clients.reduce((sum, client) => sum + client.transaction_count, 0)
    : 0;
  const avgTransactionValue =
    totalTransactions > 0 ? totalVolume / totalTransactions : 0;

  // Calculate deposit and withdrawal metrics from transactions
  const calculateDepositWithdrawMetrics = () => {
    if (!Array.isArray(transactions)) return { totalDeposits: 0, totalWithdrawals: 0 };
    
    const deposits = transactions.filter(t => t.category === 'DEP');
    const withdrawals = transactions.filter(t => t.category === 'WD');
    
    const totalDeposits = deposits.reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalWithdrawals = withdrawals.reduce((sum, t) => sum + (t.amount || 0), 0);
    
    return { totalDeposits, totalWithdrawals };
  };

  const depositWithdrawMetrics = calculateDepositWithdrawMetrics();
  const { totalDeposits, totalWithdrawals } = depositWithdrawMetrics;

  // Calculate payment method breakdown
  const calculatePaymentMethodBreakdown = () => {
    if (!Array.isArray(transactions)) return {};
    
    const breakdown: { [key: string]: { deposits: number; withdrawals: number; total: number } } = {};
    
    transactions.forEach(transaction => {
      const method = transaction.payment_method || 'Unknown';
      
      if (!breakdown[method]) {
        breakdown[method] = { deposits: 0, withdrawals: 0, total: 0 };
      }
      
      if (transaction.category === 'DEP') {
        breakdown[method].deposits += transaction.amount || 0;
        breakdown[method].total += transaction.amount || 0;
      } else if (transaction.category === 'WD') {
        breakdown[method].withdrawals += transaction.amount || 0;
        breakdown[method].total -= transaction.amount || 0;
      }
    });
    
    return breakdown;
  };

  const paymentMethodBreakdown = calculatePaymentMethodBreakdown();

  // Calculate daily deposit and withdrawal metrics for the selected date
  const calculateDailyDepositWithdrawMetrics = (date: string) => {
    if (!Array.isArray(transactions)) return { totalDeposits: 0, totalWithdrawals: 0, transactionCount: 0, uniqueClients: 0 };
    
    const dateTransactions = transactions.filter(t => {
      const transactionDate = t.date ? t.date.split('T')[0] : null;
      return transactionDate === date;
    });
    
    const deposits = dateTransactions.filter(t => t.category === 'DEP');
    const withdrawals = dateTransactions.filter(t => t.category === 'WD');
    
    // Use original amounts since we now have automatic rate conversion from backend
    const totalDeposits = deposits.reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalWithdrawals = withdrawals.reduce((sum, t) => sum + (t.amount || 0), 0);
    
    // Calculate transaction count and unique clients from the same filtered transactions
    const transactionCount = dateTransactions.length;
    const uniqueClients = new Set(dateTransactions.map(t => t.client_name).filter(name => name)).size;
    
    return { totalDeposits, totalWithdrawals, transactionCount, uniqueClients };
  };

  // Calculate daily payment method breakdown for the selected date
  const calculateDailyPaymentMethodBreakdown = (date: string) => {
    if (!Array.isArray(transactions)) return {};
    
    const dateTransactions = transactions.filter(t => {
      const transactionDate = t.date ? t.date.split('T')[0] : null;
      return transactionDate === date;
    });
    
    const breakdown: { [key: string]: { deposits: number; withdrawals: number; total: number } } = {};
    
    dateTransactions.forEach(transaction => {
      const method = transaction.payment_method || 'Unknown';
      const amount = transaction.amount || 0; // Use original amount since we have automatic conversion
      
      if (!breakdown[method]) {
        breakdown[method] = { deposits: 0, withdrawals: 0, total: 0 };
      }
      
      if (transaction.category === 'DEP') {
        breakdown[method].deposits += amount;
        breakdown[method].total += amount;
      } else if (transaction.category === 'WD') {
        breakdown[method].withdrawals += amount;
        breakdown[method].total -= amount;
      }
    });
    
    return breakdown;
  };

  // Fetch dropdown options
  const fetchDropdownOptions = async () => {
    try {
      setLoadingDropdownOptions(true);
      const response = await api.get('/api/v1/transactions/dropdown-options');
      if (response.ok) {
        const data = await api.parseResponse(response);
        if (data) {
          // Extract just the 'value' property from each option object
          setDropdownOptions({
            currencies: (data.currency || []).map((option: any) => option.value),
            payment_methods: (data.payment_method || []).map((option: any) => option.value),
            categories: (data.category || []).map((option: any) => option.value),
            psps: (data.psp || []).map((option: any) => option.value),
            companies: (data.company || []).map((option: any) => option.value),
          });
        }
      }
    } catch (error) {
      console.error('Error fetching dropdown options:', error);
    } finally {
      setLoadingDropdownOptions(false);
    }
  };

  // Daily Summary Functions
  const fetchDailySummary = async (date: string) => {
    try {
      setDailySummaryLoading(true);
      setSelectedDate(date);
      
      const response = await api.get(`/api/summary/${date}`);
      
      if (response.ok) {
        const data = await api.parseResponse(response);
        console.log('🔍 Daily Summary Data Received:', data);
        console.log('🔍 PSP Summary Data:', data.psp_summary);
        setDailySummaryData(data);
        setShowDailySummaryModal(true);
      } else {
        // Create empty summary for dates without data
        const emptySummary: DailySummary = {
          date: date,
          date_str: new Date(date).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }),
          usd_rate: null,
          total_amount_tl: 0,
          total_amount_usd: 0,
          total_commission_tl: 0,
          total_commission_usd: 0,
          total_net_tl: 0,
          total_net_usd: 0,
          transaction_count: 0,
          unique_clients: 0,
          psp_summary: [],
          category_summary: [],
          payment_method_summary: [],
          transactions: []
        };
        setDailySummaryData(emptySummary);
        setShowDailySummaryModal(true);
      }
    } catch (error) {
      console.error('Error fetching daily summary:', error);
      // Show empty summary on error
      const emptySummary: DailySummary = {
        date: date,
        date_str: new Date(date).toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        usd_rate: null,
        total_amount_tl: 0,
        total_amount_usd: 0,
        total_commission_tl: 0,
        total_commission_usd: 0,
        total_net_tl: 0,
        total_net_usd: 0,
        transaction_count: 0,
        unique_clients: 0,
        psp_summary: [],
        category_summary: [],
        payment_method_summary: [],
        transactions: []
      };
      setDailySummaryData(emptySummary);
      setShowDailySummaryModal(true);
    } finally {
      setDailySummaryLoading(false);
    }
  };

  const closeDailySummaryModal = () => {
    setShowDailySummaryModal(false);
    setDailySummaryData(null);
    setSelectedDate('');
  };

  // Function to detect foreign currencies in daily transactions
  // const detectForeignCurrencies = (date: string): string[] => { ... }
  // Function to check if exchange rates are needed
  // const needsExchangeRates = (date: string): boolean => { ... }
  // Function to get missing exchange rates
  // const getMissingExchangeRates = (date: string): string[] => { ... }
  // Function to save exchange rates
  // const saveExchangeRates = async () => { ... }
  // Function to calculate amounts with exchange rates
  // const calculateAmountWithRates = (amount: number, currency: string): number => { ... }
  // Function to calculate daily metrics with exchange rates
  // const calculateDailyMetricsWithRates = (date: string) => { ... }

  // Chart data preparation functions
  const prepareTransactionVolumeData = () => {
    const monthlyData = transactions.reduce((acc, transaction) => {
      if (!transaction.date) return acc; // Skip transactions without dates
      
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthKey,
          deposits: 0,
          withdrawals: 0,
          net: 0,
          count: 0
        };
      }
      
      if (transaction.amount > 0) {
        acc[monthKey].deposits += transaction.amount;
      } else {
        acc[monthKey].withdrawals += Math.abs(transaction.amount);
      }
      acc[monthKey].net += transaction.amount;
      acc[monthKey].count += 1;
      
      return acc;
    }, {} as Record<string, any>);

    return Object.values(monthlyData)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6); // Last 6 months
  };

  const preparePaymentMethodChartData = () => {
    const methodData = transactions.reduce((acc, transaction) => {
      const method = transaction.payment_method || 'Unknown';
      if (!acc[method]) {
        acc[method] = { method, volume: 0, count: 0 };
      }
      acc[method].volume += Math.abs(transaction.amount);
      acc[method].count += 1;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(methodData)
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 5); // Top 5 methods
  };

  const prepareClientPerformanceData = () => {
    return clients
      .map(client => ({
        name: client.client_name,
        volume: client.total_amount,
        transactions: client.transaction_count,
        avgTransaction: client.avg_transaction,
        commission: client.total_commission
      }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 10); // Top 10 clients
  };

  const prepareCurrencyDistributionData = () => {
    const currencyData = transactions.reduce((acc, transaction) => {
      const currency = transaction.currency || 'Unknown';
      if (!acc[currency]) {
        acc[currency] = { currency, volume: 0, count: 0 };
      }
      acc[currency].volume += Math.abs(transaction.amount);
      acc[currency].count += 1;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(currencyData)
      .sort((a, b) => b.volume - a.volume);
  };

  const preparePSPPerformanceData = () => {
    const pspData = transactions.reduce((acc, transaction) => {
      const psp = transaction.psp || 'Unknown';
      if (!acc[psp]) {
        acc[psp] = { psp, volume: 0, count: 0, success: 0 };
      }
      acc[psp].volume += Math.abs(transaction.amount);
      acc[psp].count += 1;
      // Assume successful if amount is not zero
      if (transaction.amount !== 0) {
        acc[psp].success += 1;
      }
      return acc;
    }, {} as Record<string, any>);

    return Object.values(pspData)
      .map(item => ({
        ...item,
        successRate: item.count > 0 ? (item.success / item.count) * 100 : 0
      }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 5); // Top 5 PSPs
  };

  // Chart colors
  const chartColors = {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#06b6d4',
    light: '#f3f4f6',
    dark: '#1f2937'
  };

  const pieChartColors = [
    chartColors.primary,
    chartColors.secondary,
    chartColors.success,
    chartColors.warning,
    chartColors.danger,
    chartColors.info
  ];

  // Loading state
  if (authLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600 mx-auto'></div>
          <p className='mt-4 text-gray-600'>Loading clients...</p>
        </div>
      </div>
    );
  }

  const fetchClientTransactions = async (clientName: string) => {
    if (clientTransactions[clientName]) return; // Already loaded
    
    setLoadingClientTransactions(prev => ({ ...prev, [clientName]: true }));
    
    try {
      const params = new URLSearchParams();
      params.append('client', clientName);
      params.append('per_page', '100'); // Get all transactions for this client
      
      const response = await api.get(`/api/v1/transactions/?${params.toString()}`);
      
      if (response.ok) {
        const data = await api.parseResponse(response);
        if (data?.transactions) {
          setClientTransactions(prev => ({ ...prev, [clientName]: data.transactions }));
        }
      }
    } catch (error) {
      console.error('Error fetching client transactions:', error);
    } finally {
      setLoadingClientTransactions(prev => ({ ...prev, [clientName]: false }));
    }
  };

  const toggleClientExpansion = (clientName: string) => {
    const newExpanded = new Set(expandedClients);
    if (newExpanded.has(clientName)) {
      newExpanded.delete(clientName);
    } else {
      newExpanded.add(clientName);
      fetchClientTransactions(clientName);
    }
    setExpandedClients(newExpanded);
  };

  const renderGroupedTransactions = () => {
    const groupedTransactions = groupTransactionsByDate(transactions);

    if (groupedTransactions.length === 0) {
      return (
        <div className='p-8 text-center text-gray-500'>
          No transactions to group by date
        </div>
      );
    }

    return groupedTransactions.map((dateGroup, groupIndex) => (
      <div key={dateGroup.dateKey} className='border-b border-gray-100 last:border-b-0'>
        {/* Date Header */}
        <div className='px-6 py-4 bg-gradient-to-r from-blue-50/50 to-purple-50/50 border-b border-gray-100'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm'>
                <Calendar className='h-4 w-4 text-white' />
              </div>
              <div>
                <h4 className='text-lg font-bold text-gray-800'>
                  {formatDateHeader(dateGroup.date)}
                </h4>
                <p className='text-xs text-gray-500'>
                  {dateGroup.transactions.length} transaction{dateGroup.transactions.length !== 1 ? 's' : ''} • {formatCurrency(dateGroup.transactions.reduce((sum, t) => sum + (t.amount || 0), 0), '₺')} total
                </p>
              </div>
            </div>
            <div className='flex items-center gap-3'>
              <button
                onClick={() => fetchDailySummary(dateGroup.date)}
                disabled={dailySummaryLoading}
                className='inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-600 text-white text-xs font-medium rounded-lg hover:from-purple-600 hover:to-pink-700 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                <BarChart className='h-3 w-3' />
                {dailySummaryLoading && selectedDate === dateGroup.date ? 'Loading...' : 'Summary'}
              </button>
              <div className='bg-white px-3 py-1 rounded-lg border border-gray-200 shadow-sm'>
                <span className='text-sm font-medium text-gray-700'>
                  {dateGroup.transactions.length} transaction{dateGroup.transactions.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions Table for this date */}
        <div className='overflow-x-auto border border-gray-200 rounded-lg bg-white shadow-sm'>
          <table className='min-w-full divide-y divide-gray-200' style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead className='bg-gray-50'>
              <tr>
                <th className='px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-1/12 border-b border-gray-200'>
                  Client
                </th>
                <th className='px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-1/12 border-b border-gray-200'>
                  Company
                </th>

                <th className='px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-1/12 border-b border-gray-200'>
                  Payment Method
                </th>
                <th className='px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-1/12 border-b border-gray-200'>
                  Category
                </th>
                <th className='px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider w-1/12 border-b border-gray-200'>
                  Amount
                </th>
                <th className='px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider w-1/12 border-b border-gray-200'>
                  Commission
                </th>
                <th className='px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider w-1/12 border-b border-gray-200'>
                  Net Amount
                </th>
                <th className='px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-1/12 border-b border-gray-200'>
                  Currency
                </th>
                <th className='px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-1/12 border-b border-gray-200'>
                  PSP
                </th>
                <th className='px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-1/12 border-b border-gray-200'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-200'>
              {dateGroup.transactions.map((transaction) => (
                <tr key={transaction.id} className='hover:bg-gray-50 transition-colors duration-200'>
                  <td className='px-6 py-4 whitespace-nowrap border-b border-gray-100'>
                    <div className='flex items-center'>
                      <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3'>
                        <User className='h-4 w-4 text-blue-600' />
                      </div>
                      <div className='text-sm font-medium text-gray-900'>
                        {transaction.client_name || 'Unknown'}
                      </div>
                    </div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b border-gray-100'>
                    {transaction.company || 'N/A'}
                  </td>

                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b border-gray-100'>
                    {transaction.payment_method || 'N/A'}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b border-gray-100'>
                    {transaction.category || 'N/A'}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right border-b border-gray-100'>
                    {formatCurrency(transaction.amount || 0, transaction.currency)}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 text-right border-b border-gray-100'>
                    {formatCurrency(transaction.commission || 0, transaction.currency)}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600 text-right border-b border-gray-100'>
                    {formatCurrency(transaction.net_amount || 0, transaction.currency)}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b border-gray-100'>
                    {transaction.currency || 'N/A'}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b border-gray-100'>
                    {transaction.psp || 'N/A'}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-center border-b border-gray-100'>
                    <div className='flex items-center justify-center gap-1'>
                      <button
                        onClick={() => handleViewTransaction(transaction)}
                        className='text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded transition-colors duration-200'
                        title='View Details'
                      >
                        <Eye className='h-3 w-3' />
                      </button>
                      <button
                        onClick={() => handleEditTransaction(transaction)}
                        className='text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded transition-colors duration-200'
                        title='Edit Transaction'
                      >
                        <Edit className='h-3 w-3' />
                      </button>
                      <button
                        onClick={() => handleDeleteTransaction(transaction)}
                        className='text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded transition-colors duration-200'
                        title='Delete Transaction'
                      >
                        <Trash2 className='h-3 w-3' />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    ));
  };

  // Template download function
  const downloadTemplate = (type: 'essential' | 'full', format: 'csv' | 'xlsx') => {
    if (type === 'essential') {
      if (format === 'csv') {
        // Download essential CSV template
        const csvContent = `Client,Company,Payment Method,Category,Amount,Currency,PSP,Date
John Doe,ABC Corporation,Credit Card,DEP,1000.50,USD,Stripe,2025-08-18
Jane Smith,XYZ Ltd,Bank Transfer,WIT,2500.00,EUR,PayPal,2025-08-19
Mike Johnson,Global Inc,TR1122334455,Wire Transfer,DEP,5000.00,GBP,Bank of America,2025-08-20`;
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'essential_transaction_template.csv';
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        // Download essential Excel template
        const essentialData = [
          ['Client', 'Company', 'Payment Method', 'Category', 'Amount', 'Currency', 'PSP', 'Date'],
          ['John Doe', 'ABC Corporation', 'Credit Card', 'DEP', 1000.50, 'USD', 'Stripe', '2025-08-18'],
          ['Jane Smith', 'XYZ Ltd', 'Bank Transfer', 'WIT', 2500.00, 'EUR', 'PayPal', '2025-08-19'],
          ['Mike Johnson', 'Global Inc', 'TR1122334455', 'Wire Transfer', 'DEP', 5000.00, 'GBP', 'Bank of America', '2025-08-20']
        ];
        
        const worksheet = XLSX.utils.aoa_to_sheet(essentialData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
        
        XLSX.writeFile(workbook, 'essential_transaction_template.xlsx');
      }
    } else {
      if (format === 'csv') {
        // Download full CSV template
        const csvContent = `Client,Company,Payment Method,Category,Amount,Commission,Net Amount,Currency,PSP,Date,Notes
John Doe,ABC Corporation,Credit Card,DEP,1000.50,25.00,975.50,USD,Stripe,2025-08-18,Monthly payment
Jane Smith,XYZ Ltd,Bank Transfer,WIT,2500.00,50.00,2450.00,EUR,PayPal,2025-08-19,Quarterly transfer
Mike Johnson,Global Inc,TR1122334455,Wire Transfer,DEP,5000.00,100.00,4900.00,GBP,Bank of America,2025-08-20,Annual deposit`;
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'full_transaction_template.csv';
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        // Download full Excel template
        const fullData = [
          ['Client', 'Company', 'Payment Method', 'Category', 'Amount', 'Commission', 'Net Amount', 'Currency', 'PSP', 'Date', 'Notes'],
          ['John Doe', 'ABC Corporation', 'Credit Card', 'DEP', 1000.50, 25.00, 975.50, 'USD', 'Stripe', '2025-08-18', 'Monthly payment'],
          ['Jane Smith', 'XYZ Ltd', 'Bank Transfer', 'WIT', 2500.00, 50.00, 2450.00, 'EUR', 'PayPal', '2025-08-19', 'Quarterly transfer'],
          ['Mike Johnson', 'Global Inc', 'TR1122334455', 'Wire Transfer', 'DEP', 5000.00, 100.00, 4900.00, 'GBP', 'Bank of America', '2025-08-20', 'Annual deposit']
        ];
        
        const worksheet = XLSX.utils.aoa_to_sheet(fullData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
        
        XLSX.writeFile(workbook, 'full_transaction_template.xlsx');
      }
    }
  };

  return (
    <div className='space-y-8'>
      {/* Enhanced Header */}
      <PageHeader
        title={t('clients.title')}
        subtitle={t('clients.description')}
        actions={
          <div className='flex items-center gap-3'>
            <Button 
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="flex items-center gap-2"
            >
              <Download className='h-4 w-4' />
              {t('clients.export')}
            </Button>
            <Button 
              variant="outline"
              size="sm"
              onClick={triggerFileInput}
              disabled={importing}
              className="flex items-center gap-2 bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
            >
              <Upload className='h-4 w-4' />
              {importing ? 'Importing...' : 'Import'}
            </Button>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => setShowImportGuide(true)}
              className="flex items-center gap-2 bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              <Info className='h-4 w-4' />
              Guide
            </Button>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => setShowBulkDeleteModal(true)}
              className="flex items-center gap-2 bg-red-50 border-red-300 text-red-700 hover:bg-red-100"
            >
              <Trash2 className='h-4 w-4' />
              Bulk
            </Button>
            <Button 
              variant="primary"
              size="sm"
              onClick={() => navigate('/transactions/add')}
              className="flex items-center gap-2"
            >
              <Plus className='h-4 w-4' />
              Add Transaction
            </Button>
          </div>
        }
      />

      

      {/* Status Indicators */}
      <div className="bg-blue-50/50 border border-blue-200/60 rounded-xl p-4">
        <div className='flex items-center gap-6 text-sm text-blue-700'>
          <div className='flex items-center gap-2'>
            <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                            <span className="font-medium">{t('dashboard.active_clients')}: {clients.length}</span>
          </div>
          <div className='flex items-center gap-2'>
            <div className='w-2 h-2 bg-blue-500 rounded-full'></div>
            <span className="font-medium">Total Volume: {formatCurrency(totalVolume, '₺')}</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      {/* Enhanced Tab Navigation */}
      <div className='bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden'>
        <div className='bg-gradient-to-r from-gray-50 to-gray-100/50 px-6 py-2'>
          <nav className='flex space-x-1'>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-3 rounded-xl font-medium text-sm transition-all duration-200 flex items-center gap-2 ${
                  activeTab === 'overview'
                    ? 'bg-white text-blue-600 shadow-md border border-gray-200'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                }`}
              >
                  <BarChart3 className='h-4 w-4' />
                  Overview
              </button>
              {activeTab === 'overview' && (
                <button
                  onClick={() => {
                    fetchClients();
                    fetchDropdownOptions();
                  }}
                  disabled={loading}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white/60 rounded-lg transition-all duration-200 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  title={loading ? 'Refreshing...' : 'Refresh Overview data'}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('clients')}
                className={`px-6 py-3 rounded-xl font-medium text-sm transition-all duration-200 flex items-center gap-2 ${
                  activeTab === 'clients'
                    ? 'bg-white text-blue-600 shadow-md border border-gray-200'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                }`}
              >
                  <Users className='h-4 w-4' />
                  Clients
              </button>
              {activeTab === 'clients' && (
                <button
                  onClick={() => {
                    fetchClients();
                  }}
                  disabled={loading}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white/60 rounded-lg transition-all duration-200 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  title={loading ? 'Refreshing...' : 'Refresh Clients data'}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('transactions')}
                className={`px-6 py-3 rounded-xl font-medium text-sm transition-all duration-200 flex items-center gap-2 ${
                  activeTab === 'transactions'
                    ? 'bg-white text-blue-600 shadow-md border border-gray-200'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                }`}
              >
                  <FileText className='h-4 w-4' />
                  Transactions
              </button>
              {activeTab === 'transactions' && (
                <button
                  onClick={() => {
                    fetchTransactions();
                  }}
                  disabled={loading}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white/60 rounded-lg transition-all duration-200 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  title={loading ? 'Refreshing...' : 'Refresh Transactions data'}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-6 py-3 rounded-xl font-medium text-sm transition-all duration-200 flex items-center gap-2 ${
                  activeTab === 'analytics'
                    ? 'bg-white text-blue-600 shadow-md border border-gray-200'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                }`}
              >
                  <LineChart className='h-4 w-4' />
                  Analytics
              </button>
              {activeTab === 'analytics' && (
                <button
                  onClick={() => {
                    fetchClients();
                    fetchTransactions();
                  }}
                  disabled={loading}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white/60 rounded-lg transition-all duration-200 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  title={loading ? 'Refreshing...' : 'Refresh Analytics data'}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              )}
            </div>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className='space-y-6'>
          {/* Professional Financial Metrics Section */}
          <Section title="Financial Overview" subtitle="Key financial metrics and transaction summaries">
            <CardGrid cols={3} gap="lg">
              {/* Total Withdrawals */}
              <div className='bg-gradient-to-br from-red-50 to-red-100/50 rounded-2xl p-6 shadow-sm border border-red-200 hover:shadow-md transition-all duration-200 group'>
                <div className='flex items-center justify-between'>
                  <div className='space-y-2'>
                    <p className='text-sm font-medium text-red-700'>
                      Total Withdrawals
                    </p>
                    <p className='text-3xl font-bold text-red-900'>
                      {formatCurrency(totalWithdrawals, '₺')}
                    </p>
                    <div className='flex items-center gap-1 text-xs text-red-600'>
                      <TrendingUp className='h-3 w-3 rotate-180' />
                      <span>WD Transactions</span>
                    </div>
                  </div>
                  <div className='p-4 bg-white/80 rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-200'>
                    <TrendingUp className='h-7 w-7 text-red-600 rotate-180' />
                  </div>
                </div>
              </div>

              {/* Net Flow */}
              <div className='bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-6 shadow-sm border border-blue-200 hover:shadow-md transition-all duration-200 group'>
                <div className='flex items-center justify-between'>
                  <div className='space-y-2'>
                    <p className='text-sm font-medium text-blue-700'>
                      Net Flow
                    </p>
                    <p className={`text-3xl font-bold ${totalDeposits - totalWithdrawals >= 0 ? 'text-blue-900' : 'text-red-600'}`}>
                      {formatCurrency(totalDeposits - totalWithdrawals, '₺')}
                    </p>
                    <div className='flex items-center gap-1 text-xs text-blue-600'>
                      <Activity className='h-3 w-3' />
                      <span>Deposits - Withdrawals</span>
                    </div>
                  </div>
                  <div className='p-4 bg-white/80 rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-200'>
                    <Activity className='h-7 w-7 text-blue-600' />
                  </div>
                </div>
              </div>

              {/* Total Transactions */}
              <div className='bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl p-6 shadow-sm border border-purple-200 hover:shadow-md transition-all duration-200 group'>
                <div className='flex items-center justify-between'>
                  <div className='space-y-2'>
                    <p className='text-sm font-medium text-purple-700'>
                      {t('dashboard.total_transactions')}
                    </p>
                    <p className='text-3xl font-bold text-purple-900'>
                      {totalTransactions.toLocaleString()}
                    </p>
                    <div className='flex items-center gap-1 text-xs text-purple-600'>
                      <CreditCard className='h-3 w-3' />
                      <span>All Categories</span>
                    </div>
                  </div>
                  <div className='p-4 bg-white/80 rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-200'>
                    <CreditCard className='h-7 w-7 text-purple-600' />
                  </div>
                </div>
              </div>
            </CardGrid>
          </Section>

          {/* Client Distribution and Top Performers */}
          <Section title="Client Insights" subtitle="Distribution analysis and top performing clients">
            <CardGrid cols={2} gap="lg">
              <div className='bg-white rounded-xl p-6 shadow-sm border border-gray-100'>
                <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                  Client Distribution
                </h3>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-gray-600'>{t('dashboard.active_clients')}</span>
                    <span className='text-lg font-semibold text-gray-900'>
                      {clients.length}
                    </span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-gray-600'>
                      Active Clients
                    </span>
                    <span className='text-lg font-semibold text-gray-900'>
                      {clients.length}
                    </span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-gray-600'>
                      Multi-Currency Clients
                    </span>
                    <span className='text-lg font-semibold text-gray-900'>
                      {
                        clients.filter(
                          c =>
                            Array.isArray(c.currencies) && c.currencies.length > 1
                        ).length
                      }
                    </span>
                  </div>
                </div>
              </div>

              <div className='bg-white rounded-xl p-6 shadow-sm border border-gray-100'>
                <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                  Top Performers
                </h3>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-gray-600'>
                      Highest Volume Client
                    </span>
                    <span className='text-sm font-medium text-gray-900'>
                      {clients.length > 0
                        ? clients.reduce((max, client) =>
                            client.total_amount > max.total_amount ? client : max
                          ).client_name
                        : 'N/A'}
                    </span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-gray-600'>
                      Most Transactions
                    </span>
                    <span className='text-sm font-medium text-gray-900'>
                      {clients.length > 0
                        ? clients.reduce((max, client) =>
                            client.transaction_count > max.transaction_count
                              ? client
                              : max
                          ).client_name
                        : 'N/A'}
                    </span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-gray-600'>
                      Highest Avg Transaction
                    </span>
                    <span className='text-sm font-medium text-gray-900'>
                      {clients.length > 0
                        ? clients.reduce((max, client) =>
                            client.avg_transaction > max.avg_transaction
                              ? client
                              : max
                        ).client_name
                      : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </CardGrid>
          </Section>

          {/* Payment Method Breakdown */}
          <Section title="Payment Method Analysis" subtitle="Deposits and withdrawals by payment method">
            {Object.keys(paymentMethodBreakdown).length > 0 ? (
              <div className='space-y-4'>
                {Object.entries(paymentMethodBreakdown)
                  .sort(([, a], [, b]) => Math.abs(b.total) - Math.abs(a.total))
                  .map(([method, data]) => (
                    <div key={method} className='bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors duration-200'>
                      <div className='flex items-center justify-between mb-3'>
                        <h4 className='text-lg font-semibold text-gray-900'>
                          {method}
                        </h4>
                        <div className={`text-lg font-bold ${data.total >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {formatCurrency(Math.abs(data.total), '₺')}
                        </div>
                      </div>
                      
                      <div className='grid grid-cols-2 gap-4'>
                        <div className='bg-white rounded-lg p-3 border border-emerald-200'>
                          <div className='flex items-center gap-2 mb-1'>
                            <TrendingUp className='h-4 w-4 text-emerald-600' />
                            <span className='text-sm font-medium text-emerald-700'>Deposits</span>
                          </div>
                          <div className='text-lg font-bold text-emerald-900'>
                            {formatCurrency(data.deposits, '₺')}
                          </div>
                        </div>
                        
                        <div className='bg-white rounded-lg p-3 border border-red-200'>
                          <div className='flex items-center gap-2 mb-1'>
                            <TrendingUp className='h-4 w-4 text-red-600 rotate-180' />
                            <span className='text-sm font-medium text-red-700'>Withdrawals</span>
                          </div>
                          <div className='text-lg font-bold text-red-900'>
                            {formatCurrency(data.withdrawals, '₺')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className='text-center py-8'>
                <CreditCard className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                <p className='text-gray-500'>No payment method data available</p>
              </div>
            )}
          </Section>

        </div>
      )}

      {activeTab === 'transactions' && (
        <ContentArea>
          {/* Transactions Header Section */}
          <Section title="Transaction Management" subtitle="Complete overview of all transaction records">
            
            {/* Category Filter */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-4">
                <label htmlFor="categoryFilter" className="text-sm font-medium text-gray-700">
                  Category Filter:
                </label>
                <select
                  id="categoryFilter"
                  value={filters.category}
                  onChange={(e) => {
                    setFilters(prev => ({ ...prev, category: e.target.value }));
                    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
                  }}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Categories</option>
                  <option value="DEP">Deposits (DEP)</option>
                  <option value="WD">Withdrawals (WD)</option>
                  <option value="WIT">Withdrawals (WIT)</option>
                </select>
                
                {/* Clear Filters Button */}
                {filters.category && (
                  <button
                    onClick={() => {
                      setFilters(prev => ({ ...prev, category: '' }));
                      setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                    className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors duration-200"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            </div>
            {loading ? (
              <div className='p-12 text-center'>
                <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
                <p className='text-gray-600 text-lg'>Loading transactions...</p>
              </div>
            ) : error ? (
              <div className='p-12 text-center'>
                <div className='text-red-500 mb-4'>
                  <AlertCircle className='h-16 w-16 mx-auto' />
                </div>
                <h3 className='text-xl font-semibold text-gray-900 mb-2'>
                  Error Loading Transactions
                </h3>
                <p className='text-gray-600 mb-6'>{error}</p>
                <Button
                  variant="primary"
                  onClick={fetchTransactions}
                  className="flex items-center gap-2"
                >
                  Try Again
                </Button>
              </div>
            ) : transactions.length === 0 ? (
              <div className='p-12 text-center'>
                <div className='text-gray-400 mb-4'>
                  <FileText className='h-16 w-16 mx-auto' />
                </div>
                <h3 className='text-xl font-semibold text-gray-900 mb-2'>
                  No Transactions Found
                </h3>
                <p className='text-gray-600'>
                  No transactions are currently available.
                </p>
              </div>
            ) : (
              <div className='overflow-x-auto'>
                {renderGroupedTransactions()}

                {/* Summary Footer */}
                <div className='px-6 py-4 border-t border-gray-200 bg-gray-50'>
                  <div className='flex items-center justify-between text-sm text-gray-700'>
                    <div className='flex items-center gap-4'>
                      <span className='font-medium'>
                        {transactions.length} {t('dashboard.total_transactions').toLowerCase()}
                      </span>
                      <span className='text-gray-500'>
                        across {groupTransactionsByDate(transactions).length} date{groupTransactionsByDate(transactions).length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <span className='font-semibold text-gray-900'>
                      Total: {formatCurrency(
                        transactions.reduce((sum, t) => sum + (t.amount || 0), 0),
                        'TL'
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className='px-6 py-4 border-t border-gray-200 bg-gray-50'>
                <div className='flex items-center justify-between'>
                  <div className='text-sm text-gray-700'>
                    Showing page {pagination.page} of {pagination.pages} • {pagination.total} {t('dashboard.total_transactions').toLowerCase()}
                  </div>
                  <div className='flex items-center gap-4'>
                    {/* Page Size Selector */}
                    <div className='flex items-center gap-2'>
                      <label htmlFor="pageSize" className='text-sm text-gray-600'>Show:</label>
                      <select
                        id="pageSize"
                        value={pagination.per_page}
                        onChange={(e) => {
                          const newSize = parseInt(e.target.value);
                          setPagination(prev => ({ 
                            ...prev, 
                            per_page: newSize, 
                            page: 1 // Reset to first page when changing page size
                          }));
                        }}
                        className='px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      >
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value={200}>200</option>
                        <option value={500}>500</option>
                      </select>
                      <span className='text-sm text-gray-500'>per page</span>
                    </div>
                    
                    {/* Navigation Buttons */}
                    <div className='flex items-center gap-2'>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (pagination.page > 1) {
                            setPagination(prev => ({ ...prev, page: prev.page - 1 }));
                          }
                        }}
                        disabled={pagination.page <= 1}
                        className="flex items-center gap-2"
                      >
                        Previous
                      </Button>
                      <span className='px-3 py-2 text-sm text-gray-700'>
                        {pagination.page} / {pagination.pages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (pagination.page < pagination.pages) {
                            setPagination(prev => ({ ...prev, page: prev.page + 1 }));
                          }
                        }}
                        disabled={pagination.page >= pagination.pages}
                        className="flex items-center gap-2"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Section>
        </ContentArea>
      )}

      {activeTab === 'analytics' && (
        <ContentArea>
          {/* Analytics Overview Section */}
          <Section title="Analytics Overview" subtitle="Comprehensive financial and performance insights">
            {/* Professional Charts Section */}
            <CardGrid cols={2} gap="lg">
              {/* Transaction Volume Trend Chart */}
              <div className='bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200'>
                <div className='flex items-center justify-between mb-6'>
                  <h3 className='text-lg font-semibold text-gray-900'>Transaction Volume Trend</h3>
                  <div className='flex items-center gap-2 text-sm text-gray-500'>
                    <div className='w-3 h-3 bg-emerald-500 rounded-full'></div>
                    <span>Deposits</span>
                    <div className='w-3 h-3 bg-red-500 rounded-full'></div>
                    <span>Withdrawals</span>
                  </div>
                </div>
                <div className='h-64'>
                  <ResponsiveContainer width='100%' height='100%'>
                    <RechartsLineChart data={prepareTransactionVolumeData()}>
                      <CartesianGrid strokeDasharray='3 3' stroke='#f3f4f6' />
                      <XAxis 
                        dataKey='month' 
                        stroke='#6b7280'
                        fontSize={12}
                        tickFormatter={(value) => {
                          const [year, month] = value.split('-');
                          return `${month}/${year.slice(2)}`;
                        }}
                      />
                      <YAxis 
                        stroke='#6b7280'
                        fontSize={12}
                        tickFormatter={(value) => formatCurrency(value, '₺')}
                      />
                      <Tooltip 
                        formatter={(value: any) => [formatCurrency(value, '₺'), '']}
                        labelFormatter={(label) => {
                          const [year, month] = label.split('-');
                          return `${month}/${year}`;
                        }}
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Line 
                        type='monotone' 
                        dataKey='deposits' 
                        stroke={chartColors.success} 
                        strokeWidth={3}
                        dot={{ fill: chartColors.success, strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: chartColors.success, strokeWidth: 2 }}
                      />
                      <Line 
                        type='monotone' 
                        dataKey='withdrawals' 
                        stroke={chartColors.danger} 
                        strokeWidth={3}
                        dot={{ fill: chartColors.danger, strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: chartColors.danger, strokeWidth: 2 }}
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Payment Method Distribution Chart */}
              <div className='bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200'>
                <div className='flex items-center justify-between mb-6'>
                  <h3 className='text-lg font-semibold text-gray-900'>Payment Method Distribution</h3>
                  <div className='text-sm text-gray-500'>Volume by Method</div>
                </div>
                <div className='h-64'>
                  <ResponsiveContainer width='100%' height='100%'>
                    <RechartsPieChart>
                      <Pie
                        data={preparePaymentMethodChartData()}
                        cx='50%'
                        cy='50%'
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey='volume'
                      >
                        {preparePaymentMethodChartData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={pieChartColors[index % pieChartColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any) => [formatCurrency(value, '₺'), 'Volume']}
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Legend 
                        verticalAlign='bottom' 
                        height={36}
                        formatter={(value) => <span className='text-sm text-gray-700'>{value}</span>}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardGrid>
          </Section>

          {/* Client Performance and Currency Charts Section */}
          <Section title="Client & Currency Analysis" subtitle="Performance metrics and distribution analysis">
            <CardGrid cols={2} gap="lg">
              {/* Top Client Performance Chart */}
              <div className='bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200'>
                <div className='flex items-center justify-between mb-6'>
                  <h3 className='text-lg font-semibold text-gray-900'>Top Client Performance</h3>
                  <div className='text-sm text-gray-500'>Volume by Client</div>
                </div>
                <div className='h-64'>
                  <ResponsiveContainer width='100%' height='100%'>
                    <RechartsBarChart data={prepareClientPerformanceData()}>
                      <CartesianGrid strokeDasharray='3 3' stroke='#f3f4f6' />
                      <XAxis 
                        dataKey='name' 
                        stroke='#6b7280'
                        fontSize={10}
                        angle={-45}
                        textAnchor='end'
                        height={80}
                        tickFormatter={(value) => value.length > 12 ? value.substring(0, 12) + '...' : value}
                      />
                      <YAxis 
                        stroke='#6b7280'
                        fontSize={12}
                        tickFormatter={(value) => formatCurrency(value, '₺')}
                      />
                      <Tooltip 
                        formatter={(value: any) => [formatCurrency(value, '₺'), 'Volume']}
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Bar 
                        dataKey='volume' 
                        fill={chartColors.primary}
                        radius={[4, 4, 0, 0]}
                      />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Currency Distribution Chart */}
              <div className='bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200'>
                <div className='flex items-center justify-between mb-6'>
                  <h3 className='text-lg font-semibold text-gray-900'>Currency Distribution</h3>
                  <div className='text-sm text-gray-500'>Volume by Currency</div>
                </div>
                <div className='h-64'>
                  <ResponsiveContainer width='100%' height='100%'>
                    <RechartsBarChart data={prepareCurrencyDistributionData()}>
                      <CartesianGrid strokeDasharray='3 3' stroke='#f3f4f6' />
                      <XAxis 
                        dataKey='currency' 
                        stroke='#6b7280'
                        fontSize={12}
                      />
                      <YAxis 
                        stroke='#6b7280'
                        fontSize={12}
                        tickFormatter={(value) => formatCurrency(value, '₺')}
                      />
                      <Tooltip 
                        formatter={(value: any) => [formatCurrency(value, '₺'), 'Volume']}
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Bar 
                        dataKey='volume' 
                        fill={chartColors.secondary}
                        radius={[4, 4, 0, 0]}
                      />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardGrid>
          </Section>

          {/* PSP Performance and Recent Activity Section */}
          <Section title="PSP Performance & Activity" subtitle="Provider performance metrics and client activity insights">
            <CardGrid cols={2} gap="lg">
              {/* PSP Performance Chart */}
              <div className='bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200'>
                <div className='flex items-center justify-between mb-6'>
                  <h3 className='text-lg font-semibold text-gray-900'>PSP Performance</h3>
                  <div className='text-sm text-gray-500'>Volume & Success Rate</div>
                </div>
                <div className='h-64'>
                  <ResponsiveContainer width='100%' height='100%'>
                    <ComposedChart data={preparePSPPerformanceData()}>
                      <CartesianGrid strokeDasharray='3 3' stroke='#f3f4f6' />
                      <XAxis 
                        dataKey='psp' 
                        stroke='#6b7280'
                        fontSize={10}
                        angle={-45}
                        textAnchor='end'
                        height={80}
                      />
                      <YAxis 
                        stroke='#6b7280'
                        fontSize={12}
                        tickFormatter={(value) => formatCurrency(value, '₺')}
                      />
                      <Tooltip 
                        formatter={(value: any, name: string) => [
                          name === 'volume' ? formatCurrency(value, '₺') : `${value.toFixed(1)}%`,
                          name === 'volume' ? 'Volume' : 'Success Rate'
                        ]}
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Bar 
                        dataKey='volume' 
                        fill={chartColors.info}
                        radius={[4, 4, 0, 0]}
                      />
                      <Line 
                        type='monotone' 
                        dataKey='successRate' 
                        stroke={chartColors.warning} 
                        strokeWidth={3}
                        dot={{ fill: chartColors.warning, strokeWidth: 2, r: 4 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recent Client Activity */}
              <div className='bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200'>
                <div className='flex items-center justify-between mb-6'>
                  <h3 className='text-lg font-semibold text-gray-900'>Recent Client Activity</h3>
                  <div className='text-sm text-gray-500'>Last 5 {t('dashboard.active_clients')}</div>
                </div>
                <div className='space-y-4'>
                  {clients
                    .filter(client => client.last_transaction)
                    .sort((a, b) => new Date(b.last_transaction).getTime() - new Date(a.last_transaction).getTime())
                    .slice(0, 5)
                    .map((client, index) => (
                      <div key={client.client_name} className='flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200'>
                        <div className='flex items-center gap-4'>
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
                            index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                            index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400' :
                            index === 2 ? 'bg-gradient-to-br from-amber-600 to-yellow-600' :
                            'bg-gradient-to-br from-blue-400 to-purple-500'
                          }`}>
                            <User className='h-5 w-5 text-white' />
                          </div>
                          <div>
                            <p className='text-sm font-semibold text-gray-900'>{client.client_name}</p>
                            <p className='text-xs text-gray-500'>Last: {formatDate(client.last_transaction)}</p>
                          </div>
                        </div>
                        <div className='text-right'>
                          <p className='text-sm font-bold text-gray-900'>{formatCurrency(client.total_amount, '₺')}</p>
                          <p className='text-xs text-gray-500'>{client.transaction_count} transactions</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </CardGrid>
          </Section>
        </ContentArea>
      )}

      {/* View Client Modal */}
      {showViewModal && selectedClient && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
            <div className='p-6 border-b border-gray-100'>
              <div className='flex items-center justify-between'>
                <h3 className='text-xl font-semibold text-gray-900'>
                  Client Details
                </h3>
                <button
                  onClick={closeModal}
                  className='p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200'
                >
                  <X className='h-5 w-5' />
                </button>
              </div>
            </div>
            <div className='p-6 space-y-6'>
              {/* Client Info */}
              <div className='flex items-center gap-4'>
                <div className='w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center'>
                  <User className='h-8 w-8 text-accent-600' />
                </div>
                <div>
                  <h4 className='text-xl font-semibold text-gray-900'>
                    {selectedClient.client_name}
                  </h4>
                  <p className='text-gray-600'>
                    {selectedClient.company_name || 'No Company'}
                  </p>
                </div>
              </div>

              {/* Financial Summary */}
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div className='bg-gray-50 rounded-lg p-4'>
                  <p className='text-sm text-gray-600'>Total Volume</p>
                  <p className='text-xl font-bold text-gray-900'>
                    {(() => {
                      const primaryCurrency =
                        Array.isArray(selectedClient.currencies) &&
                        selectedClient.currencies.length > 0
                          ? selectedClient.currencies[0]
                          : 'USD';
                      return formatCurrency(
                        selectedClient.total_amount,
                        primaryCurrency
                      );
                    })()}
                  </p>
                </div>
                <div className='bg-gray-50 rounded-lg p-4'>
                  <p className='text-sm text-gray-600'>Commissions</p>
                  <p className='text-xl font-bold text-success-600'>
                    {(() => {
                      const primaryCurrency =
                        Array.isArray(selectedClient.currencies) &&
                        selectedClient.currencies.length > 0
                          ? selectedClient.currencies[0]
                          : 'USD';
                      return formatCurrency(
                        selectedClient.total_commission,
                        primaryCurrency
                      );
                    })()}
                  </p>
                </div>
                <div className='bg-gray-50 rounded-lg p-4'>
                  <p className='text-sm text-gray-600'>Net Amount</p>
                  <p className='text-xl font-bold text-accent-600'>
                    {(() => {
                      const primaryCurrency =
                        Array.isArray(selectedClient.currencies) &&
                        selectedClient.currencies.length > 0
                          ? selectedClient.currencies[0]
                          : 'USD';
                      return formatCurrency(
                        selectedClient.total_net,
                        primaryCurrency
                      );
                    })()}
                  </p>
                </div>
              </div>

              {/* Transaction Details */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='bg-gray-50 rounded-lg p-4'>
                  <p className='text-sm text-gray-600'>Transaction Count</p>
                  <p className='text-2xl font-bold text-gray-900'>
                    {selectedClient.transaction_count}
                  </p>
                </div>
                <div className='bg-gray-50 rounded-lg p-4'>
                  <p className='text-sm text-gray-600'>Average Transaction</p>
                  <p className='text-2xl font-bold text-gray-900'>
                    {(() => {
                      const primaryCurrency =
                        Array.isArray(selectedClient.currencies) &&
                        selectedClient.currencies.length > 0
                          ? selectedClient.currencies[0]
                          : 'USD';
                      return formatCurrency(
                        selectedClient.avg_transaction,
                        primaryCurrency
                      );
                    })()}
                  </p>
                </div>
              </div>

              {/* Additional Details */}
              <div className='space-y-4'>
                {selectedClient.payment_method && (
                  <div className='flex items-center gap-3'>
                    <Globe className='h-5 w-5 text-gray-400' />
                    <div>
                      <p className='text-sm font-medium text-gray-900'>
                        Payment Method
                      </p>
                      <p className='text-sm text-gray-600'>
                        {selectedClient.payment_method}
                      </p>
                    </div>
                  </div>
                )}

                {selectedClient.currencies &&
                  selectedClient.currencies.length > 0 && (
                    <div>
                      <p className='text-sm font-medium text-gray-900 mb-2'>
                        Currencies
                      </p>
                      <div className='flex flex-wrap gap-2'>
                        {selectedClient.currencies.map(currency => (
                          <span
                            key={currency}
                            className='inline-flex px-3 py-1 text-sm font-medium rounded-full bg-accent-100 text-accent-800'
                          >
                            {currency}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                {selectedClient.psps && selectedClient.psps.length > 0 && (
                  <div>
                    <p className='text-sm font-medium text-gray-900 mb-2'>
                      Payment Service Providers
                    </p>
                    <div className='flex flex-wrap gap-2'>
                      {selectedClient.psps.map(psp => (
                        <span
                          key={psp}
                          className='inline-flex px-3 py-1 text-sm font-medium rounded-full bg-success-100 text-success-800'
                        >
                          {psp}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className='flex items-center gap-3'>
                  <Calendar className='h-5 w-5 text-gray-400' />
                  <div>
                    <p className='text-sm font-medium text-gray-900'>
                      Last Transaction
                    </p>
                    <p className='text-sm text-gray-600'>
                      {selectedClient.last_transaction
                        ? formatDate(selectedClient.last_transaction)
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className='p-6 border-t border-gray-100'>
              <button
                onClick={closeModal}
                className='w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200'
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {showEditModal && selectedClient && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
            <div className='p-6 border-b border-gray-100'>
              <div className='flex items-center justify-between'>
                <h3 className='text-xl font-semibold text-gray-900'>
                  Edit Client
                </h3>
                <button
                  onClick={closeModal}
                  className='p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200'
                >
                  <X className='h-5 w-5' />
                </button>
              </div>
            </div>
            <div className='p-6'>
              <p className='text-gray-600 mb-6'>
                Edit functionality will be implemented here. This would include
                forms for updating client information.
              </p>
              <div className='flex gap-3'>
                <button
                  onClick={closeModal}
                  className='flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200'
                >
                  Cancel
                </button>
                <button
                  onClick={closeModal}
                  className='flex-1 px-4 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700 transition-colors duration-200'
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedClient && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-xl max-w-md w-full'>
            <div className='p-6 border-b border-gray-100'>
              <div className='flex items-center justify-between'>
                <h3 className='text-xl font-semibold text-gray-900'>
                  Delete Client
                </h3>
                <button
                  onClick={closeModal}
                  className='p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200'
                >
                  <X className='h-5 w-5' />
                </button>
              </div>
            </div>
            <div className='p-6'>
              <div className='flex items-center gap-4 mb-4'>
                <div className='w-12 h-12 bg-danger-100 rounded-full flex items-center justify-center'>
                  <Trash2 className='h-6 w-6 text-danger-600' />
                </div>
                <div>
                  <p className='text-lg font-semibold text-gray-900'>
                    Are you sure?
                  </p>
                  <p className='text-gray-600'>This action cannot be undone.</p>
                </div>
              </div>
              <p className='text-gray-600 mb-6'>
                You are about to delete{' '}
                <strong>{selectedClient.client_name}</strong>. This will
                permanently remove all associated data.
              </p>
              <div className='flex gap-3'>
                <button
                  onClick={closeModal}
                  disabled={deleteLoading}
                  className='flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50'
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteClient}
                  disabled={deleteLoading}
                  className='flex-1 px-4 py-2 bg-danger-600 text-white rounded-lg hover:bg-danger-700 transition-colors duration-200 disabled:opacity-50'
                >
                  {deleteLoading ? 'Deleting...' : 'Delete Client'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Daily Summary Modal */}
      {showDailySummaryModal && dailySummaryData && (
        <div className='fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-2xl shadow-xl max-w-5xl w-full max-h-[85vh] overflow-hidden border border-gray-100'>
            {/* Modal Header */}
            <div className='bg-gray-50 border-b border-gray-200 p-6'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-4'>
                  <div className='w-10 h-10 bg-gray-200 rounded-xl flex items-center justify-center'>
                    <Calendar className='h-5 w-5 text-gray-600' />
                  </div>
                  <div>
                    <h2 className='text-xl font-semibold text-gray-900'>Daily Summary</h2>
                    <p className='text-gray-500 text-sm'>
                      {dailySummaryData.date_str}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeDailySummaryModal}
                  className='w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors duration-200'
                >
                  <X className='h-4 w-4 text-gray-600' />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className='p-6 overflow-y-auto max-h-[calc(85vh-120px)]'>
              {dailySummaryLoading ? (
                <div className='flex items-center justify-center py-12'>
                  <div className='text-center'>
                    <div className='animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-600 mx-auto mb-3'></div>
                    <p className='text-gray-600 text-sm'>Loading summary...</p>
                  </div>
                </div>
              ) : (
                <div className='space-y-6'>
                  {/* Key Metrics Section */}
                  {(() => {
                    const dailyMetrics = calculateDailyDepositWithdrawMetrics(dailySummaryData.date);
                    return (
                      <div className='space-y-4'>
                        <div className='flex items-center gap-3'>
                          <div className='w-1 h-6 bg-gray-400 rounded-full'></div>
                          <h3 className='text-lg font-medium text-gray-900'>Overview</h3>
                        </div>
                        
                        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                          {/* Deposits */}
                          <div className='bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow duration-200'>
                            <div className='flex items-center justify-between mb-3'>
                              <div className='w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center'>
                                <TrendingUp className='h-4 w-4 text-green-600' />
                              </div>
                              <span className='text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full'>
                                Deposits
                              </span>
                            </div>
                            <p className='text-2xl font-semibold text-gray-900 mb-1'>
                              {formatCurrency(dailyMetrics.totalDeposits, '₺')}
                            </p>
                            <p className='text-xs text-gray-500'>Total incoming</p>
                          </div>

                          {/* Withdrawals */}
                          <div className='bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow duration-200'>
                            <div className='flex items-center justify-between mb-3'>
                              <div className='w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center'>
                                <TrendingUp className='h-4 w-4 text-red-600 rotate-180' />
                              </div>
                              <span className='text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full'>
                                Withdrawals
                              </span>
                            </div>
                            <p className='text-2xl font-semibold text-gray-900 mb-1'>
                              {formatCurrency(dailyMetrics.totalWithdrawals, '₺')}
                            </p>
                            <p className='text-xs text-gray-500'>Total outgoing</p>
                          </div>

                          {/* Net Flow */}
                          <div className='bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow duration-200'>
                            <div className='flex items-center justify-between mb-3'>
                              <div className='w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center'>
                                <Activity className='h-4 w-4 text-blue-600' />
                              </div>
                              <span className='text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full'>
                                Net
                              </span>
                            </div>
                            <p className={`text-2xl font-semibold mb-1 ${dailyMetrics.totalDeposits - dailyMetrics.totalWithdrawals >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(dailyMetrics.totalDeposits - dailyMetrics.totalWithdrawals, '₺')}
                            </p>
                            <p className='text-xs text-gray-500'>Balance</p>
                          </div>

                          {/* Statistics */}
                          <div className='bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow duration-200'>
                            <div className='flex items-center justify-between mb-3'>
                              <div className='w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center'>
                                <BarChart3 className='h-4 w-4 text-gray-600' />
                              </div>
                              <span className='text-xs font-medium text-gray-600 bg-gray-50 px-2 py-1 rounded-full'>
                                Stats
                              </span>
                            </div>
                            <div className='space-y-2'>
                              <div className='flex justify-between items-center text-sm'>
                                <span className='text-gray-600'>Transactions</span>
                                <span className='font-semibold text-gray-900'>{dailyMetrics.transactionCount}</span>
                              </div>
                              <div className='flex justify-between items-center text-sm'>
                                <span className='text-gray-600'>Clients</span>
                                <span className='font-semibold text-gray-900'>{dailyMetrics.uniqueClients}</span>
                              </div>
                              {dailyMetrics.transactionCount > 0 && (
                                <div className='flex justify-between items-center text-sm'>
                                  <span className='text-gray-600'>Average</span>
                                  <span className='font-semibold text-gray-900'>
                                    {formatCurrency((dailyMetrics.totalDeposits + dailyMetrics.totalWithdrawals) / dailyMetrics.transactionCount)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* USD Rate */}
                  {dailySummaryData.usd_rate !== null && dailySummaryData.usd_rate !== undefined && (
                    <div className='bg-gray-50 border border-gray-200 rounded-xl p-4'>
                      <div className='flex items-center gap-3'>
                        <div className='w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center'>
                          <DollarSign className='h-4 w-4 text-blue-600' />
                        </div>
                        <div>
                          <p className='text-sm font-medium text-gray-700'>USD Rate</p>
                          <p className='text-xl font-semibold text-gray-900'>${Number(dailySummaryData.usd_rate).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Payment Methods Breakdown */}
                  {(() => {
                    const dailyPaymentBreakdown = calculateDailyPaymentMethodBreakdown(dailySummaryData.date);
                    return Object.keys(dailyPaymentBreakdown).length > 0 ? (
                      <div className='space-y-4'>
                        <div className='flex items-center gap-3'>
                          <div className='w-1 h-6 bg-gray-400 rounded-full'></div>
                          <h3 className='text-lg font-medium text-gray-900'>Payment Methods</h3>
                        </div>
                        
                        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                          {Object.entries(dailyPaymentBreakdown)
                            .sort(([, a], [, b]) => Math.abs(b.total) - Math.abs(a.total))
                            .map(([method, data]) => (
                              <div key={method} className='bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow duration-200'>
                                <div className='flex items-center justify-between mb-3'>
                                  <h4 className='text-sm font-medium text-gray-900'>{method}</h4>
                                  <div className={`text-sm font-semibold px-2 py-1 rounded-full ${data.total >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                                    {formatCurrency(Math.abs(data.total), '₺')}
                                  </div>
                                </div>
                                
                                <div className='grid grid-cols-2 gap-3'>
                                  <div className='bg-green-50 border border-green-100 rounded-lg p-3'>
                                    <div className='flex items-center gap-2 mb-1'>
                                      <TrendingUp className='h-3 w-3 text-green-600' />
                                      <span className='text-xs font-medium text-green-700'>Deposits</span>
                                    </div>
                                    <p className='text-lg font-semibold text-green-900'>
                                      {formatCurrency(data.deposits, '₺')}
                                    </p>
                                  </div>
                                  
                                  <div className='bg-red-50 border border-red-100 rounded-lg p-3'>
                                    <div className='flex items-center gap-2 mb-1'>
                                      <TrendingUp className='h-3 w-3 text-red-600 rotate-180' />
                                      <span className='text-xs font-medium text-red-700'>Withdrawals</span>
                                    </div>
                                    <p className='text-lg font-semibold text-red-900'>
                                      {formatCurrency(data.withdrawals, '₺')}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    ) : null;
                  })()}

                  {/* Distribution Summary */}
                  {dailySummaryData.transaction_count > 0 && (
                    <div className='space-y-4'>
                      <div className='flex items-center gap-3'>
                        <div className='w-1 h-6 bg-gray-400 rounded-full'></div>
                        <h3 className='text-lg font-medium text-gray-900'>Breakdown</h3>
                      </div>
                      
                      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                        {/* PSP Distribution */}
                        {dailySummaryData.psp_summary.length > 0 && (
                          <div className='bg-white border border-gray-200 rounded-xl p-4'>
                            <div className='flex items-center gap-3 mb-3'>
                              <div className='w-6 h-6 bg-gray-100 rounded-lg flex items-center justify-center'>
                                <Building2 className='h-3 w-3 text-gray-600' />
                              </div>
                              <h4 className='text-sm font-medium text-gray-900'>PSPs (Net Amounts)</h4>
                            </div>
                            <div className='space-y-2'>
                              {dailySummaryData.psp_summary.slice(0, 4).map((psp, idx) => {
                                // Debug logging to see what data we're receiving
                                console.log('🔍 PSP Debug:', psp.name, 'is_tether:', psp.is_tether, 'primary_currency:', psp.primary_currency, 'net_usd:', psp.net_usd, 'net_tl:', psp.net_tl);
                                
                                return (
                                  <div key={idx} className='flex justify-between items-center text-sm'>
                                    <span className='text-gray-600 truncate'>{psp.name}</span>
                                    <div className='flex items-center gap-2'>
                                      <span className='text-xs text-gray-500'>{psp.count} tx</span>
                                      <span className='font-medium text-gray-900'>
                                        {psp.is_tether 
                                          ? `$${psp.net_usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                          : `${psp.net_tl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`
                                        }
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                              {dailySummaryData.psp_summary.length > 4 && (
                                <div className='text-center pt-2 border-t border-gray-100'>
                                  <span className='text-xs text-gray-500'>
                                    +{dailySummaryData.psp_summary.length - 4} more
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Category Distribution */}
                        {dailySummaryData.category_summary.length > 0 && (
                          <div className='bg-white border border-gray-200 rounded-xl p-4'>
                            <div className='flex items-center gap-3 mb-3'>
                              <div className='w-6 h-6 bg-gray-100 rounded-lg flex items-center justify-center'>
                                <FileText className='h-3 w-3 text-gray-600' />
                              </div>
                              <h4 className='text-sm font-medium text-gray-900'>Categories</h4>
                            </div>
                            <div className='space-y-2'>
                              {dailySummaryData.category_summary.slice(0, 4).map((category, idx) => (
                                <div key={idx} className='flex justify-between items-center text-sm'>
                                  <span className='text-gray-600 truncate'>{category.name}</span>
                                  <span className='font-medium text-gray-900'>{category.count}</span>
                                </div>
                              ))}
                              {dailySummaryData.category_summary.length > 4 && (
                                <div className='text-center pt-2 border-t border-gray-100'>
                                  <span className='text-xs text-gray-500'>
                                    +{dailySummaryData.category_summary.length - 4} more
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Payment Methods */}
                        {dailySummaryData.payment_method_summary.length > 0 && (
                          <div className='bg-white border border-gray-200 rounded-xl p-4'>
                            <div className='flex items-center gap-3 mb-3'>
                              <div className='w-6 h-6 bg-gray-100 rounded-lg flex items-center justify-center'>
                                <CreditCard className='h-3 w-3 text-gray-600' />
                              </div>
                              <h4 className='text-sm font-medium text-gray-900'>Payment Methods (Net Amounts)</h4>
                            </div>
                            <div className='space-y-2'>
                              {dailySummaryData.payment_method_summary.slice(0, 4).map((method, idx) => (
                                <div key={idx} className='flex justify-between items-center text-sm'>
                                  <span className='text-gray-600 truncate'>{method.name}</span>
                                  <span className='font-medium text-gray-900'>{method.count}</span>
                                </div>
                              ))}
                              {dailySummaryData.payment_method_summary.length > 4 && (
                                <div className='text-center pt-2 border-t border-gray-100'>
                                  <span className='text-xs text-gray-500'>
                                    +{dailySummaryData.payment_method_summary.length - 4} more
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Exchange Rate Modal - REMOVED - No longer needed with automatic yfinance integration */}

      {/* Clients Tab Content */}
      {activeTab === 'clients' && (
        <div className='space-y-6'>
          {/* Clients Table */}
          <div className='bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden'>
            <div className='px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100/50'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm'>
                    <Users className='h-5 w-5 text-white' />
    </div>
                  <div>
                    <h3 className='text-xl font-bold text-gray-900'>
                      Clients Overview
                    </h3>
                    <p className='text-sm text-gray-600'>
                      Manage clients and view their transactions
                    </p>
                  </div>
                </div>
                <div className='flex items-center gap-3'>
                  <button
                    onClick={handleExport}
                    className='inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:shadow-md transition-all duration-200 font-medium'
                  >
                    <Download className='h-4 w-4' />
                    Export
                  </button>
                  <button
                    onClick={() => navigate('/transactions/add')}
                    className='inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 hover:shadow-lg transition-all duration-200 font-medium shadow-md'
                  >
                    <Plus className='h-4 w-4' />
                    Add Transaction
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className='p-12 text-center'>
                <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600 mx-auto mb-4'></div>
                <p className='text-gray-600 text-lg'>Loading clients...</p>
              </div>
            ) : clients.length === 0 ? (
              <div className='p-12 text-center'>
                <div className='text-gray-400 mb-4'>
                  <Users className='h-16 w-16 mx-auto' />
                </div>
                <h3 className='text-xl font-semibold text-gray-900 mb-2'>
                  No Clients Found
                </h3>
                <p className='text-gray-600'>
                  No clients are currently available.
                </p>
              </div>
            ) : (
              <div className='overflow-x-auto'>
                <table className='min-w-full divide-y divide-gray-200'>
                  <thead className='bg-gray-50'>
                    <tr>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Client
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Company
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Total Amount
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Transactions
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Last Transaction
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className='bg-white divide-y divide-gray-200'>
                    {clients.map((client) => (
                      <React.Fragment key={client.client_name}>
                        {/* Client Row */}
                        <tr className='hover:bg-gray-50 transition-colors duration-200'>
                          <td className='px-6 py-4 whitespace-nowrap'>
                            <div className='flex items-center'>
                              <button
                                onClick={() => toggleClientExpansion(client.client_name)}
                                className='mr-3 p-1 hover:bg-gray-100 rounded transition-colors duration-200'
                              >
                                <div className={`w-4 h-4 transition-transform duration-200 ${
                                  expandedClients.has(client.client_name) ? 'rotate-90' : ''
                                }`}>
                                  ▶
                                </div>
                              </button>
                              <div className='w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3'>
                                <User className='h-4 w-4 text-white' />
                              </div>
                              <div>
                                <div className='text-sm font-semibold text-gray-900'>
                                  {client.client_name}
                                </div>
                                <div className='text-sm text-gray-500'>
                                  'Payment Method'
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                            {client.company_name || 'N/A'}
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap'>
                            <div className='text-sm font-semibold text-gray-900'>
                              {formatCurrency(client.total_amount, '₺')}
                            </div>
                            <div className='text-xs text-gray-500'>
                              {formatCurrency(client.total_commission, '₺')} commission
                            </div>
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                            {client.transaction_count}
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                            {client.last_transaction ? formatDate(client.last_transaction) : 'N/A'}
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                            <div className='flex items-center gap-2'>
                              <button
                                onClick={() => handleViewClient(client)}
                                className='text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded transition-colors duration-200'
                                title='View Details'
                              >
                                <Eye className='h-4 w-4' />
                              </button>
                              <button
                                onClick={() => handleEditClient(client)}
                                className='text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded transition-colors duration-200'
                                title='Edit Client'
                              >
                                <Edit className='h-4 w-4' />
                              </button>
                              <button
                                onClick={() => handleDeleteClient(client)}
                                className='text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded transition-colors duration-200'
                                title='Delete Client'
                              >
                                <Trash2 className='h-4 w-4' />
                              </button>
                            </div>
                          </td>
                        </tr>
                        
                        {/* Expanded Transactions Row */}
                        {expandedClients.has(client.client_name) && (
                          <tr>
                            <td colSpan={6} className='px-6 py-4 bg-gray-50'>
                              <div className='space-y-4'>
                                <div className='flex items-center justify-between'>
                                  <h4 className='text-sm font-medium text-gray-700'>
                                    Transactions for {client.client_name}
                                  </h4>
                                  <button
                                    onClick={() => navigate('/transactions/add', { state: { clientName: client.client_name } })}
                                    className='inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-all duration-200'
                                  >
                                    <Plus className='h-3 w-3' />
                                    Add Transaction
                                  </button>
                                </div>
                                
                                {loadingClientTransactions[client.client_name] ? (
                                  <div className='text-center py-4'>
                                    <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto'></div>
                                    <p className='text-sm text-gray-500 mt-2'>Loading transactions...</p>
                                  </div>
                                ) : clientTransactions[client.client_name]?.length > 0 ? (
                                  <div className='overflow-x-auto'>
                                    <table className='min-w-full divide-y divide-gray-200'>
                                      <thead className='bg-white'>
                                        <tr>
                                          <th className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                            Date
                                          </th>
                                          <th className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                            Category
                                          </th>
                                          <th className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                            Amount
                                          </th>
                                          <th className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                            Currency
                                          </th>
                                          <th className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                            PSP
                                          </th>
                                          <th className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                            Actions
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className='bg-white divide-y divide-gray-200'>
                                        {clientTransactions[client.client_name].map((transaction) => (
                                          <tr key={transaction.id} className='hover:bg-gray-50'>
                                            <td className='px-4 py-2 whitespace-nowrap text-sm text-gray-900'>
                                              {transaction.date ? formatDate(transaction.date) : 'N/A'}
                                            </td>
                                            <td className='px-4 py-2 whitespace-nowrap text-sm text-gray-900'>
                                              {transaction.category}
                                            </td>
                                            <td className='px-4 py-2 whitespace-nowrap text-sm font-semibold text-gray-900'>
                                              {formatCurrency(transaction.amount, transaction.currency)}
                                            </td>
                                            <td className='px-4 py-2 whitespace-nowrap text-sm text-gray-500'>
                                              {transaction.currency}
                                            </td>
                                            <td className='px-4 py-2 whitespace-nowrap text-sm text-gray-900'>
                                              {transaction.psp}
                                            </td>
                                            <td className='px-4 py-2 whitespace-nowrap text-sm font-medium'>
                                              <div className='flex items-center gap-1'>
                                                <button
                                                  onClick={() => handleViewTransaction(transaction)}
                                                  className='text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded transition-colors duration-200'
                                                  title='View Details'
                                                >
                                                  <Eye className='h-3 w-3' />
                                                </button>
                                                <button
                                                  onClick={() => handleEditTransaction(transaction)}
                                                  className='text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded transition-colors duration-200'
                                                  title='Edit Transaction'
                                                >
                                                  <Edit className='h-3 w-3' />
                                                </button>
                                                <button
                                                  onClick={() => handleDeleteTransaction(transaction)}
                                                  className='text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded transition-colors duration-200'
                                                  title='Delete Transaction'
                                                >
                                                  <Trash2 className='h-3 w-3' />
                                                </button>
                                              </div>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <div className='text-center py-4 text-sm text-gray-500'>
                                    No transactions found for this client.
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Transaction View Modal */}
      {showViewTransactionModal && selectedTransaction && (
        <Modal
          isOpen={showViewTransactionModal}
          onClose={() => setShowViewTransactionModal(false)}
          title="Transaction Details"
        >
          <TransactionDetailView transaction={selectedTransaction} />
        </Modal>
      )}

      {/* Transaction Edit Modal */}
      {showEditTransactionModal && selectedTransaction && (
        <Modal
          isOpen={showEditTransactionModal}
          onClose={() => setShowEditTransactionModal(false)}
          title="Edit Transaction"
        >
          <TransactionEditForm
            transaction={selectedTransaction}
            onSave={(updatedTransaction) => {
              // Update the transaction in the local state
              setTransactions(prev => 
                prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t)
              );
              // Update in client transactions if it exists
              if (clientTransactions[updatedTransaction.client_name]) {
                setClientTransactions(prev => ({
                  ...prev,
                  [updatedTransaction.client_name]: prev[updatedTransaction.client_name].map(t => 
                    t.id === updatedTransaction.id ? updatedTransaction : t
                  )
                }));
              }
              setShowEditTransactionModal(false);
            }}
            onCancel={() => setShowEditTransactionModal(false)}
            dropdownOptions={dropdownOptions}
          />
        </Modal>
      )}

               {/* Import Guide Modal */}
         {showImportGuide && (
           <Modal
             isOpen={showImportGuide}
             onClose={() => setShowImportGuide(false)}
             title="📁 Import Transactions Guide"
             size="lg"
           >
          <div className="space-y-6 max-h-96 overflow-y-auto">
            {/* File Format Support */}
            <div>
              <h5 className="text-sm font-medium text-blue-800 mb-2">✅ Supported File Formats:</h5>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">CSV (Fully Supported)</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">XLSX (Fully Supported)</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">XLS (Fully Supported)</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">XLSM (Fully Supported)</span>
              </div>
            </div>

            {/* Essential vs Optional Fields */}
            <div>
              <h5 className="text-sm font-medium text-blue-800 mb-2">🎯 Essential vs Optional Fields:</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <h6 className="font-medium text-green-700 mb-1">✅ Essential Fields (Recommended):</h6>
                  <ul className="text-green-600 space-y-1">
                    <li>• <strong>Client</strong> - Client's full name</li>
                    <li>• <strong>Amount</strong> - Transaction amount</li>
                    <li>• <strong>Company</strong> - Company name</li>
                    <li></li>
                    <li>• <strong>Payment Method</strong> - How payment was made</li>
                    <li>• <strong>Category</strong> - Transaction category</li>
                    <li>• <strong>Currency</strong> - Transaction currency</li>
                    <li>• <strong>PSP</strong> - Payment service provider</li>
                    <li>• <strong>Date</strong> - Transaction date</li>
                  </ul>
                </div>
                <div>
                  <h6 className="font-medium text-blue-700 mb-1">❓ Optional Fields:</h6>
                  <ul className="text-blue-600 space-y-1">
                    <li>• <strong>Commission</strong> - Auto-calculated if not provided</li>
                    <li>• <strong>Net Amount</strong> - Auto-calculated if not provided</li>
                    <li>• <strong>Notes</strong> - Additional transaction details</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Column Structure */}
            <div>
              <h5 className="text-sm font-medium text-blue-800 mb-2">📋 Essential Column Structure (in exact order):</h5>
              <div className="bg-white border border-blue-200 rounded-lg p-3 text-xs font-mono text-gray-700 overflow-x-auto">
                <div className="grid grid-cols-9 gap-1 text-center font-medium text-blue-600 mb-2">
                  <div className="col-span-1">1</div>
                  <div className="col-span-1">2</div>
                  <div className="col-span-1">3</div>
                  <div className="col-span-1">4</div>
                  <div className="col-span-1">5</div>
                  <div className="col-span-1">6</div>
                  <div className="col-span-1">7</div>
                  <div className="col-span-1">8</div>
                  <div className="col-span-1">9</div>
                </div>
                <div className="grid grid-cols-9 gap-1 text-center">
                  <div className="col-span-1">Client</div>
                  <div className="col-span-1">Company</div>
                  
                  <div className="col-span-1">Payment</div>
                  <div className="col-span-1">Category</div>
                  <div className="col-span-1">Amount</div>
                  <div className="col-span-1">Currency</div>
                  <div className="col-span-1">PSP</div>
                  <div className="col-span-1">Date</div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-xs text-gray-600 text-center mb-2">Optional Columns (if needed):</div>
                  <div className="grid grid-cols-3 gap-1 text-center text-xs">
                    <div className="col-span-1">10</div>
                    <div className="col-span-1">11</div>
                    <div className="col-span-1">12</div>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-center text-xs">
                    <div className="col-span-1">Commission</div>
                    <div className="col-span-1">Net Amount</div>
                    <div className="col-span-1">Notes</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Example Formats */}
            <div>
              <h5 className="text-sm font-medium text-blue-800 mb-2">💡 Example File Formats:</h5>
              
              {/* CSV Format */}
              <div className="mb-3">
                <h6 className="text-sm font-medium text-blue-700 mb-2">📄 CSV Format (Essential Columns):</h6>
                <div className="bg-white border border-blue-200 rounded-lg p-3 text-xs font-mono text-gray-700 overflow-x-auto">
                  <div className="text-blue-600 font-medium mb-1">Essential Header Row:</div>
                  <div className="text-gray-800">Client,Company,Payment Method,Category,Amount,Currency,PSP,Date</div>
                  <div className="text-blue-600 font-medium mt-2 mb-1">Essential Data Row (Example):</div>
                  <div className="text-gray-800">John Doe,ABC Corp,Credit Card,DEP,1000.50,USD,Stripe,2025-08-18</div>
                  
                  <div className="mt-3 pt-2 border-t border-gray-200">
                    <div className="text-blue-600 font-medium mb-1">Full Header Row (with optional columns):</div>
                    <div className="text-gray-800">Client,Company,Payment Method,Category,Amount,Commission,Net Amount,Currency,PSP,Date,Notes</div>
                    <div className="text-blue-600 font-medium mt-2 mb-1">Full Data Row (Example):</div>
                    <div className="text-gray-800">John Doe,ABC Corp,Credit Card,DEP,1000.50,25.00,975.50,USD,Stripe,2025-08-18,Monthly payment</div>
                  </div>
                </div>
              </div>
              
              {/* Excel Format */}
              <div>
                <h6 className="text-sm font-medium text-blue-700 mb-2">📊 Excel Format (XLSX/XLS/XLSM):</h6>
                <div className="bg-white border border-blue-200 rounded-lg p-3 text-xs font-mono text-gray-700 overflow-x-auto">
                  <div className="text-blue-600 font-medium mb-1">Essential Column Structure:</div>
                  <div className="text-gray-800">Column A: Client | Column B: Company | Column C: Payment Method</div>
                  <div className="text-gray-800">Column D: Category | Column E: Amount | Column F: Currency | Column G: PSP | Column H: Date</div>
                  
                  <div className="mt-3 pt-2 border-t border-gray-200">
                    <div className="text-blue-600 font-medium mb-1">Optional Columns (if needed):</div>
                    <div className="text-gray-800">Column J: Commission | Column K: Net Amount | Column L: Notes</div>
                  </div>
                  
                  <div className="text-blue-600 font-medium mt-2 mb-1">💡 Tip: Excel files are automatically parsed - just ensure your first row contains headers!</div>
                </div>
              </div>
            </div>

            {/* Downloadable Template Examples */}
            <div>
              <h5 className="text-sm font-medium text-blue-800 mb-2">📥 Download Template Examples:</h5>
              
              {/* Essential Template */}
              <div className="mb-3">
                <h6 className="text-sm font-medium text-green-700 mb-2">✅ Essential Template (9 columns):</h6>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="text-sm text-green-800 mb-2">
                    <strong>Perfect for most imports:</strong> Contains only the essential columns needed for complete transaction data.
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => downloadTemplate('essential', 'csv')}
                      className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      Download CSV Template
                    </button>
                    <button
                      onClick={() => downloadTemplate('essential', 'xlsx')}
                      className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      Download Excel Template
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Full Template */}
              <div>
                <h6 className="text-sm font-medium text-blue-700 mb-2">📋 Full Template (12 columns):</h6>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="text-sm text-blue-800 mb-2">
                    <strong>Complete template:</strong> Includes all columns including commission, net amount, and notes for advanced users.
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => downloadTemplate('full', 'csv')}
                      className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      Download CSV Template
                    </button>
                    <button
                      onClick={() => downloadTemplate('full', 'xlsx')}
                      className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      Download Excel Template
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Smart Import Note */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <h6 className="text-sm font-medium text-green-800 mb-1">🧮 Smart Import Features:</h6>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• <strong>Essential 9 columns</strong> provide complete transaction data</li>
                <li>• <strong>Commission & Net Amount</strong> are auto-calculated if not provided</li>
                <li>• <strong>Transaction summaries</strong> are automatically generated</li>
                <li>• <strong>Client statistics</strong> are updated in real-time</li>
                <li>• <strong>Flexible import</strong> - use 9 essential columns or all 12 columns</li>
                <li>• Only import <strong>raw data</strong> - let the system handle calculations!</li>
              </ul>
            </div>
                       </div>
           </Modal>
         )}

         {/* Import Preview Modal */}
         {showImportPreview && (
           <Modal
             isOpen={showImportPreview}
             onClose={() => setShowImportPreview(false)}
             title="📋 Import Preview - Review Your Data"
             size="lg"
           >
             <div className="space-y-6">
               {/* Summary */}
               <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                 <h5 className="text-sm font-medium text-blue-800 mb-2">📊 Import Summary:</h5>
                 <div className="grid grid-cols-2 gap-4 text-sm">
                   <div>
                     <span className="text-blue-600 font-medium">Total Transactions:</span>
                     <span className="ml-2 text-blue-800">{importData.length}</span>
                   </div>
                   <div>
                     <span className="text-blue-600 font-medium">File Type:</span>
                     <span className="ml-2 text-blue-800">CSV</span>
                   </div>
                 </div>
               </div>

               {/* Preview Table */}
               <div>
                 <h5 className="text-sm font-medium text-gray-800 mb-3">👀 Preview (First 5 transactions):</h5>
                 <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                   <table className="min-w-full divide-y divide-gray-200">
                     <thead className="bg-gray-50">
                       <tr>
                         <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                         <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                         <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                         <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Currency</th>
                         <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                       </tr>
                     </thead>
                     <tbody className="bg-white divide-y divide-gray-200">
                       {importPreview.map((transaction, index) => (
                         <tr key={index} className="hover:bg-gray-50">
                           <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{transaction.client_name}</td>
                           <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{transaction.company || '-'}</td>
                           <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{transaction.amount}</td>
                           <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{transaction.currency}</td>
                           <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{transaction.category}</td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               </div>

               {/* Action Buttons */}
               <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                 <button
                   onClick={() => setShowImportPreview(false)}
                   className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                 >
                   Cancel
                 </button>
                 <button
                   onClick={handleFinalImport}
                   disabled={importing}
                   className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   {importing ? 'Importing...' : `Import ${importData.length} Transactions`}
                 </button>
               </div>
             </div>
           </Modal>
         )}

         {/* Bulk Delete Modal */}
         {showBulkDeleteModal && (
           <Modal
             isOpen={showBulkDeleteModal}
             onClose={() => setShowBulkDeleteModal(false)}
             title="🗑️ Bulk Delete All Transactions"
             size="md"
           >
             <div className="space-y-6">
               {/* Warning */}
               <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                 <div className="flex items-center gap-2 mb-2">
                   <AlertCircle className="w-5 h-5 text-red-600" />
                   <h5 className="text-sm font-medium text-red-800">⚠️ DANGER ZONE</h5>
                 </div>
                 <p className="text-sm text-red-700">
                   This action will <strong>permanently delete ALL transactions</strong> from the system. 
                   This action cannot be undone and will affect all client data, reports, and analytics.
                 </p>
               </div>

               {/* Confirmation Code Input */}
               <div>
                 <label htmlFor="confirmationCode" className="block text-sm font-medium text-gray-700 mb-2">
                   Enter Confirmation Code:
                 </label>
                 <input
                   type="text"
                   id="confirmationCode"
                   value={confirmationCode}
                   onChange={(e) => setConfirmationCode(e.target.value)}
                   placeholder="Enter 4-digit code"
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                   maxLength={4}
                   autoComplete="off"
                 />
                 <p className="text-xs text-gray-500 mt-1">
                   You must enter the exact 4-digit confirmation code to proceed with deletion.
                 </p>
               </div>

               {/* Action Buttons */}
               <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                 <button
                   onClick={() => setShowBulkDeleteModal(false)}
                   className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                 >
                   Cancel
                 </button>
                 <button
                   onClick={handleBulkDeleteAll}
                   disabled={deleting || confirmationCode !== '4561'}
                   className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   {deleting ? 'Deleting...' : 'Delete All Transactions'}
                 </button>
               </div>
             </div>
           </Modal>
         )}
    </div>
  );
}