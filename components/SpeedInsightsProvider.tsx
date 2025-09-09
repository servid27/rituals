'use client';

import { ReactNode, useEffect } from 'react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { usePathname } from 'next/navigation';
import { useSpeedInsights } from '@/libs/speed-insights';

// Speed Insights Provider component
const SpeedInsightsProvider = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const speedInsights = useSpeedInsights();

  // Track custom performance metrics
  useEffect(() => {
    const trackPageLoadPerformance = () => {
      if (typeof window !== 'undefined' && 'performance' in window) {
        // Track page load time
        window.addEventListener('load', () => {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          if (navigation) {
            // Track page load time
            const pageLoadTime = navigation.loadEventEnd - navigation.fetchStart;
            speedInsights.trackCustomMetric('pageLoad', pageLoadTime);

            // Track DOM content loaded
            const domLoadTime = navigation.domContentLoadedEventEnd - navigation.fetchStart;
            speedInsights.trackCustomMetric('domLoad', domLoadTime);

            // Track first byte time
            const ttfb = navigation.responseStart - navigation.requestStart;
            speedInsights.trackCustomMetric('ttfb', ttfb);
          }
        });

        // Track largest contentful paint
        if ('PerformanceObserver' in window) {
          try {
            const observer = new PerformanceObserver((list) => {
              for (const entry of list.getEntries()) {
                if (entry.entryType === 'largest-contentful-paint') {
                  speedInsights.trackCustomMetric('lcp', entry.startTime);
                }
              }
            });
            observer.observe({ entryTypes: ['largest-contentful-paint'] });

            // Clean up observer after 10 seconds
            setTimeout(() => {
              observer.disconnect();
            }, 10000);
          } catch (error) {
            console.warn('LCP observer not supported:', error);
          }
        }
      }
    };

    trackPageLoadPerformance();
  }, [pathname, speedInsights]);

  // Track route changes
  useEffect(() => {
    const startTime = performance.now();

    // Track route change performance
    const handleRouteChange = () => {
      const routeChangeTime = performance.now() - startTime;
      speedInsights.trackCustomMetric('routeChange', routeChangeTime);
    };

    // Use a small delay to ensure the route has fully loaded
    const timer = setTimeout(handleRouteChange, 100);
    return () => clearTimeout(timer);
  }, [pathname, speedInsights]);

  return (
    <>
      {/* Vercel Speed Insights */}
      <SpeedInsights />

      {children}
    </>
  );
};

export default SpeedInsightsProvider;
