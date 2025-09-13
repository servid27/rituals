/* eslint-disable no-empty */
'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useMonitoring } from '@/libs/monitoring';
import { analytics } from '@/libs/analytics';

// Types
import type { Task, Routine, SessionRecord } from '@/types/rituals';

// Utils
import { uid, fmt } from '@/libs/rituals-utils';

// API
import { ritualsApi as api } from '@/libs/rituals-api';

// ---------- Store (with database integration) ----------
const useStore = () => {
  const { data: session } = useSession();
  const { trackUserAction } = useMonitoring();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from database
  const loadFromDatabase = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const [routinesData, sessionsData] = await Promise.all([api.getRoutines(), api.getSessions()]);

      setRoutines(routinesData);
      setSessions(sessionsData);

      // Use requestAnimationFrame to ensure the state updates are rendered
      requestAnimationFrame(() => {
        setIsLoading(false);
      });
    } catch (error) {
      console.error('Error loading data from database:', error);
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  // Initialize data
  useEffect(() => {
    if (!session?.user?.id) {
      setIsLoading(false);
      return;
    }

    loadFromDatabase();
  }, [session?.user?.id, loadFromDatabase]);

  // Save routine to database
  const saveRoutine = async (routine: Routine) => {
    try {
      const savedRoutine = await api.saveRoutine(routine);
      if (savedRoutine) {
        setRoutines((prev) => {
          const exists = prev.some((r) => r.id === routine.id);
          if (!exists) {
            // Track with both monitoring and analytics
            trackUserAction('routine_created', {
              routineId: routine.id,
              routineName: routine.name,
              taskCount: routine.tasks.length,
              timestamp: Date.now(),
            });

            // Enhanced Vercel Analytics tracking
            analytics.trackRoutineEvent('created', {
              routineId: routine.id,
              routineName: routine.name,
              taskCount: routine.tasks.length,
            });
          }
          return exists ? prev.map((r) => (r.id === routine.id ? savedRoutine : r)) : [...prev, savedRoutine];
        });
      }
    } catch (error) {
      console.error('Error saving routine:', error);
      trackUserAction('error_occurred', {
        action: 'save_routine',
        error: error instanceof Error ? error.message : 'Unknown error',
        routineId: routine.id,
      });
    }
  };

  // Update routine in database
  const updateRoutine = async (routine: Routine) => {
    try {
      const updatedRoutine = await api.updateRoutine(routine);
      if (updatedRoutine) {
        setRoutines((prev) => prev.map((r) => (r.id === routine.id ? updatedRoutine : r)));

        // Track with both monitoring and analytics
        trackUserAction('routine_updated', {
          routineId: routine.id,
          routineName: routine.name,
          taskCount: routine.tasks.length,
          timestamp: Date.now(),
        });

        // Enhanced Vercel Analytics tracking
        analytics.trackRoutineEvent('updated', {
          routineId: routine.id,
          routineName: routine.name,
          taskCount: routine.tasks.length,
        });
      }
    } catch (error) {
      console.error('Error updating routine:', error);
      trackUserAction('error_occurred', {
        action: 'update_routine',
        error: error instanceof Error ? error.message : 'Unknown error',
        routineId: routine.id,
      });
    }
  };

  // Delete routine from database
  const deleteRoutine = async (id: string) => {
    try {
      const routineToDelete = routines.find((r) => r.id === id);
      const success = await api.deleteRoutine(id);

      if (success) {
        setRoutines((prev) => prev.filter((r) => r.id !== id));
        trackUserAction('routine_deleted', {
          routineId: id,
          routineName: routineToDelete?.name || 'Unknown',
          taskCount: routineToDelete?.tasks.length || 0,
          timestamp: Date.now(),
        });
      } else {
        // If delete failed, refresh data to sync with database
        console.log('Delete failed, refreshing data from database...');
        await loadFromDatabase();
        trackUserAction('error_occurred', {
          action: 'delete_routine',
          error: 'Delete operation failed',
          routineId: id,
        });
      }
      return success;
    } catch (error) {
      console.error('Error deleting routine:', error);
      // On error, also refresh data to sync with database
      await loadFromDatabase();
      return false;
    }
  };

  const addSession = async (sessionRecord: SessionRecord) => {
    try {
      const savedSession = await api.addSession(sessionRecord);
      if (savedSession) {
        setSessions((prev) => [savedSession, ...prev]);

        // Find the routine name for tracking
        const routine = routines.find((r) => r.id === sessionRecord.routineId);

        // Track with both monitoring and analytics
        trackUserAction('routine_completed', {
          routineId: sessionRecord.routineId,
          routineName: routine?.name || 'Unknown',
          tasksCompleted: sessionRecord.tasksCompleted,
          tasksTotal: sessionRecord.tasksTotal,
          actualSeconds: sessionRecord.actualSeconds,
          targetSeconds: sessionRecord.targetSeconds,
          deltaSeconds: sessionRecord.deltaSeconds,
          completionRate: (sessionRecord.tasksCompleted / sessionRecord.tasksTotal) * 100,
          efficiency:
            sessionRecord.targetSeconds > 0 ? (sessionRecord.targetSeconds / sessionRecord.actualSeconds) * 100 : 0,
          timestamp: Date.now(),
        });

        // Enhanced Vercel Analytics tracking
        analytics.trackRoutineEvent('completed', {
          routineId: sessionRecord.routineId,
          routineName: routine?.name || 'Unknown',
          taskCount: sessionRecord.tasksTotal,
          duration: sessionRecord.actualSeconds,
          completionRate: (sessionRecord.tasksCompleted / sessionRecord.tasksTotal) * 100,
        });
      }
    } catch (error) {
      console.error('Error saving session:', error);
      trackUserAction('error_occurred', {
        action: 'save_session',
        error: error instanceof Error ? error.message : 'Unknown error',
        routineId: sessionRecord.routineId,
      });
    }
  };

  const setRoutinesWrapper = (updater: React.SetStateAction<Routine[]>) => {
    setRoutines((prev) => {
      const newRoutines = typeof updater === 'function' ? updater(prev) : updater;

      // Auto-save changes to database
      if (session?.user?.id) {
        // Find changed routines and save them
        newRoutines.forEach(async (routine) => {
          const existingRoutine = prev.find((r) => r.id === routine.id);
          if (!existingRoutine) {
            // New routine
            await saveRoutine(routine);
          } else if (JSON.stringify(existingRoutine) !== JSON.stringify(routine)) {
            // Updated routine
            await updateRoutine(routine);
          }
        });
      }

      return newRoutines;
    });
  };

  return {
    routines,
    setRoutines: setRoutinesWrapper,
    sessions,
    addSession,
    deleteRoutine,
    loadFromDatabase,
    isLoading,
  };
};

// ---------- Small UI bits ----------
const NumberInput: React.FC<{ value: number; onChange: (_newValue: number) => void; className?: string }> = ({
  value,
  onChange,
  className,
}) => (
  <input
    type="number"
    className={`w-16 border rounded px-2 py-1 text-sm ${className || ''}`}
    min={0}
    value={value}
    onChange={(e) => onChange(parseInt(e.target.value || '0', 10))}
  />
);

const DragHandle: React.FC = () => (
  <span className="cursor-grab text-gray-400 select-none" title="Drag">
    ⋮⋮
  </span>
);

// ---------- Routine Card (HOME) ----------
const RoutineCard: React.FC<{ routine: Routine; index: number; onOpen: () => void }> = ({ routine, index, onOpen }) => {
  const total = routine.tasks.reduce((a, t) => a + t.targetSeconds, 0);
  const preview = routine.tasks.slice(0, 4);
  const bg = ['bg-amber-50', 'bg-sky-50', 'bg-emerald-50', 'bg-rose-50'][index % 4];
  return (
    <button onClick={onOpen} className={`text-left p-4 rounded-2xl border ${bg} hover:shadow transition`}>
      <div className="font-semibold mb-2 truncate">{routine.name}</div>
      <ul className="text-xs text-gray-700 space-y-1 min-h-[72px]">
        {preview.map((t, i) => (
          <li key={t.id} className="flex justify-between gap-2">
            <span className="truncate">
              {i + 1}. {t.title}
            </span>
            <span className="font-mono text-gray-500">{fmt(t.targetSeconds)}</span>
          </li>
        ))}
        {routine.tasks.length > preview.length && (
          <li className="text-gray-400">+{routine.tasks.length - preview.length} more…</li>
        )}
      </ul>
      <div className="mt-2 text-[11px] text-gray-500 flex justify-between">
        <span>{routine.tasks.length} tasks</span>
        <span className="font-mono">Target {fmt(total)}</span>
      </div>
    </button>
  );
};

// ---------- Viewer (RUN) ----------
const RoutineView: React.FC<{
  routine: Routine;
  onEdit: () => void;
  onClose: () => void;
  onDelete: () => void;
  sessions: SessionRecord[];
  onRecord: (_newSession: SessionRecord) => void;
}> = ({ routine, onEdit, onClose, onDelete, sessions, onRecord }) => {
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

  // Background timer state - tracks real time even when tab is inactive
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [taskStartTime, setTaskStartTime] = useState<number | null>(null);
  const [pausedDuration, setPausedDuration] = useState(0);
  const [taskPausedDuration, setTaskPausedDuration] = useState(0);
  const [lastUpdateTime, setLastUpdateTime] = useState<number | null>(null);

  // Refs to track the current state for timer callbacks
  const runningRef = useRef(running);
  const sessionStartTimeRef = useRef(sessionStartTime);
  const taskStartTimeRef = useRef(taskStartTime);
  const pausedDurationRef = useRef(pausedDuration);
  const taskPausedDurationRef = useRef(taskPausedDuration);
  const currentIndexRef = useRef(currentIndex);

  // Update refs when state changes
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

  // Session persistence key
  const sessionKey = `routine_session_${routine.id}`;

  // Save session state to localStorage
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
      lastUpdateTime: Date.now(),
      routineId: routine.id,
      version: 1, // for future migrations
    };

    try {
      localStorage.setItem(sessionKey, JSON.stringify(sessionState));
    } catch (e) {
      console.warn('Failed to save session state:', e);
    }
  }, [
    running,
    sessionStarted,
    currentIndex,
    doneActuals,
    startedAt,
    sessionStartTime,
    taskStartTime,
    pausedDuration,
    taskPausedDuration,
    sessionKey,
    routine.id,
  ]);

  // Load session state from localStorage
  const loadSessionState = useCallback(() => {
    try {
      const saved = localStorage.getItem(sessionKey);
      if (!saved) return false;

      const sessionState = JSON.parse(saved);
      if (sessionState.routineId !== routine.id || !sessionState.sessionStarted) return false;

      // Check if session is recent (within 24 hours)
      const timeSinceLastUpdate = Date.now() - (sessionState.lastUpdateTime || 0);
      if (timeSinceLastUpdate > 24 * 60 * 60 * 1000) {
        try {
          localStorage.removeItem(sessionKey);
        } catch (e) {
          console.warn('Failed to clear old session state:', e);
        }
        return false;
      }

      // Show restore prompt instead of auto-restoring
      setShowSessionRestore(true);
      return true;
    } catch (e) {
      console.warn('Failed to load session state:', e);
      return false;
    }
  }, [sessionKey, routine.id]);

  // Actually restore the session state
  const restoreSession = useCallback(() => {
    try {
      const saved = localStorage.getItem(sessionKey);
      if (!saved) return;

      const sessionState = JSON.parse(saved);

      // Restore state
      setSessionStarted(sessionState.sessionStarted);
      setCurrentIndex(sessionState.currentIndex);
      setDoneActuals(sessionState.doneActuals || []);
      setStartedAt(sessionState.startedAt);
      setSessionStartTime(sessionState.sessionStartTime);
      setTaskStartTime(sessionState.taskStartTime);
      setPausedDuration(sessionState.pausedDuration || 0);
      setTaskPausedDuration(sessionState.taskPausedDuration || 0);

      // Calculate elapsed time accounting for time away
      const now = Date.now();
      const timeSinceLastUpdate = now - (sessionState.lastUpdateTime || now);

      if (sessionState.running && timeSinceLastUpdate < 300000) {
        // Resume if less than 5 minutes
        setRunning(true);
      } else {
        setRunning(false);
        // Add away time to paused duration if we were paused or away too long
        if (!sessionState.running || timeSinceLastUpdate >= 300000) {
          setPausedDuration((prev) => prev + timeSinceLastUpdate);
        }
      }

      setHasRestoredSession(true);
      setShowSessionRestore(false);
    } catch (e) {
      console.warn('Failed to restore session state:', e);
    }
  }, [sessionKey]);

  // Clear session state
  const clearSessionState = useCallback(() => {
    try {
      localStorage.removeItem(sessionKey);
    } catch (e) {
      console.warn('Failed to clear session state:', e);
    }
  }, [sessionKey]);

  // Handle page unload/beforeunload to save state
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (sessionStarted && running) {
        saveSessionState();
        e.preventDefault();
        e.returnValue = 'You have a routine session in progress. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    const handleUnload = () => {
      if (sessionStarted) {
        saveSessionState();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
    };
  }, [sessionStarted, running, saveSessionState]);

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${routine.name}"? This action cannot be undone.`)) {
      clearSessionState(); // Clear any saved session
      onDelete();
      onClose(); // Close the view after deleting
    }
  };

  // Load saved session on component mount
  useEffect(() => {
    loadSessionState();
  }, [loadSessionState]);

  // Save session state whenever relevant state changes
  useEffect(() => {
    saveSessionState();
  }, [saveSessionState]);

  // Background timer with timestamp-based calculation
  useEffect(() => {
    if (!running || !sessionStartTime) return;

    let rafId: number;
    let intervalId: NodeJS.Timeout;

    const updateTimers = () => {
      // Check running state from ref to get latest value
      if (!runningRef.current || !sessionStartTimeRef.current) return;

      const now = Date.now();
      const totalElapsedMs = now - sessionStartTimeRef.current - pausedDurationRef.current;
      const totalElapsedSec = Math.floor(totalElapsedMs / 1000);

      setGlobalElapsed(Math.max(0, totalElapsedSec));

      if (taskStartTimeRef.current && currentIndexRef.current !== null) {
        const taskElapsedMs = now - taskStartTimeRef.current - taskPausedDurationRef.current;
        const taskElapsedSec = Math.floor(taskElapsedMs / 1000);
        setPerTaskElapsed(Math.max(0, taskElapsedSec));
      }
    };

    // Update immediately
    updateTimers();

    // Use requestAnimationFrame for smooth updates and better background behavior
    const tick = () => {
      if (runningRef.current) {
        updateTimers();
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);

    // Fallback with setInterval for when RAF is throttled, but check running state
    intervalId = setInterval(() => {
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
  }, [running, sessionStartTime]); // Only depend on running state and sessionStartTime

  // Handle visibility change to detect when user returns to tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && sessionStarted && runningRef.current) {
        // User returned to tab, refresh timers immediately
        const now = Date.now();
        if (sessionStartTimeRef.current) {
          const totalElapsedMs = now - sessionStartTimeRef.current - pausedDurationRef.current;
          const totalElapsedSec = Math.floor(totalElapsedMs / 1000);
          setGlobalElapsed(Math.max(0, totalElapsedSec));
        }

        if (taskStartTimeRef.current && currentIndexRef.current !== null) {
          const taskElapsedMs = now - taskStartTimeRef.current - taskPausedDurationRef.current;
          const taskElapsedSec = Math.floor(taskElapsedMs / 1000);
          setPerTaskElapsed(Math.max(0, taskElapsedSec));
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [sessionStarted]);

  const handleStartPause = () => {
    const now = Date.now();

    if (!sessionStarted) {
      // Starting new session
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
      // Pausing
      setRunning(false);
      setLastUpdateTime(now);
    } else {
      // Resuming
      const pauseTime = now - (lastUpdateTime || now);
      setPausedDuration((prev) => prev + pauseTime);
      setTaskPausedDuration((prev) => prev + pauseTime);

      setRunning(true);
    }
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
      setTaskStartTime(Date.now()); // Reset task timer for next task
      setTaskPausedDuration(0); // Reset task pause duration for next task
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
      setTaskStartTime(Date.now()); // Reset task timer for next task
      setTaskPausedDuration(0); // Reset task pause duration for next task
    } else {
      setRunning(false);
      setCurrentIndex(null);
      setTaskStartTime(null);
    }
  };

  const totalTarget = routine.tasks.reduce((a, t) => a + t.targetSeconds, 0);
  const totalActual =
    doneActuals.reduce((a, v) => a + (typeof v === 'number' ? v : 0), 0) + (currentIndex != null ? perTaskElapsed : 0);
  const totalRemaining = totalTarget - totalActual;

  const finish = () => {
    const tasksDone = doneActuals.filter((v) => typeof v === 'number').length;
    const now = new Date();
    const startISO = startedAt || new Date(now.getTime() - globalElapsed * 1000).toISOString();
    const rec: SessionRecord = {
      id: uid(),
      routineId: routine.id,
      dateISO: now.toISOString(),
      startISO,
      endISO: now.toISOString(),
      targetSeconds: totalTarget,
      actualSeconds: globalElapsed, // Use calculated global elapsed time
      deltaSeconds: globalElapsed - totalTarget,
      tasksCompleted: tasksDone,
      tasksTotal: routine.tasks.length,
    };
    onRecord(rec);
    reset(); // This will clear session state
    setFinishStats(rec);
  };

  const renderActual = (i: number) => {
    if (i === currentIndex) return fmt(perTaskElapsed);
    const val = doneActuals[i];
    return typeof val === 'number' ? fmt(val) : '—';
  };
  const renderRemaining = (i: number) => {
    const target = routine.tasks[i].targetSeconds;
    if (i === currentIndex) return fmt(target - perTaskElapsed);
    const val = doneActuals[i];
    return typeof val === 'number' ? fmt(target - val) : '—';
  };

  const routineSessions = sessions.filter((s) => s.routineId === routine.id);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl sm:text-2xl font-semibold">{routine.name}</h2>
          {hasRestoredSession && (
            <div className="text-sm text-blue-600 flex items-center gap-1">
              <span>📋</span>
              <span>Session restored - continuing where you left off</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3 py-2 rounded-xl border font-mono text-sm">⏱️ {fmt(globalElapsed)}</div>
          <button
            className={`px-3 py-2 rounded-xl text-sm ${running ? 'bg-gray-200 text-black' : 'bg-green-600 text-white'}`}
            onClick={handleStartPause}
          >
            {running ? '⏸️ Pause' : '▶️ Start'}
          </button>
          <button className="px-3 py-2 rounded-xl border text-sm" onClick={reset}>
            🔄 Reset
          </button>
        </div>
      </div>

      <div className="rounded-2xl border bg-white">
        {/* Desktop table view - hidden on mobile */}
        <div className="hidden sm:block">
          {/* Header row */}
          <div className="grid grid-cols-12 text-xs text-gray-500 px-3 py-2 border-b">
            <div className="col-span-6">Task</div>
            <div className="col-span-2 text-right">Target</div>
            <div className="col-span-2 text-right">Actual</div>
            <div className="col-span-2 text-right">Remaining</div>
          </div>
          <ul className="divide-y">
            {routine.tasks.map((t, i) => {
              const isActive = i === currentIndex && running;
              const remainingNow = isActive
                ? t.targetSeconds - perTaskElapsed
                : typeof doneActuals[i] === 'number'
                ? t.targetSeconds - (doneActuals[i] as number)
                : 0;
              return (
                <li key={t.id} className="grid grid-cols-12 items-center p-3 gap-2">
                  <div className="col-span-6 flex items-center gap-3">
                    <span className="w-6 text-xs text-gray-500">{i + 1}.</span>
                    <span>{t.title}</span>
                  </div>
                  <div className="col-span-2 text-right font-mono text-sm">{fmt(t.targetSeconds)}</div>
                  <div
                    className={`col-span-2 text-right font-mono text-sm ${isActive ? 'text-black' : 'text-gray-500'}`}
                  >
                    {renderActual(i)}
                  </div>
                  <div
                    className={`col-span-2 text-right font-mono text-sm ${
                      isActive ? (remainingNow < 0 ? 'text-red-600' : 'text-green-700') : 'text-gray-500'
                    }`}
                  >
                    {renderRemaining(i)}
                  </div>
                  {isActive && (
                    <div className="col-span-12 flex justify-end gap-2 mt-2">
                      <button className="px-3 py-1 rounded-lg border" onClick={skipCurrent}>
                        ⏭️ Skip
                      </button>
                      <button className="px-3 py-1 rounded-lg bg-black text-white" onClick={completeCurrent}>
                        ✅ Done
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          {/* Totals row */}
          <div className="grid grid-cols-12 px-3 py-2 border-t bg-gray-50 text-sm font-mono">
            <div className="col-span-6 font-semibold">Total</div>
            <div className="col-span-2 text-right">{fmt(totalTarget)}</div>
            <div className="col-span-2 text-right">{fmt(totalActual)}</div>
            <div className={`col-span-2 text-right ${totalRemaining < 0 ? 'text-red-600' : 'text-green-700'}`}>
              {fmt(totalRemaining)}
            </div>
          </div>
        </div>

        {/* Mobile card view - visible only on mobile */}
        <div className="sm:hidden divide-y">
          {routine.tasks.map((t, i) => {
            const isActive = i === currentIndex && running;
            const remainingNow = isActive
              ? t.targetSeconds - perTaskElapsed
              : typeof doneActuals[i] === 'number'
              ? t.targetSeconds - (doneActuals[i] as number)
              : 0;
            return (
              <div key={t.id} className={`p-4 ${isActive ? 'bg-blue-50' : ''}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-2">
                    <span className="text-sm text-gray-500 mt-0.5">{i + 1}.</span>
                    <span className="font-medium">{t.title}</span>
                  </div>
                  {isActive && <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>}
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <div className="text-xs text-gray-500">Target</div>
                    <div className="font-mono">{fmt(t.targetSeconds)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Actual</div>
                    <div className={`font-mono ${isActive ? 'text-black' : 'text-gray-500'}`}>{renderActual(i)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Remaining</div>
                    <div
                      className={`font-mono ${
                        isActive ? (remainingNow < 0 ? 'text-red-600' : 'text-green-700') : 'text-gray-500'
                      }`}
                    >
                      {renderRemaining(i)}
                    </div>
                  </div>
                </div>
                {isActive && (
                  <div className="flex gap-2 mt-3">
                    <button className="flex-1 px-3 py-2 rounded-lg border text-sm" onClick={skipCurrent}>
                      ⏭️ Skip
                    </button>
                    <button
                      className="flex-1 px-3 py-2 rounded-lg bg-black text-white text-sm"
                      onClick={completeCurrent}
                    >
                      ✅ Done
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          {/* Mobile totals */}
          <div className="p-4 bg-gray-50">
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <div className="text-xs text-gray-500">Target Total</div>
                <div className="font-mono font-semibold">{fmt(totalTarget)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Actual Total</div>
                <div className="font-mono font-semibold">{fmt(totalActual)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Remaining</div>
                <div className={`font-mono font-semibold ${totalRemaining < 0 ? 'text-red-600' : 'text-green-700'}`}>
                  {fmt(totalRemaining)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-2">
        <button className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm" onClick={() => setConfirmFinish(true)}>
          🏁 Finish
        </button>
        <button className="px-4 py-2 rounded-xl border text-sm" onClick={() => setShowHistory(true)}>
          📜 History
        </button>
        <button className="px-4 py-2 rounded-xl border text-sm" onClick={onEdit}>
          ✏️ Edit
        </button>
        <button
          className="px-4 py-2 rounded-xl border border-red-300 text-red-600 hover:bg-red-50 text-sm"
          onClick={handleDelete}
        >
          🗑️ Delete
        </button>
        <button className="px-4 py-2 rounded-xl border text-sm" onClick={onClose}>
          ✖️ Close
        </button>
      </div>

      {/* Confirm Finish */}
      {confirmFinish && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-md mx-4">
            <div className="px-4 sm:px-5 py-4 border-b">
              <h3 className="text-lg font-semibold">Finish routine?</h3>
            </div>
            <div className="px-4 sm:px-5 py-4 text-sm">
              Are you sure you want to finish? Your current stats will be saved to history.
            </div>
            <div className="px-4 sm:px-5 py-4 border-t flex flex-col sm:flex-row justify-end gap-2">
              <button className="px-4 py-2 rounded-xl border text-sm" onClick={() => setConfirmFinish(false)}>
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm"
                onClick={() => {
                  setConfirmFinish(false);
                  finish();
                }}
              >
                Finish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session Summary */}
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
                <div className="font-mono">{fmt(finishStats.targetSeconds)}</div>
                <div className="text-gray-500">Actual</div>
                <div className="font-mono">{fmt(finishStats.actualSeconds)}</div>
                <div className="text-gray-500">Δ</div>
                <div className={`font-mono ${finishStats.deltaSeconds <= 0 ? 'text-green-700' : 'text-red-600'}`}>
                  {fmt(Math.abs(finishStats.deltaSeconds))}
                </div>
                <div className="text-gray-500">Tasks</div>
                <div>
                  {finishStats.tasksCompleted}/{finishStats.tasksTotal}
                </div>
              </div>
            </div>
            <div className="px-4 sm:px-5 py-4 border-t flex justify-end">
              <button className="px-4 py-2 rounded-xl bg-black text-white text-sm" onClick={() => setFinishStats(null)}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/30 grid place-items-center p-4 z-40">
          <div className="bg-white w-full max-w-4xl mx-4 rounded-2xl border shadow-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
              <div className="font-semibold">History · {routine.name}</div>
              <button className="px-3 py-1 rounded border text-sm" onClick={() => setShowHistory(false)}>
                Close
              </button>
            </div>
            <div className="overflow-auto flex-1">
              {/* Desktop table view */}
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
                    {routineSessions.map((s) => (
                      <tr key={s.id} className="border-t">
                        <td className="px-3 py-2">{new Date(s.dateISO).toLocaleDateString()}</td>
                        <td className="px-3 py-2">{new Date(s.startISO).toLocaleTimeString()}</td>
                        <td className="px-3 py-2">{new Date(s.endISO).toLocaleTimeString()}</td>
                        <td className="px-3 py-2 text-right font-mono">{fmt(s.targetSeconds)}</td>
                        <td className="px-3 py-2 text-right font-mono">{fmt(s.actualSeconds)}</td>
                        <td
                          className={`px-3 py-2 text-right font-mono ${
                            s.deltaSeconds > 0 ? 'text-red-600' : 'text-green-700'
                          }`}
                        >
                          {fmt(Math.abs(s.deltaSeconds))}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {s.tasksCompleted}/{s.tasksTotal}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile card view */}
              <div className="sm:hidden divide-y">
                {routineSessions.map((s) => (
                  <div key={s.id} className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium">{new Date(s.dateISO).toLocaleDateString()}</div>
                      <div className="text-sm text-gray-500">
                        {s.tasksCompleted}/{s.tasksTotal} tasks
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      {new Date(s.startISO).toLocaleTimeString()} - {new Date(s.endISO).toLocaleTimeString()}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <div className="text-xs text-gray-500">Target</div>
                        <div className="font-mono">{fmt(s.targetSeconds)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Actual</div>
                        <div className="font-mono">{fmt(s.actualSeconds)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Δ</div>
                        <div className={`font-mono ${s.deltaSeconds > 0 ? 'text-red-600' : 'text-green-700'}`}>
                          {fmt(Math.abs(s.deltaSeconds))}
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

      {/* Session Restore Modal */}
      {showSessionRestore && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-md mx-4">
            <div className="px-4 sm:px-5 py-4 border-b">
              <h3 className="text-lg font-semibold">Resume Previous Session?</h3>
            </div>
            <div className="px-4 sm:px-5 py-4 text-sm">
              <p className="mb-2">
                You have an unfinished routine session. Would you like to continue where you left off?
              </p>
              <p className="text-gray-500 text-xs">Your progress and timing will be preserved.</p>
            </div>
            <div className="px-4 sm:px-5 py-4 border-t flex flex-col sm:flex-row justify-end gap-2">
              <button
                className="px-4 py-2 rounded-xl border text-sm"
                onClick={() => {
                  setShowSessionRestore(false);
                  clearSessionState();
                }}
              >
                Start Fresh
              </button>
              <button className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm" onClick={restoreSession}>
                Resume Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------- Editor with Drag & Drop ----------
const RoutineEditor: React.FC<{
  draft: Routine;
  onChange: (_updatedRoutine: Routine) => void;
  onSave: () => void;
  onClose: () => void;
}> = ({ draft, onChange, onSave, onClose }) => {
  const dragFrom = useRef<number | null>(null);
  const updateTask = (id: string, patch: Partial<Task>) => {
    onChange({
      ...draft,
      tasks: draft.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
      updatedAt: new Date().toISOString(),
    });
  };
  const add = () =>
    onChange({
      ...draft,
      tasks: [...draft.tasks, { id: uid(), title: 'New task', targetSeconds: 60 }],
      updatedAt: new Date().toISOString(),
    });
  const del = (id: string) =>
    onChange({ ...draft, tasks: draft.tasks.filter((t) => t.id !== id), updatedAt: new Date().toISOString() });

  const onDragStart = (i: number) => (e: React.DragEvent) => {
    dragFrom.current = i;
    e.dataTransfer.effectAllowed = 'move';
  };
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  const onDrop = (to: number) => (e: React.DragEvent) => {
    e.preventDefault();
    const from = dragFrom.current;
    dragFrom.current = null;
    if (from == null || from === to) return;
    const arr = [...draft.tasks];
    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);
    onChange({ ...draft, tasks: arr, updatedAt: new Date().toISOString() });
  };

  return (
    <div className="space-y-4">
      <div>
        <input
          className="border rounded px-3 py-2 text-lg font-semibold w-full"
          value={draft.name}
          onChange={(e) => onChange({ ...draft, name: e.target.value, updatedAt: new Date().toISOString() })}
        />
      </div>

      <div className="grid gap-2">
        {draft.tasks.map((t, i) => {
          const mins = Math.floor(t.targetSeconds / 60);
          const secs = t.targetSeconds % 60;
          return (
            <div
              key={t.id}
              className="p-3 rounded-xl border bg-white"
              draggable
              onDragStart={onDragStart(i)}
              onDragOver={onDragOver}
              onDrop={onDrop(i)}
            >
              {/* Mobile layout */}
              <div className="sm:hidden space-y-3">
                <div className="flex items-start gap-2">
                  <div className="w-6 text-center mt-1">
                    <DragHandle />
                  </div>
                  <input
                    className="flex-1 border rounded px-2 py-1 text-sm"
                    value={t.title}
                    onChange={(e) => updateTask(t.id, { title: e.target.value })}
                    placeholder="Task name"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Target:</span>
                    <NumberInput
                      value={mins}
                      onChange={(n) => updateTask(t.id, { targetSeconds: n * 60 + secs })}
                      className="w-14 text-sm"
                    />
                    <span className="text-xs text-gray-500">min</span>
                    <NumberInput
                      value={secs}
                      onChange={(n) => updateTask(t.id, { targetSeconds: mins * 60 + n })}
                      className="w-14 text-sm"
                    />
                    <span className="text-xs text-gray-500">sec</span>
                  </div>
                  <button className="px-3 py-1 rounded border text-red-600 text-sm" onClick={() => del(t.id)}>
                    Delete
                  </button>
                </div>
              </div>

              {/* Desktop layout */}
              <div className="hidden sm:flex items-center gap-3">
                <div className="w-6 text-center">
                  <DragHandle />
                </div>
                <input
                  className="flex-1 border rounded px-2 py-1"
                  value={t.title}
                  onChange={(e) => updateTask(t.id, { title: e.target.value })}
                />
                <span className="text-sm text-gray-500">Target</span>
                <NumberInput value={mins} onChange={(n) => updateTask(t.id, { targetSeconds: n * 60 + secs })} />
                <span className="text-sm text-gray-500">min</span>
                <NumberInput value={secs} onChange={(n) => updateTask(t.id, { targetSeconds: mins * 60 + n })} />
                <span className="text-sm text-gray-500">sec</span>
                <button className="px-2 py-1 rounded border text-red-600" onClick={() => del(t.id)}>
                  Delete
                </button>
              </div>
            </div>
          );
        })}
        <button className="px-3 py-2 rounded-xl border text-sm" onClick={add}>
          + Add task
        </button>
      </div>

      <div className="flex flex-col sm:flex-row justify-end gap-2">
        <button className="px-4 py-2 rounded-xl bg-black text-white text-sm" onClick={onSave}>
          Save
        </button>
        <button className="px-4 py-2 rounded-xl border text-sm" onClick={onClose}>
          ✖️ Close
        </button>
      </div>
    </div>
  );
};

// ---------- App ----------
interface RitualsProps {
  initialMode?: 'home' | 'view' | 'edit' | 'new';
  initialRitualId?: string;
}

export default function Rituals({ initialMode = 'home', initialRitualId = null }: RitualsProps = {}) {
  const { routines, setRoutines, sessions, addSession, deleteRoutine, isLoading } = useStore();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<'home' | 'view' | 'edit'>(initialMode === 'new' ? 'edit' : initialMode);
  const [activeId, setActiveId] = useState<string | null>(initialRitualId);
  const active = routines.find((r) => r.id === activeId) || null;
  const [draft, setDraft] = useState<Routine | null>(null);

  const openNew = useCallback(() => {
    const routine: Routine = {
      id: uid(),
      name: 'New routine',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tasks: [],
    };
    setDraft(routine);
    setMode('edit');
  }, []);

  const openView = useCallback((r: Routine) => {
    setActiveId(r.id);
    setMode('view');
  }, []);

  const openEdit = useCallback((r: Routine) => {
    setDraft(JSON.parse(JSON.stringify(r)));
    setMode('edit');
  }, []);

  // Handle URL parameters when routines are loaded
  useEffect(() => {
    const urlMode = searchParams.get('mode');
    const urlRitual = searchParams.get('ritual');

    // Handle 'new' mode regardless of loading state or authentication
    if (urlMode === 'new') {
      openNew();
      return;
    }

    // For other modes, wait until loading is complete
    if (isLoading) return;

    if (urlRitual) {
      const routine = routines.find((r) => r.id === urlRitual);
      if (routine) {
        if (urlMode === 'edit') {
          openEdit(routine);
        } else {
          openView(routine);
        }
      }
    }
  }, [searchParams, routines, isLoading, openNew, openEdit, openView]);

  const saveDraft = () => {
    if (!draft) return;
    setRoutines((rs) => {
      const exists = rs.some((x) => x.id === draft.id);
      return exists ? rs.map((x) => (x.id === draft.id ? draft : x)) : [draft, ...rs];
    });
    setMode('view');
    setActiveId(draft.id);
    setDraft(null);
  };

  // Show loading state while data is being loaded
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-3 py-6 sm:px-6 space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold">Rituals</h1>
        </header>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your routines...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-3 py-6 sm:px-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold">Rituals</h1>
      </header>

      {mode === 'home' && (
        <div className="space-y-4">
          <h2 className="text-sm text-gray-600">Your routines</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {routines.map((r, idx) => (
              <RoutineCard key={r.id} routine={r} index={idx} onOpen={() => openView(r)} />
            ))}
            <button
              onClick={openNew}
              className="p-4 rounded-2xl border-dashed border-2 border-gray-300 hover:border-gray-400 text-left flex flex-col items-start justify-center min-h-[140px]"
            >
              <div className="w-10 h-10 grid place-items-center rounded-xl border mb-2">+</div>
              <div className="font-semibold">New routine</div>
              <div className="text-xs text-gray-500">Create a checklist</div>
            </button>
          </div>
        </div>
      )}

      {mode === 'view' && active && (
        <RoutineView
          routine={active}
          onEdit={() => openEdit(active)}
          onClose={() => {
            setMode('home');
            setActiveId(null);
          }}
          onDelete={() => deleteRoutine(active.id)}
          sessions={sessions}
          onRecord={addSession}
        />
      )}

      {mode === 'edit' && draft && (
        <RoutineEditor
          draft={draft}
          onChange={setDraft}
          onSave={saveDraft}
          onClose={() => {
            setMode('home');
            setDraft(null);
            setActiveId(null);
          }}
        />
      )}

      <footer className="pt-6 text-center text-xs text-gray-500">
        Local‑first · Keep-style cards · Drag to reorder (Edit mode)
      </footer>
    </div>
  );
}

// ---------- Tiny self-tests (non-blocking) ----------
try {
  console.assert(fmt(0) === '0:00', 'fmt(0)');
  console.assert(fmt(125) === '2:05', 'fmt(125)');
  console.assert(fmt(-61) === '-1:01', 'fmt(-61)');
} catch {}
