"use client";

import { create } from "zustand";
import type { ArenaTask, AuthUser } from "@/types";

type GameState = {
  user: AuthUser | null;
  tasks: ArenaTask[];
  selectedTask: ArenaTask | null;
  selectedSlot: number | null;
  setUser: (user: AuthUser | null) => void;
  setTasks: (tasks: ArenaTask[]) => void;
  upsertTask: (task: ArenaTask) => void;
  removeTask: (id: string) => void;
  selectTask: (task: ArenaTask | null) => void;
  selectSlot: (slot: number | null) => void;
};

export const useGameStore = create<GameState>((set) => ({
  user: null,
  tasks: [],
  selectedTask: null,
  selectedSlot: null,
  setUser: (user) => set({ user }),
  setTasks: (tasks) => set({ tasks }),
  upsertTask: (task) =>
    set((state) => ({
      tasks: [...state.tasks.filter((item) => item._id !== task._id), task].sort((a, b) => a.boxPosition - b.boxPosition),
      selectedTask: state.selectedTask?._id === task._id ? task : state.selectedTask
    })),
  removeTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((task) => task._id !== id),
      selectedTask: state.selectedTask?._id === id ? null : state.selectedTask
    })),
  selectTask: (task) => set({ selectedTask: task }),
  selectSlot: (slot) => set({ selectedSlot: slot })
}));
