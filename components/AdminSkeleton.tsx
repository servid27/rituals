'use client';

import React from 'react';

interface AdminSkeletonProps {
  type?: 'card' | 'table' | 'stats' | 'dashboard';
  count?: number;
}

export default function AdminSkeleton({ type = 'card', count = 1 }: AdminSkeletonProps) {
  const renderSkeleton = () => {
    switch (type) {
      case 'stats':
        return (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg border animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </div>
            ))}
          </div>
        );

      case 'table':
        return (
          <div className="bg-white rounded-lg border animate-pulse">
            <div className="p-6 border-b">
              <div className="h-6 bg-gray-200 rounded w-40 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-64"></div>
            </div>
            <div className="p-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex space-x-4 mb-4">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 rounded w-28"></div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'dashboard':
        return (
          <div className="space-y-6">
            {/* Header skeleton */}
            <div className="flex items-center justify-between mb-8 animate-pulse">
              <div>
                <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-96"></div>
              </div>
              <div className="flex gap-3">
                <div className="h-10 bg-gray-200 rounded w-24"></div>
                <div className="h-10 bg-gray-200 rounded w-24"></div>
              </div>
            </div>

            {/* Stats skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg border animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
              ))}
            </div>

            {/* Cards skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg border animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, j) => (
                      <div key={j} className="h-4 bg-gray-200 rounded w-full"></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'card':
      default:
        return (
          <div className="space-y-6">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg border animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                </div>
              </div>
            ))}
          </div>
        );
    }
  };

  return <div className="animate-pulse">{renderSkeleton()}</div>;
}
