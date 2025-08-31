// Types for the Rituals application

export type Task = {
  id: string;
  title: string;
  targetSeconds: number;
};

export type Routine = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  tasks: Task[];
};

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

export type RitualsProps = {
  initialMode?: 'home' | 'view' | 'edit' | 'new';
  initialRitualId?: string | null;
};
