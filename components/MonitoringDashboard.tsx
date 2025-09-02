'use client';

import { useState, useEffect } from 'react';
import { useMonitoring } from '@/libs/monitoring';

interface AnalyticsSummary {
  totalEvents: number;
  pageViews: number;
  errors: number;
  routineActions: number;
  pwaEvents: number;
  sessionId: string;
  lastActive: number | null;
}

export default function MonitoringDashboard() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const monitoring = useMonitoring();

  useEffect(() => {
    const updateSummary = () => {
      setSummary(monitoring.getAnalyticsSummary());
    };

    updateSummary();
    const interval = setInterval(updateSummary, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []); // Remove dependency on monitoring functions

  if (!summary || process.env.NODE_ENV !== 'development') {
    return null;
  }

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className={`bg-base-100 border border-base-300 rounded-lg shadow-lg transition-all duration-300 ${
          isExpanded ? 'w-80' : 'w-16'
        }`}
      >
        <div className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              {isExpanded && <span className="text-sm font-medium">Monitoring</span>}
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-base-content/60 hover:text-base-content transition-colors"
            >
              {isExpanded ? '✕' : '📊'}
            </button>
          </div>

          {isExpanded && (
            <div className="mt-3 space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center p-2 bg-base-200 rounded">
                  <div className="font-bold text-primary">{summary.pageViews}</div>
                  <div className="text-base-content/60">Page Views</div>
                </div>
                <div className="text-center p-2 bg-base-200 rounded">
                  <div className="font-bold text-secondary">{summary.routineActions}</div>
                  <div className="text-base-content/60">Routines</div>
                </div>
                <div className="text-center p-2 bg-base-200 rounded">
                  <div className={`font-bold ${summary.errors > 0 ? 'text-error' : 'text-success'}`}>
                    {summary.errors}
                  </div>
                  <div className="text-base-content/60">Errors</div>
                </div>
                <div className="text-center p-2 bg-base-200 rounded">
                  <div className="font-bold text-accent">{summary.pwaEvents}</div>
                  <div className="text-base-content/60">PWA Events</div>
                </div>
              </div>

              <div className="border-t border-base-300 pt-2 space-y-1">
                <div className="flex justify-between">
                  <span className="text-base-content/60">Total Events:</span>
                  <span className="font-mono">{summary.totalEvents}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-base-content/60">Last Active:</span>
                  <span className="font-mono">{formatDate(summary.lastActive)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-base-content/60">Session:</span>
                  <span className="font-mono text-[10px]">{summary.sessionId.slice(-8)}...</span>
                </div>
              </div>

              <div className="border-t border-base-300 pt-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full" title="Monitoring Active"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full" title="PWA Active"></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full" title="Analytics Active"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
