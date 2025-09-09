import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/libs/next-auth';
import { UserService } from '@/libs/user-service';
import { RoutineService } from '@/libs/routine-service';

// Simple in-memory cache
let usersCache: { data: any; timestamp: number } | null = null;
const CACHE_DURATION = 60000; // 1 minute for user data

export async function GET(request: NextRequest) {
  try {
  // Quick auth check
  const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check cache first
    if (usersCache && Date.now() - usersCache.timestamp < CACHE_DURATION) {
      return NextResponse.json(usersCache.data, {
        headers: {
          'Cache-Control': 'private, max-age=60',
          'X-Cache': 'HIT',
        },
      });
    }

    // Get comprehensive user analytics from Supabase
    const [totalUsers, usersToday, usersThisWeek, usersThisMonth, mostActiveUsers, userStats] = await Promise.all([
      UserService.getTotalCount(),
      UserService.getCountSince(new Date(new Date().setHours(0, 0, 0, 0))),
      UserService.getCountSince(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
      UserService.getCountSince(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
      UserService.getMostActiveUsers(5),
      UserService.getAggregatedStats(),
    ]);

    const stats = userStats || {
      totalRituals: 0,
      avgCurrentStreak: 0,
      maxLongestStreak: 0,
      avgCompletedToday: 0,
    };

    const responseData = {
      users: {
        total: totalUsers,
        newToday: usersToday,
        newThisWeek: usersThisWeek,
        newThisMonth: usersThisMonth,
      },
      activity: {
        totalRituals: stats.totalRituals,
        averageCurrentStreak: Math.round(stats.avgCurrentStreak * 10) / 10,
        longestStreak: stats.maxLongestStreak,
        averageCompletedToday: Math.round(stats.avgCompletedToday * 10) / 10,
      },
      mostActiveUsers: mostActiveUsers.map((user) => ({
        id: user.id,
        name: user.name || 'Anonymous',
        email: user.email || 'No email',
        routineCount: user.routineCount || 0,
        sessionCount: user.sessionCount || 0,
      })),
    };

    // Store in cache
    usersCache = {
      data: responseData,
      timestamp: Date.now(),
    };

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'private, max-age=60',
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    console.error('Failed to get user data:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
