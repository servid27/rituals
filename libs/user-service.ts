import { supabase, createSupabaseAdmin } from './supabase';

export interface User {
  id: string;
  name?: string;
  email?: string;
  image?: string;
  bio?: string;
  timezone?: string;
  preferences?: {
    dailyReminderTime?: string;
    emailNotifications?: boolean;
    theme?: 'light' | 'dark' | 'auto';
  };
  stats?: {
    totalRituals?: number;
    completedToday?: number;
    currentStreak?: number;
    longestStreak?: number;
  };
  customerId?: string;
  priceId?: string;
  hasAccess?: boolean;
  created_at?: string;
  updated_at?: string;
}

export class UserService {
  static async findById(id: string): Promise<User | null> {
    const { data, error } = await supabase.from('users').select('*').eq('id', id).single();

    if (error) {
      console.error('Error finding user by id:', error);
      return null;
    }

    return data;
  }

  static async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase.from('users').select('*').eq('email', email).single();

    if (error) {
      console.error('Error finding user by email:', error);
      return null;
    }

    return data;
  }

  static async findByCustomerId(customerId: string): Promise<User | null> {
    const { data, error } = await supabase.from('users').select('*').eq('customerId', customerId).single();

    if (error) {
      console.error('Error finding user by customer ID:', error);
      return null;
    }

    return data;
  }

  static async create(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .insert({
        ...userData,
        preferences: userData.preferences || {
          dailyReminderTime: '09:00',
          emailNotifications: true,
          theme: 'light',
        },
        stats: userData.stats || {
          totalRituals: 0,
          completedToday: 0,
          currentStreak: 0,
          longestStreak: 0,
        },
        hasAccess: userData.hasAccess || false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      return null;
    }

    return data;
  }

  static async update(id: string, userData: Partial<User>): Promise<User | null> {
    const { data, error } = await supabase.from('users').update(userData).eq('id', id).select().single();

    if (error) {
      console.error('Error updating user:', error);
      return null;
    }

    return data;
  }

  static async updateStats(id: string, stats: Partial<User['stats']>): Promise<User | null> {
    const user = await this.findById(id);
    if (!user) return null;

    const updatedStats = { ...user.stats, ...stats };

    return this.update(id, { stats: updatedStats });
  }

  static async getAllUsers(): Promise<User[]> {
    const supabaseAdmin = createSupabaseAdmin();
    const { data, error } = await supabaseAdmin.from('users').select('*').order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting all users:', error);
      return [];
    }

    return data || [];
  }

  static async getUserCount(): Promise<number> {
    const supabaseAdmin = createSupabaseAdmin();
    const { count, error } = await supabaseAdmin.from('users').select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error getting user count:', error);
      return 0;
    }

    return count || 0;
  }

  // Administrative methods for analytics
  static async getTotalCount(): Promise<number> {
    return this.getUserCount();
  }

  static async getCountSince(date: Date): Promise<number> {
    const supabaseAdmin = createSupabaseAdmin();
    const { count, error } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', date.toISOString());

    if (error) {
      console.error('Error getting user count since date:', error);
      return 0;
    }

    return count || 0;
  }

  static async getMostActiveUsers(limit: number): Promise<any[]> {
    const supabaseAdmin = createSupabaseAdmin();
    // This is a simplified version - in a real implementation, you might need
    // to join with routines table or create a materialized view for performance
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, name, email, stats')
      .order('stats->totalRituals', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error getting most active users:', error);
      return [];
    }

    // Add mock routine and session counts - you'd need to implement proper joins
    return (data || []).map((user) => ({
      ...user,
      routineCount: user.stats?.totalRituals || 0,
      sessionCount: user.stats?.totalRituals || 0, // Simplified
    }));
  }

  static async getAggregatedStats(): Promise<any> {
    const supabaseAdmin = createSupabaseAdmin();
    const { data, error } = await supabaseAdmin.from('users').select('stats');

    if (error) {
      console.error('Error getting aggregated stats:', error);
      return {
        totalRituals: 0,
        avgCurrentStreak: 0,
        maxLongestStreak: 0,
        avgCompletedToday: 0,
      };
    }

    if (!data || data.length === 0) {
      return {
        totalRituals: 0,
        avgCurrentStreak: 0,
        maxLongestStreak: 0,
        avgCompletedToday: 0,
      };
    }

    const totalRituals = data.reduce((sum, user) => sum + (user.stats?.totalRituals || 0), 0);
    const avgCurrentStreak = data.reduce((sum, user) => sum + (user.stats?.currentStreak || 0), 0) / data.length;
    const maxLongestStreak = Math.max(...data.map((user) => user.stats?.longestStreak || 0));
    const avgCompletedToday = data.reduce((sum, user) => sum + (user.stats?.completedToday || 0), 0) / data.length;

    return {
      totalRituals,
      avgCurrentStreak,
      maxLongestStreak,
      avgCompletedToday,
    };
  }

  static async delete(id: string): Promise<boolean> {
    const supabaseAdmin = createSupabaseAdmin();
    const { error } = await supabaseAdmin.from('users').delete().eq('id', id);

    if (error) {
      console.error('Error deleting user:', error);
      return false;
    }

    return true;
  }
}

export default UserService;
