"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CalendarDays, Gamepad2, Gift, ListChecks, User } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard/game", label: "Arena", icon: Gamepad2 },
  { href: "/dashboard/tasks", label: "Tasks", icon: ListChecks },
  { href: "/dashboard/history", label: "History", icon: CalendarDays },
  { href: "/dashboard/rewards", label: "Rewards", icon: Gift },
  { href: "/dashboard/profile", label: "Profile", icon: User }
];

export function DashboardNav() {
  const pathname = usePathname();

  const desktopLinks = (
    <nav className="grid gap-3">
      {links.map((link) => {
        const Icon = link.icon;
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            title={link.label}
            className={cn(
              "rounded-md border text-slate-300 transition",
              "grid h-11 w-11 place-items-center",
              active ? "border-cyan-300/60 bg-cyan-300/20 text-cyan-100" : "border-slate-700/60 bg-slate-950/40 hover:border-slate-400/50"
            )}
          >
            <Icon size={19} />
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      <nav className="mobile-tabbar fixed inset-x-2 bottom-2 z-[220] grid grid-cols-5 gap-1 rounded-lg border border-slate-700/70 bg-slate-950/88 p-1.5 shadow-2xl shadow-black/40 backdrop-blur-xl lg:hidden">
        {links.map((link) => {
          const Icon = link.icon;
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "mobile-tabbar-item flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-md border px-1 py-1.5 text-[10px] font-medium leading-none transition",
                active
                  ? "border-cyan-300/45 bg-cyan-300/16 text-cyan-100 shadow-[0_0_18px_rgba(45,212,191,0.16)]"
                  : "border-transparent text-slate-400 hover:bg-slate-800/55 hover:text-slate-100"
              )}
            >
              <Icon size={17} strokeWidth={active ? 2.3 : 2} />
              <span className="truncate">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <aside className="glass fixed inset-y-4 left-4 z-40 hidden w-20 flex-col items-center justify-between rounded-lg p-3 lg:flex">
        <Link href="/dashboard/game" className="grid h-12 w-12 place-items-center rounded-md border border-cyan-300/30 bg-cyan-300/15 text-cyan-100 shadow-neon" aria-label="Task Arena">
          <BarChart3 size={21} />
        </Link>
        {desktopLinks}
        <span className="h-12 w-12" aria-hidden="true" />
      </aside>
    </>
  );
}
