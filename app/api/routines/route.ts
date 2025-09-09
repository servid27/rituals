import { auth } from '@/libs/next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { RoutineService } from '@/libs/routine-service';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const routines = await RoutineService.findByUserId(session.user.id);

    console.log(
      'GET /api/routines - returning routines:',
      routines.map((r) => ({ id: r.id, name: r.name }))
    );

    return NextResponse.json({ routines });
  } catch (error) {
    console.error('Error fetching routines:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    console.log('POST /api/routines - session:', session);
    console.log('POST /api/routines - user:', session?.user);

    if (!session?.user?.id) {
      console.log('POST /api/routines - No user ID found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    console.log('POST /api/routines - body:', body);
    const { id, name, tasks } = body;

    if (!id || !name || !Array.isArray(tasks)) {
      console.log('POST /api/routines - Missing required fields:', {
        id: !!id,
        name: !!name,
        tasks: Array.isArray(tasks),
      });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if routine with this ID already exists for this user
    const existingRoutine = await RoutineService.findByUserIdAndId(session.user.id, id);
    console.log('POST /api/routines - existing routine:', existingRoutine);

    if (existingRoutine) {
      // Update existing routine
      const updatedRoutine = await RoutineService.update(existingRoutine.id, {
        name,
        tasks,
      });
      console.log('POST /api/routines - updated routine:', updatedRoutine);
      return NextResponse.json({ routine: updatedRoutine });
    } else {
      // Create new routine
      const routineData = {
        id,
        user_id: session.user.id, // Fixed: using user_id to match database schema
        name,
        tasks,
        sessions: [] as any[],
        isActive: true,
      };
      console.log('POST /api/routines - creating routine with data:', routineData);

      const routine = await RoutineService.create(routineData);
      console.log('POST /api/routines - created routine:', routine);

      return NextResponse.json({ routine });
    }
  } catch (error) {
    console.error('Error saving routine:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, tasks } = body;

    console.log('PUT request received:', {
      userId: session.user.id,
      routineId: id,
      hasName: !!name,
      taskCount: tasks?.length,
    });

    if (!id) {
      return NextResponse.json({ error: 'Routine ID is required' }, { status: 400 });
    }

    // First, let's see what routines exist for this user
    const allUserRoutines = await RoutineService.findByUserId(session.user.id);
    console.log(
      'User has routines:',
      allUserRoutines.map((r) => ({ id: r.id, name: r.name }))
    );

    const routine = await RoutineService.findByUserIdAndId(session.user.id, id);

    console.log('Found routine for update:', routine ? { id: routine.id, name: routine.name } : 'null');

    if (!routine) {
      return NextResponse.json({ error: 'Routine not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (tasks !== undefined) updateData.tasks = tasks;

    const updatedRoutine = await RoutineService.update(routine.id, updateData);
    return NextResponse.json({ routine: updatedRoutine });
  } catch (error) {
    console.error('Error updating routine:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Routine ID is required' }, { status: 400 });
    }

    console.log('DELETE request - User ID:', session.user.id, 'Routine ID:', id);

    const routine = await RoutineService.findByUserIdAndId(session.user.id, id);

    console.log(
      'Found routine for deletion:',
      routine ? { id: routine.id, name: routine.name, isActive: routine.isActive } : 'null'
    );

    if (!routine) {
      return NextResponse.json({ error: 'Routine not found' }, { status: 404 });
    }

    const success = await RoutineService.delete(routine.id);

    if (!success) {
      return NextResponse.json({ error: 'Failed to delete routine' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Routine deleted successfully' });
  } catch (error) {
    console.error('Error deleting routine:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
