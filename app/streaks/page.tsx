"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRitualsStore } from "@/libs/rituals-store";
import { fmt } from "@/libs/rituals-utils";
import { Flame, Clock, Award, TrendingUp, Calendar } from "lucide-react";
import ButtonAccount from "@/components/ButtonAccount";

export default function StreaksPage() {
  const { data: session } = useSession();
  const { sessions, isLoading } = useRitualsStore();
  const [stats, setStats] = useState({
    currentStreak: 0,
    longestStreak: 0,
    totalTime: 0,
    totalSessions: 0,
    xp: 0,
    level: 1,
  });

  useEffect(() => {
    if (!sessions.length) return;

    // Calculate current streak
    const calculateStreak = () => {
      const sortedSessions = [...sessions].sort(
        (a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime()
      );

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;
      let lastDate: Date | null = null;

      // Check sessions by unique dates
      const uniqueDates = new Set<string>();
      sortedSessions.forEach((session) => {
        const date = new Date(session.dateISO);
        date.setHours(0, 0, 0, 0);
        uniqueDates.add(date.toISOString());
      });

      const sortedDates = Array.from(uniqueDates)
        .map((d) => new Date(d))
        .sort((a, b) => b.getTime() - a.getTime());

      // Calculate current streak
      for (let i = 0; i < sortedDates.length; i++) {
        const date = sortedDates[i];
        const expectedDate = new Date(today);
        expectedDate.setDate(expectedDate.getDate() - i);

        if (date.getTime() === expectedDate.getTime()) {
          currentStreak++;
        } else {
          break;
        }
      }

      // Calculate longest streak
      for (let i = 0; i < sortedDates.length; i++) {
        const date = sortedDates[i];

        if (!lastDate) {
          tempStreak = 1;
        } else {
          const dayDiff = Math.floor(
            (lastDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (dayDiff === 1) {
            tempStreak++;
          } else {
            tempStreak = 1;
          }
        }

        longestStreak = Math.max(longestStreak, tempStreak);
        lastDate = date;
      }

      return { currentStreak, longestStreak };
    };

    // Calculate total time
    const totalTime = sessions.reduce(
      (acc, session) => acc + session.actualSeconds,
      0
    );

    // Calculate XP (10 XP per minute spent)
    const xp = Math.floor(totalTime / 60) * 10;
    const level = Math.floor(xp / 1000) + 1;

    const { currentStreak, longestStreak } = calculateStreak();

    setStats({
      currentStreak,
      longestStreak,
      totalTime,
      totalSessions: sessions.length,
      xp,
      level,
    });
  }, [sessions]);

  if (isLoading) {
    return (
      <main className="p-3 bg-[#F7F5FA] sm:p-6 min-h-screen">
        <div className="flex items-center justify-center h-64">Loading...</div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="p-3 bg-[#F7F5FA] sm:p-6 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">Streaks & Progress</h1>
          <div className="bg-white rounded-lg p-6 text-center">
            <p className="text-gray-600">Please sign in to view your streaks</p>
          </div>
        </div>
      </main>
    );
  }

  const xpToNextLevel = stats.level * 1000 - stats.xp;
  const xpProgress = ((stats.xp % 1000) / 1000) * 100;

  return (
    <main className="p-3 bg-[#F7F5FA] sm:p-6 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between mt-6 mb-6">
          <div className="text-2xl sm:text-3xl lg:text-5xl font-bold tracking-[-0.015em] text-text-light">
            Streak Page
          </div>

          <ButtonAccount />
        </header>

        {/* Current Streak Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 space-y-3 shadow-card border border-gray-200 text-center">
          <div className="flex items-center justify-center gap-3 mb-4"></div>
          <div className="text-7xl">🔥</div>
          <div className="flex  justify-center gap-2">
            <span className="text-6xl sm:text-7xl font-bold">
              {stats.currentStreak}
            </span>
          </div>
          <h2 className="text-2xl font-semibold">Current Streak</h2>

          <p className="mt-4 text-sm opacity-90">
            Keep going! Complete a ritual today to maintain your streak.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 gap-4">
          {/* Total Time */}
          <div className="card">
            <div className="flex flex-col justify-center items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Clock size={20} className="text-blue-600" />
              </div>
                 <p className="text-3xl font-bold text-center w-full text-gray-900">
              {fmt(stats.totalTime)}
            </p>
          
              <h3 className="font-semibold text-gray-700">Total Time</h3>
            </div>
         
          </div>

          {/* Longest Streak */}
          <div className="card">
            <div className="flex flex-col justify-center items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <TrendingUp size={20} className="text-purple-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">
              {stats.longestStreak}
            </p>
              <h3 className="font-semibold text-gray-700">Longest Streak</h3>
            </div>
            
           
          </div>

          {/* Total Sessions */}
          
        </div>

        {/* XP System Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                <Award size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Level {stats.level}</h2>
                <p className="text-sm text-gray-500">Experience Points</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-[#8050D9]">{stats.xp}</p>
              <p className="text-sm text-gray-500">XP</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress to Level {stats.level + 1}</span>
              <span>{xpToNextLevel} XP remaining</span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#8050D9] to-[#bf97f0] transition-all duration-500"
                style={{ width: `${xpProgress}%` }}
              ></div>
            </div>
          </div>

          {/* XP Info */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-gray-700 mb-2">
              How to earn XP:
            </h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• Complete rituals to earn 10 XP per minute</p>
              <p>• Each level requires 1,000 XP</p>
              <p>• More features coming soon!</p>
            </div>
          </div>

          {/* Coming Soon Badge */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 text-center font-medium">
              🚀 Achievements, Rewards & Leaderboards Coming Soon!
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
