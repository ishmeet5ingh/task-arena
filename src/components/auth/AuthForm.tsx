"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { FieldLabel, Input } from "@/components/ui/Input";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const payload =
      mode === "register"
        ? { name: form.get("name"), email: form.get("email"), password: form.get("password") }
        : { email: form.get("email"), password: form.get("password") };

    const res = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const text = await res.text();
    const data = text
      ? (() => {
          try {
            return JSON.parse(text);
          } catch {
            return { error: text };
          }
        })()
      : {};
    setLoading(false);

    if (!res.ok) {
      toast.error(data.error ?? "Authentication failed");
      return;
    }

    toast.success(mode === "register" ? "Pilot profile created" : "Welcome back");
    router.push("/dashboard/game");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="glass grid w-full max-w-md gap-5 rounded-lg p-6">
      <div>
        <p className="text-sm uppercase tracking-[0.22em] text-cyan-200/80">Task Arena</p>
        <h1 className="mt-2 text-3xl font-black text-white">{mode === "register" ? "Create your pilot" : "Enter the arena"}</h1>
      </div>
      {mode === "register" ? (
        <FieldLabel label="Name">
          <Input name="name" autoComplete="name" required placeholder="Avery Stone" />
        </FieldLabel>
      ) : null}
      <FieldLabel label="Email">
        <Input name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
      </FieldLabel>
      <FieldLabel label="Password">
        <Input name="password" type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} required placeholder="Minimum 8 characters" />
      </FieldLabel>
      <Button disabled={loading}>{loading ? "Calibrating..." : mode === "register" ? "Create account" : "Log in"}</Button>
      <p className="text-center text-sm text-slate-400">
        {mode === "register" ? "Already registered?" : "New to the arena?"}{" "}
        <Link href={mode === "register" ? "/login" : "/register"} className="font-semibold text-cyan-200 hover:text-cyan-100">
          {mode === "register" ? "Log in" : "Create account"}
        </Link>
      </p>
    </form>
  );
}
