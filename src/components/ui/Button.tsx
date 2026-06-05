"use client";

import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger" | "success";
};

export function Button({ className, variant = "primary", ...props }: Props) {
  const variants = {
    primary: "border-cyan-300/30 bg-cyan-300/15 text-cyan-100 hover:bg-cyan-300/25",
    ghost: "border-slate-500/30 bg-slate-900/40 text-slate-200 hover:bg-slate-800/80",
    danger: "border-rose-300/30 bg-rose-500/15 text-rose-100 hover:bg-rose-500/25",
    success: "border-lime-300/30 bg-lime-400/15 text-lime-100 hover:bg-lime-400/25"
  };

  return (
    <button
      className={cn(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
