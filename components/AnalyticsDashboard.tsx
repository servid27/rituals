'use client';

import { useState, useEffect } from 'react';
import { analytics } from '@/libs/analytics';

interface AnalyticsSummary {
  totalEvents: number;
  routineEvents: number;
  pwaEvents: number;
  userEvents: number;
  featureUsage: number;
  errorCount: number;
  lastActivity: string;
}

export default function AnalyticsDashboard() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Simulate analytics summary (in real app, this would come from Vercel Analytics API)
    const mockSummary: AnalyticsSummary = {
      totalEvents: 0,
      routineEvents: 0,
      pwaEvents: 0,
      userEvents: 0,
      featureUsage: 0,
      errorCount: 0,
      lastActivity: new Date().toLocaleTimeString(),
    };

    setSummary(mockSummary);

    // Update every 30 seconds
    const interval = setInterval(() => {
      setSummary((prev) =>
        prev
          ? {
              ...prev,
              lastActivity: new Date().toLocaleTimeString(),
            }
          : null
      );
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Test analytics functions
  const testAnalytics = () => {
    analytics.trackFeatureUsage('analytics_dashboard', {
      action: 'test_click',
      value: 1,
    });

    analytics.trackEvent('feature_used', {
      feature_name: 'analytics_test',
      test_mode: true,
    });
  };

  if (!summary || process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div
        className={`bg-base-100 border border-base-300 rounded-lg shadow-lg transition-all duration-300 ${
          isExpanded ? 'w-80' : 'w-16'
        }`}
      >
        <div className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              {isExpanded && <span className="text-sm font-medium">Analytics</span>}
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-base-content/60 hover:text-base-content transition-colors"
            >
              {isExpanded ? '✕' : '📈'}
            </button>
          </div>

          {isExpanded && (
            <div className="mt-3 space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center p-2 bg-base-200 rounded">
                  <div className="font-bold text-blue-600">{summary.routineEvents}</div>
                  <div className="text-base-content/60">Routines</div>
                </div>
                <div className="text-center p-2 bg-base-200 rounded">
                  <div className="font-bold text-green-600">{summary.pwaEvents}</div>
                  <div className="text-base-content/60">PWA</div>
                </div>
                <div className="text-center p-2 bg-base-200 rounded">
                  <div className="font-bold text-purple-600">{summary.userEvents}</div>
                  <div className="text-base-content/60">Users</div>
                </div>
                <div className="text-center p-2 bg-base-200 rounded">
                  <div className={`font-bold ${summary.errorCount > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                    {summary.errorCount}
                  </div>
                  <div className="text-base-content/60">Errors</div>
                </div>
              </div>

              <div className="border-t border-base-300 pt-2 space-y-1">
                <div className="flex justify-between">
                  <span className="text-base-content/60">Total Events:</span>
                  <span className="font-mono">{summary.totalEvents}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-base-content/60">Feature Usage:</span>
                  <span className="font-mono">{summary.featureUsage}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-base-content/60">Last Activity:</span>
                  <span className="font-mono text-[10px]">{summary.lastActivity}</span>
                </div>
              </div>

              <div className="border-t border-base-300 pt-2">
                <button
                  onClick={testAnalytics}
                  className="w-full bg-blue-600 text-white text-xs px-2 py-1 rounded hover:bg-blue-700 transition-colors"
                >
                  Test Analytics
                </button>
              </div>

              <div className="border-t border-base-300 pt-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" title="Vercel Analytics"></div>
                  <div className="w-2 h-2 bg-green-500 rounded-full" title="Speed Insights"></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full" title="Custom Tracking"></div>
                </div>
                <div className="text-[10px] text-base-content/60 mt-1">Vercel Analytics Active</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
