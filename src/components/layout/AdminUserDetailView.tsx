"use client";

import { useEffect, useState } from "react";
import type { ArenaTask, AuthUser } from "@/types";

type Activity = { _id: string; action: string; metadata: Record<string, unknown>; createdAt: string };

export function AdminUserDetailView({ id }: { id: string }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tasks, setTasks] = useState<ArenaTask[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);

  useEffect(() => {
    async function load() {
      const [userRes, taskRes, activityRes] = await Promise.all([
        fetch(`/api/admin/users/${id}`),
        fetch(`/api/admin/users/${id}/tasks`),
        fetch(`/api/admin/users/${id}/activity`)
      ]);
      if (userRes.ok) setUser((await userRes.json()).user);
      if (taskRes.ok) setTasks((await taskRes.json()).tasks);
      if (activityRes.ok) setActivity((await activityRes.json()).activity);
    }
    load();
  }, [id]);

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
      <section className="grid gap-4">
        <div className="glass rounded-lg p-5">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/80">User report</p>
          <h1 className="mt-1 text-3xl font-black text-white">{user?.name ?? "Loading user"}</h1>
          <p className="mt-1 text-slate-400">{user?.email}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <Metric label="Level" value={user?.level ?? 1} />
            <Metric label="Points" value={user?.totalRewardPoints ?? 0} />
            <Metric label="Streak" value={user?.currentStreak ?? 0} />
            <Metric label="Tasks" value={tasks.length} />
          </div>
        </div>
        <div className="grid gap-3">
          {tasks.map((task) => (
            <article key={task._id} className="glass rounded-lg p-4">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <h2 className="font-bold text-white">{task.title}</h2>
                  <p className="mt-1 text-sm text-slate-400">{task.description || "No description"}</p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-bold text-cyan-100">{task.status}</p>
                  <p className="text-slate-500">{task.priority} / {task.rewardPoints} pts</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
      <aside className="glass rounded-lg p-5">
        <h2 className="mb-4 text-lg font-black text-white">Recent activity</h2>
        <div className="grid gap-3">
          {activity.map((item) => (
            <div key={item._id} className="rounded-md border border-slate-700/60 bg-slate-950/50 p-3">
              <p className="font-bold text-white">{item.action.replaceAll("_", " ")}</p>
              <p className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-slate-700/60 bg-slate-950/50 p-3">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </div>
  );
}
