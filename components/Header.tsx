"use client";

import React from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EnterpriseState } from "@/types/enterprise";
import {
  ShieldAlert,
  Play,
  Pause,
  FastForward,
  Coins,
  TrendingUp,
  Sliders,
  Cpu,
  RotateCcw,
  SkipForward
} from "lucide-react";

interface HeaderProps {
  state: EnterpriseState;
  onSpeedChange: (speed: number) => void;
  onOpenHitlDrawer: () => void;
  onOpenSettings: () => void;
  onTogglePlay?: () => void;
  onStepCycle?: () => void;
  onReset?: () => void;
}

export function Header({
  state,
  onSpeedChange,
  onOpenHitlDrawer,
  onOpenSettings,
  onTogglePlay,
  onStepCycle,
  onReset
}: HeaderProps) {
  const pendingApprovalsCount = state.approvals.filter(a => a.status === "pending").length;
  const isExecuting = state.phase === "autonomous_execution";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/90 bg-slate-950/80 backdrop-blur-md px-4 sm:px-6 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-3 max-w-7xl mx-auto">
        {/* Brand & Venture Identifier */}
        <div className="flex items-center space-x-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-600 text-white font-black text-lg shadow-md shadow-cyan-500/20">
            📎
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base tracking-wider text-slate-100">
                PAPERCLIP
              </span>
              <span className="text-xs uppercase font-mono tracking-widest text-cyan-400 font-semibold">
                ENTERPRISE
              </span>
              <Badge variant="outline" className="hidden sm:inline-flex text-[10px] py-0 px-2 font-mono">
                v2.4
              </Badge>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
              <span className="text-slate-300 font-medium truncate max-w-[140px] sm:max-w-[200px]">
                {state.blueprint?.company_name || "New Venture"}
              </span>
              {state.blueprint?.ticker && (
                <span className="text-cyan-400 font-bold">[{state.blueprint.ticker}]</span>
              )}
            </div>
          </div>
        </div>

        {/* Phase Progress Indicator */}
        <div className="hidden lg:flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-lg p-1 text-xs">
          <span className={`px-2.5 py-1 rounded font-medium ${state.phase === "onboarding" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "text-slate-500"}`}>
            1. Concept
          </span>
          <span className="text-slate-600 text-xs">›</span>
          <span className={`px-2.5 py-1 rounded font-medium ${state.phase === "launch_valuation" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "text-slate-500"}`}>
            2. Valuation
          </span>
          <span className="text-slate-600 text-xs">›</span>
          <span className={`px-2.5 py-1 rounded font-medium ${state.phase === "chief_selection" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "text-slate-500"}`}>
            3. Chief of Staff
          </span>
          <span className="text-slate-600 text-xs">›</span>
          <span className={`px-2.5 py-1 rounded font-medium ${state.phase === "autonomous_execution" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "text-slate-500"}`}>
            4. Operations
          </span>
        </div>

        {/* Right Status Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Treasury Metric */}
          {state.phase !== "onboarding" && (
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
              <Coins className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-slate-400">Treasury:</span>
              <span className="font-bold text-amber-300">
                {state.capital_treasury.toLocaleString()} $CLIP
              </span>
            </div>
          )}

          {/* HITL Alerts Button */}
          {isExecuting && (
            <Button
              variant={pendingApprovalsCount > 0 ? "destructive" : "outline"}
              size="sm"
              onClick={onOpenHitlDrawer}
              className={`relative gap-1.5 font-mono text-xs ${pendingApprovalsCount > 0 ? "animate-pulse" : ""}`}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>HITL</span>
              {pendingApprovalsCount > 0 && (
                <span className="ml-1 rounded-full bg-white text-rose-900 font-bold px-1.5 py-0.2 text-[10px]">
                  {pendingApprovalsCount}
                </span>
              )}
            </Button>
          )}

          {/* Simulation Speed Toggles */}
          {isExecuting && (
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
              <button
                type="button"
                onClick={onTogglePlay ? onTogglePlay : () => onSpeedChange(state.simulation_speed === 0 ? 1 : 0)}
                className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
                  state.is_running ? "bg-cyan-500/20 text-cyan-300" : "bg-amber-500/20 text-amber-300"
                }`}
                title={state.is_running ? "Pause Simulation" : "Start Simulation"}
              >
                {state.is_running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              </button>
              {onStepCycle && !state.is_running && (
                <button
                  type="button"
                  onClick={onStepCycle}
                  className="p-1.5 rounded text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Step 1 Cycle Forward"
                >
                  <SkipForward className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => onSpeedChange(1)}
                className={`px-2 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${
                  state.simulation_speed === 1 && state.is_running ? "bg-cyan-500/20 text-cyan-300 font-bold" : "text-slate-400 hover:text-white"
                }`}
                title="1x Speed"
              >
                1x
              </button>
              <button
                type="button"
                onClick={() => onSpeedChange(3)}
                className={`px-2 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${
                  state.simulation_speed >= 3 && state.is_running ? "bg-cyan-500/20 text-cyan-300 font-bold" : "text-slate-400 hover:text-white"
                }`}
                title="Fast Forward 3x"
              >
                <FastForward className="h-3 w-3 inline mr-0.5" />3x
              </button>
            </div>
          )}

          {/* Reset Simulation Button */}
          {onReset && state.phase !== "onboarding" && (
            <Button
              variant="outline"
              size="icon"
              onClick={onReset}
              title="Reset Simulator to Phase 1"
              className="text-slate-400 hover:text-rose-400 border-slate-800 hover:border-rose-900 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          )}

          {/* Settings / CEO Command Center */}
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenSettings}
            title="CEO Command Center, LLM & Embeddings Endpoints, Sandbox Settings"
            className="text-slate-300 hover:text-white gap-1.5 font-mono text-xs border-slate-800 hover:border-cyan-500/50 bg-slate-900/60 cursor-pointer"
          >
            <Sliders className="h-3.5 w-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Settings</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
