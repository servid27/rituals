'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { isAdminUser, getAdminRoutes } from '@/libs/admin';

export default function AdminPanel() {
  const { data: session } = useSession();
  const router = useRouter();
  const adminRoutes = getAdminRoutes();

  // Don't show if user is not admin
  if (!isAdminUser(session)) {
    return null;
  }

  const getColorClasses = (color: string) => {
    const colorMap = {
      red: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        hover: 'hover:bg-red-100/80 hover:shadow-red-200/50',
        text: 'group-hover:text-red-700',
        accent: 'group-hover:text-red-600',
      },
      blue: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        hover: 'hover:bg-blue-100/80 hover:shadow-blue-200/50',
        text: 'group-hover:text-blue-700',
        accent: 'group-hover:text-blue-600',
      },
      purple: {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        hover: 'hover:bg-purple-100/80 hover:shadow-purple-200/50',
        text: 'group-hover:text-purple-700',
        accent: 'group-hover:text-purple-600',
      },
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  return (
    <div className="space-y-4">
      <h2 className="text-sm text-gray-600 flex items-center gap-2">
        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
        Admin Panel
        {process.env.NODE_ENV === 'development' && (
          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">DEV MODE</span>
        )}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {adminRoutes.map((route) => {
          const colors = getColorClasses(route.color);

          return (
            <button
              key={route.path}
              onClick={() => router.push(route.path)}
              className={`text-left p-4 rounded-2xl ${colors.bg} border ${colors.border} 
                         transition-all duration-300 hover:shadow-lg ${colors.hover} 
                         hover:-translate-y-1 cursor-pointer group`}
            >
              <div
                className={`font-semibold mb-2 ${colors.text} transition-colors duration-300 
                             flex items-center gap-2`}
              >
                <span className="text-lg">{route.icon}</span>
                {route.title}
              </div>

              <div className="text-xs text-gray-700 space-y-1 min-h-[72px]">
                {route.features.map((feature, index) => (
                  <div key={index}>{feature}</div>
                ))}
              </div>

              <div
                className={`mt-2 text-[11px] text-gray-500 ${colors.accent} 
                             transition-colors duration-300`}
              >
                {route.description.split(' ').slice(0, 3).join(' ')}
              </div>
            </button>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-xl">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <span className="text-lg">🔧</span>
          Quick Admin Stats
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-white p-3 rounded-lg border">
            <div className="font-medium text-gray-700 mb-1">Available Routes</div>
            <div className="text-2xl font-bold text-blue-600">{adminRoutes.length}</div>
            <div className="text-xs text-gray-500">Admin interfaces</div>
          </div>
          <div className="bg-white p-3 rounded-lg border">
            <div className="font-medium text-gray-700 mb-1">Environment</div>
            <div className="text-2xl font-bold text-green-600">
              {process.env.NODE_ENV === 'development' ? 'DEV' : 'PROD'}
            </div>
            <div className="text-xs text-gray-500">Current mode</div>
          </div>
          <div className="bg-white p-3 rounded-lg border">
            <div className="font-medium text-gray-700 mb-1">Access Level</div>
            <div className="text-2xl font-bold text-purple-600">ADMIN</div>
            <div className="text-xs text-gray-500">Full permissions</div>
          </div>
        </div>
      </div>
    </div>
  );
}
