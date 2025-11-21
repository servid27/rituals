"use client";

import React, { useRef } from "react";
import type { Routine, Task } from "@/types/rituals";
import { uid } from "@/libs/rituals-utils";
import { DragHandle, NumberInput } from "./UIComponents";

export interface RoutineEditorProps {
  draft: Routine;
  onChange: (_updatedRoutine: Routine) => void;
  onSave: () => void;
  onClose: () => void;
}

export const RoutineEditor: React.FC<RoutineEditorProps> = ({
  draft,
  onChange,
  onSave,
  onClose,
}) => {
  const dragFrom = useRef<number | null>(null);

  const updateTask = (id: string, patch: Partial<Task>) => {
    onChange({
      ...draft,
      tasks: draft.tasks.map((task) =>
        task.id === id ? { ...task, ...patch } : task
      ),
      updatedAt: new Date().toISOString(),
    });
  };

  const addTask = () =>
    onChange({
      ...draft,
      tasks: [
        ...draft.tasks,
        { id: uid(), title: "New task", targetSeconds: 60 },
      ],
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
    event.dataTransfer.effectAllowed = "move";
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
    onChange({
      ...draft,
      tasks: nextTasks,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-4 md:bg-white md:p-6 md:rounded-lg md:shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
      <div className="flex justify-between items-center  pb-5  pt-3 md:px-5 border-b border-gray-200 w-full">
        {" "}
        <button className="" onClick={onClose}>
   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-move-left-icon lucide-move-left"><path d="M6 8L2 12L6 16"/><path d="M2 12H22"/></svg>
        </button>
        <div className="text-black font-semibold  text-2xl">New Ritual</div>
        <div     onClick={onSave} className="color-main font-semibold  text-lg">Create</div>
      </div>
      <div className="title-sm ">Ritual Title</div>

      <div className="flex gap-5 w-full">
        <input
          className="  px-6  py-4 text-lg font-medium sm:card-title bg-white border-gray-200 shadow-card border-2  md:rounded-lg rounded-full md:bg-gray-100 w-full"
          value={draft.name}
          onChange={(event) =>
            onChange({
              ...draft,
              name: event.target.value,
              updatedAt: new Date().toISOString(),
            })
          }
        />
      </div>
      <div className="title-sm mt-5">Tasks</div>
      <div className="grid gap-2">
        {draft.tasks.map((task, index) => {
          const minutes = Math.floor(task.targetSeconds / 60);
          const seconds = task.targetSeconds % 60;

          return (
            <div
              key={task.id}
              className=""
              draggable
              onDragStart={onDragStart(index)}
              onDragOver={onDragOver}
              onDrop={onDrop(index)}
            >
              <div className="sm:hidden  ">
                <div className="space-y-3 bg-white py-5 px-2   rounded-lg shadow">
                  <div className="flex items-center  gap-2">
                    <div className="w-6 text-center mt-1">
                      <DragHandle />
                    </div>
                    <input
                      className="flex-1  px-2 py-1 text-xl font-medium"
                      value={task.title}
                      onChange={(event) =>
                        updateTask(task.id, { title: event.target.value })
                      }
                      placeholder="Task name"
                    />
                    <button
                      className="px-3 py-1 h-10 w-10"
                      onClick={() => deleteTask(task.id)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        className="lucide lucide-trash2-icon lucide-trash-2"
                      >
                        <path d="M10 11v6" />
                        <path d="M14 11v6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                        <path d="M3 6h18" />
                        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>

                  <div className="flex ml-10 mt-4 items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          className="lucide lucide-clock2-icon lucide-clock-2"
                        >
                          <path d="M12 6v6l4-2" />
                          <circle cx="12" cy="12" r="10" />
                        </svg>
                      </div>
                      <NumberInput
                        value={minutes}
                        onChange={(value) =>
                          updateTask(task.id, {
                            targetSeconds: value * 60 + seconds,
                          })
                        }
                        className="w-14 py-1  text-lg flex text-center"
                      />
                      <div className="text-xl  text-gray-500">:</div>
                      <NumberInput
                        value={seconds}
                        onChange={(value) =>
                          updateTask(task.id, {
                            targetSeconds: minutes * 60 + value,
                          })
                        }
                        className="w-14 py-1  text-lg flex text-center"
                      />
                      <div>min</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="hidden sm:flex    w-full items-center gap-3">
                <div className="w-full">
               <div className="flex items-center gap-5 px-3"><div className="w-6 text-center">
                  <DragHandle />
                </div>
                <input
                  className="flex-1 border-b-2 w-full border-gray-300 b   py-2 px-4 "
                  value={task.title}
                  onChange={(event) =>
                    updateTask(task.id, { title: event.target.value })
                  }
                />

                <button
                  className="px-3 py-1 h-10 w-10"
                  onClick={() => deleteTask(task.id)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    className="lucide lucide-trash2-icon lucide-trash-2"
                  >
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                    <path d="M3 6h18" />
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button></div> 

                <div className="flex ml-13 mt-4  mb-8 items-center justify-between">
                <div className="flex items-center gap-2">
                  <div>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      className="lucide lucide-clock2-icon lucide-clock-2"
                    >
                      <path d="M12 6v6l4-2" />
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                  </div>
                  <NumberInput
                    value={minutes}
                    onChange={(value) =>
                      updateTask(task.id, {
                        targetSeconds: value * 60 + seconds,
                      })
                    }
                    className="w-14 py-1  text-lg flex text-center"
                  />
                  <div className="text-xl  text-gray-500">:</div>
                  <NumberInput
                    value={seconds}
                    onChange={(value) =>
                      updateTask(task.id, {
                        targetSeconds: minutes * 60 + value,
                      })
                    }
                    className="w-14 py-1  text-lg flex text-center"
                  />
                  <div>min</div>
                </div>


</div>
                
              </div>
              
              </div>
              
            </div>
          );
        })}
        <button
          className="px-3 py-3 underline rounded-md border mb-8 font-semibold color-main  flex items-center gap-2 justify-center border-dashed cursor-crosshair border-gray-400"
          onClick={addTask}
        >
          <div className="w-fit flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              className="lucide lucide-clock2-icon lucide-clock-2"
            >
              <path d="M12 6v6l4-2" />
              <circle cx="12" cy="12" r="10" />
            </svg>
            Add task
          </div>
        </button>
      </div>

      <div className="">
        <button
          className="px-4 w-full py-4 rounded-md justify-center sm:flex hidden font-semibold bg-main text-white text-sm"
          onClick={onSave}
        >
          Create a new Ritual
        </button>
      </div>
    </div>
  );
};

export default RoutineEditor;
