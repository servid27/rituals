/**
 * Basic monitoring and analytics utilities
 */

import { analytics } from './analytics';

// Event types for tracking
export type MonitoringEvent =
  | 'page_view'
  | 'routine_created'
  | 'routine_updated'
  | 'routine_deleted'
  | 'routine_completed'
  | 'pwa_installed'
  | 'pwa_prompt_shown'
  | 'user_signup'
  | 'user_signin'
  | 'error_occurred'
  | 'performance_issue';

export interface MonitoringData {
  event: MonitoringEvent;
  timestamp: number;
  userId?: string;
  sessionId: string;
  userAgent: string;
  path: string;
  properties?: Record<string, any>;
}

export interface PerformanceMetrics {
  page: string;
  loadTime: number;
  renderTime: number;
  interactionTime?: number;
  memoryUsage?: number;
  timestamp: number;
}

class MonitoringService {
  private sessionId: string;
  private isEnabled: boolean;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.isEnabled = typeof window !== 'undefined' && process.env.NODE_ENV === 'production';

    if (typeof window !== 'undefined') {
      this.initializePerformanceMonitoring();
      this.initializeErrorTracking();
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializePerformanceMonitoring() {
    if ('performance' in window && 'PerformanceObserver' in window) {
      // Monitor Core Web Vitals
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              this.trackPerformance({
                page: window.location.pathname,
                loadTime: entry.duration,
                renderTime:
                  (entry as PerformanceNavigationTiming).domContentLoadedEventEnd -
                  (entry as PerformanceNavigationTiming).domInteractive,
                timestamp: Date.now(),
              });
            }
          }
        });
        observer.observe({ entryTypes: ['navigation'] });
      } catch (error) {
        console.warn('Performance monitoring not supported:', error);
      }
    }
  }

  private initializeErrorTracking() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.trackEvent('error_occurred', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.trackEvent('error_occurred', {
        type: 'unhandled_promise_rejection',
        reason: event.reason?.toString(),
        stack: event.reason?.stack,
      });
    });
  }

  trackEvent(event: MonitoringEvent, properties?: Record<string, any>) {
    if (!this.isEnabled) return;

    const data: MonitoringData = {
      event,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      path: window.location.pathname,
      properties,
    };

    // Store locally for now (can be sent to analytics service later)
    this.storeEvent(data);

    // Send to Vercel Analytics
    analytics.trackEvent(event, properties);

    // Console log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Monitoring Event:', data);
    }
  }

  trackPerformance(metrics: PerformanceMetrics) {
    if (!this.isEnabled) return;

    this.storeEvent({
      event: 'performance_issue',
      timestamp: metrics.timestamp,
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      path: metrics.page,
      properties: metrics,
    });

    // Log slow pages
    if (metrics.loadTime > 3000) {
      console.warn('🐌 Slow page load detected:', metrics);
    }
  }

  trackPageView(path?: string) {
    this.trackEvent('page_view', {
      path: path || window.location.pathname,
      referrer: document.referrer,
      timestamp: Date.now(),
    });
  }

  trackUserAction(action: string, properties?: Record<string, any>) {
    this.trackEvent(action as MonitoringEvent, {
      action,
      ...properties,
    });
  }

  private storeEvent(data: MonitoringData) {
    try {
      // Store in localStorage for basic persistence
      const storageKey = 'monitoring_events';
      const existing = localStorage.getItem(storageKey);
      const events = existing ? JSON.parse(existing) : [];

      events.push(data);

      // Keep only last 100 events to prevent storage bloat
      if (events.length > 100) {
        events.splice(0, events.length - 100);
      }

      localStorage.setItem(storageKey, JSON.stringify(events));
    } catch (error) {
      console.warn('Failed to store monitoring event:', error);
    }
  }

  getStoredEvents(): MonitoringData[] {
    try {
      const stored = localStorage.getItem('monitoring_events');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  clearStoredEvents() {
    try {
      localStorage.removeItem('monitoring_events');
    } catch (error) {
      console.warn('Failed to clear monitoring events:', error);
    }
  }

  // PWA specific tracking
  trackPWAInstall() {
    this.trackEvent('pwa_installed', {
      installDate: new Date().toISOString(),
      userAgent: navigator.userAgent,
    });
  }

  trackPWAPromptShown() {
    this.trackEvent('pwa_prompt_shown', {
      timestamp: Date.now(),
    });
  }

  // Get basic analytics summary
  getAnalyticsSummary() {
    const events = this.getStoredEvents();
    const summary = {
      totalEvents: events.length,
      pageViews: events.filter((e) => e.event === 'page_view').length,
      errors: events.filter((e) => e.event === 'error_occurred').length,
      routineActions: events.filter((e) => e.event.includes('routine')).length,
      pwaEvents: events.filter((e) => e.event.includes('pwa')).length,
      sessionId: this.sessionId,
      lastActive: events.length > 0 ? Math.max(...events.map((e) => e.timestamp)) : null,
    };

    return summary;
  }
}

// Singleton instance
export const monitoring = new MonitoringService();

// React hook for easy tracking
export function useMonitoring() {
  return {
    trackEvent: monitoring.trackEvent.bind(monitoring),
    trackPageView: monitoring.trackPageView.bind(monitoring),
    trackUserAction: monitoring.trackUserAction.bind(monitoring),
    trackPWAInstall: monitoring.trackPWAInstall.bind(monitoring),
    trackPWAPromptShown: monitoring.trackPWAPromptShown.bind(monitoring),
    getAnalyticsSummary: monitoring.getAnalyticsSummary.bind(monitoring),
    trackPerformance: monitoring.trackPerformance.bind(monitoring),
  };
}

// Export default for backwards compatibility
export default monitoring;
