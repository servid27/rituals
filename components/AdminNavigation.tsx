'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAdminRoutes, type AdminRoute } from '@/libs/admin';
import { preloadAllAdminData } from '@/hooks/useAdminData';

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
  const [loadingRoute, setLoadingRoute] = useState<string | null>(null);
  const [preloadTriggered, setPreloadTriggered] = useState(false);
  const [preloadComplete, setPreloadComplete] = useState(false);

  // Trigger preload on first hover
  const handleMouseEnter = () => {
    if (!preloadTriggered) {
      console.log('🔥 Mouse hover detected - triggering aggressive preload!');
      setPreloadTriggered(true);
      preloadAllAdminData().then(() => {
        console.log('⚡ Hover-triggered preload complete!');
        setPreloadComplete(true);
      });
    }
  };

  const handleNavigation = async (path: string) => {
    if (path === currentPath) return; // Don't navigate if already on the page

    setLoadingRoute(path);

    // Navigate immediately without artificial delays
    router.push(path);

    // Clear loading state quickly
    setTimeout(() => setLoadingRoute(null), 100);
  };

  const getColorClasses = (color: string, isCurrent: boolean = false) => {
    const baseClasses = {
      gray: isCurrent
        ? 'bg-gray-100 border-gray-300 text-gray-700 shadow-inner'
        : 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white shadow-sm hover:shadow-md transform hover:scale-105 border border-gray-500 hover:border-gray-400',
      red: isCurrent
        ? 'bg-red-100 border-red-300 text-red-700 shadow-inner'
        : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-sm hover:shadow-md transform hover:scale-105 border border-red-500 hover:border-red-400',
      blue: isCurrent
        ? 'bg-blue-100 border-blue-300 text-blue-700 shadow-inner'
        : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-sm hover:shadow-md transform hover:scale-105 border border-blue-500 hover:border-blue-400',
      purple: isCurrent
        ? 'bg-purple-100 border-purple-300 text-purple-700 shadow-inner'
        : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-sm hover:shadow-md transform hover:scale-105 border border-purple-500 hover:border-purple-400',
    };
    return baseClasses[color as keyof typeof baseClasses] || '';
  };

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      {adminRoutes.map((route) => {
        const isCurrent = currentPath === route.path;
        const isLoading = loadingRoute === route.path;
        return (
          <button
            key={route.path}
            onClick={() => handleNavigation(route.path)}
            onMouseEnter={handleMouseEnter}
            disabled={isCurrent || isLoading}
            className={`px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium 
                       ${getColorClasses(route.color, isCurrent)} 
                       ${isCurrent || isLoading ? 'cursor-default' : 'cursor-pointer'} 
                       flex items-center gap-2 min-w-0 relative`}
            title={route.description}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
            ) : (
              <span className="text-base flex-shrink-0">{route.icon}</span>
            )}
            <span className="hidden sm:inline">{route.title}</span>
            <span className="sm:hidden">{route.title.split(' ')[0]}</span>
            {isCurrent && <span className="ml-1 opacity-70 hidden sm:inline">•</span>}
          </button>
        );
      })}

      {showBackToDashboard && (
        <>
          {/* Separator */}
          <div className="w-px h-8 bg-gray-300 mx-2 hidden sm:block"></div>

          {/* Dashboard Button */}
          <button
            onClick={() => handleNavigation('/admin/dashboard')}
            onMouseEnter={handleMouseEnter}
            disabled={loadingRoute === '/admin/dashboard'}
            className="px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium 
                       bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 
                       text-white shadow-sm hover:shadow-md transform hover:scale-105 
                       flex items-center gap-2 border border-gray-500 hover:border-gray-400
                       disabled:cursor-default disabled:transform-none"
            title="Return to admin dashboard"
          >
            {loadingRoute === '/admin/dashboard' ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <span className="text-base">⚙️</span>
            )}
            <span className="hidden sm:inline">Admin Dashboard</span>
            <span className="sm:hidden">Admin</span>
          </button>
        </>
      )}
    </div>
  );
}
