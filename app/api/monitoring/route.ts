import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const events = await request.json();

    // In production, you would send this to your analytics service
    // The endpoint processes events but does not log them here to reduce noise.

    // Basic validation
    if (!events || (Array.isArray(events) && events.length === 0)) {
      return NextResponse.json({ error: 'No events provided' }, { status: 400 });
    }

    // Process events (you can extend this to save to database)
    const processedEvents = Array.isArray(events) ? events : [events];

    for (const event of processedEvents) {
      // Basic event validation
      if (!event.event || !event.timestamp || !event.sessionId) {
        // Skip invalid events quietly
        continue;
      }

      // Log different event types
      switch (event.event) {
        case 'error_occurred':
          // send to error tracking pipeline (not logged here)
          break;
        case 'performance_issue':
          // handle perf issue (not logged here)
          break;
        case 'pwa_installed':
          // handle pwa install (not logged here)
          break;
        default:
        // generic event handling
      }
    }

    return NextResponse.json({
      success: true,
      processed: processedEvents.length,
    });
  } catch (error) {
    // Error: return generic error without logging to reduce noise
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
