import { auth } from '@/libs/next-auth';
import { NextRequest, NextResponse } from 'next/server';
import connectMongo from '@/libs/mongoose';
import Routine from '@/models/Routine';
import mongoose from 'mongoose';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();

    const routines = await Routine.find({
      userId: new mongoose.Types.ObjectId(session.user.id),
      isActive: true,
    }).sort({ createdAt: -1 });

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
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, tasks } = body;

    if (!id || !name || !Array.isArray(tasks)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectMongo();

    // Check if routine with this ID already exists for this user
    const existingRoutine = await Routine.findOne({
      userId: new mongoose.Types.ObjectId(session.user.id),
      id: id,
    });

    if (existingRoutine) {
      // Update existing routine
      existingRoutine.name = name;
      existingRoutine.tasks = tasks;
      await existingRoutine.save();
      return NextResponse.json({ routine: existingRoutine });
    } else {
      // Create new routine
      const routine = new Routine({
        userId: new mongoose.Types.ObjectId(session.user.id),
        id,
        name,
        tasks,
        sessions: [],
      });

      await routine.save();
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

    await connectMongo();

    // First, let's see what routines exist for this user
    const allUserRoutines = await Routine.find({ userId: new mongoose.Types.ObjectId(session.user.id) });
    console.log(
      'User has routines:',
      allUserRoutines.map((r) => ({ id: r.id, name: r.name }))
    );

    const routine = await Routine.findOne({
      userId: new mongoose.Types.ObjectId(session.user.id),
      id: id,
    });

    console.log('Found routine for update:', routine ? { id: routine.id, name: routine.name } : 'null');

    if (!routine) {
      return NextResponse.json({ error: 'Routine not found' }, { status: 404 });
    }

    if (name !== undefined) routine.name = name;
    if (tasks !== undefined) routine.tasks = tasks;

    await routine.save();
    return NextResponse.json({ routine });
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

    await connectMongo();

    console.log('DELETE request - User ID:', session.user.id, 'Routine ID:', id);

    const routine = await Routine.findOne({
      userId: new mongoose.Types.ObjectId(session.user.id),
      id: id,
    });

    console.log(
      'Found routine for deletion:',
      routine ? { id: routine.id, name: routine.name, isActive: routine.isActive } : 'null'
    );

    if (!routine) {
      return NextResponse.json({ error: 'Routine not found' }, { status: 404 });
    }

    routine.isActive = false;
    await routine.save();

    return NextResponse.json({ message: 'Routine deleted successfully' });
  } catch (error) {
    console.error('Error deleting routine:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
