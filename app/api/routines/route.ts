import { auth } from '@/libs/next-auth';
import { NextRequest, NextResponse } from 'next/server';
import connectMongo from '@/libs/mongoose';
import Routine from '@/models/Routine';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();

    const routines = await Routine.find({
      userId: session.user.id,
      isActive: true,
    }).sort({ createdAt: -1 });

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
      userId: session.user.id,
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
        userId: session.user.id,
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

    if (!id) {
      return NextResponse.json({ error: 'Routine ID is required' }, { status: 400 });
    }

    await connectMongo();

    const routine = await Routine.findOne({
      userId: session.user.id,
      id: id,
    });

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

    const routine = await Routine.findOne({
      userId: session.user.id,
      id: id,
    });

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
