"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface SheetProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  side?: "right" | "left" | "bottom";
  children: React.ReactNode;
}

export function Sheet({ open, onOpenChange, onClose, side = "right", children }: SheetProps) {
  const handleClose = React.useCallback(() => {
    if (onOpenChange) onOpenChange(false);
    if (onClose) onClose();
  }, [onOpenChange, onClose]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    if (open) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, handleClose]);

  if (!open) return null;

  const sideStyles = {
    right: "inset-y-0 right-0 h-full w-full max-w-md sm:max-w-lg border-l border-slate-800 bg-slate-900/95 shadow-2xl",
    left: "inset-y-0 left-0 h-full w-full max-w-md border-r border-slate-800 bg-slate-900/95 shadow-2xl",
    bottom: "inset-x-0 bottom-0 max-h-[85vh] w-full border-t border-slate-800 bg-slate-900/95 shadow-2xl rounded-t-xl",
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />
      {/* Drawer */}
      <div className={cn("fixed z-50 flex flex-col p-6 overflow-y-auto backdrop-blur-md", sideStyles[side])}>
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 rounded-md p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          aria-label="Close drawer"
        >
          <X className="h-5 w-5" />
        </button>
        {children}
      </div>
    </div>
  );
}

export function SheetHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col space-y-1.5 pb-4 border-b border-slate-800", className)} {...props}>{children}</div>;
}

export function SheetTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-lg font-bold text-slate-100 flex items-center gap-2", className)} {...props}>{children}</h3>;
}

export function SheetDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-xs text-slate-400 leading-relaxed", className)} {...props}>{children}</p>;
}

export function SheetContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex-1 py-4 space-y-4", className)} {...props}>{children}</div>;
}
