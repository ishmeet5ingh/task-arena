"use client";

import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { FieldLabel, Input, Select } from "@/components/ui/Input";
import { TaskModal } from "@/components/tasks/TaskModal";
import { cn } from "@/lib/utils";
import type { ArenaTask } from "@/types";

export function TaskBoard() {
  const [tasks, setTasks] = useState<ArenaTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [sort, setSort] = useState("boxPosition");
  const [editing, setEditing] = useState<ArenaTask | null>(null);
  const [open, setOpen] = useState(false);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({ search, status, priority, sort });
    const res = await fetch(`/api/tasks?${params}`, { cache: "no-store" });
    if (res.ok) setTasks((await res.json()).tasks);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [search, status, priority, sort]);

  const summary = useMemo(
    () => ({
      total: tasks.length,
      completed: tasks.filter((task) => task.status === "completed").length,
      active: tasks.filter((task) => task.status === "active").length,
      overdue: tasks.filter((task) => task.status === "overdue").length
    }),
    [tasks]
  );

  async function complete(task: ArenaTask) {
    const res = await fetch(`/api/tasks/${task._id}/complete`, { method: "PATCH" });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Could not complete task");
      return;
    }
    toast.success(`Completed for ${data.earned} points`);
    load();
  }

  async function remove(task: ArenaTask) {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    const res = await fetch(`/api/tasks/${task._id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Could not delete task");
      return;
    }
    toast.success("Task deleted");
    load();
  }

  return (
    <div className="grid gap-4">
      <section className="glass rounded-lg p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/80">Operations</p>
            <h1 className="mt-1 text-3xl font-black text-white">Task command center</h1>
          </div>
          <Button onClick={() => { setEditing(null); setOpen(true); }}>Create task</Button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_160px_160px_160px]">
          <FieldLabel label="Search">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 text-slate-500" size={16} />
              <Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find by title" />
            </div>
          </FieldLabel>
          <FieldLabel label="Status">
            <Select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
            </Select>
          </FieldLabel>
          <FieldLabel label="Priority">
            <Select value={priority} onChange={(event) => setPriority(event.target.value)}>
              <option value="all">All</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </Select>
          </FieldLabel>
          <FieldLabel label="Sort">
            <Select value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="boxPosition">Arena slot</option>
              <option value="dueTime">Due time</option>
            </Select>
          </FieldLabel>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-4">
        <Summary label="Total" value={summary.total} />
        <Summary label="Active" value={summary.active} />
        <Summary label="Completed" value={summary.completed} />
        <Summary label="Overdue" value={summary.overdue} />
      </section>

      <section className="grid gap-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-28 animate-pulse rounded-lg border border-slate-700/50 bg-slate-900/60" />)
        ) : tasks.length ? (
          tasks.map((task) => (
            <article key={task._id} className="glass rounded-lg p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold text-white">{task.title}</h2>
                    <span className={cn("rounded-md border px-2 py-1 text-xs uppercase", task.status === "completed" ? "border-lime-300/40 text-lime-200" : task.status === "overdue" ? "border-rose-300/40 text-rose-200" : "border-cyan-300/40 text-cyan-200")}>
                      {task.status}
                    </span>
                    <span className="rounded-md border border-slate-600/50 px-2 py-1 text-xs uppercase text-slate-300">{task.priority}</span>
                  </div>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{task.description || "No description."}</p>
                  <p className="mt-2 text-xs text-slate-500">Slot {task.boxPosition + 1} / {task.rewardPoints} points</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="success" onClick={() => complete(task)} disabled={task.status === "completed"}>Complete</Button>
                  <Button variant="ghost" onClick={() => { setEditing(task); setOpen(true); }}>Edit</Button>
                  <Button variant="danger" onClick={() => remove(task)}>Delete</Button>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="glass grid min-h-56 place-items-center rounded-lg text-center text-slate-400">No tasks match these filters.</div>
        )}
      </section>

      <TaskModal open={open} task={editing} onClose={() => setOpen(false)} onSaved={() => load()} />
    </div>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <div className="glass rounded-lg p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-white">{value}</p>
    </div>
  );
}
