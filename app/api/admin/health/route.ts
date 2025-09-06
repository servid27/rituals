import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/libs/next-auth';
import { supabase } from '@/libs/supabase';

export async function GET(request: NextRequest) {
  try {
    // Quick auth check
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Test Supabase connection
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true }).limit(1);

    if (error) {
      return NextResponse.json({ status: 'error', error: 'Database connection failed' }, { status: 500 });
    }

    return NextResponse.json(
      {
        status: 'ok',
        timestamp: new Date().toISOString(),
        connection: 'healthy',
        database: 'connected',
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=10',
        },
      }
    );
  } catch (error) {
    return NextResponse.json({ status: 'error', error: 'Health check failed' }, { status: 500 });
  }
}
