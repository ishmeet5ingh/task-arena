"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AuthUser } from "@/types";

type Stat = { _id: string; completed: number; pending: number; overdue: number; total: number };

export function AdminUsersView() {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [stats, setStats] = useState<Stat[]>([]);

  useEffect(() => {
    fetch("/api/admin/users").then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setStats(data.stats);
      }
    });
  }, []);

  const statByUser = useMemo(() => new Map(stats.map((stat) => [stat._id, stat])), [stats]);

  return (
    <div className="grid gap-4">
      <section className="glass rounded-lg p-5">
        <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/80">Admin activity</p>
        <h1 className="mt-1 text-3xl font-black text-white">User productivity overview</h1>
      </section>
      <section className="grid gap-3">
        {users.map((user) => {
          const stat = statByUser.get(user._id);
          return (
            <Link key={user._id} href={`/admin/users/${user._id}`} className="glass rounded-lg p-4 transition hover:border-cyan-300/50">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-white">{user.name}</h2>
                  <p className="text-sm text-slate-400">{user.email}</p>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center text-sm">
                  <Metric label="Points" value={user.totalRewardPoints} />
                  <Metric label="Done" value={stat?.completed ?? 0} />
                  <Metric label="Pending" value={stat?.pending ?? 0} />
                  <Metric label="Overdue" value={stat?.overdue ?? 0} />
                </div>
              </div>
            </Link>
          );
        })}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-20 rounded-md border border-slate-700/60 bg-slate-950/50 px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="font-black text-white">{value}</p>
    </div>
  );
}
