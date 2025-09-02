'use client';

import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { ReactNode } from 'react';

interface VercelAnalyticsProviderProps {
  children: ReactNode;
}

/**
 * Vercel Analytics Provider
 * Provides Vercel Analytics and Speed Insights tracking
 */
export default function VercelAnalyticsProvider({ children }: VercelAnalyticsProviderProps) {
  return (
    <>
      {children}

      {/* Vercel Analytics - tracks page views, custom events, and user behavior */}
      <Analytics
        // Enable debug mode in development
        debug={process.env.NODE_ENV === 'development'}
      />

      {/* Vercel Speed Insights - tracks Core Web Vitals and performance metrics */}
      <SpeedInsights
        // Enable debug mode in development
        debug={process.env.NODE_ENV === 'development'}
      />
    </>
  );
}
