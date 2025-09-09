'use client';

import Link from 'next/link';

export default function Offline() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="mb-4">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636L5.636 18.364M6 6h12v12H6V6z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">You&apos;re Offline</h1>
        <p className="text-gray-600 mb-6">
          It looks like you&apos;ve lost your internet connection. Don&apos;t worry, you can still view your previously
          loaded rituals!
        </p>
        <div className="space-y-3">
          <Link
            href="/rituals"
            className="block w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            View My Rituals
          </Link>
          <button
            onClick={() => window.location.reload()}
            className="block w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Try Again
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-6">Your data will sync automatically once you&apos;re back online.</p>
      </div>
    </div>
  );
}
