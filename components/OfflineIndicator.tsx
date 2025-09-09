'use client';

import { useOnlineStatus } from '@/hooks/useOnlineStatus';

const OfflineIndicator = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-red-500 text-white text-center py-2 z-50">
      <div className="flex items-center justify-center space-x-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18.364 5.636L5.636 18.364M6 6h12v12H6V6z"
          />
        </svg>
        <span className="text-sm font-medium">You&apos;re offline</span>
      </div>
    </div>
  );
};

export default OfflineIndicator;
