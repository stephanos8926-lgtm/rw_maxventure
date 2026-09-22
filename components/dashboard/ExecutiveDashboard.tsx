"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/Dialog";
import { Sheet, SheetHeader, SheetTitle, SheetDescription, SheetContent } from "@/components/ui/Sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  EnterpriseState,
  AgentRole,
  Task,
  ApprovalRequest,
  EnterpriseLog,
  TaskArtifact
} from "@/types/enterprise";
import {
  Coins,
  TrendingUp,
  Cpu,
  Flame,
  ShieldAlert,
  Clock,
  CheckCircle2,
  FileCode,
  Terminal,
  Layers,
  Sparkles,
  Send,
  Eye,
  Activity,
  PlusCircle,
  Copy,
  Check,
  Sliders,
  DollarSign,
  Briefcase,
  FolderCode,
  Database,
  Brain
} from "lucide-react";
import { WorkspaceInspector } from "./WorkspaceInspector";
import { SemanticMemoryExplorer } from "./SemanticMemoryExplorer";

interface ExecutiveDashboardProps {
  state: EnterpriseState;
  onApprovalDecision: (taskId: string, decision: "approved" | "rejected", guidance?: string) => Promise<void>;
  onExecuteCeoAction: (action: string, payload: Record<string, unknown>) => Promise<void>;
  isHitlDrawerOpen: boolean;
  setIsHitlDrawerOpen: (open: boolean) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
}

export function ExecutiveDashboard({
  state,
  onApprovalDecision,
  onExecuteCeoAction,
  isHitlDrawerOpen,
  setIsHitlDrawerOpen,
  isSettingsOpen,
  setIsSettingsOpen
}: ExecutiveDashboardProps) {
  const [selectedAgent, setSelectedAgent] = useState<AgentRole | null>(null);
  const [selectedArtifact, setSelectedArtifact] = useState<TaskArtifact | null>(null);
  const [selectedTaskForArtifact, setSelectedTaskForArtifact] = useState<Task | null>(null);
  const [logFilter, setLogFilter] = useState<string>("all");
  const [ceoDirectiveText, setCeoDirectiveText] = useState("");
  const [isSubmittingDirective, setIsSubmittingDirective] = useState(false);
  const [copiedArtifact, setCopiedArtifact] = useState(false);
  const [decisionGuidance, setDecisionGuidance] = useState<Record<string, string>>({});

  // Calculations
  const pendingApprovals = state.approvals.filter(a => a.status === "pending");
  const inProgressTasks = state.tasks.filter(t => t.status === "in_progress");
  const completedTasks = state.tasks.filter(t => t.status === "completed");
  const backlogTasks = state.tasks.filter(t => t.status === "backlog" || t.status === "pending_approval");

  // Runway calculation (approx cycles remaining)
  const runwayCycles = state.burn_rate_per_cycle > 0
    ? Math.floor(state.capital_treasury / state.burn_rate_per_cycle)
    : 999;

  // Filtered logs
  const filteredLogs = state.logs.filter(log => {
    if (logFilter === "all") return true;
    return log.type === logFilter;
  });

  const handleCopyArtifact = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedArtifact(true);
    setTimeout(() => setCopiedArtifact(false), 2000);
  };

  const handleSendCeoDirective = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ceoDirectiveText.trim() || isSubmittingDirective) return;
    setIsSubmittingDirective(true);
    try {
      await onExecuteCeoAction("issue_directive", { directive: ceoDirectiveText.trim() });
      setCeoDirectiveText("");
    } finally {
      setIsSubmittingDirective(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      {/* 1. TOP EXECUTIVE TELEMETRY BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Treasury */}
        <div className="p-3.5 rounded-xl border border-amber-500/30 bg-gradient-to-b from-amber-950/20 to-slate-900 shadow-md">
          <div className="flex items-center justify-between text-[11px] font-mono text-amber-400">
            <span>TREASURY</span>
            <Coins className="h-3.5 w-3.5" />
          </div>
          <div className="mt-1 text-lg sm:text-xl font-bold font-mono text-amber-300 truncate">
            {state.capital_treasury.toLocaleString()} <span className="text-[10px] text-amber-500">$CLIP</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            Initial: {state.initial_capital.toLocaleString()}
          </div>
        </div>

        {/* Valuation */}
        <div className="p-3.5 rounded-xl border border-cyan-500/30 bg-gradient-to-b from-cyan-950/20 to-slate-900 shadow-md">
          <div className="flex items-center justify-between text-[11px] font-mono text-cyan-400">
            <span>VALUATION</span>
            <TrendingUp className="h-3.5 w-3.5" />
          </div>
          <div className="mt-1 text-lg sm:text-xl font-bold font-mono text-cyan-300 truncate">
            ${((state.valuation?.valuation_usd || 3500000) / 1000000).toFixed(1)}M
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            Rating: {state.valuation?.risk_rating || "A"}
          </div>
        </div>

        {/* Burn Rate */}
        <div className="p-3.5 rounded-xl border border-rose-500/30 bg-gradient-to-b from-rose-950/20 to-slate-900 shadow-md">
          <div className="flex items-center justify-between text-[11px] font-mono text-rose-400">
            <span>BURN RATE</span>
            <Flame className="h-3.5 w-3.5" />
          </div>
          <div className="mt-1 text-lg sm:text-xl font-bold font-mono text-rose-300">
            -{state.burn_rate_per_cycle} <span className="text-[10px] text-slate-400">/ cycle</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            Runway: ~{runwayCycles} cycles
          </div>
        </div>

        {/* Revenue Yield */}
        <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-gradient-to-b from-emerald-950/20 to-slate-900 shadow-md">
          <div className="flex items-center justify-between text-[11px] font-mono text-emerald-400">
            <span>YIELD EARNED</span>
            <DollarSign className="h-3.5 w-3.5" />
          </div>
          <div className="mt-1 text-lg sm:text-xl font-bold font-mono text-emerald-300 truncate">
            +{state.total_revenue_generated.toLocaleString()} <span className="text-[10px] text-slate-400">$CLIP</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            {completedTasks.length} milestones paid
          </div>
        </div>

        {/* Active Agents */}
        <div className="p-3.5 rounded-xl border border-indigo-500/30 bg-gradient-to-b from-indigo-950/20 to-slate-900 shadow-md">
          <div className="flex items-center justify-between text-[11px] font-mono text-indigo-400">
            <span>ACTIVE AGENTS</span>
            <Cpu className="h-3.5 w-3.5" />
          </div>
          <div className="mt-1 text-lg sm:text-xl font-bold font-mono text-indigo-300">
            {state.active_agents.length} Nodes
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            1 Chief + {state.active_agents.length - 1} Specialists
          </div>
        </div>

        {/* Heartbeats / Cycle */}
        <div className="p-3.5 rounded-xl border border-slate-700 bg-gradient-to-b from-slate-800/40 to-slate-900 shadow-md">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>RUNTIME HEARTBEAT</span>
            <Activity className="h-3.5 w-3.5 text-cyan-400" />
          </div>
          <div className="mt-1 text-lg sm:text-xl font-bold font-mono text-slate-100 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            #{state.heartbeat_count}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            Speed: {state.simulation_speed}x
          </div>
        </div>
      </div>

      {/* 2. PENDING HITL ALERT BANNER (If any approvals are pending) */}
      {pendingApprovals.length > 0 && (
        <div className="rounded-xl border border-rose-500/50 bg-rose-950/30 p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-pulse-subtle">
          <div className="flex items-center space-x-3 text-left">
            <div className="h-9 w-9 rounded-lg bg-rose-600/30 border border-rose-500 flex items-center justify-center text-rose-300 flex-shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-rose-200 flex items-center gap-2">
                Human-in-the-Loop (HITL) Interrupt Active
                <Badge variant="destructive" className="font-mono text-[10px]">
                  {pendingApprovals.length} PENDING DECISION{pendingApprovals.length > 1 ? "S" : ""}
                </Badge>
              </div>
              <div className="text-xs text-rose-300/80">
                Autonomous specialist agents have paused execution awaiting CEO authorization.
              </div>
            </div>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setIsHitlDrawerOpen(true)}
            className="w-full sm:w-auto font-bold gap-1.5 shadow-md shadow-rose-900/30 cursor-pointer"
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Open HITL Decision Center</span>
          </Button>
        </div>
      )}

      {/* 3. MAIN DASHBOARD TABS */}
      <Tabs defaultValue="hierarchy" className="w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
          <TabsList>
            <TabsTrigger value="hierarchy" className="gap-1.5">
              <Cpu className="h-3.5 w-3.5" />
              <span>Agent Tree</span>
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-1.5">
              <Layers className="h-3.5 w-3.5" />
              <span>Operations & Deliverables</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px]">
                {inProgressTasks.length + backlogTasks.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="hitl" className="gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>HITL Approvals</span>
              {pendingApprovals.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-bold">
                  {pendingApprovals.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="telemetry" className="gap-1.5">
              <Terminal className="h-3.5 w-3.5" />
              <span>Event Stream</span>
            </TabsTrigger>
            <TabsTrigger value="workspace" className="gap-1.5">
              <FolderCode className="h-3.5 w-3.5" />
              <span>Agent Workspace & Tools</span>
              {(state.recent_tool_executions?.length || 0) > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 text-[10px] font-mono">
                  {state.recent_tool_executions?.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="memory" className="gap-1.5">
              <Brain className="h-3.5 w-3.5" />
              <span>SQLite+Vec Memory</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-800 text-[10px] font-mono">
                {state.memories_count || 4}
              </span>
            </TabsTrigger>
            <TabsTrigger value="blueprint" className="gap-1.5">
              <Briefcase className="h-3.5 w-3.5" />
              <span>Blueprint & KPIs</span>
            </TabsTrigger>
          </TabsList>

          {/* Quick CEO Directive Input */}
          <form onSubmit={handleSendCeoDirective} className="flex items-center gap-2 w-full sm:w-auto">
            <Input
              value={ceoDirectiveText}
              onChange={(e) => setCeoDirectiveText(e.target.value)}
              placeholder="Inject CEO Order to Chief of Staff..."
              className="h-8 text-xs bg-slate-900/90 border-slate-800 w-full sm:w-64"
              disabled={isSubmittingDirective}
            />
            <Button
              type="submit"
              size="sm"
              variant="cyan"
              disabled={!ceoDirectiveText.trim() || isSubmittingDirective}
              className="h-8 text-xs px-2.5"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>
        </div>

        {/* TAB 1: AGENT HIERARCHY TREE */}
        <TabsContent value="hierarchy" className="space-y-6">
          {/* Chief of Staff Node (Apex) */}
          {state.chief_of_staff && (
            <div className="flex flex-col items-center">
              <div
                onClick={() => setSelectedAgent(state.chief_of_staff)}
                className="w-full max-w-xl rounded-xl border border-cyan-500/40 bg-gradient-to-r from-slate-900 via-cyan-950/20 to-slate-900 p-4 shadow-xl hover:border-cyan-400 cursor-pointer transition-all hover:scale-[1.01]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-11 w-11 rounded-xl bg-cyan-950 border border-cyan-700 flex items-center justify-center text-2xl shadow-md">
                      {state.chief_of_staff.avatar}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm sm:text-base text-slate-100">
                          {state.chief_of_staff.name}
                        </span>
                        <Badge variant="cyan" className="font-mono text-[10px]">
                          CHIEF OF STAFF
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400 font-medium">
                        {state.chief_of_staff.title}
                      </p>
                    </div>
                  </div>

                  <div className="text-right font-mono text-xs">
                    <div className="text-slate-400 text-[10px]">Cycle Burn</div>
                    <span className="font-bold text-amber-400">
                      -{state.chief_of_staff.cost_per_cycle} $CLIP
                    </span>
                  </div>
                </div>

                {/* Last Thought Bubble */}
                <div className="mt-3 p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-cyan-200 flex items-start gap-2">
                  <span className="text-cyan-400 font-mono text-[11px] mt-0.5">THOUGHT:</span>
                  <span className="italic leading-relaxed">
                    &ldquo;{state.chief_of_staff.last_thought || "Orchestrating autonomous operations..."}&rdquo;
                  </span>
                </div>
              </div>

              {/* Connecting Tree Line */}
              <div className="h-6 w-0.5 bg-cyan-500/50" />
            </div>
          )}

          {/* Specialist Sub-Agents Grid */}
          <div>
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>Autonomous Specialist Sub-Agents ({state.active_agents.filter(a => a.role !== "chief_of_staff").length})</span>
              <span className="text-slate-500">Click node for deep metrics</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {state.active_agents
                .filter(a => a.role !== "chief_of_staff")
                .map((agent) => {
                  const statusColors = {
                    idle: "border-slate-800 bg-slate-900/60 text-slate-300",
                    thinking: "border-indigo-500/40 bg-indigo-950/20 text-indigo-300",
                    executing: "border-cyan-500/40 bg-cyan-950/20 text-cyan-300",
                    waiting_approval: "border-amber-500/40 bg-amber-950/20 text-amber-300",
                    completed: "border-emerald-500/40 bg-emerald-950/20 text-emerald-300",
                  };

                  return (
                    <div
                      key={agent.id}
                      onClick={() => setSelectedAgent(agent)}
                      className={`rounded-xl border p-4 shadow-lg hover:border-slate-600 transition-all cursor-pointer flex flex-col justify-between ${statusColors[agent.status]}`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2.5">
                            <div className="h-9 w-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-lg">
                              {agent.avatar}
                            </div>
                            <div>
                              <div className="font-bold text-xs sm:text-sm text-slate-100 flex items-center gap-1.5">
                                {agent.name}
                              </div>
                              <div className="text-[11px] text-slate-400">{agent.title}</div>
                            </div>
                          </div>

                          <Badge
                            variant={
                              agent.status === "executing"
                                ? "cyan"
                                : agent.status === "waiting_approval"
                                ? "amber"
                                : "outline"
                            }
                            className="font-mono text-[9px] uppercase"
                          >
                            {agent.status}
                          </Badge>
                        </div>

                        {/* Current Task or Idle */}
                        <div className="text-xs">
                          <div className="text-[10px] font-mono text-slate-400 uppercase">Current Routine</div>
                          <div className="font-medium text-slate-200 truncate mt-0.5">
                            {agent.current_task || "Monitoring operational queue"}
                          </div>
                        </div>

                        {/* Last Thought */}
                        <div className="p-2 rounded bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-300 italic line-clamp-2">
                          &ldquo;{agent.last_thought || "Awaiting instructions..."}&rdquo;
                        </div>
                      </div>

                      {/* Footer Metrics */}
                      <div className="pt-3 border-t border-slate-800/60 mt-3 flex items-center justify-between text-[11px] font-mono text-slate-400">
                        <span>Burn: -{agent.cost_per_cycle} $CLIP</span>
                        <span>Tokens: {agent.tokens_burned.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: OPERATIONS & DELIVERABLE ARTIFACTS */}
        <TabsContent value="tasks" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1: In Progress */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-cyan-400 uppercase font-bold pb-2 border-b border-cyan-500/30">
                <span className="flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 animate-spin" />
                  In Flight ({inProgressTasks.length})
                </span>
              </div>
              <div className="space-y-3">
                {inProgressTasks.map((t) => {
                  const assignedAgent = state.active_agents.find(a => a.id === t.assigned_to_role_id);
                  return (
                    <div
                      key={t.id}
                      className="p-3.5 rounded-xl border border-cyan-500/30 bg-slate-900/80 shadow-md space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-xs text-slate-100 leading-snug">
                          {t.title}
                        </span>
                        <Badge variant="cyan" className="font-mono text-[9px] uppercase">
                          {t.department}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                        {t.description}
                      </p>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono text-slate-400">
                          <span>Sprint Progress</span>
                          <span className="text-cyan-400 font-bold">{t.progress}%</span>
                        </div>
                        <Progress value={t.progress} indicatorColor="cyan" className="h-2" />
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-400">
                        <span>Agent: {assignedAgent?.name || "Specialist"}</span>
                        <span className="text-emerald-400 font-bold">+{t.revenue_yield} $CLIP Yield</span>
                      </div>
                    </div>
                  );
                })}
                {inProgressTasks.length === 0 && (
                  <div className="p-6 text-center text-xs text-slate-500 rounded-xl border border-dashed border-slate-800">
                    No active tasks currently executing.
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: Backlog & Pending Approvals */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-amber-400 uppercase font-bold pb-2 border-b border-amber-500/30">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Queue & Awaiting CEO ({backlogTasks.length})
                </span>
              </div>
              <div className="space-y-3">
                {backlogTasks.map((t) => {
                  const isPendingApproval = t.status === "pending_approval";
                  return (
                    <div
                      key={t.id}
                      className={`p-3.5 rounded-xl border shadow-md space-y-2.5 ${
                        isPendingApproval
                          ? "border-rose-500/50 bg-rose-950/20"
                          : "border-slate-800 bg-slate-900/60"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-xs text-slate-100 leading-snug">
                          {t.title}
                        </span>
                        <Badge
                          variant={isPendingApproval ? "destructive" : "outline"}
                          className="font-mono text-[9px] uppercase"
                        >
                          {isPendingApproval ? "HITL VETO" : "BACKLOG"}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                        {t.description}
                      </p>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] font-mono">
                        <span className="text-amber-400">Cost: -{t.cost} $CLIP</span>
                        {isPendingApproval && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setIsHitlDrawerOpen(true)}
                            className="h-6 text-[10px] px-2"
                          >
                            Review
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Column 3: Completed Milestones & Output Artifacts */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-emerald-400 uppercase font-bold pb-2 border-b border-emerald-500/30">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Verified Deliverables ({completedTasks.length})
                </span>
              </div>
              <div className="space-y-3">
                {completedTasks.map((t) => {
                  const hasArtifact = t.artifacts && t.artifacts.length > 0;
                  return (
                    <div
                      key={t.id}
                      className="p-3.5 rounded-xl border border-emerald-500/30 bg-slate-900/70 shadow-md space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-xs text-slate-100 leading-snug">
                          {t.title}
                        </span>
                        <Badge variant="emerald" className="font-mono text-[9px]">
                          DONE
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2">
                        {t.description}
                      </p>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[10px] font-mono">
                        <span className="text-emerald-400 font-bold">
                          +{t.revenue_yield} $CLIP Yielded
                        </span>
                        {hasArtifact && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedArtifact(t.artifacts![0]);
                              setSelectedTaskForArtifact(t);
                            }}
                            className="h-6 text-[10px] px-2 gap-1 text-cyan-400 hover:text-cyan-300"
                          >
                            <FileCode className="h-3 w-3" />
                            <span>View Artifact</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {completedTasks.length === 0 && (
                  <div className="p-6 text-center text-xs text-slate-500 rounded-xl border border-dashed border-slate-800">
                    No deliverables completed yet. Specialist agents are executing sprints.
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* TAB 3: HITL APPROVAL CENTER */}
        <TabsContent value="hitl" className="space-y-4">
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 mb-4 text-xs space-y-1">
            <div className="font-semibold text-slate-200 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-400" />
              Human-in-the-Loop (HITL) Governance Center
            </div>
            <p className="text-slate-400 leading-relaxed">
              As Chief Executive Officer, you maintain ultimate fiduciary and strategic authority. High-cost sprints,
              architectural pivots, and critical marketing campaigns require your explicit authorization to deduct capital.
            </p>
          </div>

          <div className="space-y-4">
            {pendingApprovals.map((req) => (
              <Card key={req.id} className="border-rose-500/40 bg-slate-900/90 shadow-xl">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="destructive" className="font-mono text-[10px]">
                          RISK: {req.risk_level.toUpperCase()}
                        </Badge>
                        <span className="text-[11px] font-mono text-slate-400">
                          Submitted at {req.timestamp}
                        </span>
                      </div>
                      <CardTitle className="text-base text-slate-100">{req.title}</CardTitle>
                      <CardDescription className="text-xs text-slate-300 mt-1">
                        Proposing Agent: <span className="text-cyan-400 font-semibold">{req.proposed_by_name}</span> ({req.proposed_by_role})
                      </CardDescription>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-[10px] text-slate-400">Budget Impact</div>
                      <div className="text-lg font-bold text-rose-400">-{req.budget_impact} $CLIP</div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
                    <span className="font-mono text-slate-400 uppercase text-[10px]">Strategic Justification</span>
                    <p className="text-slate-200">{req.strategic_justification}</p>
                  </div>

                  {req.alternative_option && (
                    <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800/80 space-y-1">
                      <span className="font-mono text-slate-400 uppercase text-[10px]">Alternative / Mitigation</span>
                      <p className="text-slate-300">{req.alternative_option}</p>
                    </div>
                  )}

                  {/* Optional CEO Guidance Input */}
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400 font-mono">
                      Executive Feedback / Guidance (Optional for Rejection)
                    </label>
                    <Input
                      value={decisionGuidance[req.task_id] || ""}
                      onChange={(e) => setDecisionGuidance({ ...decisionGuidance, [req.task_id]: e.target.value })}
                      placeholder="e.g. Reduce cost by 25% or run a 24-hour smoke test first..."
                      className="text-xs bg-slate-950/80 border-slate-800"
                    />
                  </div>
                </CardContent>

                <CardFooter className="flex items-center justify-end space-x-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onApprovalDecision(req.task_id, "rejected", decisionGuidance[req.task_id])}
                    className="text-rose-400 hover:text-rose-300 border-rose-900/60 hover:bg-rose-950/40 cursor-pointer"
                  >
                    Reject & Defer
                  </Button>
                  <Button
                    variant="emerald"
                    size="sm"
                    onClick={() => onApprovalDecision(req.task_id, "approved")}
                    className="font-bold cursor-pointer"
                  >
                    Authorize Sprint (-{req.budget_impact} $CLIP)
                  </Button>
                </CardFooter>
              </Card>
            ))}

            {pendingApprovals.length === 0 && (
              <div className="p-12 text-center rounded-xl border border-dashed border-slate-800 space-y-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
                <div className="text-sm font-semibold text-slate-200">No Pending Interrupts</div>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  All active tasks are executing within authorized budget parameters.
                  Future high-value sprints will automatically trigger CEO interrupts.
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* TAB 4: REAL-TIME EVENT STREAM / LOG TICKER */}
        <TabsContent value="telemetry" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-slate-800 bg-slate-900/80">
            <div className="flex items-center space-x-2 text-xs font-mono text-slate-300">
              <Terminal className="h-4 w-4 text-cyan-400" />
              <span>LIVE TELEMETRY STREAM</span>
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1 text-[11px] font-mono">
              {["all", "heartbeat", "action", "approval", "finance", "thought", "milestone"].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setLogFilter(f)}
                  className={`px-2 py-0.5 rounded capitalize transition-colors cursor-pointer ${
                    logFilter === f
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Terminal Console View */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs max-h-[500px] overflow-y-auto space-y-2 shadow-2xl">
            {filteredLogs.map((log) => {
              const typeBadges = {
                heartbeat: "text-cyan-400",
                thought: "text-indigo-400",
                action: "text-emerald-400",
                approval: "text-rose-400",
                finance: "text-amber-400",
                milestone: "text-purple-400 font-bold",
                alert: "text-red-400 font-bold"
              };

              return (
                <div key={log.id} className="flex items-start space-x-2 py-1 border-b border-slate-900/80 hover:bg-slate-900/40">
                  <span className="text-slate-500 flex-shrink-0 text-[10px]">[{log.timestamp}]</span>
                  <span className={`text-[10px] uppercase font-bold flex-shrink-0 ${typeBadges[log.type]}`}>
                    {log.type}
                  </span>
                  <span className="text-slate-400 flex-shrink-0">[{log.agent_name}]:</span>
                  <span className="text-slate-200 flex-1 break-words">{log.message}</span>
                </div>
              );
            })}
            {filteredLogs.length === 0 && (
              <div className="text-center py-8 text-slate-500">No logs matching filter.</div>
            )}
          </div>
        </TabsContent>

        {/* TAB 5: BUSINESS BLUEPRINT & VALUATION */}
        <TabsContent value="blueprint" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Blueprint Overview */}
            <Card className="border-slate-800 bg-slate-900/80">
              <CardHeader>
                <CardTitle className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-cyan-400" />
                  Enterprise Foundation Blueprint
                </CardTitle>
                <CardDescription>
                  Codified during Phase 1 onboarding and iterated by the Concept Artist.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-500 font-mono text-[10px] uppercase block">Vision</span>
                  <p className="text-slate-200">{state.blueprint?.vision}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-mono text-[10px] uppercase block">Core Value Prop</span>
                  <p className="text-slate-200">{state.blueprint?.core_value_prop}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-mono text-[10px] uppercase block">Monetization</span>
                  <p className="text-emerald-400 font-medium">{state.blueprint?.revenue_model}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-mono text-[10px] uppercase block">Go-To-Market Strategy</span>
                  <p className="text-slate-200">{state.blueprint?.gtm_strategy}</p>
                </div>
              </CardContent>
            </Card>

            {/* Investor Stage Term Sheet */}
            <Card className="border-slate-800 bg-slate-900/80">
              <CardHeader>
                <CardTitle className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  Investor Term Sheet & Valuation
                </CardTitle>
                <CardDescription>
                  Underwritten by {state.valuation?.firm_name || "Apex Syndicate"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex justify-between p-2.5 rounded bg-slate-950 border border-slate-800 font-mono">
                  <span className="text-slate-400">Pre-Money Valuation</span>
                  <span className="text-cyan-300 font-bold">${state.valuation?.valuation_usd.toLocaleString()} USD</span>
                </div>
                <div className="flex justify-between p-2.5 rounded bg-slate-950 border border-slate-800 font-mono">
                  <span className="text-slate-400">Treasury Capital Pool</span>
                  <span className="text-amber-300 font-bold">{state.valuation?.initial_capital.toLocaleString()} $CLIP</span>
                </div>
                <div className="flex justify-between p-2.5 rounded bg-slate-950 border border-slate-800 font-mono">
                  <span className="text-slate-400">Investor Equity Stake</span>
                  <span className="text-slate-200">{state.valuation?.equity_stake_percent}%</span>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-500 font-mono text-[10px] uppercase block">Covenants</span>
                  <ul className="space-y-1 text-slate-300 list-disc list-inside">
                    {state.valuation?.term_sheet_notes.map((note, i) => (
                      <li key={i}>{note}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 6: AGENT WORKSPACE & TOOLS */}
        <TabsContent value="workspace" className="space-y-4">
          <WorkspaceInspector state={state} />
        </TabsContent>

        {/* TAB 7: SQLITE+VEC SEMANTIC MEMORY */}
        <TabsContent value="memory" className="space-y-4">
          <SemanticMemoryExplorer state={state} />
        </TabsContent>
      </Tabs>

      {/* 4. ARTIFACT INSPECTOR MODAL */}
      {selectedArtifact && (
        <Dialog open={!!selectedArtifact} onOpenChange={() => setSelectedArtifact(null)}>
          <DialogClose onClick={() => setSelectedArtifact(null)} />
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="cyan" className="font-mono text-[10px] uppercase">
                {selectedArtifact.type} DELIVERABLE
              </Badge>
              {selectedTaskForArtifact && (
                <Badge variant="outline" className="font-mono text-[10px]">
                  Cycle #{selectedTaskForArtifact.completed_at_cycle || state.heartbeat_count}
                </Badge>
              )}
            </div>
            <DialogTitle className="text-base text-slate-100 flex items-center gap-2">
              <FileCode className="h-5 w-5 text-cyan-400" />
              {selectedArtifact.title}
            </DialogTitle>
            <DialogDescription>
              Autonomous output produced by specialist agent and verified by Chief of Staff.
            </DialogDescription>
          </DialogHeader>

          {/* Artifact Content Viewer */}
          <div className="my-4 relative">
            <button
              onClick={() => handleCopyArtifact(selectedArtifact.content)}
              className="absolute top-2 right-2 p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 border border-slate-700 shadow cursor-pointer transition-colors"
              title="Copy output"
            >
              {copiedArtifact ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedArtifact ? "Copied" : "Copy"}</span>
            </button>
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-200 overflow-x-auto max-h-[400px] whitespace-pre leading-relaxed">
              {selectedArtifact.content}
            </pre>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setSelectedArtifact(null)}>
              Close Viewer
            </Button>
          </DialogFooter>
        </Dialog>
      )}

      {/* 5. AGENT DETAILS MODAL */}
      {selectedAgent && (
        <Dialog open={!!selectedAgent} onOpenChange={() => setSelectedAgent(null)}>
          <DialogClose onClick={() => setSelectedAgent(null)} />
          <DialogHeader>
            <div className="flex items-center space-x-3 mb-2">
              <div className="h-12 w-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl">
                {selectedAgent.avatar}
              </div>
              <div>
                <DialogTitle className="text-base text-slate-100 flex items-center gap-2">
                  {selectedAgent.name}
                  <Badge variant="cyan" className="font-mono text-[10px]">
                    {selectedAgent.department}
                  </Badge>
                </DialogTitle>
                <DialogDescription>{selectedAgent.title}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 text-xs my-2">
            <div>
              <span className="text-slate-500 font-mono uppercase text-[10px] block mb-0.5">Agent Personality</span>
              <p className="text-slate-200">{selectedAgent.personality}</p>
            </div>

            {selectedAgent.leadership_style && (
              <div>
                <span className="text-slate-500 font-mono uppercase text-[10px] block mb-0.5">Leadership Doctrine</span>
                <p className="text-slate-200">{selectedAgent.leadership_style}</p>
              </div>
            )}

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-cyan-400 font-mono text-[10px] uppercase block mb-1">Active Thought Subroutine</span>
              <p className="text-slate-300 italic">&ldquo;{selectedAgent.last_thought}&rdquo;</p>
            </div>

            <div className="grid grid-cols-2 gap-3 font-mono">
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Burn Cost</span>
                <span className="text-amber-400 font-bold">-{selectedAgent.cost_per_cycle} $CLIP / cycle</span>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Tokens Processed</span>
                <span className="text-slate-200 font-bold">{selectedAgent.tokens_burned.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setSelectedAgent(null)}>
              Dismiss
            </Button>
          </DialogFooter>
        </Dialog>
      )}

      {/* 6. HITL DECISION SLIDE-OUT DRAWER */}
      <Sheet open={isHitlDrawerOpen} onOpenChange={setIsHitlDrawerOpen}>
        <SheetHeader>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-rose-400" />
            <SheetTitle>HITL Action Center</SheetTitle>
          </div>
          <SheetDescription>
            Authorize or reject interrupted agent sprints to resume LangGraph execution.
          </SheetDescription>
        </SheetHeader>

        <SheetContent>
          <div className="space-y-4">
            {pendingApprovals.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-xl border border-rose-500/40 bg-slate-950 space-y-3 text-xs shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <Badge variant="destructive" className="font-mono text-[9px] mb-1">
                      {req.risk_level.toUpperCase()} RISK
                    </Badge>
                    <h4 className="font-bold text-slate-100 text-sm">{req.title}</h4>
                    <p className="text-slate-400 text-[11px] mt-0.5">Proposed by: {req.proposed_by_name}</p>
                  </div>
                  <div className="text-right font-mono font-bold text-rose-400">
                    -{req.budget_impact} $CLIP
                  </div>
                </div>

                <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                  {req.strategic_justification}
                </div>

                <div className="space-y-1">
                  <Input
                    value={decisionGuidance[req.task_id] || ""}
                    onChange={(e) => setDecisionGuidance({ ...decisionGuidance, [req.task_id]: e.target.value })}
                    placeholder="Rejection guidance (optional)..."
                    className="h-8 text-xs bg-slate-900 border-slate-800"
                  />
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-800">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onApprovalDecision(req.task_id, "rejected", decisionGuidance[req.task_id])}
                    className="flex-1 text-xs border-rose-900/60 text-rose-400"
                  >
                    Reject
                  </Button>
                  <Button
                    variant="emerald"
                    size="sm"
                    onClick={() => onApprovalDecision(req.task_id, "approved")}
                    className="flex-1 text-xs font-bold"
                  >
                    Approve (-{req.budget_impact})
                  </Button>
                </div>
              </div>
            ))}

            {pendingApprovals.length === 0 && (
              <div className="text-center py-12 text-slate-500 space-y-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
                <div className="text-sm font-medium text-slate-300">No Pending Approvals</div>
                <p className="text-xs">All specialist workflows are moving autonomously.</p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
