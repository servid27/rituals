'use client';

import { ReactNode, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useMonitoring } from '@/libs/monitoring';

// Monitoring Provider component to track app usage
const MonitoringProvider = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const monitoring = useMonitoring();

  // Track page views
  useEffect(() => {
    monitoring.trackPageView(pathname);
  }, [pathname]); // Remove trackPageView from dependencies

  // Track user authentication events
  useEffect(() => {
    if (session?.user) {
      monitoring.trackUserAction('user_signin', {
        userId: session.user.id,
        userEmail: session.user.email,
        timestamp: Date.now(),
      });
    }
  }, [session]); // Remove trackUserAction from dependencies

  // Track app load performance
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const trackAppLoad = () => {
        // Track app initialization
        monitoring.trackUserAction('app_loaded', {
          userAgent: navigator.userAgent,
          screenResolution: `${screen.width}x${screen.height}`,
          viewportSize: `${window.innerWidth}x${window.innerHeight}`,
          colorDepth: screen.colorDepth,
          language: navigator.language,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          platform: navigator.platform,
          timestamp: Date.now(),
        });

        // Track Web Vitals if available
        if ('performance' in window && 'getEntriesByType' in performance) {
          setTimeout(() => {
            const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
            if (navigation) {
              monitoring.trackUserAction('performance_metrics', {
                domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
                responseTime: navigation.responseEnd - navigation.requestStart,
                redirectTime: navigation.redirectEnd - navigation.redirectStart,
                dnsTime: navigation.domainLookupEnd - navigation.domainLookupStart,
                connectTime: navigation.connectEnd - navigation.connectStart,
                timestamp: Date.now(),
              });
            }
          }, 1000);
        }
      };

      if (document.readyState === 'complete') {
        trackAppLoad();
      } else {
        window.addEventListener('load', trackAppLoad);
        return () => window.removeEventListener('load', trackAppLoad);
      }
    }
  }, []); // Remove trackUserAction from dependencies

  return <>{children}</>;
};

export default MonitoringProvider;
