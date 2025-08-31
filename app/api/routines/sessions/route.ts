import { auth } from '@/libs/next-auth';
import { NextRequest, NextResponse } from 'next/server';
import connectMongo from '@/libs/mongoose';
import Routine from '@/models/Routine';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const routineId = searchParams.get('routineId');

    await connectMongo();

    if (routineId) {
      // Get sessions for a specific routine
      const routine = await Routine.findOne({
        userId: session.user.id,
        id: routineId,
      });

      if (!routine) {
        return NextResponse.json({ error: 'Routine not found' }, { status: 404 });
      }

      return NextResponse.json({ sessions: routine.sessions });
    } else {
      // Get all sessions for all user's routines
      const routines = await Routine.find({
        userId: session.user.id,
        isActive: true,
      });

      const allSessions = routines.flatMap((routine) => routine.sessions);
      return NextResponse.json({ sessions: allSessions });
    }
  } catch (error) {
    console.error('Error fetching sessions:', error);
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
    const {
      id,
      routineId,
      dateISO,
      startISO,
      endISO,
      targetSeconds,
      actualSeconds,
      deltaSeconds,
      tasksCompleted,
      tasksTotal,
    } = body;

    if (!id || !routineId || !dateISO || !startISO || !endISO) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectMongo();

    const routine = await Routine.findOne({
      userId: session.user.id,
      id: routineId,
    });

    if (!routine) {
      return NextResponse.json({ error: 'Routine not found' }, { status: 404 });
    }

    const newSession = {
      id,
      routineId,
      dateISO,
      startISO,
      endISO,
      targetSeconds,
      actualSeconds,
      deltaSeconds,
      tasksCompleted,
      tasksTotal,
    };

    routine.sessions.unshift(newSession);
    await routine.save();

    return NextResponse.json({ session: newSession });
  } catch (error) {
    console.error('Error adding session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
