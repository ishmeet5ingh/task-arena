"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bell, Check, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Edit3, Keyboard, Plus, Trash2, Volume2 } from "lucide-react";
import { CSSProperties, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { TaskModal } from "@/components/tasks/TaskModal";
import { formatTime, cn } from "@/lib/utils";
import { useGameStore } from "@/store/gameStore";
import type { ArenaTask } from "@/types";

const IST_OFFSET_MINUTES = 330;

const slots = Array.from({ length: 12 }, (_, index) => ({
  index,
  x: 17 + (index % 4) * 22,
  y: 21 + Math.floor(index / 4) * 23
}));

function secondsRemaining(task?: ArenaTask | null) {
  if (!task?.startTime || !task.durationMinutes) return null;
  const end = new Date(task.startTime).getTime() + task.durationMinutes * 60 * 1000;
  return Math.max(0, Math.floor((end - Date.now()) / 1000));
}

function statusGlow(status?: ArenaTask["status"]) {
  if (status === "completed") return "border-lime-300/70 bg-lime-400/20 shadow-gold";
  if (status === "overdue") return "border-rose-300/70 bg-rose-500/20 shadow-redglow";
  if (status === "active") return "border-cyan-300/80 bg-cyan-300/20 shadow-neon";
  return "border-slate-400/35 bg-slate-800/90";
}

function secondsUntilIndianDayEnds() {
  const now = new Date();
  const istNowMs = now.getTime() + IST_OFFSET_MINUTES * 60 * 1000;
  const secondsSinceMidnight = Math.floor((istNowMs % 86_400_000) / 1000);
  return 86_400 - secondsSinceMidnight;
}

export function GameArena() {
  const { user, tasks, selectedTask, selectedSlot, setUser, setTasks, upsertTask, removeTask, selectTask, selectSlot } = useGameStore();
  const [pos, setPos] = useState({ x: 12, y: 82 });
  const [facing, setFacing] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ArenaTask | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [reward, setReward] = useState<number | null>(null);
  const [tick, setTick] = useState(0);

  const taskBySlot = useMemo(() => new Map(tasks.map((task) => [task.boxPosition, task])), [tasks]);
  const completed = tasks.filter((task) => task.status === "completed").length;
  const pending = tasks.filter((task) => task.status !== "completed").length;
  const levelProgress = ((user?.totalRewardPoints ?? 0) % 250) / 2.5;
  const nearest = useMemo(() => {
    let best = { slot: slots[0], dist: Infinity };
    for (const slot of slots) {
      const dist = Math.hypot(slot.x - pos.x, slot.y - pos.y);
      if (dist < best.dist) best = { slot, dist };
    }
    return best.dist < 18 ? best.slot : null;
  }, [pos]);

  async function refreshArena() {
    const [meRes, tasksRes] = await Promise.all([
      fetch("/api/auth/me", { cache: "no-store" }),
      fetch("/api/tasks", { cache: "no-store" })
    ]);
    if (meRes.ok) setUser((await meRes.json()).user);
    if (tasksRes.ok) {
      const data = await tasksRes.json();
      setTasks(data.tasks);
    }
  }

  function moveCharacter(dx: number, dy: number) {
    if (dx !== 0) setFacing(dx > 0 ? 1 : -1);
    setPos((current) => ({
      x: Math.min(94, Math.max(6, current.x + dx)),
      y: Math.min(90, Math.max(10, current.y + dy))
    }));
  }

  useEffect(() => {
    refreshArena();
  }, [setTasks, setUser]);

  useEffect(() => {
    const id = window.setInterval(() => setTick((value) => value + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    async function syncTimers() {
      await fetch("/api/tasks/check-overdue", { method: "PATCH" });
      const res = await fetch("/api/tasks", { cache: "no-store" });
      if (res.ok) setTasks((await res.json()).tasks);
    }
    syncTimers();
    const id = window.setInterval(syncTimers, 60000);
    return () => window.clearInterval(id);
  }, [setTasks]);

  useEffect(() => {
    const dueToStart = tasks.find((task) => task.status === "pending" && task.startTime && new Date(task.startTime).getTime() <= Date.now());
    if (!dueToStart) return;
    startTask(dueToStart, true);
  }, [tasks, tick]);

  useEffect(() => {
    function keydown(event: KeyboardEvent) {
      const key = event.key.toLowerCase();
      if (["arrowup", "w"].includes(key)) moveCharacter(0, -4);
      if (["arrowdown", "s"].includes(key)) moveCharacter(0, 4);
      if (["arrowleft", "a"].includes(key)) moveCharacter(-4, 0);
      if (["arrowright", "d"].includes(key)) moveCharacter(4, 0);
      if ((key === "e" || key === "enter") && nearest) {
        const task = taskBySlot.get(nearest.index) ?? null;
        selectSlot(nearest.index);
        selectTask(task);
        if (!task && key === "enter") {
          setEditingTask(null);
          setModalOpen(true);
        }
      }
      if ((key === "delete" || key === "backspace") && selectedTask) deleteTask(selectedTask);
    }

    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [nearest, selectedTask, taskBySlot]);

  async function startTask(task: ArenaTask, automatic = false) {
    const res = await fetch(`/api/tasks/${task._id}/start`, { method: "PATCH" });
    const data = await res.json();
    if (!res.ok) {
      if (!automatic) toast.error(data.error ?? "Could not start task");
      return;
    }
    upsertTask(data.task);
    toast.success(automatic ? `${task.title} has started` : "Timer started");
  }

  async function completeTask(task: ArenaTask) {
    const res = await fetch(`/api/tasks/${task._id}/complete`, { method: "PATCH" });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Could not complete task");
      return;
    }
    upsertTask(data.task);
    if (data.user) setUser(data.user);
    setReward(data.earned);
    toast.success(`+${data.earned} reward points`);
    window.setTimeout(() => setReward(null), 2400);
  }

  async function deleteTask(task: ArenaTask) {
    const ok = window.confirm(`Delete "${task.title}"?`);
    if (!ok) return;
    const res = await fetch(`/api/tasks/${task._id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Could not delete task");
      return;
    }
    removeTask(task._id);
    toast.success("Task deleted");
  }

  async function moveTask(task: ArenaTask, boxPosition: number) {
    const res = await fetch(`/api/tasks/${task._id}/move`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ boxPosition })
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Could not move task");
      return;
    }
    upsertTask(data.task);
  }

  const selectedRemaining = secondsRemaining(selectedTask);

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="glass overflow-hidden rounded-lg border-cyan-300/20">
        <div className="relative flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/60 px-4 py-3">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/70 to-transparent" />
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/80">Arena HUD</p>
            <h1 className="flex flex-wrap items-baseline gap-3 text-xl font-black text-white">
              <span>{user?.name ?? "Pilot"}</span>
              <DayCountdown />
            </h1>
            <div className="mt-2 h-1.5 w-48 overflow-hidden rounded-full bg-slate-900">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-lime-300" style={{ width: `${levelProgress}%` }} />
            </div>
          </div>
          <div className="grid w-full grid-cols-2 gap-2 text-sm sm:w-auto md:grid-cols-5">
            <HudStat label="Level" value={user?.level ?? 1} />
            <HudStat label="Points" value={user?.totalRewardPoints ?? 0} />
            <HudStat label="Done" value={completed} />
            <HudStat label="Pending" value={pending} />
            <HudStat label="Streak" value={user?.currentStreak ?? 0} />
          </div>
        </div>

        <div className="cinematic-arena relative min-h-[560px] overflow-hidden bg-slate-950 scanline sm:min-h-[640px]">
          <div className="arena-skyline" />
          <div className="arena-light arena-light-left" />
          <div className="arena-light arena-light-right" />
          <div className="arena-horizon" />
          <div className="arena-floor perspective-stage">
            <div className="arena-floor-core arena-grid" />
          </div>
          <div className="arena-depth-fog" />

          {slots.map((slot) => {
            const task = taskBySlot.get(slot.index);
            const near = nearest?.index === slot.index;
            const slotStyle = {
              left: `${slot.x}%`,
              top: `${slot.y}%`,
              zIndex: Math.round(slot.y),
              "--crate-depth": `${18 + Math.floor(slot.y / 6)}px`
            } as CSSProperties;
            return (
              <button
                key={slot.index}
                draggable={Boolean(task)}
                onDragStart={(event) => task && event.dataTransfer.setData("taskId", task._id)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  const id = event.dataTransfer.getData("taskId");
                  const dragged = tasks.find((item) => item._id === id);
                  if (dragged) moveTask(dragged, slot.index);
                }}
                onClick={() => {
                  selectSlot(slot.index);
                  selectTask(task ?? null);
                  if (!task) {
                    setEditingTask(null);
                    setModalOpen(true);
                  }
                }}
                className={cn(
                  "crate-3d absolute h-20 w-24 text-center text-[10px] font-black uppercase text-white transition sm:h-24 sm:w-32 sm:text-xs",
                  statusGlow(task?.status),
                  near && "crate-near"
                )}
                style={slotStyle}
              >
                <span className="crate-label line-clamp-3">{task?.title ?? "Empty Slot"}</span>
                <span className="crate-slot">#{slot.index + 1}</span>
              </button>
            );
          })}

          <motion.div
            className="arena-character absolute h-24 w-16 sm:h-28 sm:w-20"
            animate={{ left: `${pos.x}%`, top: `${pos.y}%`, scaleX: facing }}
            transition={{ type: "spring", stiffness: 240, damping: 25, mass: 0.75 }}
            style={{ zIndex: Math.round(pos.y) + 10 }}
          >
            <div className="character-shadow" />
            <div className="character-helmet" />
            <div className="character-core" />
            <div className="character-arm character-arm-left" />
            <div className="character-arm character-arm-right" />
            <div className="character-leg character-leg-left" />
            <div className="character-leg character-leg-right" />
          </motion.div>

          {nearest ? (
            <motion.div
              className="absolute bottom-24 left-1/2 z-[140] -translate-x-1/2 rounded-md border border-cyan-300/30 bg-slate-950/85 px-4 py-2 text-center text-sm text-cyan-100 shadow-neon backdrop-blur"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Press Enter to interact {taskBySlot.get(nearest.index) ? "" : "and create"}
            </motion.div>
          ) : null}

          <TouchControls onMove={moveCharacter} />

          <AnimatePresence>
            {reward ? (
              <motion.div
                className="absolute left-1/2 top-1/3 z-[150] -translate-x-1/2 rounded-lg border border-lime-300/50 bg-lime-400/20 px-8 py-5 text-4xl font-black text-lime-100 shadow-gold backdrop-blur"
                initial={{ opacity: 0, y: 30, scale: 0.9, rotateX: -18 }}
                animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
                exit={{ opacity: 0, y: -30, scale: 0.9 }}
              >
                +{reward}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-700/60 bg-slate-950/35 p-3">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setModalOpen(true)}>
              <Plus size={17} /> New task
            </Button>
            <Button variant="ghost" onClick={() => setHelpOpen(true)}>
              <Keyboard size={17} /> Shortcuts
            </Button>
            <Button variant="ghost">
              <Volume2 size={17} /> Sound
            </Button>
          </div>
          {selectedRemaining !== null ? (
            <div className="inline-flex items-center gap-2 rounded-md border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-sm text-cyan-100">
              <Bell size={16} /> {formatTime(selectedRemaining)}
            </div>
          ) : null}
        </div>
      </section>

      <aside className="glass rounded-lg border-cyan-300/20 p-4 xl:sticky xl:top-4 xl:self-start">
        {selectedTask ? (
          <div className="grid gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/80">Selected crate</p>
              <h2 className="mt-2 text-2xl font-black text-white">{selectedTask.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">{selectedTask.description || "No description added."}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <HudStat label="Status" value={selectedTask.status} />
              <HudStat label="Priority" value={selectedTask.priority} />
              <HudStat label="Points" value={selectedTask.rewardPoints} />
              <HudStat label="Slot" value={selectedTask.boxPosition + 1} />
            </div>
            <div className="grid gap-2">
              <Button onClick={() => startTask(selectedTask)} disabled={selectedTask.status === "completed" || selectedTask.status === "active"}>
                <Bell size={17} /> Start timer
              </Button>
              <Button variant="success" onClick={() => completeTask(selectedTask)} disabled={selectedTask.status === "completed"}>
                <Check size={17} /> Complete
              </Button>
              <Button variant="ghost" onClick={() => { setEditingTask(selectedTask); setModalOpen(true); }}>
                <Edit3 size={17} /> Edit
              </Button>
              <Button variant="danger" onClick={() => deleteTask(selectedTask)}>
                <Trash2 size={17} /> Delete
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid min-h-80 place-items-center text-center text-slate-400">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/80">No crate selected</p>
              <p className="mt-3 text-sm">Move near a crate and press E, or click any slot.</p>
            </div>
          </div>
        )}
      </aside>

      <TaskModal
        open={modalOpen}
        task={editingTask}
        slot={selectedSlot}
        onClose={() => {
          setModalOpen(false);
          setEditingTask(null);
        }}
        onSaved={(task) => {
          upsertTask(task);
          refreshArena();
        }}
      />
      <Modal open={helpOpen} title="Keyboard shortcuts" onClose={() => setHelpOpen(false)}>
        <div className="grid gap-3 text-sm text-slate-300">
          <p>WASD or arrow keys move the character around the arena.</p>
          <p>Enter interacts with the nearest crate and opens the create form on an empty slot. E also selects nearby crates.</p>
          <p>Delete or Backspace removes the selected task after confirmation.</p>
          <p>Drag task crates between empty slots to move tasks quickly.</p>
        </div>
      </Modal>
    </div>
  );
}

function DayCountdown() {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    setRemaining(secondsUntilIndianDayEnds());
    const id = window.setInterval(() => setRemaining(secondsUntilIndianDayEnds()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span className="inline-flex items-center rounded-md border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-2xl font-bold text-cyan-100 shadow-neon">
      {remaining === null ? "86,400" : remaining.toLocaleString("en-IN")}s
    </span>
  );
}

function HudStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-slate-600/40 bg-slate-950/60 px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="truncate text-sm font-bold text-white">{value}</p>
    </div>
  );
}

function TouchControls({ onMove }: { onMove: (dx: number, dy: number) => void }) {
  return (
    <div className="absolute bottom-4 right-4 grid grid-cols-3 gap-2 lg:hidden">
      <span />
      <Button variant="ghost" className="h-10 w-10 px-0" onClick={() => onMove(0, -5)} aria-label="Move up">
        <ChevronUp size={18} />
      </Button>
      <span />
      <Button variant="ghost" className="h-10 w-10 px-0" onClick={() => onMove(-5, 0)} aria-label="Move left">
        <ChevronLeft size={18} />
      </Button>
      <Button variant="ghost" className="h-10 w-10 px-0" onClick={() => onMove(0, 5)} aria-label="Move down">
        <ChevronDown size={18} />
      </Button>
      <Button variant="ghost" className="h-10 w-10 px-0" onClick={() => onMove(5, 0)} aria-label="Move right">
        <ChevronRight size={18} />
      </Button>
    </div>
  );
}
