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
