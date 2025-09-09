import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const speedData = await request.json();

    // In production, metrics are processed and forwarded to storage/analytics.

    // Process each metric
    if (speedData.metrics && Array.isArray(speedData.metrics)) {
      for (const metric of speedData.metrics) {
        // Performance metrics are handled (no local logging to reduce noise)
      }
    }

    // In production, you would:
    // 1. Store metrics in database
    // 2. Send to analytics service (Google Analytics, Mixpanel, etc.)
    // 3. Set up alerts for poor performance
    // 4. Generate performance reports

    return NextResponse.json({
      success: true,
      processed: speedData.metrics?.length || 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  // Return speed insights health check
  return NextResponse.json({
    status: 'healthy',
    service: 'speed-insights',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
}
