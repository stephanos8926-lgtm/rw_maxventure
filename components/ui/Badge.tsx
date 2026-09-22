import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "cyan" | "emerald" | "amber" | "indigo";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "border-transparent bg-slate-800 text-slate-100",
    secondary: "border-transparent bg-slate-800/80 text-slate-300",
    destructive: "border-rose-500/30 bg-rose-500/10 text-rose-300",
    outline: "text-slate-300 border-slate-700 bg-slate-900/40",
    cyan: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
    emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    amber: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    indigo: "border-indigo-500/30 bg-indigo-500/10 text-indigo-300",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide transition-colors focus:outline-none",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
