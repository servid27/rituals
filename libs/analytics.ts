import { track } from '@vercel/analytics';

/**
 * Custom Analytics Utility
 * Provides easy-to-use functions for tracking custom events with Vercel Analytics
 */

export type AnalyticsEvent =
  | 'routine_created'
  | 'routine_updated'
  | 'routine_deleted'
  | 'routine_completed'
  | 'pwa_installed'
  | 'pwa_prompt_shown'
  | 'user_signup'
  | 'user_signin'
  | 'page_view'
  | 'feature_used'
  | 'error_occurred'
  | 'performance_issue';

export interface AnalyticsProperties {
  [key: string]: string | number | boolean | null;
}

/**
 * Track custom events with Vercel Analytics
 */
export const trackEvent = (event: AnalyticsEvent, properties?: AnalyticsProperties) => {
  try {
    // Only track in production or when explicitly enabled
    if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_DEBUG === 'true') {
      track(event, properties);
    }

    // Also log in development for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Analytics Event:', { event, properties });
    }
  } catch (error) {
    console.warn('Failed to track analytics event:', error);
  }
};

/**
 * Track routine-related events
 */
export const trackRoutineEvent = (
  action: 'created' | 'updated' | 'deleted' | 'completed',
  data: {
    routineId?: string;
    routineName?: string;
    taskCount?: number;
    duration?: number;
    completionRate?: number;
  }
) => {
  trackEvent(`routine_${action}` as AnalyticsEvent, {
    routine_id: data.routineId || 'unknown',
    routine_name: data.routineName || 'unnamed',
    task_count: data.taskCount || 0,
    duration_seconds: data.duration || 0,
    completion_rate: data.completionRate || 0,
    timestamp: Date.now(),
  });
};

/**
 * Track PWA-related events
 */
export const trackPWAEvent = (
  action: 'installed' | 'prompt_shown' | 'prompt_accepted' | 'prompt_dismissed',
  data?: {
    source?: string;
    userAgent?: string;
  }
) => {
  trackEvent(`pwa_${action}` as AnalyticsEvent, {
    source: data?.source || 'unknown',
    user_agent: data?.userAgent || navigator.userAgent,
    timestamp: Date.now(),
  });
};

/**
 * Track user authentication events
 */
export const trackUserEvent = (
  action: 'signup' | 'signin' | 'signout',
  data?: {
    userId?: string;
    provider?: string;
    userEmail?: string;
  }
) => {
  trackEvent(`user_${action}` as AnalyticsEvent, {
    user_id: data?.userId || 'anonymous',
    provider: data?.provider || 'unknown',
    has_email: !!data?.userEmail,
    timestamp: Date.now(),
  });
};

/**
 * Track feature usage
 */
export const trackFeatureUsage = (
  featureName: string,
  data?: {
    action?: string;
    value?: string | number;
    duration?: number;
  }
) => {
  trackEvent('feature_used', {
    feature_name: featureName,
    action: data?.action || 'used',
    value: data?.value || null,
    duration_seconds: data?.duration || 0,
    timestamp: Date.now(),
  });
};

/**
 * Track page views (automatically handled by Vercel Analytics, but useful for custom logic)
 */
export const trackPageView = (
  path: string,
  data?: {
    referrer?: string;
    searchParams?: string;
  }
) => {
  trackEvent('page_view', {
    path,
    referrer: data?.referrer || document.referrer,
    search_params: data?.searchParams || window.location.search,
    timestamp: Date.now(),
  });
};

/**
 * Track errors
 */
export const trackError = (
  error: Error | string,
  data?: {
    component?: string;
    action?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
  }
) => {
  const errorMessage = error instanceof Error ? error.message : error;
  const errorStack = error instanceof Error ? error.stack : undefined;

  trackEvent('error_occurred', {
    error_message: errorMessage,
    error_stack: errorStack || 'no_stack',
    component: data?.component || 'unknown',
    action: data?.action || 'unknown',
    severity: data?.severity || 'medium',
    timestamp: Date.now(),
  });
};

/**
 * Track performance issues
 */
export const trackPerformanceIssue = (
  metric: string,
  value: number,
  data?: {
    threshold?: number;
    page?: string;
  }
) => {
  trackEvent('performance_issue', {
    metric,
    value,
    threshold: data?.threshold || 0,
    page: data?.page || window.location.pathname,
    is_above_threshold: data?.threshold ? value > data.threshold : false,
    timestamp: Date.now(),
  });
};

// Export all tracking functions
export const analytics = {
  trackEvent,
  trackRoutineEvent,
  trackPWAEvent,
  trackUserEvent,
  trackFeatureUsage,
  trackPageView,
  trackError,
  trackPerformanceIssue,
};

export default analytics;
