import Link from "next/link";
import { ArrowRight, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/Button";


export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden">
      <section className="relative flex min-h-screen items-center px-6 py-16">
        <div className="absolute inset-0 arena-grid opacity-40" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-abyss to-transparent" />
        <div className="relative mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-cyan-300/25 bg-cyan-300/10 px-3 py-2 text-sm text-cyan-100">
              <Gamepad2 size={16} /> Productivity, rendered as a playable arena
            </div>
            <h1 className="max-w-3xl text-5xl font-black leading-tight text-white md:text-7xl">Task Arena</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
              A dark futuristic productivity game where tasks become crates, focus becomes movement, and completion unlocks rewards, streaks, badges, and levels.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register">
                <Button className="min-w-40">
                  Start playing <ArrowRight size={17} />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="ghost">Log in</Button>
              </Link>
            </div>
          </div>
          <div className="glass relative min-h-[420px] overflow-hidden rounded-lg p-8 scanline">
            <div className="absolute inset-8 rounded-lg border border-cyan-300/20 arena-grid" />
            <div className="perspective-stage absolute inset-x-10 top-24 h-64 rounded-lg border border-cyan-300/20 bg-slate-950/80 shadow-neon" />
            <div className="absolute bottom-16 left-20 h-24 w-14 rounded-t-full border border-cyan-200/50 bg-cyan-200/20 shadow-neon" />
            {[0, 1, 2, 3, 4, 5].map((slot) => (
              <div
                key={slot}
                className="absolute h-16 w-24 rounded-md border border-slate-400/30 bg-slate-800/90 shadow-neon crate-face"
                style={{ left: `${36 + (slot % 3) * 28}%`, top: `${30 + Math.floor(slot / 3) * 24}%` }}
              >
                <div className="grid h-full place-items-center text-xs font-bold uppercase text-cyan-100">Task {slot + 1}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
