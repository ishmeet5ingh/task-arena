"use client";

import { CalendarDays, CheckCircle2, CircleDashed, Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { DailyHistory } from "@/types";
import { cn } from "@/lib/utils";

export function HistoryView() {
  const [history, setHistory] = useState<DailyHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch("/api/history");
      if (res.ok) setHistory((await res.json()).history);
      setLoading(false);
    }

    load();
  }, []);

  const totals = useMemo(
    () =>
      history.reduce(
        (acc, day) => ({
          days: acc.days + 1,
          completed: acc.completed + day.summary.completed,
          pending: acc.pending + day.summary.pending,
          points: acc.points + day.summary.rewardPoints
        }),
        { days: 0, completed: 0, pending: 0, points: 0 }
      ),
    [history]
  );

  return (
    <div className="grid gap-4">
      <section className="glass rounded-lg border-cyan-300/20 p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/80">Daily archives</p>
            <h1 className="mt-1 text-3xl font-black text-white">Task history by day</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Each new day starts a fresh arena. Finished tasks are recorded as completed, and unfinished tasks are recorded as pending for that day.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <HistoryMetric label="Days" value={totals.days} />
            <HistoryMetric label="Done" value={totals.completed} />
            <HistoryMetric label="Pending" value={totals.pending} />
            <HistoryMetric label="Points" value={totals.points} />
          </div>
        </div>
      </section>

      {loading ? (
        <section className="grid gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-40 animate-pulse rounded-lg border border-slate-700/50 bg-slate-900/60" />
          ))}
        </section>
      ) : history.length ? (
        <section className="grid gap-4">
          {history.map((day) => (
            <article key={day._id} className="glass overflow-hidden rounded-lg border-cyan-300/15">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/60 bg-slate-950/35 p-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-md border border-cyan-300/30 bg-cyan-300/10 text-cyan-100">
                    <CalendarDays size={19} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white">{formatDateKey(day.dateKey)}</h2>
                    <p className="text-sm text-slate-500">{day.summary.total} tasks archived</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <HistoryMetric label="Done" value={day.summary.completed} />
                  <HistoryMetric label="Pending" value={day.summary.pending} />
                  <HistoryMetric label="Points" value={day.summary.rewardPoints} />
                </div>
              </div>

              <div className="grid gap-2 p-4 md:grid-cols-2 xl:grid-cols-3">
                {day.tasks.map((task) => (
                  <div key={`${day.dateKey}-${task.taskId}`} className="rounded-md border border-slate-700/60 bg-slate-950/55 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="line-clamp-2 font-bold text-white">{task.title}</h3>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">{task.description || "No description"}</p>
                      </div>
                      <span
                        className={cn(
                          "inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-xs font-bold uppercase",
                          task.historyStatus === "completed"
                            ? "border-lime-300/40 bg-lime-400/10 text-lime-200"
                            : "border-amber-300/40 bg-amber-400/10 text-amber-200"
                        )}
                      >
                        {task.historyStatus === "completed" ? <CheckCircle2 size={13} /> : <CircleDashed size={13} />}
                        {task.historyStatus}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>Slot {task.boxPosition + 1}</span>
                      <span>{task.priority}</span>
                      <span className="inline-flex items-center gap-1 text-cyan-200">
                        <Trophy size={12} /> {task.rewardPoints}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="glass grid min-h-72 place-items-center rounded-lg text-center">
          <div>
            <CalendarDays className="mx-auto text-cyan-200" size={34} />
            <h2 className="mt-4 text-xl font-black text-white">No daily history yet</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
              History appears after a day rolls over. Today’s completed and pending tasks will be archived automatically tomorrow.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}

function HistoryMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-20 rounded-md border border-slate-700/60 bg-slate-950/60 px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="font-black text-white">{value}</p>
    </div>
  );
}

function formatDateKey(dateKey: string) {
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}
