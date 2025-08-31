/* eslint-disable no-empty */
'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

/**
 * Rituals — Google Keep-style routine cards + checklist with target time
 * Database-first with fallback to localStorage for migration.
 * This file is self-contained and compile-safe.
 *
 * Entities
 *  - Task:        { id, title, targetSeconds }
 *  - Routine:     { id, name, createdAt, updatedAt, tasks }
 *  - SessionRecord: summary written to history when you Finish
 */

// ---------- Types ----------
export type Task = { id: string; title: string; targetSeconds: number };
export type Routine = { id: string; name: string; createdAt: string; updatedAt: string; tasks: Task[] };
export type SessionRecord = {
  id: string;
  routineId: string;
  dateISO: string;
  startISO: string;
  endISO: string;
  targetSeconds: number;
  actualSeconds: number;
  deltaSeconds: number; // actual - target
  tasksCompleted: number;
  tasksTotal: number;
};

// ---------- Utils ----------
const uid = () => Math.random().toString(36).slice(2, 10);
const fmt = (s: number) => {
  const sign = s < 0 ? '-' : '';
  const v = Math.abs(Math.trunc(s));
  const m = Math.floor(v / 60);
  const sec = v % 60;
  return `${sign}${m}:${String(sec).padStart(2, '0')}`;
};

// API functions for database operations
const api = {
  async getRoutines(): Promise<Routine[]> {
    try {
      const response = await fetch('/api/routines');
      if (!response.ok) throw new Error('Failed to fetch routines');
      const data = await response.json();
      return data.routines || [];
    } catch (error) {
      console.error('Error fetching routines:', error);
      return [];
    }
  },

  async saveRoutine(routine: Routine): Promise<Routine | null> {
    try {
      const response = await fetch('/api/routines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(routine),
      });
      if (!response.ok) throw new Error('Failed to save routine');
      const data = await response.json();
      return data.routine;
    } catch (error) {
      console.error('Error saving routine:', error);
      return null;
    }
  },

  async updateRoutine(routine: Routine): Promise<Routine | null> {
    try {
      const response = await fetch('/api/routines', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(routine),
      });
      if (!response.ok) throw new Error('Failed to update routine');
      const data = await response.json();
      return data.routine;
    } catch (error) {
      console.error('Error updating routine:', error);
      return null;
    }
  },

  async deleteRoutine(id: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/routines?id=${id}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (error) {
      console.error('Error deleting routine:', error);
      return false;
    }
  },

  async getSessions(): Promise<SessionRecord[]> {
    try {
      const response = await fetch('/api/routines/sessions');
      if (!response.ok) throw new Error('Failed to fetch sessions');
      const data = await response.json();
      return data.sessions || [];
    } catch (error) {
      console.error('Error fetching sessions:', error);
      return [];
    }
  },

  async addSession(session: SessionRecord): Promise<SessionRecord | null> {
    try {
      const response = await fetch('/api/routines/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(session),
      });
      if (!response.ok) throw new Error('Failed to add session');
      const data = await response.json();
      return data.session;
    } catch (error) {
      console.error('Error adding session:', error);
      return null;
    }
  },
};

// localStorage functions for migration
const hasLS = () => {
  try {
    return typeof window !== 'undefined' && !!window.localStorage;
  } catch {
    return false;
  }
};

const load = <T,>(k: string, fb: T): T => {
  if (!hasLS()) return fb;
  try {
    const r = localStorage.getItem(k);
    return r ? (JSON.parse(r) as T) : fb;
  } catch {
    return fb;
  }
};

// Clear localStorage after migration
const clearLocalStorage = () => {
  if (!hasLS()) return;
  try {
    localStorage.removeItem('rk_routines');
    localStorage.removeItem('rk_sessions');
    localStorage.removeItem('rk_version');
    localStorage.removeItem('rk_touched');
    localStorage.setItem('rk_migrated', 'true');
  } catch {}
};

const isMigrated = (): boolean => {
  if (!hasLS()) return true;
  try {
    return localStorage.getItem('rk_migrated') === 'true';
  } catch {
    return true;
  }
};

// ---------- Seed (from user-provided list) ----------
const seed: Routine = {
  id: uid(),
  name: 'Morning Routine',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  tasks: [
    { id: uid(), title: 'Dream Log', targetSeconds: 120 },
    { id: uid(), title: 'Put away earplugs and Make Bed, bring towel', targetSeconds: 300 },
    { id: uid(), title: 'mouth guard, brush teeth, wash face, brush hair, sunblock, toilet', targetSeconds: 300 },
    { id: uid(), title: 'Body Measurements & Video + Photo, Gym Attire', targetSeconds: 300 },
    { id: uid(), title: 'Caffeine, Medicine, Supplements', targetSeconds: 180 },
    { id: uid(), title: 'Tidy Up / Pack Gym bag', targetSeconds: 600 },
    { id: uid(), title: 'walk + coffee FOOT ROTATION', targetSeconds: 1200 },
    { id: uid(), title: 'Workout', targetSeconds: 3600 },
    { id: uid(), title: 'Walk back', targetSeconds: 900 },
    { id: uid(), title: 'Shower', targetSeconds: 900 },
    { id: uid(), title: 'Meditate', targetSeconds: 900 },
  ],
};

// ---------- Store (with database integration and migration) ----------
const useStore = () => {
  const { data: session } = useSession();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);

  // Load data from database
  const loadFromDatabase = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const [routinesData, sessionsData] = await Promise.all([api.getRoutines(), api.getSessions()]);

      setRoutines(routinesData);
      setSessions(sessionsData);

      // If no routines exist, create sample data
      if (routinesData.length === 0) {
        console.log('No routines found, creating sample data...');
        const sampleRoutines = [
          {
            id: '1',
            name: 'Morning Routine',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            tasks: [
              { id: 'task1', title: 'Dream Log', targetSeconds: 120 },
              { id: 'task2', title: 'Put away earplugs and Make Bed, bring towel', targetSeconds: 300 },
              {
                id: 'task3',
                title: 'mouth guard, brush teeth, wash face, brush hair, sunblock, toilet',
                targetSeconds: 300,
              },
              { id: 'task4', title: 'Body Measurements & Video + Photo, Gym Attire', targetSeconds: 300 },
              { id: 'task5', title: 'Caffeine, Medicine, Supplements', targetSeconds: 180 },
              { id: 'task6', title: 'Tidy Up / Pack Gym bag', targetSeconds: 600 },
              { id: 'task7', title: 'walk + coffee FOOT ROTATION', targetSeconds: 1200 },
              { id: 'task8', title: 'Workout', targetSeconds: 3600 },
              { id: 'task9', title: 'Walk back', targetSeconds: 900 },
              { id: 'task10', title: 'Shower', targetSeconds: 900 },
              { id: 'task11', title: 'Meditate', targetSeconds: 900 },
            ],
          },
          {
            id: '2',
            name: 'Exercise',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            tasks: [
              { id: 'task12', title: 'Warm up', targetSeconds: 300 },
              { id: 'task13', title: 'Main workout', targetSeconds: 1500 },
              { id: 'task14', title: 'Cool down', targetSeconds: 300 },
            ],
          },
          {
            id: '3',
            name: 'Reading',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            tasks: [
              { id: 'task15', title: 'Choose material', targetSeconds: 60 },
              { id: 'task16', title: 'Read actively', targetSeconds: 1140 },
            ],
          },
        ];

        // Create sample routines in database
        for (const routine of sampleRoutines) {
          await api.saveRoutine(routine);
        }

        setRoutines(sampleRoutines);
      }
    } catch (error) {
      console.error('Error loading data from database:', error);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  // Migrate data from localStorage to database
  const migrateFromLocalStorage = useCallback(async () => {
    if (!session?.user?.id || isMigrated()) return;

    setIsMigrating(true);
    try {
      const localRoutines = load('rk_routines', []);
      const localSessions = load('rk_sessions', []);

      if (localRoutines.length > 0) {
        console.log('Migrating routines from localStorage to database...');
        for (const routine of localRoutines) {
          await api.saveRoutine(routine);
        }
      }

      if (localSessions.length > 0) {
        console.log('Migrating sessions from localStorage to database...');
        for (const session of localSessions) {
          await api.addSession(session);
        }
      }

      clearLocalStorage();
      console.log('Migration completed');
    } catch (error) {
      console.error('Error during migration:', error);
    } finally {
      setIsMigrating(false);
    }
  }, [session?.user?.id]);

  // Initialize data
  useEffect(() => {
    if (!session?.user?.id) {
      setIsLoading(false);
      return;
    }

    const initializeData = async () => {
      // First, try to migrate from localStorage if needed
      await migrateFromLocalStorage();
      // Then load from database
      await loadFromDatabase();
    };

    initializeData();
  }, [session?.user?.id, migrateFromLocalStorage, loadFromDatabase]);

  // Save routine to database
  const saveRoutine = async (routine: Routine) => {
    try {
      const savedRoutine = await api.saveRoutine(routine);
      if (savedRoutine) {
        setRoutines((prev) => {
          const exists = prev.some((r) => r.id === routine.id);
          return exists ? prev.map((r) => (r.id === routine.id ? savedRoutine : r)) : [...prev, savedRoutine];
        });
      }
    } catch (error) {
      console.error('Error saving routine:', error);
    }
  };

  // Update routine in database
  const updateRoutine = async (routine: Routine) => {
    try {
      const updatedRoutine = await api.updateRoutine(routine);
      if (updatedRoutine) {
        setRoutines((prev) => prev.map((r) => (r.id === routine.id ? updatedRoutine : r)));
      }
    } catch (error) {
      console.error('Error updating routine:', error);
    }
  };

  const addSession = async (sessionRecord: SessionRecord) => {
    try {
      const savedSession = await api.addSession(sessionRecord);
      if (savedSession) {
        setSessions((prev) => [savedSession, ...prev]);
      }
    } catch (error) {
      console.error('Error saving session:', error);
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
    isLoading,
    isMigrating,
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
  sessions: SessionRecord[];
  onRecord: (_newSession: SessionRecord) => void;
}> = ({ routine, onEdit, onClose, sessions, onRecord }) => {
  const [running, setRunning] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [perTaskElapsed, setPerTaskElapsed] = useState(0);
  const [doneActuals, setDoneActuals] = useState<number[]>([]);
  const [globalElapsed, setGlobalElapsed] = useState(0);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [finishStats, setFinishStats] = useState<SessionRecord | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const timerRef = useRef<number | null>(null);
  const [startedAt, setStartedAt] = useState<string | null>(null);

  // Tick
  useEffect(() => {
    if (!running) return;
    timerRef.current = window.setInterval(() => {
      setGlobalElapsed((s) => s + 1);
      setPerTaskElapsed((s) => s + 1);
    }, 1000);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [running]);

  const handleStartPause = () => {
    if (!sessionStarted) {
      setSessionStarted(true);
      setCurrentIndex(0);
      setPerTaskElapsed(0);
      setRunning(true);
      setStartedAt(new Date().toISOString());
      return;
    }
    setRunning((r) => !r);
  };

  const reset = () => {
    setRunning(false);
    setSessionStarted(false);
    setCurrentIndex(null);
    setPerTaskElapsed(0);
    setDoneActuals([]);
    setGlobalElapsed(0);
    setStartedAt(null);
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
    } else {
      setRunning(false);
      setCurrentIndex(null);
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
    } else {
      setRunning(false);
      setCurrentIndex(null);
    }
  };

  const totalTarget = routine.tasks.reduce((a, t) => a + t.targetSeconds, 0);
  const totalActual =
    doneActuals.reduce((a, v) => a + (typeof v === 'number' ? v : 0), 0) + (currentIndex != null ? perTaskElapsed : 0);
  const totalRemaining = totalTarget - totalActual;

  const finish = () => {
    const tasksDone = doneActuals.filter((v) => typeof v === 'number').length;
    const now = new Date();
    const startISO = startedAt || new Date(now.getTime() - totalActual * 1000).toISOString();
    const rec: SessionRecord = {
      id: uid(),
      routineId: routine.id,
      dateISO: now.toISOString(),
      startISO,
      endISO: now.toISOString(),
      targetSeconds: totalTarget,
      actualSeconds: totalActual,
      deltaSeconds: totalActual - totalTarget,
      tasksCompleted: tasksDone,
      tasksTotal: routine.tasks.length,
    };
    onRecord(rec);
    reset();
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">{routine.name}</h2>
        <div className="flex items-center gap-2">
          <div className="px-3 py-2 rounded-xl border font-mono">⏱️ {fmt(globalElapsed)}</div>
          <button
            className={`px-3 py-2 rounded-xl ${running ? 'bg-gray-200 text-black' : 'bg-green-600 text-white'}`}
            onClick={handleStartPause}
          >
            {running ? '⏸️ Pause' : '▶️ Start'}
          </button>
          <button className="px-3 py-2 rounded-xl border" onClick={reset}>
            🔄 Reset
          </button>
        </div>
      </div>

      <div className="rounded-2xl border bg-white">
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
                <div className={`col-span-2 text-right font-mono text-sm ${isActive ? 'text-black' : 'text-gray-500'}`}>
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

      <div className="flex justify-end items-center gap-2">
        <button className="px-4 py-2 rounded-xl bg-red-600 text-white" onClick={() => setConfirmFinish(true)}>
          🏁 Finish
        </button>
        <button className="px-4 py-2 rounded-xl border" onClick={() => setShowHistory(true)}>
          📜 History
        </button>
        <button className="px-4 py-2 rounded-xl border" onClick={onEdit}>
          ✏️ Edit
        </button>
        <button className="px-4 py-2 rounded-xl border" onClick={onClose}>
          ✖️ Close
        </button>
      </div>

      {/* Confirm Finish */}
      {confirmFinish && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-md">
            <div className="px-5 py-4 border-b">
              <h3 className="text-lg font-semibold">Finish routine?</h3>
            </div>
            <div className="px-5 py-4 text-sm">
              Are you sure you want to finish? Your current stats will be saved to history.
            </div>
            <div className="px-5 py-4 border-t flex justify-end gap-2">
              <button className="px-4 py-2 rounded-xl border" onClick={() => setConfirmFinish(false)}>
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-xl bg-red-600 text-white"
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
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-md">
            <div className="px-5 py-4 border-b">
              <h3 className="text-lg font-semibold">Session summary</h3>
            </div>
            <div className="px-5 py-4 text-sm">
              <div className="grid grid-cols-2 gap-y-2">
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
            <div className="px-5 py-4 border-t flex justify-end">
              <button className="px-4 py-2 rounded-xl bg-black text-white" onClick={() => setFinishStats(null)}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/30 grid place-items-center p-4 z-40">
          <div className="bg-white w-full max-w-2xl rounded-2xl border shadow-lg">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="font-semibold">History · {routine.name}</div>
              <button className="px-3 py-1 rounded border" onClick={() => setShowHistory(false)}>
                Close
              </button>
            </div>
            <div className="max-h-[60vh] overflow-auto">
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

      {/* Template refresh helper (subtle, inline) */}
      {draft.name === 'Morning Routine' && draft.tasks.length < seed.tasks.length && (
        <div className="p-3 rounded-xl border bg-amber-50 text-sm flex items-center justify-between">
          <span>New template available for this routine.</span>
          <button
            className="px-3 py-1 rounded-lg border bg-white"
            onClick={() => {
              const fresh = {
                ...draft,
                tasks: seed.tasks.map((t) => ({ id: uid(), title: t.title, targetSeconds: t.targetSeconds })),
              };
              onChange({ ...fresh, updatedAt: new Date().toISOString() });
            }}
          >
            Use latest template
          </button>
        </div>
      )}

      <div className="grid gap-2">
        {draft.tasks.map((t, i) => {
          const mins = Math.floor(t.targetSeconds / 60);
          const secs = t.targetSeconds % 60;
          return (
            <div
              key={t.id}
              className="p-2 rounded-xl border bg-white flex items-center gap-3"
              draggable
              onDragStart={onDragStart(i)}
              onDragOver={onDragOver}
              onDrop={onDrop(i)}
            >
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
          );
        })}
        <button className="px-3 py-2 rounded-xl border" onClick={add}>
          + Add task
        </button>
      </div>

      <div className="flex justify-end gap-2">
        <button className="px-4 py-2 rounded-xl bg-black text-white" onClick={onSave}>
          Save
        </button>
        <button className="px-4 py-2 rounded-xl border" onClick={onClose}>
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
  const { routines, setRoutines, sessions, addSession, isLoading, isMigrating } = useStore();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<'home' | 'view' | 'edit'>(initialMode === 'new' ? 'edit' : initialMode);
  const [activeId, setActiveId] = useState<string | null>(initialRitualId);
  const active = routines.find((r) => r.id === activeId) || null;
  const [draft, setDraft] = useState<Routine | null>(null);

  // Handle URL parameters when routines are loaded
  useEffect(() => {
    if (isLoading || isMigrating) return;

    const urlMode = searchParams.get('mode');
    const urlRitual = searchParams.get('ritual');

    console.log('URL params:', { urlMode, urlRitual });
    console.log('Available routines:', routines);

    if (urlMode === 'new') {
      openNew();
    } else if (urlRitual) {
      const routine = routines.find((r) => r.id === urlRitual);
      console.log('Found routine:', routine);
      if (routine) {
        if (urlMode === 'edit') {
          openEdit(routine);
        } else {
          openView(routine);
        }
      } else {
        console.log('No routine found with ID:', urlRitual);
      }
    }
  }, [searchParams, routines, isLoading, isMigrating]);
  const openNew = () => {
    const routine: Routine = {
      id: uid(),
      name: 'New routine',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tasks: [],
    };
    setDraft(routine);
    setMode('edit');
  };
  const openView = (r: Routine) => {
    setActiveId(r.id);
    setMode('view');
  };
  const openEdit = (r: Routine) => {
    setDraft(JSON.parse(JSON.stringify(r)));
    setMode('edit');
  };

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

  // Show loading state while data is being loaded or migrated
  if (isLoading || isMigrating) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Rituals</h1>
        </header>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">
              {isMigrating ? 'Migrating your data to the cloud...' : 'Loading your routines...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Rituals</h1>
      </header>

      {mode === 'home' && (
        <div className="space-y-4">
          <h2 className="text-sm text-gray-600">Your routines</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
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
