import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/libs/next-auth';
import connectMongo from '@/libs/mongoose';
import User from '@/models/User';
import Routine from '@/models/Routine';

// Simple in-memory cache
let usersCache: { data: any; timestamp: number } | null = null;
const CACHE_DURATION = 60000; // 1 minute for user data

export async function GET(request: NextRequest) {
  try {
    // Quick auth check
    const session = await auth();
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

    await connectMongo();

    // Get comprehensive user analytics from REAL DATABASE
    const [totalUsers, usersToday, usersThisWeek, usersThisMonth, mostActiveUsers, userStats] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      }),
      User.countDocuments({
        createdAt: {
          $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      }),
      User.countDocuments({
        createdAt: {
          $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      }),
      // Get users with most routine activity
      Routine.aggregate([
        {
          $group: {
            _id: '$userId',
            routineCount: { $sum: 1 },
            sessionCount: { $sum: { $size: '$sessions' } },
          },
        },
        { $sort: { sessionCount: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
      ]),
      // Get user statistics
      User.aggregate([
        {
          $group: {
            _id: null,
            totalRituals: { $sum: '$stats.totalRituals' },
            avgCurrentStreak: { $avg: '$stats.currentStreak' },
            maxLongestStreak: { $max: '$stats.longestStreak' },
            avgCompletedToday: { $avg: '$stats.completedToday' },
          },
        },
      ]),
    ]);

    const stats = userStats[0] || {
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
        id: user._id,
        name: user.user?.name || 'Anonymous',
        email: user.user?.email || 'No email',
        routineCount: user.routineCount,
        sessionCount: user.sessionCount,
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
