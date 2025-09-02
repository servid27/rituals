/**
 * Monitoring Configuration
 * Centralized configuration for all monitoring features
 */

export const monitoringConfig = {
  // Enable/disable monitoring features
  enabled: process.env.NODE_ENV === 'production',

  // Development monitoring (always enabled in dev)
  developmentMode: process.env.NODE_ENV === 'development',

  // Analytics settings
  analytics: {
    // How long to keep events in localStorage (in milliseconds)
    retentionPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days

    // Maximum events to store locally
    maxEvents: 1000,

    // Batch size for sending events to server
    batchSize: 50,

    // How often to send batched events (in milliseconds)
    batchInterval: 5 * 60 * 1000, // 5 minutes

    // Events to track
    trackingEvents: {
      pageViews: true,
      userActions: true,
      errors: true,
      performance: true,
      pwaEvents: true,
      routineActions: true,
    },
  },

  // Performance monitoring
  performance: {
    // Track Core Web Vitals
    webVitals: true,

    // Performance thresholds (in milliseconds)
    thresholds: {
      slowPageLoad: 3000,
      slowApiCall: 2000,
      slowInteraction: 100,
    },

    // Resource monitoring
    resourceMonitoring: {
      memory: true,
      networkRequests: true,
      errors: true,
    },
  },

  // Error tracking
  errorTracking: {
    // Track JavaScript errors
    jsErrors: true,

    // Track unhandled promise rejections
    promiseRejections: true,

    // Track network errors
    networkErrors: true,

    // Error rate alerting threshold (percentage)
    alertThreshold: 5,
  },

  // PWA monitoring
  pwa: {
    // Track PWA installation events
    installTracking: true,

    // Track offline usage
    offlineTracking: true,

    // Track app updates
    updateTracking: true,

    // Track performance in PWA mode
    performanceTracking: true,
  },

  // API endpoints
  endpoints: {
    // Monitoring data collection endpoint
    collect: '/api/monitoring',

    // Health check endpoint
    health: '/api/monitoring/health',

    // Admin monitoring dashboard
    admin: '/api/admin/monitoring',
  },

  // Sampling rates (0.0 to 1.0)
  sampling: {
    // Performance events (reduce for high-traffic apps)
    performance: 1.0,

    // User actions
    userActions: 1.0,

    // Page views
    pageViews: 1.0,

    // Errors (always track all errors)
    errors: 1.0,
  },

  // Privacy settings
  privacy: {
    // Anonymize user data
    anonymizeUsers: false,

    // Exclude sensitive routes from tracking
    excludeRoutes: ['/admin', '/api/auth', '/account'],

    // Data to exclude from tracking
    excludeData: {
      passwords: true,
      emails: false,
      userIds: false,
      ipAddresses: true,
    },
  },

  // Alert thresholds
  alerts: {
    // Error rate (percentage)
    errorRate: 5,

    // Response time (milliseconds)
    responseTime: 2000,

    // Memory usage (percentage)
    memoryUsage: 85,

    // Request rate (requests per minute)
    requestRate: 1000,
  },
};

export default monitoringConfig;
