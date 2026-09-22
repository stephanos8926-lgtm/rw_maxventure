import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "cyan" | "emerald";
  size?: "default" | "sm" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const base = "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer";
    
    const variants = {
      default: "bg-cyan-500 text-slate-950 font-semibold hover:bg-cyan-400 shadow-sm shadow-cyan-500/20 active:scale-[0.98]",
      cyan: "bg-cyan-600/90 text-white font-semibold hover:bg-cyan-500 border border-cyan-400/30 shadow-md shadow-cyan-600/20 active:scale-[0.98]",
      emerald: "bg-emerald-600 text-white font-semibold hover:bg-emerald-500 border border-emerald-400/30 shadow-md shadow-emerald-600/20 active:scale-[0.98]",
      destructive: "bg-rose-600 text-white hover:bg-rose-500 border border-rose-500/30 shadow-sm active:scale-[0.98]",
      outline: "border border-slate-700 bg-slate-900/60 text-slate-200 hover:bg-slate-800 hover:text-white hover:border-slate-600",
      secondary: "bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700/60",
      ghost: "hover:bg-slate-800/80 text-slate-300 hover:text-white",
    };

    const sizes = {
      default: "h-9 px-4 py-2",
      sm: "h-8 rounded-md px-3 text-xs",
      lg: "h-11 rounded-lg px-8 text-base",
      icon: "h-9 w-9",
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
