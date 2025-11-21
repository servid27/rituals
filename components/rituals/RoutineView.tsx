"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { uid, fmt } from "@/libs/rituals-utils";
import type { Routine, SessionRecord } from "@/types/rituals";
import {
  Play,
  Pause,
  RotateCcw,
  Flag,
  History,
  Edit,
  Trash2,
  X,
  SkipForward,
  Check,
} from "lucide-react";

export interface RoutineViewProps {
  routine: Routine;
  onEdit: () => void;
  onClose: () => void;
  onDelete: () => Promise<boolean>;
  sessions: SessionRecord[];
  onRecord: (_newSession: SessionRecord) => Promise<void> | void;
}

export const RoutineView: React.FC<RoutineViewProps> = ({
  routine,
  onEdit,
  onClose,
  onDelete,
  sessions,
  onRecord,
}) => {
  const [running, setRunning] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [perTaskElapsed, setPerTaskElapsed] = useState(0);
  const [doneActuals, setDoneActuals] = useState<number[]>([]);
  const [globalElapsed, setGlobalElapsed] = useState(0);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [finishStats, setFinishStats] = useState<SessionRecord | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [showSessionRestore, setShowSessionRestore] = useState(false);
  const [hasRestoredSession, setHasRestoredSession] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [taskStartTime, setTaskStartTime] = useState<number | null>(null);
  const [pausedDuration, setPausedDuration] = useState(0);
  const [taskPausedDuration, setTaskPausedDuration] = useState(0);
  const [lastUpdateTime, setLastUpdateTime] = useState<number | null>(null);

  const runningRef = useRef(running);
  const sessionStartTimeRef = useRef(sessionStartTime);
  const taskStartTimeRef = useRef(taskStartTime);
  const pausedDurationRef = useRef(pausedDuration);
  const taskPausedDurationRef = useRef(taskPausedDuration);
  const currentIndexRef = useRef(currentIndex);

  useEffect(() => {
    runningRef.current = running;
  }, [running]);

  useEffect(() => {
    sessionStartTimeRef.current = sessionStartTime;
  }, [sessionStartTime]);

  useEffect(() => {
    taskStartTimeRef.current = taskStartTime;
  }, [taskStartTime]);

  useEffect(() => {
    pausedDurationRef.current = pausedDuration;
  }, [pausedDuration]);

  useEffect(() => {
    taskPausedDurationRef.current = taskPausedDuration;
  }, [taskPausedDuration]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  const sessionKey = `routine_session_${routine.id}`;

  const saveSessionState = useCallback(() => {
    if (!sessionStarted) return;

    const sessionState = {
      running,
      sessionStarted,
      currentIndex,
      doneActuals,
      startedAt,
      sessionStartTime,
      taskStartTime,
      pausedDuration,
      taskPausedDuration,
      lastUpdateTime: running ? Date.now() : lastUpdateTime ?? Date.now(),
      routineId: routine.id,
      version: 1,
    } as const;

    try {
      localStorage.setItem(sessionKey, JSON.stringify(sessionState));
    } catch (error) {
      console.warn("Failed to save session state:", error);
    }
  }, [
    currentIndex,
    doneActuals,
    pausedDuration,
    routine.id,
    running,
    sessionKey,
    sessionStartTime,
    sessionStarted,
    startedAt,
    taskPausedDuration,
    taskStartTime,
    lastUpdateTime,
  ]);

  const loadSessionState = useCallback(() => {
    try {
      const saved = localStorage.getItem(sessionKey);
      if (!saved) return false;

      const sessionState = JSON.parse(saved);
      if (sessionState.routineId !== routine.id || !sessionState.sessionStarted)
        return false;

      const timeSinceLastUpdate =
        Date.now() - (sessionState.lastUpdateTime || 0);
      if (timeSinceLastUpdate > 24 * 60 * 60 * 1000) {
        localStorage.removeItem(sessionKey);
        return false;
      }

      setShowSessionRestore(true);
      return true;
    } catch (error) {
      console.warn("Failed to load session state:", error);
      return false;
    }
  }, [routine.id, sessionKey]);

  const restoreSession = useCallback(() => {
    try {
      const saved = localStorage.getItem(sessionKey);
      if (!saved) return;

      const sessionState = JSON.parse(saved);
      setSessionStarted(sessionState.sessionStarted);
      setCurrentIndex(sessionState.currentIndex);
      setDoneActuals(sessionState.doneActuals || []);
      setStartedAt(sessionState.startedAt);
      setSessionStartTime(sessionState.sessionStartTime);
      setTaskStartTime(sessionState.taskStartTime);
      setPausedDuration(sessionState.pausedDuration || 0);
      setTaskPausedDuration(sessionState.taskPausedDuration || 0);
      setLastUpdateTime(sessionState.lastUpdateTime || null);

      const now = Date.now();
      const timeSinceLastUpdate = now - (sessionState.lastUpdateTime || now);

      if (sessionState.running && timeSinceLastUpdate < 300000) {
        setRunning(true);
      } else {
        setRunning(false);
        if (!sessionState.running || timeSinceLastUpdate >= 300000) {
          setPausedDuration((prev) => prev + timeSinceLastUpdate);
          setTaskPausedDuration((prev) => prev + timeSinceLastUpdate);
        }
      }

      setHasRestoredSession(true);
      setShowSessionRestore(false);
    } catch (error) {
      console.warn("Failed to restore session state:", error);
    }
  }, [sessionKey]);

  const clearSessionState = useCallback(() => {
    try {
      localStorage.removeItem(sessionKey);
    } catch (error) {
      console.warn("Failed to clear session state:", error);
    }
  }, [sessionKey]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (sessionStarted && running) {
        saveSessionState();
        event.preventDefault();
        event.returnValue =
          "You have a routine session in progress. Are you sure you want to leave?";
        return event.returnValue;
      }
      return undefined;
    };

    const handleUnload = () => {
      if (sessionStarted) {
        saveSessionState();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("unload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("unload", handleUnload);
    };
  }, [running, saveSessionState, sessionStarted]);

  useEffect(() => {
    loadSessionState();
  }, [loadSessionState]);

  useEffect(() => {
    saveSessionState();
  }, [saveSessionState]);

  useEffect(() => {
    if (!running || !sessionStartTime) return;

    let rafId: number;
    let intervalId: number;

    const updateTimers = () => {
      if (!runningRef.current || !sessionStartTimeRef.current) return;

      const now = Date.now();
      const totalElapsedMs =
        now - sessionStartTimeRef.current - pausedDurationRef.current;
      const totalElapsedSec = Math.floor(totalElapsedMs / 1000);
      setGlobalElapsed(Math.max(0, totalElapsedSec));

      if (taskStartTimeRef.current && currentIndexRef.current !== null) {
        const taskElapsedMs =
          now - taskStartTimeRef.current - taskPausedDurationRef.current;
        const taskElapsedSec = Math.floor(taskElapsedMs / 1000);
        setPerTaskElapsed(Math.max(0, taskElapsedSec));
      }
    };

    const tick = () => {
      if (runningRef.current) {
        updateTimers();
        rafId = requestAnimationFrame(tick);
      }
    };

    updateTimers();
    rafId = requestAnimationFrame(tick);
    intervalId = window.setInterval(() => {
      if (runningRef.current) {
        updateTimers();
      }
    }, 1000);

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [running, sessionStartTime]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && sessionStarted && runningRef.current) {
        const now = Date.now();
        if (sessionStartTimeRef.current) {
          const totalElapsedMs =
            now - sessionStartTimeRef.current - pausedDurationRef.current;
          const totalElapsedSec = Math.floor(totalElapsedMs / 1000);
          setGlobalElapsed(Math.max(0, totalElapsedSec));
        }

        if (taskStartTimeRef.current && currentIndexRef.current !== null) {
          const taskElapsedMs =
            now - taskStartTimeRef.current - taskPausedDurationRef.current;
          const taskElapsedSec = Math.floor(taskElapsedMs / 1000);
          setPerTaskElapsed(Math.max(0, taskElapsedSec));
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [sessionStarted]);

  const handleStartPause = () => {
    const now = Date.now();

    if (!sessionStarted) {
      if (!routine.tasks.length) {
        window.alert("Add at least one task to start this routine.");
        return;
      }

      setSessionStarted(true);
      setCurrentIndex(0);
      setPerTaskElapsed(0);
      setGlobalElapsed(0);
      setRunning(true);
      setStartedAt(new Date().toISOString());
      setSessionStartTime(now);
      setTaskStartTime(now);
      setPausedDuration(0);
      setTaskPausedDuration(0);
      return;
    }

    if (running) {
      setRunning(false);
      setLastUpdateTime(now);
      return;
    }

    const pauseTime = now - (lastUpdateTime || now);
    setPausedDuration((prev) => prev + pauseTime);
    setTaskPausedDuration((prev) => prev + pauseTime);
    setRunning(true);
  };

  const reset = () => {
    setRunning(false);
    setSessionStarted(false);
    setCurrentIndex(null);
    setPerTaskElapsed(0);
    setDoneActuals([]);
    setGlobalElapsed(0);
    setStartedAt(null);
    setSessionStartTime(null);
    setTaskStartTime(null);
    setPausedDuration(0);
    setTaskPausedDuration(0);
    setLastUpdateTime(null);
    clearSessionState();
  };

  const completeCurrent = () => {
    if (currentIndex == null) return;

    const actual = perTaskElapsed;
    setDoneActuals((arr) => {
      const next = [...arr];
      next[currentIndex] = actual;
      return next;
    });

    const nextIndex = currentIndex + 1;
    if (nextIndex < routine.tasks.length) {
      setCurrentIndex(nextIndex);
      setPerTaskElapsed(0);
      setTaskStartTime(Date.now());
      setTaskPausedDuration(0);
    } else {
      setRunning(false);
      setCurrentIndex(null);
      setTaskStartTime(null);
    }
  };

  const skipCurrent = () => {
    if (currentIndex == null) return;

    setDoneActuals((arr) => {
      const next = [...arr];
      next[currentIndex] = 0;
      return next;
    });

    const nextIndex = currentIndex + 1;
    if (nextIndex < routine.tasks.length) {
      setCurrentIndex(nextIndex);
      setPerTaskElapsed(0);
      setTaskStartTime(Date.now());
      setTaskPausedDuration(0);
    } else {
      setRunning(false);
      setCurrentIndex(null);
      setTaskStartTime(null);
    }
  };

  const goBack = () => {
    if (currentIndex == null || currentIndex === 0) return;

    const prevIndex = currentIndex - 1;
    setCurrentIndex(prevIndex);
    setPerTaskElapsed(0);
    setTaskStartTime(Date.now());
    setTaskPausedDuration(0);

    // Clear the done actual for the previous task
    setDoneActuals((arr) => {
      const next = [...arr];
      next[prevIndex] = undefined as any;
      return next;
    });
  };

  const finish = () => {
    const tasksDone = doneActuals.filter(
      (value) => typeof value === "number"
    ).length;
    const now = new Date();
    const startISO =
      startedAt || new Date(now.getTime() - globalElapsed * 1000).toISOString();
    const record: SessionRecord = {
      id: uid(),
      routineId: routine.id,
      dateISO: now.toISOString(),
      startISO,
      endISO: now.toISOString(),
      targetSeconds: routine.tasks.reduce(
        (total, task) => total + task.targetSeconds,
        0
      ),
      actualSeconds: globalElapsed,
      deltaSeconds:
        globalElapsed -
        routine.tasks.reduce((total, task) => total + task.targetSeconds, 0),
      tasksCompleted: tasksDone,
      tasksTotal: routine.tasks.length,
    };

    void onRecord(record);
    reset();
    setFinishStats(record);
  };

  const renderActual = (index: number) => {
    if (index === currentIndex) return fmt(perTaskElapsed);
    const actual = doneActuals[index];
    return typeof actual === "number" ? fmt(actual) : "—";
  };

  const renderRemaining = (index: number) => {
    const target = routine.tasks[index].targetSeconds;
    if (index === currentIndex) return fmt(target - perTaskElapsed);
    const actual = doneActuals[index];
    return typeof actual === "number" ? fmt(target - actual) : "—";
  };

  const routineSessions = sessions.filter(
    (session) => session.routineId === routine.id
  );

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${routine.name}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    reset();
    clearSessionState();
    const success = await onDelete();
    if (success) {
      onClose();
    }
  };

  const totalTarget = routine.tasks.reduce(
    (total, task) => total + task.targetSeconds,
    0
  );
  const totalActual =
    doneActuals.reduce(
      (acc, value) => acc + (typeof value === "number" ? value : 0),
      0
    ) + (currentIndex != null ? perTaskElapsed : 0);
  const totalRemaining = totalTarget - totalActual;

  useEffect(() => {
    if (!sessionStarted || !sessionStartTime) return;

    const referenceTime = running ? Date.now() : lastUpdateTime ?? Date.now();
    const totalElapsedMs = referenceTime - sessionStartTime - pausedDuration;
    const totalElapsedSec = Math.floor(totalElapsedMs / 1000);
    setGlobalElapsed(Math.max(0, totalElapsedSec));

    if (currentIndex !== null && taskStartTime) {
      const taskElapsedMs = referenceTime - taskStartTime - taskPausedDuration;
      const taskElapsedSec = Math.floor(taskElapsedMs / 1000);
      setPerTaskElapsed(Math.max(0, taskElapsedSec));
    }
  }, [
    sessionStarted,
    sessionStartTime,
    pausedDuration,
    running,
    lastUpdateTime,
    currentIndex,
    taskStartTime,
    taskPausedDuration,
  ]);

  return (
    <div className="space-y-4 md:bg-white md:p-6 md:rounded-lg md:shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
      <div className="">
        <div className="">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-col w-full gap-1">
              <div className="w-full flex justify-between">
                <h2 className="text-xl sm:block hidden sm:text-5xl pt-2 capitalize tracking-tight font-semibold">
                  {routine.name}
                </h2>
                <div className="sm:flex hidden gap-2">
                  <button
                    className="title-sm px-4 py-2.5 rounded-md  border border-gray-300 text-gray-700 flex items-center gap-2 hover:opacity-80 transition-opacity"
                    onClick={onEdit}
                  >
                    <Edit size={16} /> Edit
                  </button>{" "}
                  <button
                    className="title-sm px-4 py-2.5 rounded-md  border border-gray-300 text-gray-700 flex items-center gap-2 hover:opacity-80 transition-opacity"
                    onClick={onClose}
                  >
                    <X size={16} /> Close
                  </button>
                </div>
              </div>
              <div className="flex sm:hidden justify-between">
                <button className="" onClick={onClose}>
                  <X size={16} />
                </button>
                <h2 className="text-2xl sm:hidden pt-2 capitalize tracking-tight font-semibold">
                  {routine.name}
                </h2>
                <button className="" onClick={onEdit}>
                  <Edit size={16} />
                </button>{" "}
              </div>
              {hasRestoredSession && (
                <div className="text-sm text-center sm:justify-start flex-col-reverse sm:flex-row  justify-center text-blue-600 flex items-center gap-1">
                  <div className="sm:block hidden">📋</div>
                  <div>Session restored - continuing where you left off</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="py-2  text-sm  flex-1 min-w-[280px]">
        <div className="flex items-end mb-3 justify-between">
          <span className="text-5xl sm:text-6xl font-bold color-main">
            {fmt(globalElapsed)}
          </span>
          <div className="flex items-center gap-2 subtext">
            <span className="">/</span>
            <span className="">{fmt(totalTarget)}</span>
          </div>
        </div>
        <div className="w-full rounded-full bg-[#8050D940] h-3 overflow-hidden">
          <div
            className="bg-main h-3 rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${
                totalTarget > 0
                  ? Math.min(
                      Math.round((globalElapsed / totalTarget) * 100),
                      100
                    )
                  : 0
              }%`,
            }}
          ></div>
        </div>
        <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
          <span>
            {totalTarget > 0
              ? Math.min(Math.round((globalElapsed / totalTarget) * 100), 100)
              : 0}
            % complete
          </span>
          <span>{fmt(Math.max(0, totalTarget - globalElapsed))} remaining</span>
        </div>
      </div>
      <div className="flex sm:hidden flex-col">
        <div className=" grid gap-2 mb-3 grid-cols-2">
          {" "}
          <button
            className={` font-semibold  uppercase px-4  cursor-pointer py-2.5 rounded-lg flex items-center justify-center gap-2 hover:opacity-80 transition-opacity ${
              running
                ? "bg-gray-200 text-gray-800"
                : "bg-[#CDE5FF] text-green-800"
            }`}
            onClick={handleStartPause}
          >
            {running ? (
              <>
                <Pause size={18} /> Pause
              </>
            ) : (
              <>
              ▶️ Start
              </>
            )}
          </button>
          <button
            className=" font-semibold text-base t uppercase px-4 py-2.5 rounded-full sm:rounded-lg bg-[#FFDFD9]  text-gray-700 flex items-center justify-center gap-2 hover:opacity-80 transition-opacity"
            onClick={reset}
          >
           🔙 Reset
          </button>
       
        </div>
        <div className="grid gap-2  grid-cols-3">
             <button
            className=" font-semibold sm:text-base text-xs sm:uppercase px-4 py-2.5 rounded-full sm:rounded-lg bg-[#E1D5F5] text-violet-900 flex items-center justify-center gap-2 hover:opacity-80 transition-opacity"
            onClick={() => setConfirmFinish(true)}
          >
          🏁 Finish
          </button>
           <button
          className=" font-semibold sm:text-base text-xs sm:uppercase px-4 py-2.5 rounded-full sm:rounded-lg bg-[#B0E0E6]  text-gray-700 flex items-center justify-center gap-2 hover:opacity-80 transition-opacity"
          onClick={() => setShowHistory(true)}
        >
         📎 History
        </button>

        <button
          className=" font-semibold sm:text-base text-xs sm:uppercase px-4 py-2.5 rounded-full sm:rounded-lg bg-[#FFDFD9] text-red-800 flex items-center justify-center gap-2 hover:opacity-80 transition-opacity"
          onClick={() => void handleDelete()}
        >
        🗑️ Delete
        </button>
    

        </div>
      </div>
      <div className="sm:grid hidden flex-wrap justify-center h-fit sm:grid-cols-5 sm:h-[10vh] gap-1 sm:gap-3 mt-4">
        <button
          className={` font-semibold  uppercase px-4  cursor-pointer py-2.5 rounded-lg flex items-center justify-center gap-2 hover:opacity-80 transition-opacity ${
            running
              ? "bg-gray-200 text-gray-800"
              : "bg-green-300 text-green-800"
          }`}
          onClick={handleStartPause}
        >
          {running ? (
            <>
              <Pause size={18} /> Pause
            </>
          ) : (
            <>
              <Play size={18} /> Start
            </>
          )}
        </button>
        <button
          className=" font-semibold sm:text-base text-xs sm:uppercase px-4 py-2.5 rounded-full sm:rounded-lg bg-gray-100   text-gray-700 flex items-center justify-center gap-2 hover:opacity-80 transition-opacity"
          onClick={reset}
        >
          <RotateCcw size={18} /> Reset
        </button>

        <button
          className=" font-semibold sm:text-base text-xs sm:uppercase px-4 py-2.5 rounded-full sm:rounded-lg bg-[#bf97f0] text-violet-900 flex items-center justify-center gap-2 hover:opacity-80 transition-opacity"
          onClick={() => setConfirmFinish(true)}
        >
          <Flag size={18} /> Finish
        </button>
        <button
          className=" font-semibold sm:text-base text-xs sm:uppercase px-4 py-2.5 rounded-full sm:rounded-lg bg-blue-200  text-gray-700 flex items-center justify-center gap-2 hover:opacity-80 transition-opacity"
          onClick={() => setShowHistory(true)}
        >
          <History size={18} /> History
        </button>

        <button
          className=" font-semibold sm:text-base text-xs sm:uppercase px-4 py-2.5 rounded-full sm:rounded-lg bg-red-300  text-red-800 flex items-center justify-center gap-2 hover:opacity-80 transition-opacity"
          onClick={() => void handleDelete()}
        >
          <Trash2 size={18} /> Delete
        </button>
      </div>

      <div className=" ">
        <div className="hidden sm:block">
          <div className="grid grid-cols-12  text-xs text-gray-500 px-3 py-2 b"></div>
          <div className="divide-y">
            {routine.tasks.map((task, index) => {
              const isActive = index === currentIndex && running;
              const remainingNow = isActive
                ? task.targetSeconds - perTaskElapsed
                : typeof doneActuals[index] === "number"
                ? task.targetSeconds - (doneActuals[index] as number)
                : 0;

              return (
                <div
                  key={task.id}
                  className="grid  grid-cols-12 border border-gray-200 my-4 rounded-lg px-8 py-4 items-center p-3 gap-2"
                >
                  <div
                    className="col-span-12 flex items-center gap-3 cursor-pointer"
                    onClick={() => {
                      const element = document.getElementById(
                        `task-details-${index}`
                      );
                      if (element) {
                        element.classList.toggle("hidden");
                      }
                    }}
                  >
                    <div className="w-full flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                            typeof doneActuals[index] === "number"
                              ? "bg-green-500 border-green-500"
                              : "border-gray-300"
                          }`}
                        >
                          {typeof doneActuals[index] === "number" && (
                            <Check size={16} className="text-white" />
                          )}
                        </div>
                        <span className="text-2xl font-semibold">
                          {task.title}
                        </span>
                      </div>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="25"
                        height="25"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-gray-900"
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </div>
                  </div>
                  <div
                    id={`task-details-${index}`}
                    className="col-span-12 hidden"
                  >
                    <div className="grid grid-cols-12  gap-2 mt-2 px-3 py-2 rounded-lg">
                      <div className="col-span-4">
                        <div className="text-xs text-gray-500 mb-1">Target</div>
                        <div className="font-bold leading-wide text-sm">
                          {fmt(task.targetSeconds)}
                        </div>
                      </div>
                      <div className="col-span-4">
                        <div className="text-xs text-gray-500 mb-1">Actual</div>
                        <div
                          className={`font-bold leading-wide text-sm ${
                            isActive ? "text-black" : "text-gray-500"
                          }`}
                        >
                          {renderActual(index)}
                        </div>
                      </div>
                      <div className="col-span-4">
                        <div className="text-xs text-gray-500 mb-1">
                          Remaining
                        </div>
                        <div
                          className={`font-bold leading-wide text-sm ${
                            isActive
                              ? remainingNow < 0
                                ? "text-red-600"
                                : "text-black "
                              : "text-gray-500"
                          }`}
                        >
                          {renderRemaining(index)}
                        </div>
                      </div>
                    </div>
                  </div>
                  {isActive && (
                    <div className="col-span-12 flex justify-between gap-2 mt-2">
                      <button
                        className=" px-4 py-2.5 rounded-md bg-white border border-gray-400 text-gray-700 flex items-center gap-2 hover:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                        onClick={goBack}
                        disabled={currentIndex === 0}
                      >
                        <SkipForward size={16} className="rotate-180" /> Go Back
                      </button>
                      <div className="flex gap-2">
                        <button
                          className="t px-4 py-2.5 rounded-md bg-white border border-gray-300 text-gray-700 flex items-center gap-2 hover:opacity-80 transition-opacity"
                          onClick={skipCurrent}
                        >
                          <SkipForward size={16} /> Skip
                        </button>
                        <button
                          className=" px-4 py-2.5 rounded-md bg-[#8050D9] text-[#ffffff] flex items-center gap-2 hover:opacity-80 transition-opacity"
                          onClick={completeCurrent}
                        >
                          <Check size={16} /> Done
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="sm:hidden divide-y">
          {routine.tasks.map((task, index) => {
            const isActive = index === currentIndex && running;
            const remainingNow = isActive
              ? task.targetSeconds - perTaskElapsed
              : typeof doneActuals[index] === "number"
              ? task.targetSeconds - (doneActuals[index] as number)
              : 0;

            return (
              <div
                key={task.id}
                className="grid grid-cols-12 border card  border-gray-200 my-2 rounded-lg px-4 py-4 items-center p-3 gap-2"
              >
                <div
                  className="col-span-12 flex  items-center gap-3 cursor-pointer"
                  onClick={() => {
                    const element = document.getElementById(
                      `task-details-mobile-${index}`
                    );
                    if (element) {
                      element.classList.toggle("hidden");
                    }
                  }}
                >
                  <div className="w-full flex items-center  justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                          typeof doneActuals[index] === "number"
                            ? "bg-green-500 border-green-500"
                            : "border-gray-300"
                        }`}
                      >
                        {typeof doneActuals[index] === "number" && (
                          <Check size={16} className="text-white" />
                        )}
                      </div>
                      <span className="text-md font-medium">
                        {task.title}{" "}
                        <span className=" opacity-80">
                          ({fmt(task.targetSeconds)}){" "}
                        </span>
                      </span>
                    </div>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="25"
                      height="25"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-gray-900"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </div>
                </div>
                <div
                  id={`task-details-mobile-${index}`}
                  className="col-span-12 hidden"
                >
                  <div className="grid grid-cols-12 gap-2 mt-2 px-3 py-2 rounded-lg">
                    <div className="col-span-4">
                      <div className="text-sm text-gray-400 mb-1">Target</div>
                      <div className="leading-wide text-sm">
                        {fmt(task.targetSeconds)}
                      </div>
                    </div>
                    <div className="col-span-4">
                      <div className="text-sm text-gray-400 mb-1">Actual</div>
                      <div
                        className={`leading-wide text-sm ${
                          isActive ? "text-black" : "text-black"
                        }`}
                      >
                        {renderActual(index)}
                      </div>
                    </div>
                    <div className="col-span-4">
                      <div className="text-sm text-gray-400 mb-1">
                        Remaining
                      </div>
                      <div
                        className={`text-sm  leading-wide${
                          isActive
                            ? remainingNow < 0
                              ? "text-red-600"
                              : "text-green-700"
                            : "text-gray-500"
                        }`}
                      >
                        {renderRemaining(index)}
                      </div>
                    </div>
                    {isActive && (
                      <div className=" f gap-2 mt-2">
                        <div className="flex">
                          {" "}
                          <button
                            className=" px-4  text-xs rounded-md bg-white border border-gray-400 text-gray-700 flex items-center gap-2 hover:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                            onClick={goBack}
                            disabled={currentIndex === 0}
                          >
                            <SkipForward size={16} className="rotate-180" /> Go
                            Back
                          </button>
                          <div className="flex gap-2">
                            <button
                              className="t px-4 p text-xs rounded-md bg-white border border-gray-300 text-gray-700 flex items-center gap-2 hover:opacity-80 transition-opacity"
                              onClick={skipCurrent}
                            >
                              <SkipForward size={16} /> Skip
                            </button>{" "}
                          </div>
                        </div>
                        <button
                          className=" px-4 ptext-xs rounded-md bg-[#8050D9] text-[#ffffff] flex items-center gap-2 hover:opacity-80 text-xs transition-opacity"
                          onClick={completeCurrent}
                        >
                          <Check size={16} /> Done
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {confirmFinish && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-md mx-4">
            <div className="px-4 sm:px-5 py-4 border-[#00000010] border-b">
              <h3 className="text-lg font-semibold">Finish routine?</h3>
            </div>
            <div className="px-4 sm:px-5 py-4 text-sm">
              Are you sure you want to finish? Your current stats will be saved
              to history.
            </div>
            <div className="px-4 sm:px-5 py-4 flex flex-col sm:flex-row justify-end gap-2">
              <button
                className="title-sm px-4 py-2.5 rounded-md bg-white border border-gray-300 text-gray-700 flex items-center justify-center gap-2 hover:opacity-80 transition-opacity"
                onClick={() => setConfirmFinish(false)}
              >
                <X size={16} /> Cancel
              </button>
              <button
                className="title-sm px-4 py-2.5 rounded-md bg-red-600 text-white flex items-center justify-center gap-2 hover:opacity-80 transition-opacity"
                onClick={() => {
                  setConfirmFinish(false);
                  finish();
                }}
              >
                <Flag size={16} /> Finish
              </button>
            </div>
          </div>
        </div>
      )}
      {finishStats && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-md mx-4">
            <div className="px-4 sm:px-5 py-4 border-b">
              <h3 className="text-lg font-semibold">Session summary</h3>
            </div>
            <div className="px-4 sm:px-5 py-4 text-sm">
              <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                <div className="text-gray-500">Date</div>
                <div>{new Date(finishStats.dateISO).toLocaleDateString()}</div>
                <div className="text-gray-500">Start</div>
                <div>{new Date(finishStats.startISO).toLocaleTimeString()}</div>
                <div className="text-gray-500">Finish</div>
                <div>{new Date(finishStats.endISO).toLocaleTimeString()}</div>
                <div className="text-gray-500">Target</div>
                <div className="font-mono">
                  {fmt(finishStats.targetSeconds)}
                </div>
                <div className="text-gray-500">Actual</div>
                <div className="font-mono">
                  {fmt(finishStats.actualSeconds)}
                </div>
                <div className="text-gray-500">Δ</div>
                <div
                  className={`font-mono ${
                    finishStats.deltaSeconds <= 0
                      ? "text-green-700"
                      : "text-red-600"
                  }`}
                >
                  {fmt(Math.abs(finishStats.deltaSeconds))}
                </div>
                <div className="text-gray-500">Tasks</div>
                <div>
                  {finishStats.tasksCompleted}/{finishStats.tasksTotal}
                </div>
              </div>
            </div>
            <div className="px-4 sm:px-5 py-4 border-t flex justify-end">
              <button
                className="title-sm px-4 py-2.5 rounded-md bg-[#8050D9] text-white flex items-center gap-2 hover:opacity-80 transition-opacity"
                onClick={() => setFinishStats(null)}
              >
                <Check size={16} /> OK
              </button>
            </div>
          </div>
        </div>
      )}
      {showHistory && (
        <div className="fixed inset-0 bg-black/30 grid place-items-center p-4 z-40">
          <div className="bg-white w-full max-w-4xl mx-4 rounded-2xl border shadow-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-[#00000010]  border-b shrink-0">
              <div className="font-semibold">History · {routine.name}</div>
              <button
                className="title-sm px-4 py-2.5 rounded-md bg-white border border-gray-300 text-gray-700 flex items-center gap-2 hover:opacity-80 transition-opacity"
                onClick={() => setShowHistory(false)}
              >
                <X size={16} /> Close
              </button>
            </div>
            <div className="overflow-auto flex-1">
              <div className="hidden sm:block">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left px-3 py-2">Date</th>
                      <th className="text-left px-3 py-2">Start</th>
                      <th className="text-left px-3 py-2">Finish</th>
                      <th className="text-right px-3 py-2">Target</th>
                      <th className="text-right px-3 py-2">Actual</th>
                      <th className="text-right px-3 py-2">Δ</th>
                      <th className="text-right px-3 py-2">Tasks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {routineSessions.map((session) => (
                      <tr key={session.id} className="">
                        <td className="px-3 py-2">
                          {new Date(session.dateISO).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-2">
                          {new Date(session.startISO).toLocaleTimeString()}
                        </td>
                        <td className="px-3 py-2">
                          {new Date(session.endISO).toLocaleTimeString()}
                        </td>
                        <td className="px-3 py-2 text-right font-mono">
                          {fmt(session.targetSeconds)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono">
                          {fmt(session.actualSeconds)}
                        </td>
                        <td
                          className={`px-3 py-2 text-right font-mono ${
                            session.deltaSeconds > 0
                              ? "text-red-600"
                              : "text-green-700"
                          }`}
                        >
                          {fmt(Math.abs(session.deltaSeconds))}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {session.tasksCompleted}/{session.tasksTotal}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="sm:hidden divide-y">
                {routineSessions.map((session) => (
                  <div key={session.id} className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium">
                        {new Date(session.dateISO).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {session.tasksCompleted}/{session.tasksTotal} tasks
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      {new Date(session.startISO).toLocaleTimeString()} -{" "}
                      {new Date(session.endISO).toLocaleTimeString()}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <div className="text-xs text-gray-500">Target</div>
                        <div className="font-mono">
                          {fmt(session.targetSeconds)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Actual</div>
                        <div className="font-mono">
                          {fmt(session.actualSeconds)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Δ</div>
                        <div
                          className={`font-mono ${
                            session.deltaSeconds > 0
                              ? "text-red-600"
                              : "text-green-700"
                          }`}
                        >
                          {fmt(Math.abs(session.deltaSeconds))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {showSessionRestore && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-md mx-4">
            <div className="px-4 sm:px-5 py-4 border-[#00000010]  border-b">
              <h3 className="text-lg font-semibold">
                Resume Previous Session?
              </h3>
            </div>
            <div className="px-4 sm:px-5 py-4 text-sm">
              <p className="mb-2">
                You have an unfinished routine session. Would you like to
                continue where you left off?
              </p>
              <p className="text-gray-500 text-xs">
                Your progress and timing will be preserved.
              </p>
            </div>
            <div className="px-4 sm:px-5 py-4  flex flex-col sm:flex-row justify-end gap-2">
              <button
                className="title-sm px-4 py-2.5 rounded-md bg-white border border-gray-300 text-gray-700 flex items-center justify-center gap-2 hover:opacity-80 transition-opacity"
                onClick={() => {
                  setShowSessionRestore(false);
                  reset();
                  clearSessionState();
                }}
              >
                <RotateCcw size={16} /> Start Fresh
              </button>
              <button
                className="title-sm px-4 py-2.5 rounded-md bg-blue-600 text-white flex items-center justify-center gap-2 hover:opacity-80 transition-opacity"
                onClick={restoreSession}
              >
                <Play size={16} /> Resume Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoutineView;
