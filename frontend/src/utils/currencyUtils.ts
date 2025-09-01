/**
 * Currency formatting utilities for PipLine Treasury System
 */

// Map internal currency codes to valid ISO 4217 codes
const CURRENCY_MAP: { [key: string]: string } = {
  'TL': 'TL',  // Turkish Lira
  'USD': 'USD', // US Dollar
  'EUR': 'EUR', // Euro
};

/**
 * Format currency amount with proper currency code mapping
 * @param amount - The amount to format
 * @param currency - The currency code (will be mapped to valid ISO 4217)
 * @param locale - The locale for formatting (default: 'en-US')
 * @returns Formatted currency string
 */
export const formatCurrency = (
  amount: number,
  currency: string = '₺', // Default to Turkish Lira symbol
  locale: string = 'en-US'
): string => {
  // Map internal currency codes to valid ISO 4217 codes for Intl.NumberFormat
  const CURRENCY_MAP: { [key: string]: string } = {
    '₺': 'TL',  // Turkish Lira symbol → TL
    '$': 'USD',  // US Dollar symbol → USD
    '€': 'EUR',  // Euro symbol → EUR
    '£': 'GBP',  // British Pound symbol → GBP
    // Legacy support for text codes
    'TL': 'TL',
    'USD': 'USD',
    'EUR': 'EUR',
    'GBP': 'GBP',
  };

  const validCurrency = CURRENCY_MAP[currency] || currency;

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: validCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    // Fallback formatting if currency code is invalid
    console.warn(`Invalid currency code: ${currency}, using fallback formatting`);
    return `${currency}${amount.toLocaleString()}`;
  }
};

/**
 * Format currency amount without currency symbol (just the number)
 * @param amount - The amount to format
 * @param locale - The locale for formatting (default: 'en-US')
 * @returns Formatted number string
 */
export const formatAmount = (
  amount: number, 
  locale: string = 'en-US'
): string => {
  try {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    return amount.toFixed(2);
  }
};

/**
 * Get the valid ISO 4217 currency code for an internal currency code
 * @param internalCode - The internal currency code
 * @returns The valid ISO 4217 currency code
 */
export const getValidCurrencyCode = (internalCode: string): string => {
  return CURRENCY_MAP[internalCode] || internalCode;
};

/**
 * Check if a currency code is valid for Intl.NumberFormat
 * @param currencyCode - The currency code to check
 * @returns True if the currency code is valid
 */
export const isValidCurrencyCode = (currencyCode: string): boolean => {
  try {
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    });
    return true;
  } catch {
    return false;
  }
};

// Helper function to get currency symbol from code
export const getCurrencySymbol = (currencyCode: string): string => {
  const SYMBOL_MAP: { [key: string]: string } = {
    'TL': '₺',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
  };
  
  return SYMBOL_MAP[currencyCode] || currencyCode;
};

// Helper function to format amount with symbol only (no currency formatting)
export const formatAmountWithSymbol = (
  amount: number,
  currency: string = '₺'
): string => {
  return `${currency}${amount.toLocaleString()}`;
};
