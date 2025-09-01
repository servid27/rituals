// Seed data for the Rituals application

import type { Routine } from '@/types/rituals';
import { uid } from './rituals-utils';

export const defaultRoutine: Routine = {
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
