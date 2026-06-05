"use client";

import { Award, BadgeCheck, Gift } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

type Reward = { _id: string; points: number; reason: string; createdAt: string };
type Badge = { _id: string; name: string; description: string; earnedAt: string };

export function RewardsView() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);

  async function load() {
    const res = await fetch("/api/rewards");
    if (res.ok) {
      const data = await res.json();
      setRewards(data.rewards);
      setBadges(data.badges);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
      <section className="glass rounded-lg p-5">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/80">Rewards</p>
            <h1 className="mt-1 text-3xl font-black text-white">Badge vault</h1>
          </div>
          <Button onClick={() => fetch("/api/rewards/claim", { method: "POST" })}>
            <Gift size={17} /> Sync
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {badges.length ? badges.map((badge) => (
            <article key={badge._id} className="rounded-lg border border-lime-300/25 bg-lime-400/10 p-4">
              <BadgeCheck className="text-lime-200" />
              <h2 className="mt-3 font-bold text-white">{badge.name}</h2>
              <p className="mt-1 text-sm text-slate-300">{badge.description}</p>
            </article>
          )) : <p className="text-slate-400">Complete tasks to unlock badges.</p>}
        </div>
      </section>
      <aside className="glass rounded-lg p-5">
        <div className="mb-4 flex items-center gap-2 text-cyan-100">
          <Award size={18} /> Recent point drops
        </div>
        <div className="grid gap-3">
          {rewards.length ? rewards.map((reward) => (
            <div key={reward._id} className="rounded-md border border-slate-700/60 bg-slate-950/50 p-3">
              <p className="font-bold text-white">+{reward.points} points</p>
              <p className="text-sm text-slate-400">{reward.reason}</p>
            </div>
          )) : <p className="text-sm text-slate-400">No rewards earned yet.</p>}
        </div>
      </aside>
    </div>
  );
}
