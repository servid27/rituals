// API functions for database operations in the Rituals application

import type { Routine, SessionRecord } from '@/types/rituals';

export const ritualsApi = {
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
      console.log('Updating routine:', routine);
      const response = await fetch('/api/routines', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(routine),
      });

      if (!response.ok) {
        if (response.status === 404) {
          // Routine doesn't exist in database, create it first
          console.log('Routine not found in database, creating it...');
          return await this.saveRoutine(routine);
        }
        const errorText = await response.text();
        console.error('Update failed:', response.status, errorText);
        throw new Error(`Failed to update routine: ${response.status}`);
      }

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
