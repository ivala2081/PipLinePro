import { SWRConfiguration } from 'swr';
import { isDevelopment } from './environment';

// SWR configuration for data fetching and caching
export const swrConfig: SWRConfiguration = {
  // Revalidate data every 5 minutes
  refreshInterval: 5 * 60 * 1000,
  // Keep data in cache for 10 minutes
  dedupingInterval: 10 * 60 * 1000,
  // Retry failed requests 3 times
  errorRetryCount: 3,
  // Retry delay with exponential backoff
  errorRetryInterval: 1000,
  // Focus revalidation in development
  revalidateOnFocus: isDevelopment(),
  // Revalidate on reconnect
  revalidateOnReconnect: true,
  // Revalidate on mount if data is stale
  revalidateOnMount: true,
  // Compare function for determining if data has changed
  compare: (a, b) => JSON.stringify(a) === JSON.stringify(b),
};

// Query keys factory for consistent key management
export const queryKeys = {
  // Dashboard queries
  dashboard: {
    stats: (range: string = 'all') => `/api/v1/analytics/dashboard/stats?range=${range}`,
    topPerformers: (range: string = 'all') => `/api/v1/analytics/top-performers?range=${range}`,
    revenueTrends: (range: string = 'all') => `/api/v1/analytics/revenue/trends?range=${range}`,
  },
  
  // Analytics queries
  analytics: {
    clients: (range: string) => `/api/v1/analytics/clients/analytics?range=${range}`,
    commission: (range: string) => `/api/v1/analytics/commission/analytics?range=${range}`,
    volumeAnalysis: (range: string) => `/api/v1/analytics/transactions/volume-analysis?range=${range}`,
    systemPerformance: () => '/api/v1/analytics/system/performance',
    dataQuality: () => '/api/v1/analytics/data/quality',
    integrationStatus: () => '/api/v1/analytics/integration/status',
    securityMetrics: () => '/api/v1/analytics/security/metrics',
    ledgerData: (days: number) => `/api/v1/analytics/ledger-data?days=${days}`,
  },
  
  // Transaction queries
  transactions: {
    all: (params?: any) => `/api/v1/transactions?${new URLSearchParams(params)}`,
    clients: () => '/api/v1/transactions/clients',
    dropdownOptions: () => '/api/v1/transactions/dropdown-options',
    pspSummaryStats: () => '/api/v1/transactions/psp_summary_stats',
  },
  
  // User queries
  users: {
    settings: () => '/api/v1/users/settings',
    profile: () => '/api/v1/users/profile',
  },
  
  // Auth queries
  auth: {
    check: () => '/api/v1/auth/check',
    csrfToken: () => '/api/v1/auth/csrf-token',
  },
  
  // Exchange rates queries
  exchangeRates: {
    all: () => '/api/exchange-rates',
    refresh: () => '/api/exchange-rates/refresh',
  },
} as const;

// Fetcher function for SWR
export const fetcher = async (url: string) => {
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};

export default swrConfig;
