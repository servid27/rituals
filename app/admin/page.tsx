'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { isAdminUser } from '@/libs/admin';
import AdminPreloader from '@/components/AdminPreloader';
import { useAdminUsers, useAdminMonitoring, useAdminPerformance } from '@/hooks/useAdminData';
import GlobalAdminPreloader from '@/components/GlobalAdminPreloader';

export default function UnifiedAdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { data: dashboardData, loading: usersLoading } = useAdminUsers();
  const { data: monitoringData, loading: monitoringLoading } = useAdminMonitoring();
  const { data: performanceData, loading: performanceLoading } = useAdminPerformance();
  const [activeTab, setActiveTab] = useState('overview');

  // Handle loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!session) {
    router.push('/api/auth/signin');
    return null;
  }

  // Check if user is admin
  if (!isAdminUser(session)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don&apos;t have permission to access this page.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'monitoring', label: 'System Health', icon: '🔍' },
    { id: 'users', label: 'User Analytics', icon: '👥' },
    { id: 'performance', label: 'Performance', icon: '⚡' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <GlobalAdminPreloader />
      <AdminPreloader />
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                <span className="text-5xl">⚙️</span>
                Unified Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-2">Complete system administration and analytics in one place</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors text-sm flex items-center gap-2"
              >
                <span>🏠</span>
                User Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Quick Stats */}
            {!usersLoading && dashboardData && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Users</p>
                      <p className="text-3xl font-bold text-blue-600">{dashboardData.users.total}</p>
                    </div>
                    <div className="text-3xl">👥</div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">+{dashboardData.users.newThisMonth} this month</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Rituals</p>
                      <p className="text-3xl font-bold text-purple-600">{dashboardData.activity.totalRituals}</p>
                    </div>
                    <div className="text-3xl">🎯</div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Avg {dashboardData.activity.averageCompletedToday} completed today
                  </p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Longest Streak</p>
                      <p className="text-3xl font-bold text-green-600">{dashboardData.activity.longestStreak}</p>
                    </div>
                    <div className="text-3xl">🔥</div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Avg current: {dashboardData.activity.averageCurrentStreak}
                  </p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">New This Week</p>
                      <p className="text-3xl font-bold text-orange-600">{dashboardData.users.newThisWeek}</p>
                    </div>
                    <div className="text-3xl">📈</div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">{dashboardData.users.newToday} joined today</p>
                </div>
              </div>
            )}

            {/* System Health Overview */}
            {!monitoringLoading && monitoringData && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                    System Health Overview
                  </h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{formatUptime(monitoringData.uptime)}</div>
                      <div className="text-sm text-gray-600">Uptime</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{monitoringData.system.memoryUsage}%</div>
                      <div className="text-sm text-gray-600">Memory Usage</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{monitoringData.system.responseTime}ms</div>
                      <div className="text-sm text-gray-600">Response Time</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{monitoringData.analytics.totalSessions}</div>
                      <div className="text-sm text-gray-600">Active Sessions</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'monitoring' && (
          <div className="space-y-8">
            {!monitoringLoading && monitoringData ? (
              <>
                {/* System Health */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">{formatUptime(monitoringData.uptime)}</div>
                      <div className="text-sm text-gray-600 mt-2">System Uptime</div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">{monitoringData.system.memoryUsage}%</div>
                      <div className="text-sm text-gray-600 mt-2">Memory Usage</div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600">{monitoringData.system.responseTime}ms</div>
                      <div className="text-sm text-gray-600 mt-2">Response Time</div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-red-600">{monitoringData.analytics.errorRate}%</div>
                      <div className="text-sm text-gray-600 mt-2">Error Rate</div>
                    </div>
                  </div>
                </div>

                {/* System Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">System Information</h3>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Environment</span>
                        <span className="font-medium">{monitoringData.environment}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Node Version</span>
                        <span className="font-medium">{monitoringData.nodeVersion}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Platform</span>
                        <span className="font-medium">{monitoringData.platform}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status</span>
                        <span className="font-medium text-green-600">{monitoringData.status}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-lg border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">Popular Routes</h3>
                    </div>
                    <div className="p-6 space-y-3">
                      {monitoringData.analytics.popularRoutes.map((route: any, index: number) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="font-mono text-sm">{route.path}</span>
                          <span className="bg-gray-100 px-2 py-1 rounded text-sm">{route.views} views</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Memory Details */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Memory Details</h3>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {Math.round(monitoringData.memory.rss / 1024 / 1024)}MB
                        </div>
                        <div className="text-sm text-gray-600">RSS</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {Math.round(monitoringData.memory.heapUsed / 1024 / 1024)}MB
                        </div>
                        <div className="text-sm text-gray-600">Heap Used</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {Math.round(monitoringData.memory.heapTotal / 1024 / 1024)}MB
                        </div>
                        <div className="text-sm text-gray-600">Heap Total</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {Math.round(monitoringData.memory.external / 1024 / 1024)}MB
                        </div>
                        <div className="text-sm text-gray-600">External</div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading monitoring data...</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-8">
            {!usersLoading && dashboardData ? (
              <>
                {/* User Analytics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">User Growth</h3>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{dashboardData.users.total}</div>
                          <div className="text-sm text-gray-600">Total Users</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{dashboardData.users.newToday}</div>
                          <div className="text-sm text-gray-600">Today</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">{dashboardData.users.newThisWeek}</div>
                          <div className="text-sm text-gray-600">This Week</div>
                        </div>
                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">{dashboardData.users.newThisMonth}</div>
                          <div className="text-sm text-gray-600">This Month</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-lg border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">Activity Metrics</h3>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Rituals</span>
                        <span className="font-bold text-purple-600">{dashboardData.activity.totalRituals}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Average Current Streak</span>
                        <span className="font-bold text-green-600">{dashboardData.activity.averageCurrentStreak}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Longest Streak</span>
                        <span className="font-bold text-red-600">{dashboardData.activity.longestStreak}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Avg Completed Today</span>
                        <span className="font-bold text-blue-600">{dashboardData.activity.averageCompletedToday}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Most Active Users */}
                {dashboardData.mostActiveUsers.length > 0 && (
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">Most Active Users</h3>
                    </div>
                    <div className="p-6">
                      <div className="space-y-4">
                        {dashboardData.mostActiveUsers.map((user: any, index: number) => (
                          <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-4">
                              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{user.name}</p>
                                <p className="text-sm text-gray-500">{user.email}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-900">{user.sessionCount} sessions</p>
                              <p className="text-xs text-gray-500">{user.routineCount} routines</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading user analytics...</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="space-y-8">
            {!performanceLoading && performanceData ? (
              <>
                {/* Performance Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                    <div className="text-center">
                      <div
                        className={`text-3xl font-bold ${
                          performanceData.scores.overall >= 80
                            ? 'text-green-600'
                            : performanceData.scores.overall >= 60
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}
                      >
                        {performanceData.scores.overall}
                      </div>
                      <div className="text-sm text-gray-600 mt-2">Overall Score</div>
                      <div
                        className={`text-xs mt-1 ${
                          performanceData.scores.overall >= 80
                            ? 'text-green-500'
                            : performanceData.scores.overall >= 60
                            ? 'text-yellow-500'
                            : 'text-red-500'
                        }`}
                      >
                        {performanceData.scores.overall >= 80
                          ? 'Excellent'
                          : performanceData.scores.overall >= 60
                          ? 'Good'
                          : 'Needs Work'}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {performanceData.systemMetrics.responseTime}ms
                      </div>
                      <div className="text-sm text-gray-600 mt-2">Response Time</div>
                      <div
                        className={`text-xs mt-1 ${
                          performanceData.coreWebVitals.fcpScore === 'good'
                            ? 'text-green-500'
                            : performanceData.coreWebVitals.fcpScore === 'needs-improvement'
                            ? 'text-yellow-500'
                            : 'text-red-500'
                        }`}
                      >
                        {performanceData.coreWebVitals.fcpScore === 'good'
                          ? 'Fast'
                          : performanceData.coreWebVitals.fcpScore === 'needs-improvement'
                          ? 'Average'
                          : 'Slow'}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600">
                        {performanceData.systemMetrics.memoryUsage}%
                      </div>
                      <div className="text-sm text-gray-600 mt-2">Memory Usage</div>
                      <div
                        className={`text-xs mt-1 ${
                          performanceData.coreWebVitals.fidScore === 'good'
                            ? 'text-green-500'
                            : performanceData.coreWebVitals.fidScore === 'needs-improvement'
                            ? 'text-yellow-500'
                            : 'text-red-500'
                        }`}
                      >
                        {performanceData.systemMetrics.memoryUsage < 50
                          ? 'Optimal'
                          : performanceData.systemMetrics.memoryUsage < 80
                          ? 'Normal'
                          : 'High'}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {Math.floor(performanceData.systemMetrics.uptime / 3600)}h
                      </div>
                      <div className="text-sm text-gray-600 mt-2">Uptime</div>
                      <div
                        className={`text-xs mt-1 ${
                          performanceData.coreWebVitals.clsScore === 'good'
                            ? 'text-green-500'
                            : performanceData.coreWebVitals.clsScore === 'needs-improvement'
                            ? 'text-yellow-500'
                            : 'text-red-500'
                        }`}
                      >
                        {performanceData.coreWebVitals.clsScore === 'good'
                          ? 'Stable'
                          : performanceData.coreWebVitals.clsScore === 'needs-improvement'
                          ? 'Moderate'
                          : 'Unstable'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Core Web Vitals */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Core Web Vitals</h3>
                    <p className="text-sm text-gray-600 mt-1">Real-time performance metrics based on system health</p>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-lg font-semibold text-gray-700 mb-2">First Contentful Paint</div>
                        <div
                          className={`text-2xl font-bold mb-1 ${
                            performanceData.coreWebVitals.fcpScore === 'good'
                              ? 'text-green-600'
                              : performanceData.coreWebVitals.fcpScore === 'needs-improvement'
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          }`}
                        >
                          {performanceData.coreWebVitals.fcp}ms
                        </div>
                        <div
                          className={`text-xs px-2 py-1 rounded-full ${
                            performanceData.coreWebVitals.fcpScore === 'good'
                              ? 'bg-green-100 text-green-700'
                              : performanceData.coreWebVitals.fcpScore === 'needs-improvement'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {performanceData.coreWebVitals.fcpScore.toUpperCase()}
                        </div>
                      </div>

                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-lg font-semibold text-gray-700 mb-2">Largest Contentful Paint</div>
                        <div
                          className={`text-2xl font-bold mb-1 ${
                            performanceData.coreWebVitals.lcpScore === 'good'
                              ? 'text-green-600'
                              : performanceData.coreWebVitals.lcpScore === 'needs-improvement'
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          }`}
                        >
                          {performanceData.coreWebVitals.lcp}ms
                        </div>
                        <div
                          className={`text-xs px-2 py-1 rounded-full ${
                            performanceData.coreWebVitals.lcpScore === 'good'
                              ? 'bg-green-100 text-green-700'
                              : performanceData.coreWebVitals.lcpScore === 'needs-improvement'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {performanceData.coreWebVitals.lcpScore.toUpperCase()}
                        </div>
                      </div>

                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-lg font-semibold text-gray-700 mb-2">Cumulative Layout Shift</div>
                        <div
                          className={`text-2xl font-bold mb-1 ${
                            performanceData.coreWebVitals.clsScore === 'good'
                              ? 'text-green-600'
                              : performanceData.coreWebVitals.clsScore === 'needs-improvement'
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          }`}
                        >
                          {performanceData.coreWebVitals.cls}
                        </div>
                        <div
                          className={`text-xs px-2 py-1 rounded-full ${
                            performanceData.coreWebVitals.clsScore === 'good'
                              ? 'bg-green-100 text-green-700'
                              : performanceData.coreWebVitals.clsScore === 'needs-improvement'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {performanceData.coreWebVitals.clsScore.toUpperCase()}
                        </div>
                      </div>

                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-lg font-semibold text-gray-700 mb-2">First Input Delay</div>
                        <div
                          className={`text-2xl font-bold mb-1 ${
                            performanceData.coreWebVitals.fidScore === 'good'
                              ? 'text-green-600'
                              : performanceData.coreWebVitals.fidScore === 'needs-improvement'
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          }`}
                        >
                          {performanceData.coreWebVitals.fid}ms
                        </div>
                        <div
                          className={`text-xs px-2 py-1 rounded-full ${
                            performanceData.coreWebVitals.fidScore === 'good'
                              ? 'bg-green-100 text-green-700'
                              : performanceData.coreWebVitals.fidScore === 'needs-improvement'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {performanceData.coreWebVitals.fidScore.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Real-time Metrics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">System Performance</h3>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Memory Used</span>
                        <span className="font-medium">
                          {performanceData.systemMetrics.heapUsed}MB / {performanceData.systemMetrics.heapTotal}MB
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Node Version</span>
                        <span className="font-medium">{performanceData.systemMetrics.nodeVersion}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Platform</span>
                        <span className="font-medium">{performanceData.systemMetrics.platform}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Uptime</span>
                        <span className="font-medium">
                          {Math.floor(performanceData.systemMetrics.uptime / 3600)}h{' '}
                          {Math.floor((performanceData.systemMetrics.uptime % 3600) / 60)}m
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-lg border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">Real-time Activity</h3>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">CPU Usage</span>
                        <span className="font-medium">{performanceData.realTime.cpuUsage}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Requests/sec</span>
                        <span className="font-medium">{performanceData.realTime.requestsPerSecond}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Active Connections</span>
                        <span className="font-medium">{performanceData.realTime.activeConnections}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Error Rate</span>
                        <span
                          className={`font-medium ${
                            performanceData.realTime.errorRate < 1
                              ? 'text-green-600'
                              : performanceData.realTime.errorRate < 2
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          }`}
                        >
                          {performanceData.realTime.errorRate.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading performance data...</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
