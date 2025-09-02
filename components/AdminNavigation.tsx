'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { getAdminRoutes, type AdminRoute } from '@/libs/admin';

interface AdminNavigationProps {
  currentPath?: string;
  showBackToDashboard?: boolean;
  className?: string;
}

export default function AdminNavigation({
  currentPath,
  showBackToDashboard = true,
  className = '',
}: AdminNavigationProps) {
  const router = useRouter();
  const adminRoutes = getAdminRoutes();

  const getColorClasses = (color: string, isCurrent: boolean = false) => {
    const baseClasses = {
      red: isCurrent ? 'bg-red-100 border-red-300 text-red-700' : 'bg-red-600 hover:bg-red-700 text-white',
      blue: isCurrent ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-blue-600 hover:bg-blue-700 text-white',
      purple: isCurrent
        ? 'bg-purple-100 border-purple-300 text-purple-700'
        : 'bg-purple-600 hover:bg-purple-700 text-white',
      gray: 'bg-gray-600 hover:bg-gray-700 text-white',
    };
    return baseClasses[color as keyof typeof baseClasses] || baseClasses.gray;
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {adminRoutes.map((route) => {
        const isCurrent = currentPath === route.path;
        return (
          <button
            key={route.path}
            onClick={() => router.push(route.path)}
            disabled={isCurrent}
            className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${getColorClasses(
              route.color,
              isCurrent
            )} ${isCurrent ? 'cursor-default' : 'cursor-pointer'}`}
            title={route.description}
          >
            <span className="mr-2">{route.icon}</span>
            {route.title}
            {isCurrent && <span className="ml-2">•</span>}
          </button>
        );
      })}

      {showBackToDashboard && (
        <button onClick={() => router.push('/dashboard')} className={getColorClasses('gray')}>
          Dashboard
        </button>
      )}
    </div>
  );
}
