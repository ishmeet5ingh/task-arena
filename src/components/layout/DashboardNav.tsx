"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, CalendarDays, Gamepad2, Gift, ListChecks, LogOut, Shield, User } from "lucide-react";
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

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    toast.success("Logged out");
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="glass fixed inset-y-4 left-4 z-40 hidden w-20 flex-col items-center justify-between rounded-lg p-3 lg:flex">
      <Link href="/dashboard/game" className="grid h-12 w-12 place-items-center rounded-md border border-cyan-300/30 bg-cyan-300/15 text-cyan-100 shadow-neon" aria-label="Task Arena">
        <BarChart3 size={21} />
      </Link>
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
                "grid h-11 w-11 place-items-center rounded-md border text-slate-300 transition",
                active ? "border-cyan-300/60 bg-cyan-300/20 text-cyan-100" : "border-slate-700/60 bg-slate-950/40 hover:border-slate-400/50"
              )}
            >
              <Icon size={19} />
            </Link>
          );
        })}
      </nav>
      <Button variant="ghost" className="h-11 w-11 px-0" onClick={logout} title="Logout">
        <LogOut size={18} />
      </Button>
    </aside>
  );
}
