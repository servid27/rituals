'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useSpeedInsights } from '@/libs/speed-insights';
import AdminNavigation from '@/components/AdminNavigation';
import { isAdminUser } from '@/libs/admin';

interface SpeedMetric {
  id: string;
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  navigationType: string;
  timestamp: number;
}

export default function SpeedInsightsAdminPage() {
  const [metrics, setMetrics] = useState<SpeedMetric[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [performanceScore, setPerformanceScore] = useState<number>(100);
  const [loading, setLoading] = useState(true);
  const speedInsights = useSpeedInsights();
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
    const loadData = () => {
      setMetrics(speedInsights.getMetrics());
      setSummary(speedInsights.getMetricsSummary());
      setPerformanceScore(speedInsights.getPerformanceScore());
      setLoading(false);
    };

    loadData();
    const interval = setInterval(loadData, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [speedInsights]);

  const formatValue = (metric: SpeedMetric) => {
    if (metric.name === 'CLS') {
      return metric.value.toFixed(3);
    }
    return Math.round(metric.value);
  };

  const getMetricDescription = (name: string) => {
    const descriptions = {
      CLS: 'Cumulative Layout Shift - Measures visual stability',
      FCP: 'First Contentful Paint - Time to first content render',
      FID: 'First Input Delay - Time from first user interaction to response',
      INP: 'Interaction to Next Paint - Responsiveness to user interactions',
      LCP: 'Largest Contentful Paint - Time to largest content element',
      TTFB: 'Time to First Byte - Server response time',
      custom_pageLoad: 'Custom Page Load Time',
      custom_domLoad: 'Custom DOM Load Time',
      custom_ttfb: 'Custom Time to First Byte',
      custom_lcp: 'Custom Largest Contentful Paint',
      custom_routeChange: 'Custom Route Change Time',
    };
    return descriptions[name as keyof typeof descriptions] || name;
  };

  const getRatingBadge = (rating: string) => {
    switch (rating) {
      case 'good':
        return 'badge-success';
      case 'needs-improvement':
        return 'badge-warning';
      case 'poor':
        return 'badge-error';
      default:
        return 'badge-neutral';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-success';
    if (score >= 70) return 'text-warning';
    return 'text-error';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-base-100 p-8">
        <div className="flex items-center justify-center">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <span className="text-4xl">⚡</span>
              Speed Insights Dashboard
            </h1>
            <p className="text-gray-600 mt-2">Core Web Vitals and performance metrics analysis</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="badge badge-primary">{metrics.length} metrics collected</div>
            <button
              onClick={() => {
                speedInsights.clearMetrics();
                setMetrics([]);
                setSummary(speedInsights.getMetricsSummary());
                setPerformanceScore(speedInsights.getPerformanceScore());
              }}
              className="btn btn-sm btn-outline"
            >
              Clear Metrics
            </button>
          </div>
        </div>

        {/* Admin Navigation */}
        <div className="mb-8">
          <AdminNavigation currentPath="/admin/speed-insights" />
        </div>

        {/* Performance Score */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="stat bg-base-200 rounded-lg">
            <div className="stat-title">Performance Score</div>
            <div className={`stat-value text-3xl ${getScoreColor(performanceScore)}`}>{performanceScore}</div>
            <div className="stat-desc">
              {performanceScore >= 90 ? '🚀 Excellent' : performanceScore >= 70 ? '👍 Good' : '⚠️ Needs Improvement'}
            </div>
          </div>

          <div className="stat bg-base-200 rounded-lg">
            <div className="stat-title">Good Metrics</div>
            <div className="stat-value text-success">{summary?.goodMetrics || 0}</div>
            <div className="stat-desc">Performing well</div>
          </div>

          <div className="stat bg-base-200 rounded-lg">
            <div className="stat-title">Needs Improvement</div>
            <div className="stat-value text-warning">{summary?.needsImprovementMetrics || 0}</div>
            <div className="stat-desc">Could be better</div>
          </div>

          <div className="stat bg-base-200 rounded-lg">
            <div className="stat-title">Poor Metrics</div>
            <div className="stat-value text-error">{summary?.poorMetrics || 0}</div>
            <div className="stat-desc">Needs attention</div>
          </div>
        </div>

        {/* Metrics Table */}
        <div className="card bg-base-200 mb-6">
          <div className="card-body">
            <h2 className="card-title mb-4">Web Vitals & Performance Metrics</h2>

            {metrics.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-base-content/60 mb-4">
                  No metrics collected yet. Navigate around the app to generate performance data.
                </div>
                <div className="text-sm text-base-content/40">
                  Metrics are automatically collected as you use the application.
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>Metric</th>
                      <th>Value</th>
                      <th>Rating</th>
                      <th>Type</th>
                      <th>Timestamp</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics
                      .slice()
                      .reverse()
                      .map((metric) => (
                        <tr key={metric.id}>
                          <td>
                            <div className="font-mono font-bold">{metric.name.toUpperCase()}</div>
                          </td>
                          <td>
                            <div className="font-mono">
                              {formatValue(metric)}
                              {metric.name === 'CLS' ? '' : 'ms'}
                            </div>
                          </td>
                          <td>
                            <div className={`badge ${getRatingBadge(metric.rating)}`}>{metric.rating}</div>
                          </td>
                          <td>
                            <div className="text-sm">{metric.navigationType}</div>
                          </td>
                          <td>
                            <div className="text-sm">{new Date(metric.timestamp).toLocaleTimeString()}</div>
                          </td>
                          <td>
                            <div className="text-sm text-base-content/60">{getMetricDescription(metric.name)}</div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Help Section */}
        <div className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title">Understanding Web Vitals</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              <div className="p-4 bg-base-100 rounded-lg">
                <h3 className="font-bold text-sm mb-2">🎨 LCP (Largest Contentful Paint)</h3>
                <p className="text-xs text-base-content/60">
                  Measures loading performance. Good: &lt;2.5s, Poor: &gt;4s
                </p>
              </div>
              <div className="p-4 bg-base-100 rounded-lg">
                <h3 className="font-bold text-sm mb-2">⚡ FID (First Input Delay)</h3>
                <p className="text-xs text-base-content/60">Measures interactivity. Good: &lt;100ms, Poor: &gt;300ms</p>
              </div>
              <div className="p-4 bg-base-100 rounded-lg">
                <h3 className="font-bold text-sm mb-2">📐 CLS (Cumulative Layout Shift)</h3>
                <p className="text-xs text-base-content/60">Measures visual stability. Good: &lt;0.1, Poor: &gt;0.25</p>
              </div>
              <div className="p-4 bg-base-100 rounded-lg">
                <h3 className="font-bold text-sm mb-2">🎯 FCP (First Contentful Paint)</h3>
                <p className="text-xs text-base-content/60">Time to first content. Good: &lt;1.8s, Poor: &gt;3s</p>
              </div>
              <div className="p-4 bg-base-100 rounded-lg">
                <h3 className="font-bold text-sm mb-2">🔄 INP (Interaction to Next Paint)</h3>
                <p className="text-xs text-base-content/60">
                  Measures responsiveness. Good: &lt;200ms, Poor: &gt;500ms
                </p>
              </div>
              <div className="p-4 bg-base-100 rounded-lg">
                <h3 className="font-bold text-sm mb-2">⏱️ TTFB (Time to First Byte)</h3>
                <p className="text-xs text-base-content/60">Server response time. Good: &lt;800ms, Poor: &gt;1800ms</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
