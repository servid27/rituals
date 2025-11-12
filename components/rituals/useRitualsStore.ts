/* eslint-disable no-empty */
'use client';

import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { useSession } from 'next-auth/react';
import { useMonitoring } from '@/libs/monitoring';
import { analytics } from '@/libs/analytics';
import { ritualsApi as api } from '@/libs/rituals-api';
import type { Routine, SessionRecord } from '@/types/rituals';

export interface RitualsStore {
  routines: Routine[];
  setRoutines: Dispatch<SetStateAction<Routine[]>>;
  sessions: SessionRecord[];
  addSession: (sessionRecord: SessionRecord) => Promise<void>;
  deleteRoutine: (id: string) => Promise<boolean>;
  loadFromDatabase: () => Promise<void>;
  isLoading: boolean;
}

export const useRitualsStore = (): RitualsStore => {
  const { data: session } = useSession();
  const { trackUserAction } = useMonitoring();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadFromDatabase = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const [routinesData, sessionsData] = await Promise.all([api.getRoutines(), api.getSessions()]);
      setRoutines(routinesData);
      setSessions(sessionsData);
      requestAnimationFrame(() => setIsLoading(false));
    } catch (error) {
      console.error('Error loading data from database:', error);
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (!session?.user?.id) {
      setIsLoading(false);
      return;
    }

    loadFromDatabase();
  }, [session?.user?.id, loadFromDatabase]);

  const saveRoutine = useCallback(
    async (routine: Routine) => {
      try {
        const savedRoutine = await api.saveRoutine(routine);
        if (!savedRoutine) return;

        setRoutines((prev) => {
          const exists = prev.some((r) => r.id === routine.id);
          if (!exists) {
            trackUserAction('routine_created', {
              routineId: routine.id,
              routineName: routine.name,
              taskCount: routine.tasks.length,
              timestamp: Date.now(),
            });

            analytics.trackRoutineEvent('created', {
              routineId: routine.id,
              routineName: routine.name,
              taskCount: routine.tasks.length,
            });
          }
          return exists ? prev.map((r) => (r.id === routine.id ? savedRoutine : r)) : [...prev, savedRoutine];
        });
      } catch (error) {
        console.error('Error saving routine:', error);
        trackUserAction('error_occurred', {
          action: 'save_routine',
          error: error instanceof Error ? error.message : 'Unknown error',
          routineId: routine.id,
        });
      }
    },
    [trackUserAction]
  );

  const updateRoutine = useCallback(
    async (routine: Routine) => {
      try {
        const updatedRoutine = await api.updateRoutine(routine);
        if (!updatedRoutine) return;

        setRoutines((prev) => prev.map((r) => (r.id === routine.id ? updatedRoutine : r)));

        trackUserAction('routine_updated', {
          routineId: routine.id,
          routineName: routine.name,
          taskCount: routine.tasks.length,
          timestamp: Date.now(),
        });

        analytics.trackRoutineEvent('updated', {
          routineId: routine.id,
          routineName: routine.name,
          taskCount: routine.tasks.length,
        });
      } catch (error) {
        console.error('Error updating routine:', error);
        trackUserAction('error_occurred', {
          action: 'update_routine',
          error: error instanceof Error ? error.message : 'Unknown error',
          routineId: routine.id,
        });
      }
    },
    [trackUserAction]
  );

  const deleteRoutine = useCallback(
    async (id: string) => {
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
        await loadFromDatabase();
        return false;
      }
    },
    [loadFromDatabase, routines, trackUserAction]
  );

  const addSession = useCallback(
    async (sessionRecord: SessionRecord) => {
      try {
        const savedSession = await api.addSession(sessionRecord);
        if (!savedSession) return;

        setSessions((prev) => [savedSession, ...prev]);
        const routine = routines.find((r) => r.id === sessionRecord.routineId);

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

        analytics.trackRoutineEvent('completed', {
          routineId: sessionRecord.routineId,
          routineName: routine?.name || 'Unknown',
          taskCount: sessionRecord.tasksTotal,
          duration: sessionRecord.actualSeconds,
          completionRate: (sessionRecord.tasksCompleted / sessionRecord.tasksTotal) * 100,
        });
      } catch (error) {
        console.error('Error saving session:', error);
        trackUserAction('error_occurred', {
          action: 'save_session',
          error: error instanceof Error ? error.message : 'Unknown error',
          routineId: sessionRecord.routineId,
        });
      }
    },
    [routines, trackUserAction]
  );

  const setRoutinesWrapper = useCallback(
    (updater: SetStateAction<Routine[]>) => {
      setRoutines((prev) => {
        const next = typeof updater === 'function' ? (updater as (value: Routine[]) => Routine[])(prev) : updater;

        if (session?.user?.id) {
          next.forEach(async (routine) => {
            const existingRoutine = prev.find((r) => r.id === routine.id);
            if (!existingRoutine) {
              await saveRoutine(routine);
            } else if (JSON.stringify(existingRoutine) !== JSON.stringify(routine)) {
              await updateRoutine(routine);
            }
          });
        }

        return next;
      });
    },
    [saveRoutine, session?.user?.id, updateRoutine]
  );

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

export default useRitualsStore;
