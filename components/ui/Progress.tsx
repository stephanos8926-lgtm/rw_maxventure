import * as React from "react";
import { cn } from "@/lib/utils";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  indicatorColor?: "cyan" | "emerald" | "amber" | "indigo" | "rose";
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, indicatorColor = "cyan", ...props }, ref) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    const colors = {
      cyan: "bg-gradient-to-r from-cyan-600 to-cyan-400",
      emerald: "bg-gradient-to-r from-emerald-600 to-emerald-400",
      amber: "bg-gradient-to-r from-amber-600 to-amber-400",
      indigo: "bg-gradient-to-r from-indigo-600 to-indigo-400",
      rose: "bg-gradient-to-r from-rose-600 to-rose-400",
    };

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        className={cn("relative h-2 w-full overflow-hidden rounded-full bg-slate-800/80", className)}
        {...props}
      >
        <div
          className={cn("h-full w-full flex-1 transition-all duration-500 ease-out", colors[indicatorColor])}
          style={{ transform: `translateX(-${100 - percentage}%)` }}
        />
      </div>
    );
  }
);
Progress.displayName = "Progress";
