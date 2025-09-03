'use client';

import { useState, useEffect, useCallback } from 'react';

interface AdminData {
  monitoring?: any;
  users?: any;
  analytics?: any;
}

interface CacheEntry {
  data: any;
  timestamp: number;
  expiry: number;
}

class AdminDataCache {
  private cache = new Map<string, CacheEntry>();
  private defaultExpiry = 30000; // 30 seconds

  set(key: string, data: any, expiry = this.defaultExpiry) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry,
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(key?: string) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() - entry.timestamp > entry.expiry) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }
}

const adminCache = new AdminDataCache();

export function useAdminData(endpoint: string, options: { expiry?: number } = {}) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(
    async (useCache = true) => {
      const cacheKey = `admin-${endpoint}`;

      // Try cache first if enabled - ALWAYS check cache first
      if (useCache && adminCache.has(cacheKey)) {
        const cachedData = adminCache.get(cacheKey);
        setData(cachedData);
        setLoading(false);
        console.log(`⚡ Using cached data for ${endpoint}`);
        return cachedData;
      }

      try {
        setError(null);
        // Only show loading if we don't have any data yet
        if (!data) {
          setLoading(true);
        }

        console.log(`🔄 Fetching fresh data for ${endpoint}...`);
        const response = await fetch(`/api/admin/${endpoint}`, {
          headers: {
            'Cache-Control': useCache ? 'max-age=30' : 'no-cache',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        // Store in cache
        adminCache.set(cacheKey, result, options.expiry);

        setData(result);
        console.log(`✅ Fresh data loaded for ${endpoint}`);
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error(`❌ Failed to fetch admin data from ${endpoint}:`, err);
      } finally {
        setLoading(false);
      }
    },
    [endpoint, options.expiry, data]
  );

  const refresh = useCallback(() => {
    setLoading(true);
    return fetchData(false);
  }, [fetchData]);

  useEffect(() => {
    // Check if data is already in cache immediately
    const cacheKey = `admin-${endpoint}`;
    if (adminCache.has(cacheKey)) {
      const cachedData = adminCache.get(cacheKey);
      setData(cachedData);
      setLoading(false);
      console.log(`⚡ Instant cache hit for ${endpoint}`);
    } else {
      // Fetch if not in cache
      fetchData(true);
    }
  }, [endpoint]); // Removed fetchData from dependencies to prevent loops

  return {
    data,
    loading,
    error,
    refresh,
    refetch: refresh,
  };
}

export function useAdminMonitoring() {
  return useAdminData('monitoring', { expiry: 30000 }); // 30 seconds
}

export function useAdminUsers() {
  return useAdminData('users', { expiry: 60000 }); // 1 minute
}

export function useAdminPerformance() {
  return useAdminData('performance', { expiry: 10000 }); // 10 seconds for real-time feel
}

// Clear all admin caches
export function clearAdminCache() {
  adminCache.clear();
}

// Preload admin data for faster navigation - AGGRESSIVE PRELOADING
export function preloadAdminData() {
  const endpoints = ['monitoring', 'users', 'performance'];

  // Start all requests immediately in parallel
  const preloadPromises = endpoints.map(async (endpoint) => {
    try {
      console.log(`🚀 Preloading ${endpoint} data...`);
      const response = await fetch(`/api/admin/${endpoint}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'max-age=60',
          Priority: 'high', // Tell browser this is high priority
        },
      });

      if (response.ok) {
        const data = await response.json();
        adminCache.set(`admin-${endpoint}`, data, endpoint === 'monitoring' ? 30000 : 60000);
        console.log(`✅ Preloaded ${endpoint} data successfully`);
        return data;
      } else {
        console.warn(`⚠️ Failed to preload ${endpoint}: ${response.status}`);
      }
    } catch (error) {
      console.debug(`❌ Failed to preload ${endpoint}:`, error);
    }
  });

  // Return promise that resolves when all data is loaded
  return Promise.allSettled(preloadPromises);
}

// Enhanced preloader that loads ALL admin data immediately
export function preloadAllAdminData() {
  console.log('🔥 Starting aggressive admin data preload...');

  // Start preloading immediately, don't wait
  const dataPromise = preloadAdminData();

  // Pre-warm the database connection
  const healthPromise = fetch('/api/admin/health', {
    method: 'GET',
    headers: { 'Cache-Control': 'no-cache' },
  })
    .then((response) => {
      if (response.ok) {
        console.log('✅ Database connection pre-warmed');
      }
    })
    .catch(() => {
      console.debug('Health check failed (expected if not authenticated)');
    });

  // Also warm up auth session
  const authPromise = fetch('/api/auth/session', {
    method: 'GET',
    headers: { 'Cache-Control': 'no-cache' },
  }).catch(() => {
    // Ignore errors for warmup
  });

  return Promise.allSettled([dataPromise, healthPromise, authPromise]);
}

export default adminCache;
