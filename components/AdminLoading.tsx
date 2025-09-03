'use client';

import React from 'react';

interface AdminLoadingProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  fullScreen?: boolean;
}

export default function AdminLoading({
  message = 'Loading...',
  size = 'medium',
  fullScreen = false,
}: AdminLoadingProps) {
  const sizeClasses = {
    small: 'h-6 w-6',
    medium: 'h-8 w-8',
    large: 'h-12 w-12',
  };

  const textSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
  };

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div
            className={`animate-spin rounded-full border-b-2 border-blue-600 mx-auto mb-4 ${sizeClasses[size]}`}
          ></div>
          <p className={`text-gray-600 ${textSizeClasses[size]}`}>{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <div className={`animate-spin rounded-full border-b-2 border-blue-600 mx-auto mb-3 ${sizeClasses[size]}`}></div>
        <p className={`text-gray-600 ${textSizeClasses[size]}`}>{message}</p>
      </div>
    </div>
  );
}
