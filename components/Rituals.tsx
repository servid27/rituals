"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Routine } from "@/types/rituals";
import { uid } from "@/libs/rituals-utils";
import { RoutineCard } from "./rituals/RoutineCard";
import { RoutineEditor } from "./rituals/RoutineEditor";
import { RoutineView } from "./rituals/RoutineView";
import { useRitualsStore } from "./rituals/useRitualsStore";
import ButtonAccount from "./ButtonAccount";
import router from "next/router";

interface RitualsProps {
  initialMode?: "home" | "view" | "edit" | "new";
  initialRitualId?: string | null;
}

const LAST_ACTIVE_ROUTINE_KEY = "rituals:last-active-id";
const LAST_MODE_KEY = "rituals:last-mode";

export default function Rituals({
  initialMode = "home",
  initialRitualId = null,
}: RitualsProps = {}) {
  const {
    routines,
    setRoutines,
    sessions,
    addSession,
    deleteRoutine,
    isLoading,
  } = useRitualsStore();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"home" | "view" | "edit">(
    initialMode === "new" ? "edit" : initialMode
  );
  const [activeId, setActiveId] = useState<string | null>(initialRitualId);
  const active = routines.find((r) => r.id === activeId) || null;
  const [draft, setDraft] = useState<Routine | null>(null);
  const bootstrappedRef = useRef(false);

  const openNew = useCallback(() => {
    const routine: Routine = {
      id: uid(),
      name: "New routine",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tasks: [],
    };
    setDraft(routine);
    setMode("edit");
  }, []);

  const openView = useCallback((r: Routine) => {
    setActiveId(r.id);
    setMode("view");
  }, []);

  const openEdit = useCallback((r: Routine) => {
    setDraft(JSON.parse(JSON.stringify(r)));
    setMode("edit");
  }, []);

  // Handle URL parameters when routines are loaded
  useEffect(() => {
    const urlMode = searchParams.get("mode");
    const urlRitual = searchParams.get("ritual");

    // Handle 'new' mode regardless of loading state or authentication
    if (urlMode === "new") {
      openNew();
      return;
    }

    // For other modes, wait until loading is complete
    if (isLoading) return;

    if (urlRitual) {
      const routine = routines.find((r) => r.id === urlRitual);
      if (routine) {
        if (urlMode === "edit") {
          openEdit(routine);
        } else {
          openView(routine);
        }
      }
    }
  }, [searchParams, routines, isLoading, openNew, openEdit, openView]);

  const saveDraft = () => {
    if (!draft) return;
    setRoutines((rs) => {
      const exists = rs.some((x) => x.id === draft.id);
      return exists
        ? rs.map((x) => (x.id === draft.id ? draft : x))
        : [draft, ...rs];
    });
    setMode("view");
    setActiveId(draft.id);
    setDraft(null);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      window.localStorage.setItem(LAST_MODE_KEY, mode);

      if (mode === "view" && activeId) {
        window.localStorage.setItem(LAST_ACTIVE_ROUTINE_KEY, activeId);
      } else if (mode !== "view") {
        window.localStorage.removeItem(LAST_ACTIVE_ROUTINE_KEY);
      }
    } catch (error) {
      console.warn("Unable to persist ritual view state:", error);
    }
  }, [mode, activeId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isLoading) return;
    if (mode !== "home") return;
    if (bootstrappedRef.current) return;
    if (!routines.length) return;

    bootstrappedRef.current = true;

    try {
      const storedMode = window.localStorage.getItem(LAST_MODE_KEY) as
        | RitualsProps["initialMode"]
        | null;
      const storedId = window.localStorage.getItem(LAST_ACTIVE_ROUTINE_KEY);
      const fallbackRoutine = routines[0];
      const storedRoutine = storedId
        ? routines.find((r) => r.id === storedId)
        : undefined;

      if (storedMode === "home") {
        return;
      }

      const routineToOpen = storedRoutine || fallbackRoutine;

      if (routineToOpen) {
        openView(routineToOpen);
      }
    } catch (error) {
      console.warn("Unable to restore last viewed routine:", error);
    }
  }, [isLoading, mode, routines, openView]);

  // Show loading state while data is being loaded
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-3 py-6 sm:px-6 space-y-6">
        <header className="flex items-center justify-between mb-6">
          <div className="text-2xl sm:text-5xl font-bold">🧘‍♂️Rituals</div>

          <ButtonAccount />
        </header>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your routines...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen  ">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        <header className="flex items-center justify-between">
          <div className="text-2xl sm:text-5xl font-bold">🧘‍♂️Rituals</div>{" "}
          <ButtonAccount />
        </header>

        {mode === "home" && (
          <div className="space-y-4">
             <button className="fixed bottom-24 right-6 z-50 md:hidden flex h-[15vw] w-[15vw] items-center justify-center rounded-full bg-main text-white shadow-lg transition-transform hover:scale-105 active:scale-95">
          <span
            className=""
            onClick={() => router.push("/rituals?mode=new")}
            style={{ fontSize: 32 }}
          >
           <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                className="lucide lucide-plus-icon lucide-plus"
              >
                <path d="M5 12h14" />
                <path d="M12 5v14" />
              </svg>
          </span>
        </button>
            <h2 className="title-sm">Your routines</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {routines.map((r, idx) => (
                <RoutineCard
                  key={r.id}
                  routine={r}
                  index={idx}
                  onOpen={() => openView(r)}
                />
              ))}
              <button
                onClick={openNew}
                className="p-4 rounded-2xl border-dashed border-2 border-gray-300 hover:border-gray-400 text-left flex flex-col items-start justify-center min-h-[140px]"
              >
                <div className="w-10 h-10 grid place-items-center rounded-xl border mb-2">
                  +
                </div>
                <div className="font-semibold">New routine</div>
                <div className="text-xs text-gray-500">Create a checklist</div>
              </button>
            </div>
          </div>
        )}

        {mode === "view" && active && (
          <RoutineView
            routine={active}
            onEdit={() => openEdit(active)}
            onClose={() => {
              setMode("home");
              setActiveId(null);
            }}
            onDelete={() => deleteRoutine(active.id)}
            sessions={sessions}
            onRecord={addSession}
          />
        )}

        {mode === "edit" && draft && (
          <RoutineEditor
            draft={draft}
            onChange={setDraft}
            onSave={saveDraft}
            onClose={() => {
              setMode("home");
              setDraft(null);
              setActiveId(null);
            }}
          />
        )}

        <footer className="pt-6 text-center text-xs text-gray-500">
          Local-first · Keep-style cards · Drag to reorder (Edit mode)
        </footer>
      </div>
    </div>
  );
}
