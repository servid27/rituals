import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/libs/next-auth';
import connectMongo from '@/libs/mongoose';
import User from '@/models/User';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await connectMongo();

    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      name: user.name,
      email: user.email,
      bio: user.bio || '',
      timezone: user.timezone || 'UTC',
      preferences: {
        dailyReminderTime: user.preferences?.dailyReminderTime || '09:00',
        emailNotifications: user.preferences?.emailNotifications ?? true,
        theme: user.preferences?.theme || 'light',
      },
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { name, bio, timezone, preferences } = body;

    // Validate input
    if (bio && bio.length > 500) {
      return NextResponse.json({ error: 'Bio must be less than 500 characters' }, { status: 400 });
    }

    if (preferences?.theme && !['light', 'dark', 'auto'].includes(preferences.theme)) {
      return NextResponse.json({ error: 'Invalid theme preference' }, { status: 400 });
    }

    await connectMongo();

    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (timezone !== undefined) updateData.timezone = timezone;

    if (preferences) {
      updateData.preferences = {};
      if (preferences.dailyReminderTime !== undefined) {
        updateData.preferences.dailyReminderTime = preferences.dailyReminderTime;
      }
      if (preferences.emailNotifications !== undefined) {
        updateData.preferences.emailNotifications = preferences.emailNotifications;
      }
      if (preferences.theme !== undefined) {
        updateData.preferences.theme = preferences.theme;
      }
    }

    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      { $set: updateData },
      { new: true, upsert: false }
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: {
        name: user.name,
        email: user.email,
        bio: user.bio || '',
        timezone: user.timezone || 'UTC',
        preferences: {
          dailyReminderTime: user.preferences?.dailyReminderTime || '09:00',
          emailNotifications: user.preferences?.emailNotifications ?? true,
          theme: user.preferences?.theme || 'light',
        },
      },
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
