"use client";

import { useEffect, useState } from "react";
import { AuthUser } from "@/types";

export function ProfileView() {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    fetch("/api/auth/me").then(async (res) => {
      if (res.ok) setUser((await res.json()).user);
    });
  }, []);

  return (
    <section className="glass mx-auto max-w-3xl rounded-lg p-6">
      <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/80">Pilot profile</p>
      <div className="mt-5 flex flex-wrap items-center gap-5">
        <div className="grid h-24 w-24 place-items-center rounded-lg border border-cyan-300/30 bg-cyan-300/15 text-4xl font-black text-cyan-100">
          {user?.name?.charAt(0) ?? "P"}
        </div>
        <div>
          <h1 className="text-3xl font-black text-white">{user?.name ?? "Loading..."}</h1>
          <p className="text-slate-400">{user?.email}</p>
        </div>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        <ProfileStat label="Level" value={user?.level ?? 1} />
        <ProfileStat label="Points" value={user?.totalRewardPoints ?? 0} />
        <ProfileStat label="Streak" value={user?.currentStreak ?? 0} />
        <ProfileStat label="Best" value={user?.bestStreak ?? 0} />
      </div>
      <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-800">
        <div className="h-full bg-cyan-300" style={{ width: `${((user?.totalRewardPoints ?? 0) % 250) / 2.5}%` }} />
      </div>
      <p className="mt-2 text-sm text-slate-400">Level progress resets every 250 points.</p>
    </section>
  );
}

function ProfileStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-slate-700/60 bg-slate-950/50 p-3">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </div>
  );
}
