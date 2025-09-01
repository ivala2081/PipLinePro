import React, { useState, useEffect } from 'react';
import { Save, X, AlertCircle, DollarSign } from 'lucide-react';
import { api } from '../utils/apiClient';
import { formatCurrency } from '../utils/currencyUtils';
import CurrencyConversionModal from './CurrencyConversionModal';

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

interface TransactionEditFormProps {
  transaction: Transaction;
  onSave: (updatedTransaction: Transaction) => void;
  onCancel: () => void;
  dropdownOptions: {
    categories: string[];
    psps: string[];
    payment_methods: string[];
    companies: string[];
  };
}

const TransactionEditForm: React.FC<TransactionEditFormProps> = ({
  transaction,
  onSave,
  onCancel,
  dropdownOptions = { categories: [], psps: [], payment_methods: [], companies: [] },
}) => {
  const [formData, setFormData] = useState({
    client_name: transaction.client_name || '',
    company: transaction.company || '',
    payment_method: transaction.payment_method || '',
    category: transaction.category || '',
    amount: transaction.amount?.toString() || '',
    currency: transaction.currency || 'TL',
    psp: transaction.psp || '',
    notes: transaction.notes || '',
    date: transaction.date ? transaction.date.split('T')[0] : new Date().toISOString().split('T')[0],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showExchangeRateSection, setShowExchangeRateSection] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [eurRate, setEurRate] = useState(transaction.exchange_rate?.toString() || '');
  const [usdRate, setUsdRate] = useState(transaction.exchange_rate?.toString() || '');
  const [convertedAmounts, setConvertedAmounts] = useState<{
    amount_try: number;
    commission_try: number;
    net_amount_try: number;
  } | null>(null);
  const [rateApplied, setRateApplied] = useState(false);

  // Check if exchange rate section should be shown
  useEffect(() => {
    if ((formData.currency === 'EUR' || formData.currency === 'USD') && formData.date) {
      setShowExchangeRateSection(true);
    } else {
      setShowExchangeRateSection(false);
    }
  }, [formData.currency, formData.date]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
    
    // Reset converted amounts when amount or currency changes
    if (field === 'amount' || field === 'currency') {
      setConvertedAmounts(null);
      setRateApplied(false);
    }
    
    // Show currency modal when USD is selected
    if (field === 'currency' && value === 'USD') {
      setShowCurrencyModal(true);
    }
  };

  const handleCurrencyRateSelect = (rate: number) => {
    setUsdRate(rate.toString());
    setShowCurrencyModal(false);
    // Reset converted amounts when rate is updated
    setConvertedAmounts(null);
    setRateApplied(false);
  };

  const handleApplyExchangeRate = () => {
    const amount = parseFloat(formData.amount) || 0;
    let rate = 0;
    
    if (formData.currency === 'USD') {
      rate = parseFloat(usdRate) || 0;
    } else if (formData.currency === 'EUR') {
      rate = parseFloat(eurRate) || 0;
    }
    
    if (rate > 0 && amount > 0) {
      const amount_try = amount * rate;
      const commission_try = 0; // Commission will be calculated by backend
      const net_amount_try = amount_try - commission_try;
      
      setConvertedAmounts({
        amount_try,
        commission_try,
        net_amount_try
      });
      setRateApplied(true);
      setError(null);
    } else {
      setError('Please enter valid amount and exchange rate.');
    }
  };

  const validateForm = () => {
    if (!formData.client_name.trim()) {
      setError('Client name is required.');
      return false;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Amount must be a positive number.');
      return false;
    }
    if (formData.currency === 'EUR' && !eurRate) {
      setError('Please enter the EUR exchange rate.');
      return false;
    }
    if (formData.currency === 'USD' && !usdRate) {
      setError('Please enter the USD exchange rate.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const updateData = {
        ...formData,
        amount: parseFloat(formData.amount),
        eur_rate: formData.currency === 'EUR' ? parseFloat(eurRate) : undefined,
        usd_rate: formData.currency === 'USD' ? parseFloat(usdRate) : undefined,
      };

      const response = await api.put(`/api/v1/transactions/${transaction.id}`, updateData);

      if (response.ok) {
        const result = await response.json();
        onSave(result.transaction);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update transaction.');
      }
    } catch (err) {
      setError('An error occurred while updating the transaction.');
      console.error('Error updating transaction:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-h-[80vh] overflow-y-auto pr-2 edit-form-scroll">
      <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Client Information */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-4">Client Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client Name *
            </label>
            <input
              type="text"
              value={formData.client_name}
              onChange={(e) => handleInputChange('client_name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company
            </label>
            <select
              value={formData.company}
              onChange={(e) => handleInputChange('company', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Company</option>
              {dropdownOptions?.companies?.map((company) => (
                <option key={company} value={company}>
                  {company}
                </option>
              )) || []}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </label>
            <select
              value={formData.payment_method}
              onChange={(e) => handleInputChange('payment_method', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Payment Method</option>
              {dropdownOptions?.payment_methods?.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              )) || []}
            </select>
          </div>
        </div>
      </div>

      {/* Transaction Details */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-4">Transaction Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select Category</option>
              {dropdownOptions?.categories?.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              )) || []}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              PSP
            </label>
            <select
              value={formData.psp}
              onChange={(e) => handleInputChange('psp', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select PSP</option>
              {dropdownOptions?.psps?.map((psp) => (
                <option key={psp} value={psp}>
                  {psp}
                </option>
              )) || []}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Currency
            </label>
            <select
              value={formData.currency}
              onChange={(e) => handleInputChange('currency', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="TL">TL</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transaction Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Exchange Rate Section */}
      {showExchangeRateSection && (
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-700 mb-4">Exchange Rate</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formData.currency === 'EUR' && (
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-2">
                  EUR Rate (1 EUR = ? TL)
                </label>
                                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={eurRate}
                    onChange={(e) => {
                      setEurRate(e.target.value);
                      setConvertedAmounts(null);
                      setRateApplied(false);
                    }}
                    className="w-full px-3 py-2 border border-blue-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
              </div>
            )}
            {formData.currency === 'USD' && (
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-2">
                  USD Rate (1 USD = ? TL)
                </label>
                <div className="flex space-x-3">
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={usdRate}
                    onChange={(e) => {
                      setUsdRate(e.target.value);
                      setConvertedAmounts(null);
                      setRateApplied(false);
                    }}
                    className="flex-1 px-3 py-2 border border-blue-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrencyModal(true)}
                    className="px-4 py-2 bg-blue-100 text-blue-700 border border-blue-300 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 flex items-center space-x-2"
                  >
                    <DollarSign className="h-4 w-4" />
                    <span className="text-sm font-medium">Get Rate</span>
                  </button>
                </div>
                {usdRate && (
                  <p className="text-xs text-blue-600 mt-1">
                    ${formData.amount || 0} USD = ₺{((parseFloat(formData.amount) || 0) * (parseFloat(usdRate) || 0)).toFixed(2)}
                  </p>
                )}
              </div>
            )}
          </div>
          
          {/* Apply Exchange Rate Button */}
          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={handleApplyExchangeRate}
              disabled={
                !formData.amount || 
                (formData.currency === 'USD' && !usdRate) || 
                (formData.currency === 'EUR' && !eurRate)
              }
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <span>Apply Exchange Rate</span>
            </button>
            
            {rateApplied && (
              <span className="text-sm text-green-600 font-medium">
                ✓ Rate applied successfully
              </span>
            )}
          </div>
          
          {/* Converted Amounts Display */}
          {convertedAmounts && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h5 className="text-sm font-medium text-green-800 mb-3">Converted Amounts (Turkish Lira)</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-700">Amount:</span>
                  <span className="font-medium text-green-900">
                    ₺{convertedAmounts.amount_try.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Commission:</span>
                  <span className="font-medium text-green-900">
                    ₺{convertedAmounts.commission_try.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Net Amount:</span>
                  <span className="font-medium text-green-900">
                    ₺{convertedAmounts.net_amount_try.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              <div className="mt-2 text-xs text-green-600">
                Exchange Rate: 1 {formData.currency} = ₺{formData.currency === 'USD' ? usdRate : eurRate}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Description */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-4">Additional Information</h4>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter transaction notes..."
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <X className="h-4 w-4 mr-2 inline" />
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </div>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2 inline" />
              Save Changes
            </>
          )}
        </button>
      </div>
      </form>

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
};

export default TransactionEditForm;
