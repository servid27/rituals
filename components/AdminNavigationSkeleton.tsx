'use client';

import React from 'react';

export default function AdminNavigationSkeleton() {
  return (
    <div className="flex flex-wrap items-center gap-3 animate-pulse">
      {/* Admin route buttons skeleton */}
      {Array.from({ length: 3 }, (_, i) => (
        <div
          key={i}
          className="h-10 bg-gray-200 rounded-lg flex items-center gap-2 px-4 py-2"
          style={{ width: `${120 + i * 20}px` }}
        >
          <div className="w-4 h-4 bg-gray-300 rounded"></div>
          <div className="h-3 bg-gray-300 rounded flex-1"></div>
        </div>
      ))}

      {/* Separator */}
      <div className="w-px h-8 bg-gray-200 mx-2 hidden sm:block"></div>

      {/* Dashboard button skeleton */}
      <div className="h-10 w-32 bg-gray-200 rounded-lg flex items-center gap-2 px-4">
        <div className="w-4 h-4 bg-gray-300 rounded"></div>
        <div className="h-3 bg-gray-300 rounded flex-1"></div>
      </div>
    </div>
  );
}
