'use client';

// Routine Card component for the home view

import React from 'react';
import type { Routine } from '@/types/rituals';
import { fmt } from '@/libs/rituals-utils';

export const RoutineCard: React.FC<{
  routine: Routine;
  index: number;
  onOpen: () => void;
}> = ({ routine, index, onOpen }) => {
  const total = routine.tasks.reduce((a, t) => a + t.targetSeconds, 0);
  const preview = routine.tasks.slice(0, 4);
 

  return (
    <button onClick={onOpen} className={`card hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}>
      
      <div className="card-title">{routine.name}</div>

       <span className="title-sm">Target {fmt(total)}</span>
        {routine.tasks.length > preview.length && (
          <li className="text-gray-400">+{routine.tasks.length - preview.length} more…</li>
        )}

      <div className="subtext mt-4 flex items-center justify-between">
        <span>{routine.tasks.length} tasks</span>
        
      </div>
    </button>
  );
};
