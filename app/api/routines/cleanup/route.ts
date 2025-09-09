import { auth } from '@/libs/next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { RoutineService } from '@/libs/routine-service';

export async function DELETE(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete placeholder routines (those with simple IDs like '1', '2', '3')
    const deletedCount = await RoutineService.deleteByUserIdAndIds(session.user.id, ['1', '2', '3']);

    return NextResponse.json({
      message: 'Placeholder routines cleaned up',
      deletedCount,
    });
  } catch (error) {
    console.error('Error cleaning up placeholder routines:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
