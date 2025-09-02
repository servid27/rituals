import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple in-memory request tracking (use Redis/DB in production)
const requestMetrics = {
  count: 0,
  errors: 0,
  responseTimes: [] as number[],
  lastReset: Date.now(),
};

export function middleware(request: NextRequest) {
  const startTime = Date.now();

  // Track request
  requestMetrics.count++;

  // Create response
  const response = NextResponse.next();

  // Add monitoring headers
  response.headers.set('x-request-start', startTime.toString());
  response.headers.set('x-request-id', `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  // Track response time (this won't capture the full response time, but gives us middleware processing time)
  const processingTime = Date.now() - startTime;
  requestMetrics.responseTimes.push(processingTime);

  // Keep only last 100 response times
  if (requestMetrics.responseTimes.length > 100) {
    requestMetrics.responseTimes = requestMetrics.responseTimes.slice(-100);
  }

  // Reset metrics every hour
  if (Date.now() - requestMetrics.lastReset > 3600000) {
    requestMetrics.count = 0;
    requestMetrics.errors = 0;
    requestMetrics.responseTimes = [];
    requestMetrics.lastReset = Date.now();
  }

  return response;
}

// Configure which paths to monitor
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - sw.js (service worker)
     * - workbox-*.js (workbox files)
     * - manifest.json (PWA manifest)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sw.js|workbox-.*\\.js|manifest.json).*)',
  ],
};

// Export metrics for use in monitoring API
export { requestMetrics };
