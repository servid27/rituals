import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/libs/next-auth';
import connectMongo from '@/libs/mongoose';

export async function GET(request: NextRequest) {
  try {
    // Quick auth check
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Pre-warm database connection
    await connectMongo();

    return NextResponse.json(
      {
        status: 'ok',
        timestamp: new Date().toISOString(),
        connection: 'warmed',
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=10',
        },
      }
    );
  } catch (error) {
    return NextResponse.json({ status: 'error', error: 'Connection failed' }, { status: 500 });
  }
}
