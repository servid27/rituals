'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ButtonAccount from '@/components/ButtonAccount';

interface UserStats {
  totalRituals: number;
  completedToday: number;
  currentStreak: number;
  longestStreak: number;
}

interface DailyRitual {
  _id: string;
  title: string;
  description?: string;
  category: string;
  targetTime?: string;
  estimatedDuration?: number;
  isCompleted: boolean;
  stats: {
    currentStreak: number;
  };
}

// Mock data for now - replace with API call later
const getMockData = () => {
  return {
    stats: {
      totalRituals: 3,
      completedToday: 1,
      currentStreak: 7,
      longestStreak: 15,
    },
    dailyRituals: [
      {
        _id: '1',
        title: 'Morning Meditation',
        description: 'Start the day with mindfulness',
        category: 'mindfulness',
        targetTime: '07:00',
        estimatedDuration: 15,
        isCompleted: true,
        stats: { currentStreak: 7 },
      },
      {
        _id: '2',
        title: 'Exercise',
        description: 'Daily workout routine',
        category: 'health',
        targetTime: '08:00',
        estimatedDuration: 30,
        isCompleted: false,
        stats: { currentStreak: 5 },
      },
      {
        _id: '3',
        title: 'Reading',
        description: 'Read for 20 minutes',
        category: 'learning',
        targetTime: '21:00',
        estimatedDuration: 20,
        isCompleted: false,
        stats: { currentStreak: 3 },
      },
    ],
  };
};

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<{ stats: UserStats; dailyRituals: DailyRitual[] } | null>(null);

  // Function to toggle ritual completion
  const toggleRitualCompletion = (ritualId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent navigation when clicking on the dot

    if (!data) return;

    const updatedRituals = data.dailyRituals.map((ritual) =>
      ritual._id === ritualId ? { ...ritual, isCompleted: !ritual.isCompleted } : ritual
    );

    const completedCount = updatedRituals.filter((r) => r.isCompleted).length;

    setData({
      ...data,
      dailyRituals: updatedRituals,
      stats: {
        ...data.stats,
        completedToday: completedCount,
      },
    });

    // Here you would typically also update the backend
    console.log(`Ritual ${ritualId} completion toggled`);
  };

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/api/auth/signin');
      return;
    }

    // For now, use mock data
    setData(getMockData());
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!session || !data) {
    return null;
  }

  const { stats, dailyRituals } = data;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <ButtonAccount />
      </header>

      <div className="space-y-4">
        <h2 className="text-sm text-gray-600">Your daily progress</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Today's Progress Card */}
          <div className="p-4 rounded-2xl bg-blue-50 border transition-all duration-300 hover:shadow-lg hover:shadow-blue-200/50 hover:-translate-y-1 hover:bg-blue-100/80 group">
            <div className="font-semibold mb-2 group-hover:text-blue-700 transition-colors duration-300">
              Today&apos;s Progress
            </div>
            <div className="text-xs text-gray-700 space-y-1 min-h-[72px]">
              <div className="flex justify-between gap-2">
                <span>Completed</span>
                <span className="font-mono text-gray-500 group-hover:text-blue-600 transition-colors duration-300">
                  {stats.completedToday}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span>Total Rituals</span>
                <span className="font-mono text-gray-500 group-hover:text-blue-600 transition-colors duration-300">
                  {stats.totalRituals}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span>Current Streak</span>
                <span className="font-mono text-gray-500 group-hover:text-blue-600 transition-colors duration-300">
                  {stats.currentStreak} days
                </span>
              </div>
            </div>
            <div className="mt-2 text-[11px] text-gray-500 group-hover:text-blue-600 transition-colors duration-300">
              {stats.totalRituals ? Math.round((stats.completedToday / stats.totalRituals) * 100) : 0}% complete today
            </div>
          </div>

          {/* Quick Actions Cards */}
          <button
            onClick={() => router.push('/rituals?mode=home')}
            className="text-left p-4 rounded-2xl bg-emerald-50 border transition-all duration-300 hover:shadow-lg hover:shadow-emerald-200/50 hover:-translate-y-1 hover:bg-emerald-100/80 cursor-pointer group"
          >
            <div className="font-semibold mb-2 group-hover:text-emerald-700 transition-colors duration-300">
              Your Rituals
            </div>
            <div className="text-xs text-gray-700 space-y-1 min-h-[72px]">
              <div>Manage your daily practices</div>
              <div>Track your progress</div>
              <div>Build healthy habits</div>
            </div>
            <div className="mt-2 text-[11px] text-gray-500 group-hover:text-emerald-600 transition-colors duration-300">
              View &amp; edit routines
            </div>
          </button>

          <button
            onClick={() => router.push('/rituals?mode=new')}
            className="text-left p-4 rounded-2xl border-dashed border-2 border-gray-300 hover:border-gray-400 flex flex-col items-start justify-center min-h-[140px] transition-all duration-300 hover:shadow-lg hover:shadow-gray-200/50 hover:-translate-y-1 hover:bg-gray-50/80 cursor-pointer group"
          >
            <div className="w-10 h-10 grid place-items-center rounded-xl border mb-2">+</div>
            <div className="font-semibold group-hover:text-gray-700 transition-colors duration-300">New ritual</div>
            <div className="text-xs text-gray-500 group-hover:text-gray-600 transition-colors duration-300">
              Create a new practice
            </div>
          </button>
        </div>
      </div>

      {/* Analytics Charts Section */}
      <div className="space-y-4">
        <h2 className="text-sm text-gray-600">Your analytics</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Weekly Progress Chart */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 border transition-all duration-300 hover:shadow-lg hover:shadow-purple-200/50 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Weekly Progress</h3>
              <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">+12%</span>
            </div>
            <div className="h-32 flex items-end justify-between gap-2">
              {[65, 78, 52, 89, 95, 72, 88].map((height, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-gradient-to-t from-purple-400 to-purple-300 rounded-t-md transition-all duration-500 hover:from-purple-500 hover:to-purple-400 min-h-[8px]"
                    style={{ height: `${Math.max(height * 0.8, 20)}px` }}
                  ></div>
                  <span className="text-[10px] text-gray-500">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs text-gray-600">Best day: Friday • Average: 77%</div>
          </div>

          {/* Streak Calendar */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border transition-all duration-300 hover:shadow-lg hover:shadow-emerald-200/50 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Consistency</h3>
              <span className="text-xs text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">7 day streak</span>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 49 }, (_, i) => {
                const intensity = Math.random();
                const isToday = i === 41;
                const bgColor =
                  intensity > 0.7
                    ? 'bg-emerald-500'
                    : intensity > 0.4
                    ? 'bg-emerald-300'
                    : intensity > 0.1
                    ? 'bg-emerald-200'
                    : 'bg-gray-100';
                return (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-sm ${bgColor} transition-all duration-200 hover:scale-110 ${
                      isToday ? 'ring-2 ring-emerald-400' : ''
                    }`}
                    title={`Day ${i + 1}`}
                  ></div>
                );
              })}
            </div>
            <div className="mt-3 text-xs text-gray-600">Last 7 weeks • 37/49 days completed</div>
          </div>

          {/* Completion Rate Donut */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border transition-all duration-300 hover:shadow-lg hover:shadow-amber-200/50 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Today&apos;s Completion</h3>
              <span className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded-full">33%</span>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-amber-200"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray="251.2"
                    strokeDashoffset="167.5"
                    className="text-amber-400 transition-all duration-1000"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-semibold text-amber-600">1/3</span>
                </div>
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-600 text-center">Morning Routine completed</div>
          </div>

          {/* Time Spent Chart */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-rose-50 to-pink-50 border transition-all duration-300 hover:shadow-lg hover:shadow-rose-200/50 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Time Distribution</h3>
              <span className="text-xs text-rose-600 bg-rose-100 px-2 py-1 rounded-full">2.5h today</span>
            </div>
            <div className="space-y-3">
              {[
                { name: 'Morning Routine', time: '1h 30m', percent: 60, color: 'bg-rose-400' },
                { name: 'Exercise', time: '45m', percent: 30, color: 'bg-rose-300' },
                { name: 'Reading', time: '15m', percent: 10, color: 'bg-rose-200' },
              ].map((item, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-700">{item.name}</span>
                    <span className="text-gray-500">{item.time}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`${item.color} h-2 rounded-full transition-all duration-1000`}
                      style={{ width: `${item.percent}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs text-gray-600">Most productive: 7-9 AM</div>
          </div>
        </div>
      </div>

      {/* Today's Rituals Section */}
      {dailyRituals.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm text-gray-600">Today&apos;s rituals</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {dailyRituals.slice(0, 4).map((ritual, idx) => {
              const bg = ['bg-amber-50', 'bg-sky-50', 'bg-emerald-50', 'bg-rose-50'][idx % 4];
              const hoverBg = [
                'hover:bg-amber-100/80',
                'hover:bg-sky-100/80',
                'hover:bg-emerald-100/80',
                'hover:bg-rose-100/80',
              ][idx % 4];
              const shadowColor = [
                'hover:shadow-amber-200/50',
                'hover:shadow-sky-200/50',
                'hover:shadow-emerald-200/50',
                'hover:shadow-rose-200/50',
              ][idx % 4];
              const textColor = [
                'group-hover:text-amber-700',
                'group-hover:text-sky-700',
                'group-hover:text-emerald-700',
                'group-hover:text-rose-700',
              ][idx % 4];
              const accentColor = [
                'group-hover:text-amber-600',
                'group-hover:text-sky-600',
                'group-hover:text-emerald-600',
                'group-hover:text-rose-600',
              ][idx % 4];

              return (
                <button
                  key={ritual._id}
                  onClick={() => router.push(`/rituals?ritual=${ritual._id}&mode=view`)}
                  className={`text-left p-4 rounded-2xl border ${bg} ${hoverBg} transition-all duration-300 hover:shadow-lg ${shadowColor} hover:-translate-y-1 cursor-pointer group`}
                >
                  <div
                    className={`font-semibold mb-2 truncate flex items-center gap-2 ${textColor} transition-colors duration-300`}
                  >
                    <div
                      onClick={(e) => toggleRitualCompletion(ritual._id, e)}
                      className={`w-3 h-3 rounded-full transition-all duration-300 hover:scale-110 cursor-pointer ${
                        ritual.isCompleted
                          ? 'bg-green-500 group-hover:shadow-md group-hover:shadow-green-200'
                          : 'bg-gray-300 group-hover:bg-gray-400'
                      }`}
                      title={ritual.isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                    ></div>
                    {ritual.title}
                  </div>
                  <div className="text-xs text-gray-700 space-y-1 min-h-[48px]">
                    {ritual.description && <div className="truncate">{ritual.description}</div>}
                    {ritual.targetTime && (
                      <div className="flex items-center gap-1">
                        <span className="group-hover:animate-pulse">⏰</span>
                        {ritual.targetTime}
                      </div>
                    )}
                    {ritual.estimatedDuration && (
                      <div className="flex items-center gap-1">
                        <span className="group-hover:animate-pulse">🕒</span>
                        {ritual.estimatedDuration} min
                      </div>
                    )}
                  </div>
                  <div
                    className={`mt-2 text-[11px] text-gray-500 flex justify-between ${accentColor} transition-colors duration-300`}
                  >
                    <span className="capitalize">{ritual.category}</span>
                    <span className="font-mono">{ritual.stats.currentStreak} day streak</span>
                  </div>
                </button>
              );
            })}
          </div>
          {dailyRituals.length > 4 && (
            <div className="text-center">
              <button
                onClick={() => router.push('/rituals?mode=home')}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-all duration-300 hover:underline hover:scale-105 px-4 py-2 rounded-lg hover:bg-blue-50"
              >
                View {dailyRituals.length - 4} more rituals
              </button>
            </div>
          )}
        </div>
      )}

      <footer className="pt-6 text-center text-xs text-gray-500">
        Track your daily practices · Build lasting habits
      </footer>
    </div>
  );
}
