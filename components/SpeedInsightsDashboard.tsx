'use client';

import { useState, useEffect } from 'react';
import { useSpeedInsights } from '@/libs/speed-insights';

interface MetricsSummary {
  totalMetrics: number;
  goodMetrics: number;
  needsImprovementMetrics: number;
  poorMetrics: number;
  sessionId: string;
  lastMetric: any;
}

export default function SpeedInsightsDashboard() {
  const [summary, setSummary] = useState<MetricsSummary | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [performanceScore, setPerformanceScore] = useState<number>(100);
  const speedInsights = useSpeedInsights();

  useEffect(() => {
    const updateMetrics = () => {
      setSummary(speedInsights.getMetricsSummary());
      setPerformanceScore(speedInsights.getPerformanceScore());
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  if (!summary || process.env.NODE_ENV !== 'development') {
    return null;
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-success';
    if (score >= 70) return 'text-warning';
    return 'text-error';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return 'badge-success';
    if (score >= 70) return 'badge-warning';
    return 'badge-error';
  };

  return (
    <div className="fixed bottom-20 right-4 z-40">
      <div
        className={`bg-base-100 border border-base-300 rounded-lg shadow-lg transition-all duration-300 ${
          isExpanded ? 'w-80' : 'w-16'
        }`}
      >
        <div className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              {isExpanded && <span className="text-sm font-medium">Speed Insights</span>}
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-base-content/60 hover:text-base-content transition-colors"
            >
              {isExpanded ? '✕' : '⚡'}
            </button>
          </div>

          {isExpanded && (
            <div className="mt-3 space-y-3 text-xs">
              {/* Performance Score */}
              <div className="text-center p-3 bg-base-200 rounded-lg">
                <div className={`text-2xl font-bold ${getScoreColor(performanceScore)}`}>{performanceScore}</div>
                <div className="text-base-content/60">Performance Score</div>
                <div className={`badge badge-sm ${getScoreBadge(performanceScore)} mt-1`}>
                  {performanceScore >= 90 ? 'Excellent' : performanceScore >= 70 ? 'Good' : 'Needs Work'}
                </div>
              </div>

              {/* Metrics Summary */}
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 bg-base-200 rounded">
                  <div className="font-bold text-success">{summary.goodMetrics}</div>
                  <div className="text-base-content/60">Good</div>
                </div>
                <div className="text-center p-2 bg-base-200 rounded">
                  <div className="font-bold text-warning">{summary.needsImprovementMetrics}</div>
                  <div className="text-base-content/60">Fair</div>
                </div>
                <div className="text-center p-2 bg-base-200 rounded">
                  <div className="font-bold text-error">{summary.poorMetrics}</div>
                  <div className="text-base-content/60">Poor</div>
                </div>
              </div>

              {/* Latest Metric */}
              {summary.lastMetric && (
                <div className="border-t border-base-300 pt-2">
                  <div className="text-base-content/60 mb-1">Latest Metric:</div>
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[10px]">{summary.lastMetric.name.toUpperCase()}</span>
                    <span
                      className={`badge badge-xs ${
                        summary.lastMetric.rating === 'good'
                          ? 'badge-success'
                          : summary.lastMetric.rating === 'needs-improvement'
                          ? 'badge-warning'
                          : 'badge-error'
                      }`}
                    >
                      {Math.round(summary.lastMetric.value)}
                      {summary.lastMetric.name === 'CLS' ? '' : 'ms'}
                    </span>
                  </div>
                </div>
              )}

              {/* Session Info */}
              <div className="border-t border-base-300 pt-2 space-y-1">
                <div className="flex justify-between">
                  <span className="text-base-content/60">Total Metrics:</span>
                  <span className="font-mono">{summary.totalMetrics}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-base-content/60">Session:</span>
                  <span className="font-mono text-[10px]">{summary.sessionId.slice(-8)}...</span>
                </div>
              </div>

              {/* Status Indicators */}
              <div className="border-t border-base-300 pt-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" title="Speed Insights Active"></div>
                  <div className="w-2 h-2 bg-green-500 rounded-full" title="Web Vitals Tracking"></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full" title="Performance Monitoring"></div>
                </div>
              </div>

              {/* Clear Button */}
              <button
                onClick={() => {
                  speedInsights.clearMetrics();
                  setSummary(speedInsights.getMetricsSummary());
                  setPerformanceScore(speedInsights.getPerformanceScore());
                }}
                className="w-full btn btn-xs btn-outline mt-2"
              >
                Clear Metrics
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
