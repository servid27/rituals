import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const events = await request.json();

    // In production, you would send this to your analytics service
    // For now, we'll just log it and store basic metrics

    console.log('📊 Monitoring Events Received:', {
      count: Array.isArray(events) ? events.length : 1,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
    });

    // Basic validation
    if (!events || (Array.isArray(events) && events.length === 0)) {
      return NextResponse.json({ error: 'No events provided' }, { status: 400 });
    }

    // Process events (you can extend this to save to database)
    const processedEvents = Array.isArray(events) ? events : [events];

    for (const event of processedEvents) {
      // Basic event validation
      if (!event.event || !event.timestamp || !event.sessionId) {
        console.warn('Invalid event received:', event);
        continue;
      }

      // Log different event types
      switch (event.event) {
        case 'error_occurred':
          console.error('🚨 Error tracked:', event.properties);
          break;
        case 'performance_issue':
          if (event.properties?.loadTime > 3000) {
            console.warn('🐌 Slow page detected:', event.properties);
          }
          break;
        case 'pwa_installed':
          console.log('📱 PWA installation tracked:', event.properties);
          break;
        default:
          console.log(`📈 Event tracked: ${event.event}`);
      }
    }

    return NextResponse.json({
      success: true,
      processed: processedEvents.length,
    });
  } catch (error) {
    console.error('Failed to process monitoring events:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Simple health check endpoint
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
}
