import { useState, useEffect } from 'react';
import {
  Plus,
  X,
  User,
  Calendar,
  DollarSign,
  Building2,
  CreditCard,
  Building,
  Tag,
  MessageSquare,
  ArrowLeft,
  Settings,
  AlertTriangle,
  CheckCircle,
  Info,
  FileText,
  Globe,
  TrendingUp,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/apiClient';
import { exchangeRatesService } from '../services/exchangeRatesService';
import { healthMonitor } from '../services/healthMonitor';
import CurrencyConversionModal from '../components/CurrencyConversionModal';

interface DropdownOption {
  id: number;
  value: string;
  commission_rate?: number;
}

interface GroupedOptions {
  [fieldName: string]: DropdownOption[];
}

interface ExchangeRate {
  eur_rate?: number;
  has_rates: boolean;
}

export default function AddTransaction() {
  const { t } = useLanguage();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [dropdownOptions, setDropdownOptions] = useState<GroupedOptions>({});
  const [dropdownsLoaded, setDropdownsLoaded] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate>({
    has_rates: false,
  });
  const [showExchangeRateSection, setShowExchangeRateSection] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [rateValidationMessage, setRateValidationMessage] = useState('');
  const [convertedAmountTL, setConvertedAmountTL] = useState<string>('');

  const [formData, setFormData] = useState({
    client_name: '',
    company: '',
    date: '',
    amount: '',
    payment_method: '',
    currency: '',
    category: '',
    psp: '',
    notes: '',
    eur_rate: '',
    usd_rate: '',
  });

  useEffect(() => {
    console.log('🔍 Auth state check:', { isAuthenticated, authLoading, dropdownsLoaded, user: !!user });
    
    // Only fetch dropdowns if we're authenticated and they haven't been loaded yet
    if (isAuthenticated && !authLoading && !dropdownsLoaded) {
      console.log('✅ Conditions met, fetching dropdown options...');
      fetchDropdownOptions();

      // Perform health check when component mounts
      healthMonitor.performHealthCheck().then(result => {
        if (result.issues.length > 0) {
          console.warn('⚠️ Health issues detected:', result.issues);
          console.log('💡 Recommendations:', result.recommendations);
        }
      });
    } else {
      console.log('⏳ Waiting for conditions:', { 
        needsAuth: !isAuthenticated, 
        needsLoadingComplete: authLoading, 
        needsDropdowns: dropdownsLoaded 
      });
    }
  }, [isAuthenticated, authLoading, dropdownsLoaded]);

  // Fallback: If dropdowns still aren't loaded after a delay, try again
  useEffect(() => {
    if (isAuthenticated && !authLoading && !dropdownsLoaded) {
      const timeoutId = setTimeout(() => {
        if (!dropdownsLoaded) {
          console.log('🔄 Fallback: Attempting to load dropdowns again...');
          fetchDropdownOptions();
        }
      }, 1000); // Wait 1 second before retry

      return () => clearTimeout(timeoutId);
    }
    return undefined;
  }, [isAuthenticated, authLoading, dropdownsLoaded]);

  const fetchDropdownOptions = async () => {
    try {
      console.log('🔄 Fetching dropdown options...');
      setLoading(true);
      const response = await api.get('/api/v1/transactions/dropdown-options');

      if (response.ok) {
        const data = await api.parseResponse(response);
        console.log('✅ Dropdown options loaded successfully:', data);
        setDropdownOptions(data || {});
        setDropdownsLoaded(true);
      } else {
        console.error('❌ Failed to fetch dropdown options:', response.status);
      }
    } catch (error) {
      console.error('💥 Error fetching dropdown options:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Show currency modal when USD is selected
    if (field === 'currency' && value === 'USD') {
      setShowCurrencyModal(true);
    }

    // Check exchange rates when currency or date changes
    if (field === 'currency' || field === 'date') {
      // Pass the new values to checkExchangeRates
      const newFormData = { ...formData, [field]: value };
      checkExchangeRates(newFormData.currency, newFormData.date);
    }
  };

  const handleCurrencyRateSelect = (rate: number) => {
    setFormData(prev => ({ ...prev, usd_rate: rate.toString() }));
    setShowCurrencyModal(false);
  };

  const checkExchangeRates = async (currency?: string, date?: string) => {
    // Use passed parameters or fall back to current formData
    const currentCurrency = currency || formData.currency;
    const currentDate = date || formData.date;

    if ((currentCurrency === 'EUR' || currentCurrency === 'USD') && currentDate) {
      setShowExchangeRateSection(true);
      await validateExistingRates(currentDate, currentCurrency);
    } else {
      setShowExchangeRateSection(false);
    }
  };

  const validateExistingRates = async (date: string, currency: string) => {
    try {
      setRateValidationMessage('Checking existing rates...');

      if (currency === 'EUR') {
        const res = await exchangeRatesService.fetchRate({ date, currency_pair: 'EUR/TRY' });
        if (res.status === 'success' && res.rate?.rate) {
          const r = res.rate.rate;
          setRateValidationMessage(`✓ EUR/TRY rate fetched: ${r}`);
          setExchangeRate({ has_rates: true, eur_rate: r });
          setFormData(prev => ({ ...prev, eur_rate: r.toString() }));
        } else {
          setRateValidationMessage(`⚠ EUR/TRY rate not found for ${date}.`);
          setExchangeRate({ has_rates: false });
          setFormData(prev => ({ ...prev, eur_rate: '0.00' }));
        }
      }

      if (currency === 'USD') {
        const res = await exchangeRatesService.fetchRate({ date, currency_pair: 'USD/TRY' });
        if (res.status === 'success' && res.rate?.rate) {
          const r = res.rate.rate;
          setRateValidationMessage(`✓ USD/TRY rate fetched: ${r}`);
          setFormData(prev => ({ ...prev, usd_rate: r.toString() }));
        } else {
          setRateValidationMessage(`⚠ USD/TRY rate not found for ${date}.`);
          setFormData(prev => ({ ...prev, usd_rate: '0.00' }));
        }
      }
    } catch (error) {
      setRateValidationMessage(`✗ Error: ${error}`);
    }
  };

  const applyUsdRate = () => {
    const amount = parseFloat(formData.amount || '0');
    const rate = parseFloat(formData.usd_rate || '0');
    if (!isNaN(amount) && !isNaN(rate) && rate > 0) {
      const tl = amount * rate;
      setConvertedAmountTL(tl.toFixed(2));
    } else {
      setConvertedAmountTL('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('🚀 Starting transaction creation...', {
      formData,
      timestamp: new Date().toISOString(),
    });

    // Enhanced validation
    if (!formData.client_name.trim()) {
      setError('Client name is required.');
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }

    if (!formData.date) {
      setError('Please select a date.');
      return;
    }

    if (!formData.currency) {
      setError('Please select a currency.');
      return;
    }

    if (!formData.category) {
      setError('Please select a category (WD or DEP).');
      return;
    }

    // Validate category is one of the allowed values
    if (!['WD', 'DEP'].includes(formData.category)) {
      setError('Category must be WD (Withdraw) or DEP (Deposit).');
      return;
    }

    // Validate currency is one of the allowed values
    if (!['TL', 'USD', 'EUR'].includes(formData.currency)) {
      setError('Currency must be TL, USD, or EUR.');
      return;
    }

    if (formData.currency === 'EUR' && !formData.eur_rate) {
      setError('Please enter the EUR exchange rate.');
      return;
    }

    if (formData.currency === 'USD' && !formData.usd_rate) {
      setError('Please enter the USD exchange rate.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Pre-submission session validation with enhanced checks
      console.log('🔍 Validating session before transaction submission...');

      // Step 1: Check if we have a valid session
      const authResponse = await api.get('/api/v1/auth/check');
      if (!authResponse.ok) {
        console.warn('⚠️ Auth check failed, attempting session refresh...');
        const sessionValid = await api.refreshSession();
        if (!sessionValid) {
          setError(
            'Session validation failed. Please refresh the page and try again.'
          );
          setSubmitting(false);
          return;
        }
      }

      // Step 2: Ensure we have a fresh CSRF token
      const csrfResponse = await api.get('/api/v1/auth/csrf-token');
      if (!csrfResponse.ok) {
        console.warn(
          '⚠️ CSRF token check failed, attempting session refresh...'
        );
        const sessionValid = await api.refreshSession();
        if (!sessionValid) {
          setError(
            'CSRF token validation failed. Please refresh the page and try again.'
          );
          setSubmitting(false);
          return;
        }
      }

      // Prepare payload with exchange rate if provided
      const payload: any = { ...formData };
      if (formData.currency === 'USD' && formData.usd_rate) {
        payload.exchange_rate = formData.usd_rate;
      }
      if (formData.currency === 'EUR' && formData.eur_rate) {
        payload.exchange_rate = formData.eur_rate;
      }

      console.log('📤 Sending transaction data to API...', {
        payload,
        validation: {
          category: formData.category,
          currency: formData.currency,
          amount: formData.amount,
          client_name: formData.client_name,
        },
      });

      // Try to create transaction with automatic retry
      let response: Response | null = null;
      let retryCount = 0;
      const maxRetries = 2;

      while (retryCount <= maxRetries) {
        try {
          response = await api.post('/api/v1/transactions', payload);

          // If successful, break out of retry loop
          if (response && response.ok) {
            break;
          }

          // If we get a 401 or 400, try to refresh session and retry
          if (
            response && (response.status === 401 || response.status === 400) &&
            retryCount < maxRetries
          ) {
            console.log(
              `🔄 Attempt ${retryCount + 1}: Session/CSRF issue detected, refreshing...`
            );

            // Force refresh session with multiple methods
            try {
              // Method 1: Direct API refresh
              const refreshSuccess = await api.refreshSession();
              if (!refreshSuccess) {
                console.warn(
                  'Direct API refresh failed, trying health monitor...'
                );
                // Method 2: Health monitor refresh
                await healthMonitor.refreshSession();
              }
            } catch (refreshError) {
              console.warn('All refresh methods failed:', refreshError);
              // Method 3: Manual page refresh as last resort
              if (retryCount === maxRetries - 1) {
                console.log('🔄 Last resort: suggesting page refresh...');
                setError(
                  'Session expired. Please refresh the page and try again.'
                );
                setSubmitting(false);
                return;
              }
            }

            retryCount++;
            continue;
          }

          // For other errors, break and handle normally
          break;
        } catch (error) {
          console.error(`💥 Attempt ${retryCount + 1} failed:`, error);

          if (retryCount < maxRetries) {
            console.log(`🔄 Retrying... (${retryCount + 1}/${maxRetries})`);
            retryCount++;
            // Wait a bit before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          } else {
            throw error;
          }
        }
      }

      // Ensure we have a response
      if (!response) {
        throw new Error(
          'Failed to get response from server after all retry attempts'
        );
      }

      console.log('📥 Received API response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: response.url,
        redirected: response.redirected,
        headers: Object.fromEntries(response.headers.entries()),
      });

      const data = await api.parseResponse(response);

      console.log('🔍 Parsed response data:', data);

      if (response.ok && data.success) {
        console.log('✅ Transaction created successfully!');
        setSuccess(true);
        
        // Dispatch event to refresh transaction lists in other components
        // Add a small delay to ensure transaction is fully committed
        setTimeout(() => {
          console.log('🔄 Dispatching transactionsUpdated event...');
          window.dispatchEvent(new CustomEvent('transactionsUpdated', {
            detail: { 
              action: 'create',
              transactionId: data.transaction?.id
            }
          }));
        }, 500);
        
        // Reset form
        setFormData({
          client_name: '',
          company: '',
          date: '',
          amount: '',
          payment_method: '',
          currency: '',
          category: '',
          psp: '',
          notes: '',
          eur_rate: '',
          usd_rate: '',
        });
        setConvertedAmountTL('');
      } else {
        const errorMessage =
          data?.error || data?.message || 'Failed to add transaction';
        console.error('❌ Transaction creation failed:', errorMessage);
        setError(errorMessage);
      }
    } catch (error) {
      console.error('💥 Error adding transaction:', error);

      // Enhanced error handling
      if (error instanceof Error) {
        const errorMessage = error.message;
        console.error('Error details:', {
          message: errorMessage,
          stack: error.stack,
          timestamp: new Date().toISOString(),
        });

        // Provide more specific error messages
        if (
          errorMessage.includes('CSRF') ||
          errorMessage.includes('Security token')
        ) {
          setError(
            'Security token issue. Please refresh the page and try again.'
          );
        } else if (
          errorMessage.includes('Authentication') ||
          errorMessage.includes('login')
        ) {
          setError('Session expired. Please log in again.');
        } else if (
          errorMessage.includes('401') ||
          errorMessage.includes('unauthorized')
        ) {
          setError('Authentication required. Please log in to continue.');
        } else if (
          errorMessage.includes('308') ||
          errorMessage.includes('redirect')
        ) {
          setError('URL redirect issue. Please try again.');
        } else if (errorMessage.includes('404')) {
          setError('API endpoint not found. Please check your connection.');
        } else if (errorMessage.includes('500')) {
          setError('Server error. Please try again in a few moments.');
        } else if (errorMessage.includes('403')) {
          setError('Access denied. Please check your permissions.');
        } else {
          setError(`Failed to add transaction: ${errorMessage}`);
        }
      } else {
        setError('Failed to add transaction. Please try again.');
      }
    } finally {
      setSubmitting(false);
      console.log('🏁 Transaction creation process completed');
    }
  };

  const handleCancel = () => {
    // Navigate back to transactions page
    window.location.href = '/transactions';
  };

  const resetForm = () => {
    setFormData({
      client_name: '',
      company: '',
      date: '',
      amount: '',
      payment_method: '',
      currency: '',
      category: '',
      psp: '',
      notes: '',
      eur_rate: '',
      usd_rate: '',
    });
    setSuccess(false);
    setError(null);
    setDropdownsLoaded(false);
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto'></div>
          <p className='mt-4 text-gray-600'>Loading...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <div className='w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
            <CheckCircle className='h-10 w-10 text-green-600' />
          </div>
          <h2 className='text-2xl font-bold text-gray-900 mb-2'>
            Transaction Added Successfully!
          </h2>
          <p className='text-gray-600 mb-6'>
            The transaction has been added to your pipeline.
          </p>
          <div className='flex gap-3 justify-center'>
            <button
              onClick={() => (window.location.href = '/transactions')}
              className='inline-flex items-center px-6 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm'
            >
              View Clients
            </button>
            <button
              onClick={resetForm}
              className='inline-flex items-center px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors'
            >
              Add Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-8'>
      {/* Enhanced Header */}
      <div className='bg-gradient-to-r from-blue-50 via-white to-purple-50 rounded-2xl p-8 border border-gray-100 shadow-sm'>
        <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6'>
          <div className='space-y-3'>
            <div className='flex items-center gap-3'>
              <button
                onClick={handleCancel}
                className='inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors'
              >
                <ArrowLeft className='h-4 w-4' />
                Back to Transactions
              </button>
            </div>
            <div className='flex items-center gap-3'>
              <div className='w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg'>
                <FileText className='h-6 w-6 text-white' />
              </div>
              <div>
                <h1 className='text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent tracking-tight'>
                  Add New Transaction
                </h1>
                <p className='text-lg text-gray-600 mt-1'>
                  Enter the transaction details below to add a new record to your pipeline
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className='bg-red-50 border border-red-200 rounded-xl p-4'>
          <div className='flex items-center gap-2 text-red-800'>
            <AlertTriangle className='h-5 w-5' />
            <span className='font-medium'>Error:</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Form */}
      <div className='bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden'>
        <form onSubmit={handleSubmit}>
          <div className='p-6 space-y-6'>
            {/* Basic Information */}
            <div className='space-y-4'>
              <h4 className='text-lg font-medium text-gray-900'>Basic Information</h4>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Client Name *
                  </label>
                  <input
                    type='text'
                    value={formData.client_name}
                    onChange={e => handleInputChange('client_name', e.target.value)}
                    className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200'
                    placeholder='Enter client name'
                    required
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Date *
                  </label>
                  <input
                    type='date'
                    value={formData.date}
                    onChange={e => handleInputChange('date', e.target.value)}
                    className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200'
                    required
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Amount *
                  </label>
                  <input
                    type='number'
                    step='0.01'
                    value={formData.amount}
                    onChange={e => handleInputChange('amount', e.target.value)}
                    className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200'
                    placeholder='0.00'
                    required
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Currency *
                  </label>
                  <select
                    value={formData.currency}
                    onChange={e => handleInputChange('currency', e.target.value)}
                    className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200'
                    required
                  >
                    <option value=''>Select Currency</option>
                    {dropdownOptions.currency?.map(option => (
                      <option key={option.id} value={option.value}>
                        {option.value}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className='space-y-4'>
              <h4 className='text-lg font-medium text-gray-900'>Payment Information</h4>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Payment Method *
                  </label>
                  <select
                    value={formData.payment_method}
                    onChange={e => handleInputChange('payment_method', e.target.value)}
                    className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200'
                    required
                  >
                    <option value=''>Select Payment Method</option>
                    {dropdownOptions.payment_method?.map(option => (
                      <option key={option.id} value={option.value}>
                        {option.value}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={e => handleInputChange('category', e.target.value)}
                    className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200'
                    required
                  >
                    <option value=''>Select Category</option>
                    <option value='WD'>WD (Withdraw)</option>
                    <option value='DEP'>DEP (Deposit)</option>
                  </select>
                  <p className='text-sm text-gray-500 mt-1'>
                    WD = Withdraw (no commission), DEP = Deposit (with commission)
                  </p>
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    PSP/KASA (Optional)
                  </label>
                  <select
                    value={formData.psp}
                    onChange={e => handleInputChange('psp', e.target.value)}
                    className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200'
                  >
                    <option value=''>Select PSP/KASA</option>
                    {dropdownOptions.psp?.map(option => (
                      <option key={option.id} value={option.value}>
                        {option.value}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Company Information */}
            <div className='space-y-4'>
              <h4 className='text-lg font-medium text-gray-900'>Company Information</h4>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Company
                  </label>
                  <select
                    value={formData.company}
                    onChange={e => handleInputChange('company', e.target.value)}
                    className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200'
                  >
                    <option value=''>Select Company</option>
                    {dropdownOptions.company?.map(option => (
                      <option key={option.id} value={option.value}>
                        {option.value}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className='space-y-4'>
              <h4 className='text-lg font-medium text-gray-900'>Additional Information</h4>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={e => handleInputChange('notes', e.target.value)}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200'
                  placeholder='Enter any additional notes or comments about this transaction'
                  rows={4}
                />
                <p className='text-sm text-gray-500 mt-1'>
                  Optional notes to help track transaction details
                </p>
              </div>
            </div>

            {/* Exchange Rate Section */}
            {showExchangeRateSection && (
              <div className='space-y-4'>
                <h4 className='text-lg font-medium text-gray-900'>Exchange Rates</h4>
                <div className='p-6 bg-yellow-50 border border-yellow-200 rounded-lg'>
                  <div className='flex items-center gap-2 mb-4'>
                    <AlertTriangle className='h-5 w-5 text-yellow-600' />
                    <h3 className='font-semibold text-yellow-800'>
                      Exchange Rates Required
                    </h3>
                  </div>

                  <div className='mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg'>
                    <p className='text-yellow-800 text-sm'>
                      <strong>
                        Exchange rates are required for foreign currency transactions.
                      </strong>
                      <br />
                      Please enter the exchange rates for the selected date to ensure accurate conversions.
                    </p>
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    {formData.currency === 'EUR' && (
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                          EUR to TL Rate
                        </label>
                        <input
                          type='number'
                          step='0.0001'
                          min='0'
                          value={formData.eur_rate}
                          onChange={e => handleInputChange('eur_rate', e.target.value)}
                          className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200'
                          placeholder='0.0000'
                          required={formData.currency === 'EUR'}
                        />
                        <p className='text-sm text-gray-500 mt-1'>
                          Auto-fetched when possible. If no rate, it defaults to 0.00.
                        </p>
                      </div>
                    )}

                    {formData.currency === 'USD' && (
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                          USD to TL Rate
                        </label>
                        <div className='flex gap-2'>
                          <input
                            type='number'
                            step='0.0001'
                            min='0'
                            value={formData.usd_rate}
                            onChange={e => handleInputChange('usd_rate', e.target.value)}
                            className='flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200'
                            placeholder='0.0000'
                          />
                          <button
                            type='button'
                            onClick={() => setShowCurrencyModal(true)}
                            className='px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center space-x-1'
                          >
                            <DollarSign className="h-4 w-4" />
                            <span>Get Rate</span>
                          </button>
                          <button
                            type='button'
                            onClick={applyUsdRate}
                            className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200'
                          >
                            Apply
                          </button>
                        </div>
                        {convertedAmountTL && (
                          <p className='text-sm text-gray-600 mt-2'>
                            Converted TL Amount: <span className='font-semibold'>{convertedAmountTL}</span>
                          </p>
                        )}
                        <p className='text-sm text-gray-500 mt-1'>
                          Auto-fetched when possible. If no rate, it defaults to 0.00.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Rate Validation Status */}
                  {rateValidationMessage && (
                    <div className='mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
                      <div className='flex items-center gap-2'>
                        <Info className='h-4 w-4 text-blue-600' />
                        <span className='text-blue-800 text-sm'>
                          <strong>Rate Validation:</strong> {rateValidationMessage}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className='p-6 border-t border-gray-100'>
            <div className='flex gap-3'>
              <button
                type='button'
                onClick={handleCancel}
                className='flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200'
              >
                Cancel
              </button>
              <button
                type='submit'
                disabled={submitting}
                className='flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {submitting ? 'Adding Transaction...' : 'Add Transaction'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Settings Link */}
      <div className='bg-white rounded-xl shadow-sm border border-gray-100 p-6'>
        <div className='text-center'>
          <a
            href='/settings?tab=dropdowns'
            className='inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm'
          >
            <Settings className='h-4 w-4' />
            Manage Dropdown Options
          </a>
          <div className='mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg'>
            <div className='flex items-center gap-2 text-blue-800'>
              <Info className='h-4 w-4' />
              <div className='text-sm'>
                <strong>Need to customize dropdown options?</strong>
                <br />
                If you want to add your own payment methods, companies, or PSPs, click the "Manage Dropdown Options" button above. This will take you to the settings page where you can add, edit, or remove options from the dropdown menus.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Currency Conversion Modal */}
      <CurrencyConversionModal
        isOpen={showCurrencyModal}
        onClose={() => setShowCurrencyModal(false)}
        onRateSelect={handleCurrencyRateSelect}
        currentAmount={parseFloat(formData.amount) || 0}
        transactionDate={formData.date}
      />
    </div>
  );
}
