'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import AdminNavigation from '@/components/AdminNavigation';
import { isAdminUser } from '@/libs/admin';

interface MonitoringData {
  timestamp: string;
  status: string;
  uptime: number;
  memory: any;
  analytics: {
    totalUsers: number;
    activeUsers: number;
    totalSessions: number;
    errorRate: number;
    averageSessionDuration: number;
    popularRoutes: Array<{ path: string; views: number }>;
    deviceTypes: { mobile: number; desktop: number; tablet: number };
    browsers: { chrome: number; firefox: number; safari: number; edge: number };
  };
  system: {
    memoryUsage: number;
    responseTime: number;
    requestCount: number;
  };
}

export default function AdminMonitoringPage() {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { data: session, status } = useSession();

  // Handle authentication
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/api/auth/signin');
      return;
    }
    if (!isAdminUser(session)) {
      router.push('/dashboard');
      return;
    }
  }, [session, status, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/admin/monitoring');
        if (!response.ok) {
          throw new Error('Failed to fetch monitoring data');
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-base-100 p-8">
        <div className="flex items-center justify-center">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-base-100 p-8">
        <div className="alert alert-error">
          <span>Error loading monitoring data: {error}</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-base-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <span className="text-4xl">📊</span>
              Monitoring Dashboard
            </h1>
            <p className="text-gray-600 mt-2">Real-time system health and user activity tracking</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="badge badge-success">
              {data.status} • {new Date(data.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Admin Navigation */}
        <div className="mb-8">
          <AdminNavigation currentPath="/admin/monitoring" />
        </div>

        {/* System Health */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="stat bg-base-200 rounded-lg">
            <div className="stat-title">Uptime</div>
            <div className="stat-value text-2xl">{formatUptime(data.uptime)}</div>
            <div className="stat-desc">System running</div>
          </div>

          <div className="stat bg-base-200 rounded-lg">
            <div className="stat-title">Memory Usage</div>
            <div className="stat-value text-2xl">{data.system.memoryUsage}%</div>
            <div className="stat-desc">Heap utilization</div>
          </div>

          <div className="stat bg-base-200 rounded-lg">
            <div className="stat-title">Response Time</div>
            <div className="stat-value text-2xl">{data.system.responseTime}ms</div>
            <div className="stat-desc">Latest request</div>
          </div>

          <div className="stat bg-base-200 rounded-lg">
            <div className="stat-title">Error Rate</div>
            <div className="stat-value text-2xl">{data.analytics.errorRate}%</div>
            <div className="stat-desc">24h average</div>
          </div>
        </div>

        {/* Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="card bg-base-200">
            <div className="card-body">
              <h2 className="card-title">User Analytics</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="stat">
                  <div className="stat-title">Total Users</div>
                  <div className="stat-value text-primary">{data.analytics.totalUsers}</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Active Users</div>
                  <div className="stat-value text-secondary">{data.analytics.activeUsers}</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Total Sessions</div>
                  <div className="stat-value text-accent">{data.analytics.totalSessions}</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Avg. Session</div>
                  <div className="stat-value text-base-content">{data.analytics.averageSessionDuration}min</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-base-200">
            <div className="card-body">
              <h2 className="card-title">Popular Routes</h2>
              <div className="space-y-2">
                {data.analytics.popularRoutes.map((route, index) => (
                  <div key={route.path} className="flex justify-between items-center">
                    <span className="font-mono text-sm">{route.path}</span>
                    <span className="badge badge-outline">{route.views} views</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Device & Browser Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card bg-base-200">
            <div className="card-body">
              <h2 className="card-title">Device Types</h2>
              <div className="space-y-2">
                {Object.entries(data.analytics.deviceTypes).map(([device, count]) => (
                  <div key={device} className="flex justify-between items-center">
                    <span className="capitalize">{device}</span>
                    <span className="badge">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card bg-base-200">
            <div className="card-body">
              <h2 className="card-title">Browsers</h2>
              <div className="space-y-2">
                {Object.entries(data.analytics.browsers).map(([browser, count]) => (
                  <div key={browser} className="flex justify-between items-center">
                    <span className="capitalize">{browser}</span>
                    <span className="badge">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Memory Details */}
        <div className="card bg-base-200 mt-6">
          <div className="card-body">
            <h2 className="card-title">Memory Details</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="stat">
                <div className="stat-title">RSS</div>
                <div className="stat-value text-sm">{Math.round(data.memory.rss / 1024 / 1024)}MB</div>
              </div>
              <div className="stat">
                <div className="stat-title">Heap Used</div>
                <div className="stat-value text-sm">{Math.round(data.memory.heapUsed / 1024 / 1024)}MB</div>
              </div>
              <div className="stat">
                <div className="stat-title">Heap Total</div>
                <div className="stat-value text-sm">{Math.round(data.memory.heapTotal / 1024 / 1024)}MB</div>
              </div>
              <div className="stat">
                <div className="stat-title">External</div>
                <div className="stat-value text-sm">{Math.round(data.memory.external / 1024 / 1024)}MB</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
