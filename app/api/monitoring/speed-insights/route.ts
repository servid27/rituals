import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const speedData = await request.json();

    // Log speed insights data
    console.log('⚡ Speed Insights Received:', {
      metrics: speedData.metrics?.length || 0,
      pageUrl: speedData.pageUrl,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent')?.substring(0, 100) + '...',
    });

    // Process each metric
    if (speedData.metrics && Array.isArray(speedData.metrics)) {
      for (const metric of speedData.metrics) {
        // Log performance issues
        if (metric.rating === 'poor') {
          console.warn(`🚨 Poor Performance - ${metric.name}:`, {
            value: metric.value,
            rating: metric.rating,
            page: speedData.pageUrl,
            timestamp: new Date(metric.timestamp).toISOString(),
          });
        }

        // Log good performance
        if (metric.rating === 'good') {
          console.log(`✅ Good Performance - ${metric.name}:`, {
            value: metric.value,
            page: speedData.pageUrl,
          });
        }
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
    console.error('Failed to process speed insights:', error);
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
