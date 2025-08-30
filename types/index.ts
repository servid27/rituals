export * from './config';

export interface UserProfile {
  _id: string;
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
    totalRituals: number;
    completedToday: number;
    currentStreak: number;
    longestStreak: number;
  };
  customerId?: string;
  priceId?: string;
  hasAccess?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RitualCompletion {
  date: Date;
  notes?: string;
  rating?: number;
}

export interface RitualStats {
  totalCompletions: number;
  currentStreak: number;
  longestStreak: number;
  lastCompleted?: Date;
}

export interface Ritual {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  category: 'health' | 'mindfulness' | 'productivity' | 'creativity' | 'relationships' | 'learning' | 'other';
  frequency: 'daily' | 'weekly' | 'monthly';
  targetTime?: string;
  estimatedDuration?: number;
  isActive: boolean;
  completions: RitualCompletion[];
  stats: RitualStats;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DailyRitual extends Ritual {
  isCompleted: boolean;
}
