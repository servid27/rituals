// Store/state management for the Rituals application

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import type { Routine, SessionRecord } from '@/types/rituals';
import { ritualsApi } from './rituals-api';

export const useRitualsStore = () => {
  const { data: session } = useSession();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from database
  const loadFromDatabase = useCallback(async () => {
    if (!session?.user?.id) return;

    console.log('Loading data from database for user:', session.user.id);

    try {
      console.log('Fetching routines and sessions...');
      const [routinesData, sessionsData] = await Promise.all([ritualsApi.getRoutines(), ritualsApi.getSessions()]);

      console.log('Fetched routines:', routinesData.length);
      console.log('Fetched sessions:', sessionsData.length);

      setRoutines(routinesData);
      setSessions(sessionsData);
    } catch (error) {
      console.error('Error loading data from database:', error);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  // Initialize data
  useEffect(() => {
    if (!session?.user?.id) {
      setIsLoading(false);
      return;
    }

    const initializeData = async () => {
      console.log('Initializing data for user:', session.user?.id);
      await loadFromDatabase();
      console.log('Data initialization complete');
    };

    initializeData();
  }, [session?.user?.id, loadFromDatabase]);

  // Save routine to database
  const saveRoutine = async (routine: Routine) => {
    try {
      const savedRoutine = await ritualsApi.saveRoutine(routine);
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
      const updatedRoutine = await ritualsApi.updateRoutine(routine);
      if (updatedRoutine) {
        setRoutines((prev) => prev.map((r) => (r.id === routine.id ? updatedRoutine : r)));
      }
    } catch (error) {
      console.error('Error updating routine:', error);
    }
  };

  const addSession = async (sessionRecord: SessionRecord) => {
    try {
      const savedSession = await ritualsApi.addSession(sessionRecord);
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
    loadFromDatabase,
  };
};
