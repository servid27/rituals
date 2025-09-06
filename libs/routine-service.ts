import { supabase, createSupabaseAdmin } from './supabase';

export interface Task {
  id: string;
  title: string;
  targetSeconds: number;
}

export interface SessionRecord {
  id: string;
  routineId: string;
  dateISO: string;
  startISO: string;
  endISO: string;
  targetSeconds: number;
  actualSeconds: number;
  deltaSeconds: number;
  tasksCompleted: number;
  tasksTotal: number;
}

export interface Routine {
  id: string;
  user_id: string; // Changed from userId to match database schema
  name: string;
  tasks: Task[];
  sessions: SessionRecord[];
  isActive: boolean;
  created_at?: string;
  updated_at?: string;
}

export class RoutineService {
  // Use admin client for all operations since we're using NextAuth instead of Supabase Auth
  private static getClient() {
    return createSupabaseAdmin();
  }

  static async findByUserId(userId: string): Promise<Routine[]> {
    const client = this.getClient();
    const { data, error } = await client
      .from('routines')
      .select('*')
      .eq('user_id', userId) // Changed from userId to user_id
      .eq('isActive', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error finding routines by user id:', error);
      return [];
    }

    return data || [];
  }

  static async findById(id: string): Promise<Routine | null> {
    const client = this.getClient();
    const { data, error } = await client.from('routines').select('*').eq('id', id).single();

    if (error) {
      console.error('Error finding routine by id:', error);
      return null;
    }

    return data;
  }

  static async findByUserIdAndId(userId: string, routineId: string): Promise<Routine | null> {
    const client = this.getClient();
    const { data, error } = await client
      .from('routines')
      .select('*')
      .eq('user_id', userId) // Changed from userId to user_id
      .eq('id', routineId)
      .single();

    if (error) {
      console.error('Error finding routine by user and routine id:', error);
      return null;
    }

    return data;
  }

  static async create(routineData: Omit<Routine, 'created_at' | 'updated_at'>): Promise<Routine | null> {
    const client = this.getClient();
    const { data, error } = await client
      .from('routines')
      .insert({
        ...routineData,
        tasks: routineData.tasks || [],
        sessions: routineData.sessions || [],
        isActive: routineData.isActive !== false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating routine:', error);
      return null;
    }

    return data;
  }

  static async update(id: string, routineData: Partial<Routine>): Promise<Routine | null> {
    const client = this.getClient();
    const { data, error } = await client.from('routines').update(routineData).eq('id', id).select().single();

    if (error) {
      console.error('Error updating routine:', error);
      return null;
    }

    return data;
  }

  static async addSession(routineId: string, session: SessionRecord): Promise<Routine | null> {
    const routine = await this.findById(routineId);
    if (!routine) return null;

    const updatedSessions = [...(routine.sessions || []), session];

    return this.update(routineId, { sessions: updatedSessions });
  }

  static async delete(id: string): Promise<boolean> {
    const client = this.getClient();
    const { error } = await client.from('routines').update({ isActive: false }).eq('id', id);

    if (error) {
      console.error('Error deleting routine:', error);
      return false;
    }

    return true;
  }

  static async hardDelete(id: string): Promise<boolean> {
    const client = this.getClient();
    const { error } = await client.from('routines').delete().eq('id', id);

    if (error) {
      console.error('Error hard deleting routine:', error);
      return false;
    }

    return true;
  }

  static async getAllRoutines(): Promise<Routine[]> {
    const client = this.getClient();
    const { data, error } = await client.from('routines').select('*').order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting all routines:', error);
      return [];
    }

    return data || [];
  }

  static async getRoutineCount(): Promise<number> {
    const client = this.getClient();
    const { count, error } = await client.from('routines').select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error getting routine count:', error);
      return 0;
    }

    return count || 0;
  }

  static async cleanup(): Promise<{ deletedCount: number }> {
    // Clean up old sessions (keep only last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const routines = await this.getAllRoutines();
    let deletedCount = 0;

    for (const routine of routines) {
      if (routine.sessions && routine.sessions.length > 0) {
        const filteredSessions = routine.sessions.filter((session) => {
          const sessionDate = new Date(session.dateISO);
          return sessionDate >= thirtyDaysAgo;
        });

        if (filteredSessions.length !== routine.sessions.length) {
          await this.update(routine.id, { sessions: filteredSessions });
          deletedCount += routine.sessions.length - filteredSessions.length;
        }
      }
    }

    return { deletedCount };
  }

  static async deleteByUserIdAndIds(userId: string, routineIds: string[]): Promise<number> {
    let deletedCount = 0;

    for (const routineId of routineIds) {
      const routine = await this.findByUserIdAndId(userId, routineId);
      if (routine) {
        const deleted = await this.delete(routine.id);
        if (deleted) deletedCount++;
      }
    }

    return deletedCount;
  }
}

export default RoutineService;
