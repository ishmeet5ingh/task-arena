"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, CalendarDays, Gamepad2, Gift, ListChecks, LogOut, Menu, Shield, User, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard/game", label: "Arena", icon: Gamepad2 },
  { href: "/dashboard/tasks", label: "Tasks", icon: ListChecks },
  { href: "/dashboard/history", label: "History", icon: CalendarDays },
  { href: "/dashboard/rewards", label: "Rewards", icon: Gift },
  { href: "/dashboard/profile", label: "Profile", icon: User },
  { href: "/admin/users", label: "Admin", icon: Shield }
];

export function DashboardNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    toast.success("Logged out");
    router.push("/login");
    router.refresh();
  }

  const navLinks = (mobile = false) => (
    <nav className={cn("grid", mobile ? "gap-2" : "gap-3")}>
      {links.map((link) => {
        const Icon = link.icon;
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            title={link.label}
            onClick={() => setOpen(false)}
            className={cn(
              "rounded-md border text-slate-300 transition",
              mobile ? "flex h-11 items-center gap-3 px-3 text-sm font-semibold" : "grid h-11 w-11 place-items-center",
              active ? "border-cyan-300/60 bg-cyan-300/20 text-cyan-100" : "border-slate-700/60 bg-slate-950/40 hover:border-slate-400/50"
            )}
          >
            <Icon size={mobile ? 17 : 19} />
            {mobile ? <span>{link.label}</span> : null}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      <header className="glass fixed inset-x-3 top-2 z-50 flex h-12 items-center justify-between rounded-lg px-3 lg:hidden">
        <Link href="/dashboard/game" className="flex items-center gap-2 text-sm font-black text-white" onClick={() => setOpen(false)}>
          <span className="grid h-8 w-8 place-items-center rounded-md border border-cyan-300/30 bg-cyan-300/15 text-cyan-100">
            <BarChart3 size={18} />
          </span>
          Task Arena
        </Link>
        <Button variant="ghost" className="h-8 w-8 px-0" onClick={() => setOpen((value) => !value)} aria-label="Open menu">
          {open ? <X size={18} /> : <Menu size={18} />}
        </Button>
      </header>

      {open ? <button className="fixed inset-0 z-40 bg-black/55 lg:hidden" aria-label="Close menu" onClick={() => setOpen(false)} /> : null}

      <aside
        className={cn(
          "glass fixed bottom-3 top-20 z-50 w-64 rounded-lg p-3 transition-transform lg:hidden",
          open ? "left-3 translate-x-0" : "left-0 -translate-x-[110%]"
        )}
      >
        <div className="mb-3 border-b border-slate-700/60 pb-3">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/80">Navigation</p>
        </div>
        {navLinks(true)}
        <Button variant="ghost" className="mt-3 w-full justify-start" onClick={logout}>
          <LogOut size={17} /> Logout
        </Button>
      </aside>

      <aside className="glass fixed inset-y-4 left-4 z-40 hidden w-20 flex-col items-center justify-between rounded-lg p-3 lg:flex">
        <Link href="/dashboard/game" className="grid h-12 w-12 place-items-center rounded-md border border-cyan-300/30 bg-cyan-300/15 text-cyan-100 shadow-neon" aria-label="Task Arena">
          <BarChart3 size={21} />
        </Link>
        {navLinks()}
        <Button variant="ghost" className="h-11 w-11 px-0" onClick={logout} title="Logout">
          <LogOut size={18} />
        </Button>
      </aside>
    </>
  );
}
