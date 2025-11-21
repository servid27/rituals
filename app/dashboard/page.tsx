"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ButtonAccount from "@/components/ButtonAccount";
import WeeklyProgress from "@/components/WeeklyProgress";

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
  totalTasks: number;
  completedTasks: number;
  stats: {
    currentStreak: number;
  };
}

// Function to fetch real data from the rituals API
const fetchRealData = async () => {
  try {
    const routinesResponse = await fetch("/api/routines");

    const routinesData = routinesResponse.ok
      ? (await routinesResponse.json()).routines
      : [];

    // Transform routines into dashboard format
    const dailyRituals: DailyRitual[] = routinesData.map((routine: any) => ({
      _id: routine.id,
      title: routine.name,
      description: `${routine.tasks.length} tasks`,
      category: "other", // Default category, could be enhanced
      targetTime: "", // Could calculate from tasks
      estimatedDuration: Math.round(
        routine.tasks.reduce(
          (sum: number, task: any) => sum + task.targetSeconds,
          0
        ) / 60
      ),
      isCompleted: false, // Would need to check today's sessions
      totalTasks: routine.tasks.length,
      completedTasks: 0, // Would calculate from today's task completions
      stats: { currentStreak: 0 }, // Would calculate from sessions
    }));

    // Calculate stats
    const stats = {
      totalRituals: routinesData.length,
      completedToday: 0, // Would calculate from today's sessions
      currentStreak: 0, // Would calculate from sessions
      longestStreak: 0, // Would calculate from sessions
    };

    return { stats, dailyRituals };
  } catch (error) {
    console.error("Error fetching real data:", error);
    // Fallback to empty data
    return {
      stats: {
        totalRituals: 0,
        completedToday: 0,
        currentStreak: 0,
        longestStreak: 0,
      },
      dailyRituals: [],
    };
  }
};

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<{
    stats: UserStats;
    dailyRituals: DailyRitual[];
  } | null>(null);

  // Function to toggle ritual completion
  const toggleRitualCompletion = (
    ritualId: string,
    event: React.MouseEvent
  ) => {
    event.stopPropagation(); // Prevent navigation when clicking on the dot

    if (!data) return;

    const updatedRituals = data.dailyRituals.map((ritual) =>
      ritual._id === ritualId
        ? { ...ritual, isCompleted: !ritual.isCompleted }
        : ritual
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
    if (status === "loading") return;
    if (!session) {
      router.push("/api/auth/signin");
      return;
    }

    // Fetch real data from the API
    const loadData = async () => {
      const realData = await fetchRealData();
      setData(realData);
    };

    loadData();
  }, [session, status, router]);

  if (status === "loading") {
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
    <div className="min-h-screen bg-[#F7F5FA] ">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        <header className="flex items-center justify-between mb-6">
          <div className="text-2xl mt-6 sm:text-3xl lg:text-5xl font-bold tracking-[-0.015em] text-text-light">
            🚀 Dashboard
          </div>

          <ButtonAccount />
        </header>

        <button className="fixed bottom-24 right-6 z-50 md:hidden flex h-[15vw] w-[15vw] items-center justify-center rounded-full bg-main text-white shadow-lg transition-transform hover:scale-105 active:scale-95">
          <span
            className=""
            onClick={() => router.push("/rituals?mode=new")}
            style={{ fontSize: 32 }}
          >
           <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                className="lucide lucide-plus-icon lucide-plus"
              >
                <path d="M5 12h14" />
                <path d="M12 5v14" />
              </svg>
          </span>
        </button>

        <section>
          <h2 className="title-sm mb-4">Your daily progress</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 lg:gap-6">
            {/* Today's Progress Card */}
            <div className="card hover:shadow-xl relative h-full flex items-stretch  flex-col transition-shadow duration-300">
              <div className="text-xs font-bold uppercase  flex gap-1 mb-2 tracking-wider color-main">
                <span>🔥 {stats.currentStreak}</span>
                <span>Current Streak</span>
              </div>
              <div className="sm:hidden card-title">Today&apos;s Progress</div>
              <div className="text-[2rem] sm:flex items-center gap-2 hidden leading-[112%] font-semibold tracking-tighter">
             <div className="text-6xl">👏🏻</div> <div>Today&apos;s &nbsp;  <br />Progress</div>  
              </div>
                 <div className="h-full fkex"></div>
              <div className="h-fit flex flex-col  w-full mb-2 a gap-2">
                <div className="flex justify-between text-base font-medium text-subtext-light">
                  <span className="tracking-wide">Current Progress</span>
                  <span className="font-semibold">
                    {stats.totalRituals
                      ? Math.round(
                          (stats.completedToday / stats.totalRituals) * 100
                        )
                      : 0}
                    %
                  </span>
                </div>
             
                <div className="h-2 w-full rounded-full bg-progress-bg-light">
                  <div
                    className="h-2 rounded-full bg-accent transition-all duration-500"
                    style={{
                      width: `${
                        stats.totalRituals
                          ? Math.round(
                              (stats.completedToday / stats.totalRituals) * 100
                            )
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500">
                  {stats.completedToday} of {stats.totalRituals} rituals
                  completed
                </div>
              </div>
            </div>
            <div className="hidden sm:flex">
              <WeeklyProgress></WeeklyProgress>
            </div>
            {/* New Ritual Card */}
          </div>
        </section>

        {/* Today's Rituals Section */}
        {dailyRituals.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="title-sm">Today&apos;s rituals</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 lg:gap-6">
              {dailyRituals.slice(0, 3).map((ritual, idx) => {
                return (
                  <button
                    key={ritual._id}
                    onClick={() =>
                      router.push(`/rituals?ritual=${ritual._id}&mode=view`)
                    }
                    className="card hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  >
                    <div
                      className={`font-semibold mb-2 truncate flex  transition-colors duration-300`}
                    >
                      <div
                        onClick={(e) => toggleRitualCompletion(ritual._id, e)}
                        className={`text-lg  font-bold mb-2 leading-tight tracking-[-0.015em] text-text-light ${
                          ritual.isCompleted
                            ? "bg-green-500 group-hover:shadow-md group-hover:shadow-green-200"
                            : "bg-gray-300 group-hover:bg-gray-400"
                        }`}
                        title={
                          ritual.isCompleted
                            ? "Mark as incomplete"
                            : "Mark as complete"
                        }
                      ></div>
                      <div className="flex justify-between w-full">
                        <div className="">
                          <div className="card-title capitalize">
                            {" "}
                            {ritual.title}
                          </div>
                          <div className="text-xs text-gray-700 space-y-1 ">
                            {ritual.estimatedDuration && (
                              <div className="subtext">
                                {ritual.estimatedDuration} min
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="  flex text-md">
                          {" "}
                          🔥{stats.currentStreak}{" "}
                        </span>
                      </div>
                    </div>

                    {/* {ritual.targetTime && (
                        <div className="flex items-center gap-1">
                          <span className="group-hover:animate-pulse">⏰</span>
                          {ritual.targetTime}
                        </div>
                      )} */}
                    {ritual.totalTasks > 0 && (
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-base font-medium tracking-wide text-subtext-light">
                          <span className="">
                            {" "}
                            {ritual.completedTasks}/ {ritual.totalTasks} Tasks
                          </span>
                          <span>
                            {ritual.totalTasks > 0
                              ? Math.round(
                                  (ritual.completedTasks / ritual.totalTasks) *
                                    100
                                )
                              : 0}
                            %
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-progress-bg-light">
                          <div
                            className="h-2 rounded-full bg-accen"
                            style={{
                              width: `${
                                ritual.totalTasks > 0
                                  ? Math.round(
                                      (ritual.completedTasks /
                                        ritual.totalTasks) *
                                        100
                                    )
                                  : 0
                              }%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

           
            {dailyRituals.length > 8 && (
              <div className="text-center mt-6">
                <button
                  onClick={() => router.push("/rituals?mode=home")}
                  className="px-6 py-3 text-accent hover:text-white hover:bg-accent text-sm font-medium transition-all duration-300 rounded-lg border-2 border-[#8050D9]"
                >
                  View {dailyRituals.length - 8} more rituals
                </button>
              </div>
            )}
          </section>
        )}
 <button
              onClick={() => router.push("/rituals?mode=new")}
              className="card  md:flex flex-col w-full mt-8 items-center justify-center min-h-[200px] border-2 border-dashed border-gray-300 hover:border-[#8050D9] h transition-all duration-300 group"
            >
              <div className="w-14 h-14 rounded-full bg-[#8050D9] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <span className="text-3xl text-white">  <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                className="lucide lucide-plus-icon lucide-plus"
              >
                <path d="M5 12h14" />
                <path d="M12 5v14" />
              </svg></span>
              </div>
              <div className="font-semibold text-lg text-gray-700 group-hover:text-[#8050D9] transition-colors">
                New Ritual
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Create a new practice
              </div>
            </button>
        {/* Analytics Charts Section */}
        <section>
          <h2 className="text-sm text-gray-600 title-sm mb-4">
            Your analytics
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {/* Weekly Progress Chart */}
            <div className="md:hidden">
              <WeeklyProgress></WeeklyProgress>
            </div>

            {/* Streak Calendar */}
            <div className="card">
              <div className="flex items-center justify-between ">
                <h3 className="card-title">Consistency</h3>
                <span className="text-sm font-medium text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                  7 day streak
                </span>
              </div>
              <div className=" subtext mb-8">
                37/49 days completed <br />
                Last 7 weeks
              </div>
              <div className="grid grid-cols-7 mb-5 gap-3">
                {Array.from({ length: 5 * 7 }, (_, i) => {
                  const intensity = Math.random();
                  const isToday = i === 5 * 7;
                  const bgColor =
                    intensity > 0.7
                      ? "bg-emerald-500"
                      : intensity > 0.4
                      ? "bg-emerald-300"
                      : intensity > 0.1
                      ? "bg-emerald-200"
                      : "bg-gray-100";
                  return (
                    <div
                      key={i}
                      className={`w-8 h-8 sm:w-15 sm:h-15 rounded-sm ${bgColor} transition-all duration-200 hover:scale-110 ${
                        isToday ? "ring-2 ring-emerald-400" : ""
                      }`}
                      title={`Day ${i + 1}`}
                    ></div>
                  );
                })}
              </div>
            </div>

            {/* Completion Rate Donut */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="card-title">Today&apos;s Completion</h3>
                <span className="text-sm font-medium text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
                  33%
                </span>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative sm:w-100 sm:h-100 w-60 h-60">
                  <svg
                    className="sm:w-100 sm:h-100 w-60 h-60 transform -rotate-90"
                    viewBox="0 0 100 100"
                  >
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
                    <span className="sm:text-5xl sm:font-bold text-3xl font-semibold text-amber-600">
                      1/3
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-center mt-3 flex justify-center w-full">
                <div className="w-fit subtext ">
                  {stats.completedToday} of {stats.totalRituals} rituals
                  completed
                </div>
              </div>
            </div>

            {/* Time Spent Chart */}
            <div className="card">
              <div className="flex items-center justify-between ">
                <h3 className="card-title">Time Distribution</h3>

                <span className="text-sm font-medium text-rose-600  bg-rose-100 px-2 py-1 rounded-full">
                  {Math.round(
                    (dailyRituals.reduce(
                      (sum, r) => sum + r.estimatedDuration,
                      0
                    ) /
                      60) *
                      10
                  ) / 10}
                  h planned
                </span>
              </div>
              <div className="subtext mb-6">
                {dailyRituals.length > 0
                  ? `${dailyRituals.length} rituals planned`
                  : "No rituals yet"}
              </div>
              <div className="space-y-3 mb-4">
                {dailyRituals.slice(0, 3).map((ritual, i) => {
                  const colors = ["bg-rose-400", "bg-rose-300", "bg-rose-200"];
                  const totalDuration = dailyRituals.reduce(
                    (sum, r) => sum + r.estimatedDuration,
                    0
                  );
                  const percent =
                    totalDuration > 0
                      ? Math.round(
                          (ritual.estimatedDuration / totalDuration) * 100
                        )
                      : 0;

                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="ext-sm text-subtext-light  mt-1 font-bold uppercase flex  tracking-wider ">
                          {ritual.title}
                        </span>
                        <span className="subtext">
                          {ritual.estimatedDuration}m
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`${
                            colors[i] || "bg-rose-200"
                          } h-2 rounded-full transition-all duration-1000`}
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <footer className="pt-8 pb-6 text-center text-sm text-gray-500 border-t border-gray-200 mt-12">
          Track your daily practices · Build lasting habits
        </footer>
      </div>
    </div>
  );
}
