import { Session } from 'next-auth';

/**
 * Utility functions for admin access control
 */

export function isAdminUser(session: Session | null): boolean {
  if (!session?.user?.email) return false;

  // Allow access for specific admin emails
  if (session.user.email === 'admin@example.com') return true;

  // Allow access for emails ending with admin domain
  if (session.user.email.endsWith('@admin.rituals.com')) return true;

  // Allow access in development mode
  if (process.env.NODE_ENV === 'development') return true;

  return false;
}

export function getAdminRoutes() {
  return [
    {
      path: '/admin/dashboard',
      title: 'Admin Dashboard',
      description: 'Administrative control panel and system overview',
      icon: '⚙️',
      color: 'gray',
      features: ['Admin overview', 'Quick access panel', 'System status', 'Navigation hub'],
    },
    {
      path: '/admin/monitoring',
      title: 'System Monitoring',
      description: 'Real-time system health and user activity tracking',
      icon: '📊',
      color: 'red',
      features: ['Real-time system health', 'User activity tracking', 'Performance metrics', 'Error monitoring'],
    },
    {
      path: '/admin/speed-insights',
      title: 'Speed Insights',
      description: 'Core Web Vitals and performance metrics analysis',
      icon: '⚡',
      color: 'blue',
      features: ['Core Web Vitals', 'Performance analytics', 'Load time metrics', 'User experience data'],
    },
    {
      path: '/admin/analytics',
      title: 'Analytics Dashboard',
      description: 'Comprehensive analytics and user behavior tracking',
      icon: '📈',
      color: 'purple',
      features: ['User behavior tracking', 'Event analytics', 'Conversion metrics', 'Custom events data'],
    },
  ];
}

export type AdminRoute = ReturnType<typeof getAdminRoutes>[number];
