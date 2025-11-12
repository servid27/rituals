'use client';

import React, { useRef } from 'react';
import type { Routine, Task } from '@/types/rituals';
import { uid } from '@/libs/rituals-utils';
import { DragHandle, NumberInput } from './UIComponents';

export interface RoutineEditorProps {
  draft: Routine;
  onChange: (_updatedRoutine: Routine) => void;
  onSave: () => void;
  onClose: () => void;
}

export const RoutineEditor: React.FC<RoutineEditorProps> = ({ draft, onChange, onSave, onClose }) => {
  const dragFrom = useRef<number | null>(null);

  const updateTask = (id: string, patch: Partial<Task>) => {
    onChange({
      ...draft,
      tasks: draft.tasks.map((task) => (task.id === id ? { ...task, ...patch } : task)),
      updatedAt: new Date().toISOString(),
    });
  };

  const addTask = () =>
    onChange({
      ...draft,
      tasks: [...draft.tasks, { id: uid(), title: 'New task', targetSeconds: 60 }],
      updatedAt: new Date().toISOString(),
    });

  const deleteTask = (id: string) =>
    onChange({
      ...draft,
      tasks: draft.tasks.filter((task) => task.id !== id),
      updatedAt: new Date().toISOString(),
    });

  const onDragStart = (index: number) => (event: React.DragEvent) => {
    dragFrom.current = index;
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const onDrop = (to: number) => (event: React.DragEvent) => {
    event.preventDefault();
    const from = dragFrom.current;
    dragFrom.current = null;
    if (from == null || from === to) return;
    const nextTasks = [...draft.tasks];
    const [moved] = nextTasks.splice(from, 1);
    nextTasks.splice(to, 0, moved);
    onChange({ ...draft, tasks: nextTasks, updatedAt: new Date().toISOString() });
  };

  return (
    <div className="space-y-4">
      <div>
        <input
          className="border rounded px-3 py-2 text-lg font-semibold w-full"
          value={draft.name}
          onChange={(event) => onChange({ ...draft, name: event.target.value, updatedAt: new Date().toISOString() })}
        />
      </div>

      <div className="grid gap-2">
        {draft.tasks.map((task, index) => {
          const minutes = Math.floor(task.targetSeconds / 60);
          const seconds = task.targetSeconds % 60;

          return (
            <div
              key={task.id}
              className="p-3 rounded-xl border bg-white"
              draggable
              onDragStart={onDragStart(index)}
              onDragOver={onDragOver}
              onDrop={onDrop(index)}
            >
              <div className="sm:hidden space-y-3">
                <div className="flex items-start gap-2">
                  <div className="w-6 text-center mt-1">
                    <DragHandle />
                  </div>
                  <input
                    className="flex-1 border rounded px-2 py-1 text-sm"
                    value={task.title}
                    onChange={(event) => updateTask(task.id, { title: event.target.value })}
                    placeholder="Task name"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Target:</span>
                    <NumberInput
                      value={minutes}
                      onChange={(value) => updateTask(task.id, { targetSeconds: value * 60 + seconds })}
                      className="w-14 text-sm"
                    />
                    <span className="text-xs text-gray-500">min</span>
                    <NumberInput
                      value={seconds}
                      onChange={(value) => updateTask(task.id, { targetSeconds: minutes * 60 + value })}
                      className="w-14 text-sm"
                    />
                    <span className="text-xs text-gray-500">sec</span>
                  </div>
                  <button className="px-3 py-1 rounded border text-red-600 text-sm" onClick={() => deleteTask(task.id)}>
                    Delete
                  </button>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-3">
                <div className="w-6 text-center">
                  <DragHandle />
                </div>
                <input
                  className="flex-1 border rounded px-2 py-1"
                  value={task.title}
                  onChange={(event) => updateTask(task.id, { title: event.target.value })}
                />
                <span className="text-sm text-gray-500">Target</span>
                <NumberInput
                  value={minutes}
                  onChange={(value) => updateTask(task.id, { targetSeconds: value * 60 + seconds })}
                />
                <span className="text-sm text-gray-500">min</span>
                <NumberInput
                  value={seconds}
                  onChange={(value) => updateTask(task.id, { targetSeconds: minutes * 60 + value })}
                />
                <span className="text-sm text-gray-500">sec</span>
                <button className="px-2 py-1 rounded border text-red-600" onClick={() => deleteTask(task.id)}>
                  Delete
                </button>
              </div>
            </div>
          );
        })}
        <button className="px-3 py-2 rounded-xl border text-sm" onClick={addTask}>
          + Add task
        </button>
      </div>

      <div className="flex flex-col sm:flex-row justify-end gap-2">
        <button className="px-4 py-2 rounded-xl bg-black text-white text-sm" onClick={onSave}>
          Save
        </button>
        <button className="px-4 py-2 rounded-xl border text-sm" onClick={onClose}>
          ✖️ Close
        </button>
      </div>
    </div>
  );
};

export default RoutineEditor;
