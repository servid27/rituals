'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import AdminNavigation from '@/components/AdminNavigation';
import { isAdminUser } from '@/libs/admin';

export default function AdminAnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Handle loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!session) {
    router.push('/api/auth/signin');
    return null;
  }

  // Simple admin check (in production, you'd want more sophisticated role-based access)
  const isAdmin = isAdminUser(session);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <span className="text-4xl">📈</span>
                Analytics Dashboard
              </h1>
              <p className="text-gray-600 mt-2">Comprehensive analytics and user behavior tracking</p>
            </div>
          </div>
        </div>

        {/* Admin Navigation */}
        <div className="mb-8">
          <AdminNavigation currentPath="/admin/analytics" />
        </div>

        {/* Analytics Content */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
              Live Analytics Data
            </h2>
            <p className="text-gray-600 text-sm mt-1">Real-time analytics and user behavior insights</p>
          </div>

          <div className="p-6">
            <AnalyticsDashboard />
          </div>
        </div>

        {/* Navigation Help */}
        <div className="mt-8 bg-purple-50 border border-purple-200 rounded-xl p-6">
          <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
            <span className="text-lg">🧭</span>
            Admin Navigation
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white p-4 rounded-lg border border-purple-200">
              <div className="font-medium text-red-700 mb-2">📊 System Monitoring</div>
              <div className="text-gray-600 text-xs">
                Monitor system health, user activity, and performance metrics in real-time.
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-purple-200">
              <div className="font-medium text-blue-700 mb-2">⚡ Speed Insights</div>
              <div className="text-gray-600 text-xs">
                Analyze Core Web Vitals, performance metrics, and user experience data.
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-purple-200">
              <div className="font-medium text-purple-700 mb-2">📈 Analytics Dashboard</div>
              <div className="text-gray-600 text-xs">
                View comprehensive analytics, user behavior, and custom event tracking.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
