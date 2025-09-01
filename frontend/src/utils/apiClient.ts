/**
 * Centralized API Client with automatic CSRF token handling
 * This ensures all API calls work consistently
 */

import { apiConfig, loggingConfig } from '../config/environment';
import { measureAsync } from './performance';

class ApiClient {
  private csrfToken: string | null = null;
  private isGettingToken = false;
  private tokenPromise: Promise<string | null> | null = null;
  
  // Add caching and rate limiting
  private lastAuthCheck = 0;
  private lastTokenFetch = 0;
  private authCheckCache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 30000; // 30 seconds
  private readonly RATE_LIMIT_DELAY = 2000; // 2 seconds between auth checks

  // Request deduplication and batching
  private pendingRequests = new Map<string, Promise<any>>();
  private requestQueue: Array<{ id: string; request: () => Promise<any>; resolve: (value: any) => void; reject: (error: any) => void }> = [];
  private isProcessingQueue = false;
  private readonly BATCH_DELAY = 50; // 50ms to batch requests

  /**
   * Get CSRF token with caching and deduplication
   */
  private async getCsrfToken(): Promise<string | null> {
    const now = Date.now();
    
    // Rate limiting: don't fetch token too frequently
    if (now - this.lastTokenFetch < this.RATE_LIMIT_DELAY) {
      console.log('⏳ Rate limiting CSRF token fetch');
      return this.csrfToken;
    }

    // If we already have a token, return it
    if (this.csrfToken) {
      return this.csrfToken;
    }

    // If we're already getting a token, wait for that promise
    if (this.isGettingToken && this.tokenPromise) {
      return this.tokenPromise;
    }

    // Start getting a new token
    this.isGettingToken = true;
    this.lastTokenFetch = now;
    this.tokenPromise = this.fetchCsrfToken();

    try {
      this.csrfToken = await this.tokenPromise;
      return this.csrfToken;
    } finally {
      this.isGettingToken = false;
      this.tokenPromise = null;
    }
  }

  /**
   * Fetch CSRF token from server with enhanced session handling
   */
  private async fetchCsrfToken(): Promise<string | null> {
    try {
      console.log('🔄 Fetching fresh CSRF token...');

      // Step 1: Ensure we have a valid session by checking auth
      const authResponse = await fetch('/api/v1/auth/check', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      });

      if (!authResponse.ok) {
        console.warn('⚠️ Auth check failed, session may be invalid');
        return null;
      }

      // Step 2: Get the CSRF token with enhanced handling
      const response = await fetch('/api/v1/auth/csrf-token', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const token = data.csrf_token;

        console.log(
          '✅ CSRF token fetched successfully:',
          token ? `${token.substring(0, 20)}...` : 'null'
        );

        // Enhanced validation - check if token exists and has reasonable length
        if (token && token.length > 20) {
          return token;
        } else {
          console.warn('⚠️ Invalid CSRF token format');
          return null;
        }
      } else {
        console.error('❌ Failed to fetch CSRF token:', response.status, response.statusText);
        return null;
      }
    } catch (error) {
      console.error('💥 Error fetching CSRF token:', error);
      return null;
    }
  }

  /**
   * Create a unique request key for deduplication
   */
  private createRequestKey(method: string, url: string, data?: any): string {
    const dataStr = data ? JSON.stringify(data) : '';
    return `${method}:${url}:${dataStr}`;
  }

  /**
   * Process the request queue to batch related requests
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      // Group requests by type for batching
      const analyticsRequests = this.requestQueue.filter(req => 
        req.id.includes('analytics') || req.id.includes('dashboard')
      );
      const otherRequests = this.requestQueue.filter(req => 
        !req.id.includes('analytics') && !req.id.includes('dashboard')
      );

      // Process analytics requests in parallel (they can be batched)
      if (analyticsRequests.length > 0) {
        console.log(`🚀 Batching ${analyticsRequests.length} analytics requests`);
        const promises = analyticsRequests.map(req => req.request());
        
        try {
          const results = await Promise.all(promises);
          analyticsRequests.forEach((req, index) => {
            req.resolve(results[index]);
          });
        } catch (error) {
          analyticsRequests.forEach(req => {
            req.reject(error);
          });
        }
      }

      // Process other requests individually
      for (const req of otherRequests) {
        try {
          const result = await req.request();
          req.resolve(result);
        } catch (error) {
          req.reject(error);
        }
      }

    } finally {
      this.requestQueue = [];
      this.isProcessingQueue = false;
    }
  }

  /**
   * Add request to queue with batching
   */
  private async queueRequest<T>(
    id: string, 
    request: () => Promise<T>
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.requestQueue.push({ id, request, resolve, reject });
      
      // Process queue after a short delay to allow batching
      setTimeout(() => {
        this.processQueue();
      }, this.BATCH_DELAY);
    });
  }

  /**
   * Make a request with deduplication and batching
   */
  private async makeRequest<T>(
    method: string,
    url: string,
    data?: any,
    options?: RequestInit
  ): Promise<T> {
    const requestKey = this.createRequestKey(method, url, data);
    
    // Check if we have a pending request for this key
    if (this.pendingRequests.has(requestKey)) {
      console.log(`🔄 Deduplicating request: ${method} ${url}`);
      const originalResponse = await this.pendingRequests.get(requestKey)!;
      
      // Clone the response for each consumer to avoid "body stream already read" error
      if (originalResponse instanceof Response) {
        return originalResponse.clone() as T;
      }
      
      return originalResponse;
    }

    // Create the request promise
    const requestPromise = this.executeRequest<T>(method, url, data, options);
    
    // Store it for deduplication
    this.pendingRequests.set(requestKey, requestPromise);
    
    // Clean up when done
    requestPromise.finally(() => {
      this.pendingRequests.delete(requestKey);
    });

    return requestPromise;
  }

  /**
   * Execute the actual request
   */
  private async executeRequest<T>(
    method: string,
    url: string,
    data?: any,
    options?: RequestInit
  ): Promise<T> {
    try {
      const token = await this.getCsrfToken();
      
      const requestOptions: RequestInit = {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          ...(token && { 'X-CSRFToken': token }),
          ...options?.headers,
        },
        ...options,
      };

      if (data && method !== 'GET') {
        requestOptions.body = JSON.stringify(data);
      }

      // Add query parameters for GET requests
      if (method === 'GET' && data) {
        const params = new URLSearchParams();
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value));
          }
        });
        const queryString = params.toString();
        if (queryString) {
          url += (url.includes('?') ? '&' : '?') + queryString;
        }
      }

      const response = await fetch(url, requestOptions);
      return response as T;
    } catch (error) {
      console.error(`💥 Request failed: ${method} ${url}`, error);
      throw error;
    }
  }

  /**
   * GET request with deduplication
   */
  async get<T = Response>(url: string, params?: Record<string, any>): Promise<T> {
    return this.makeRequest<T>('GET', url, params);
  }

  /**
   * POST request with deduplication
   */
  async post<T = Response>(url: string, data?: any): Promise<T> {
    return this.makeRequest<T>('POST', url, data);
  }

  /**
   * PUT request with deduplication
   */
  async put<T = Response>(url: string, data?: any): Promise<T> {
    return this.makeRequest<T>('PUT', url, data);
  }

  /**
   * DELETE request with deduplication
   */
  async delete<T = Response>(url: string): Promise<T> {
    return this.makeRequest<T>('DELETE', url);
  }

  /**
   * Batch multiple requests together for better performance
   */
  async batchRequests<T>(requests: Array<{ method: string; url: string; data?: any }>): Promise<T[]> {
    const promises = requests.map(req => 
      this.makeRequest<T>(req.method, req.url, req.data)
    );
    
    return Promise.all(promises);
  }

  /**
   * Parse response with better error handling and automatic cloning
   */
  async parseResponse<T = any>(response: Response): Promise<T> {
    // Clone the response to avoid "body stream already read" errors
    const clonedResponse = response.clone();
    
    if (!clonedResponse.ok) {
      const errorText = await clonedResponse.text();
      let errorData;
      
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText || 'Unknown error occurred' };
      }
      
      throw new Error(errorData.message || `HTTP ${clonedResponse.status}: ${clonedResponse.statusText}`);
    }

    try {
      const contentType = clonedResponse.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await clonedResponse.json();
      } else {
        return await clonedResponse.text() as T;
      }
    } catch (error) {
      console.error('Error parsing response:', error);
      throw new Error('Failed to parse response');
    }
  }

  /**
   * Clear CSRF token and reset authentication state
   */
  clearToken(): void {
    this.csrfToken = null;
    this.lastTokenFetch = 0;
    this.isGettingToken = false;
    this.tokenPromise = null;
  }

  /**
   * Refresh the current session and get a new CSRF token
   */
  async refreshSession(): Promise<boolean> {
    try {
      console.log('🔄 Refreshing session...');
      
      // Clear current token
      this.clearToken();
      
      // Attempt to get a new token
      const newToken = await this.getCsrfToken();
      
      if (newToken) {
        console.log('✅ Session refreshed successfully');
        return true;
      } else {
        console.warn('⚠️ Failed to refresh session');
        return false;
      }
    } catch (error) {
      console.error('❌ Error refreshing session:', error);
      return false;
    }
  }

  /**
   * Clear all caches and pending requests
   */
  clearCache(): void {
    this.authCheckCache.clear();
    this.pendingRequests.clear();
    this.requestQueue = [];
    this.csrfToken = null;
    this.lastAuthCheck = 0;
    this.lastTokenFetch = 0;
  }

  /**
   * Get cache statistics for debugging
   */
  getCacheStats(): {
    pendingRequests: number;
    queuedRequests: number;
    cacheSize: number;
  } {
    return {
      pendingRequests: this.pendingRequests.size,
      queuedRequests: this.requestQueue.length,
      cacheSize: this.authCheckCache.size,
    };
  }
}

// Export singleton instance
export const api = new ApiClient();

