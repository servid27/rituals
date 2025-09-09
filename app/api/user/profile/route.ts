import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/libs/next-auth';
import { UserService } from '@/libs/user-service';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await UserService.findByEmail(session.user.email);

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

    const user = await UserService.findByEmail(session.user.email);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (timezone !== undefined) updateData.timezone = timezone;

    if (preferences) {
      const updatedPreferences = { ...user.preferences };
      if (preferences.dailyReminderTime !== undefined) {
        updatedPreferences.dailyReminderTime = preferences.dailyReminderTime;
      }
      if (preferences.emailNotifications !== undefined) {
        updatedPreferences.emailNotifications = preferences.emailNotifications;
      }
      if (preferences.theme !== undefined) {
        updatedPreferences.theme = preferences.theme;
      }
      updateData.preferences = updatedPreferences;
    }

    const updatedUser = await UserService.update(user.id, updateData);

    if (!updatedUser) {
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: {
        name: updatedUser.name,
        email: updatedUser.email,
        bio: updatedUser.bio || '',
        timezone: updatedUser.timezone || 'UTC',
        preferences: {
          dailyReminderTime: updatedUser.preferences?.dailyReminderTime || '09:00',
          emailNotifications: updatedUser.preferences?.emailNotifications ?? true,
          theme: updatedUser.preferences?.theme || 'light',
        },
      },
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
