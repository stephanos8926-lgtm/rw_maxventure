"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Header } from "@/components/Header";
import { OnboardingSurvey } from "@/components/onboarding/OnboardingSurvey";
import { ConceptArtistChat } from "@/components/onboarding/ConceptArtistChat";
import { InvestorValuationModal } from "@/components/launch/InvestorValuationModal";
import { ChiefOfStaffSelector } from "@/components/cos/ChiefOfStaffSelector";
import { ExecutiveDashboard } from "@/components/dashboard/ExecutiveDashboard";
import { SystemSettingsModal } from "@/components/dashboard/SystemSettingsModal";
import { EnterpriseState, BusinessBlueprint, ChiefOfStaffCandidate, EnterpriseSystemSettings } from "@/types/enterprise";
import { getSimulationEngine } from "@/lib/simulation-engine";

export default function PaperclipEnterpriseSimulatorPage() {
  const [engine] = useState(() => getSimulationEngine());
  const [state, setState] = useState<EnterpriseState>(() => engine.getState());
  const [onboardingSubstep, setOnboardingSubstep] = useState<"survey" | "chat">("survey");
  const [showValuationModal, setShowValuationModal] = useState(false);
  const [isHitlDrawerOpen, setIsHitlDrawerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Sync state from engine listener
  useEffect(() => {
    const unsubscribe = engine.subscribe((newState) => {
      setState({ ...newState });
    });
    return () => unsubscribe();
  }, [engine]);

  // Connect to SSE stream if available
  useEffect(() => {
    try {
      const es = new EventSource("/api/enterprise/stream");
      eventSourceRef.current = es;

      es.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed && parsed.phase) {
            setState(parsed);
          }
        } catch (e) {
          console.error("SSE parse error:", e);
        }
      };

      es.onerror = () => {
        // SSE disconnected or not supported in local preview - engine interval handles simulation
        es.close();
      };

      return () => {
        es.close();
      };
    } catch (err) {
      console.warn("EventSource setup skipped:", err);
    }
  }, []);

  // Handlers for Simulation Controls in Header
  const handleTogglePlay = useCallback(() => {
    if (state.is_running) {
      engine.pauseSimulation();
    } else {
      engine.startSimulation();
    }
  }, [engine, state.is_running]);

  const handleStepCycle = useCallback(() => {
    engine.stepHeartbeat();
  }, [engine]);

  const handleSpeedChange = useCallback((speed: number) => {
    engine.setSimulationSpeed(speed);
  }, [engine]);

  const handleReset = useCallback(() => {
    engine.resetSimulation();
    setOnboardingSubstep("survey");
    setShowValuationModal(false);
  }, [engine]);

  // Phase 1: Survey Completion -> Move to Concept Artist Chat
  const handleCompleteSurvey = (blueprint: BusinessBlueprint) => {
    engine.updateBlueprint(blueprint);
    setOnboardingSubstep("chat");
  };

  // Phase 1 -> Phase 2: Launch Enterprise -> Investor Valuation
  const handleLaunchEnterprise = async (blueprint: BusinessBlueprint) => {
    engine.updateBlueprint(blueprint);
    const valuation = engine.evaluateInvestorTermSheet();
    setShowValuationModal(true);
  };

  // Phase 2 -> Phase 3: Accept Term Sheet -> Chief of Staff Selection
  const handleProceedToChiefSelection = () => {
    setShowValuationModal(false);
    engine.advanceToChiefOfStaffSelection();
  };

  // Phase 3 -> Phase 4: Hire Chief of Staff -> Autonomous Operations
  const handleSelectChiefCandidate = (candidateId: string) => {
    engine.selectChiefOfStaff(candidateId);
  };

  // HITL Approval Decision
  const handleApprovalDecision = async (
    taskId: string,
    decision: "approved" | "rejected",
    guidance?: string
  ) => {
    engine.submitApprovalDecision(taskId, decision, guidance);
    // Also dispatch to API route
    try {
      await fetch("/api/enterprise/approval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, decision, guidance })
      });
    } catch (e) {
      console.error("API approval dispatch failed:", e);
    }
  };

  // Generic CEO Action Dispatch
  const handleExecuteCeoAction = async (action: string, payload: Record<string, unknown>) => {
    if (action === "issue_directive" && typeof payload.directive === "string") {
      engine.issueCeoDirective(payload.directive);
    } else if (action === "inject_capital" && typeof payload.amount === "number") {
      engine.injectCapital(payload.amount);
    } else if (action === "update_settings" && payload.settings) {
      engine.updateSettings(payload.settings as Partial<EnterpriseSystemSettings>);
    } else if (action === "set_strictness") {
      engine.setGovernanceStrictness(
        payload.strictness as "all" | "high_cost_only" | "auto_pilot",
        Number(payload.threshold)
      );
    }

    try {
      await fetch("/api/enterprise/ceo-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, payload })
      });
    } catch (e) {
      console.error("API CEO action dispatch failed:", e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-cyan-500 selection:text-slate-950">
      {/* Global Interactive Header */}
      <Header
        state={state}
        onTogglePlay={handleTogglePlay}
        onStepCycle={handleStepCycle}
        onSpeedChange={handleSpeedChange}
        onReset={handleReset}
        onOpenHitlDrawer={() => setIsHitlDrawerOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Content Area: Routed by Simulation Phase */}
      <main className="flex-1 pb-16">
        {state.phase === "onboarding" && (
          <>
            {onboardingSubstep === "survey" ? (
              <OnboardingSurvey
                initialBlueprint={state.blueprint}
                onCompleteSurvey={handleCompleteSurvey}
              />
            ) : (
              <ConceptArtistChat
                blueprint={state.blueprint}
                onLaunchEnterprise={handleLaunchEnterprise}
                onBackToSurvey={() => setOnboardingSubstep("survey")}
              />
            )}
          </>
        )}

        {state.phase === "launch_valuation" && (
          <div className="py-12 text-center">
            <InvestorValuationModal
              open={showValuationModal || state.phase === "launch_valuation"}
              blueprint={state.blueprint}
              valuation={state.valuation}
              onProceedToChiefSelection={handleProceedToChiefSelection}
            />
          </div>
        )}

        {state.phase === "chief_selection" && (
          <ChiefOfStaffSelector
            candidates={state.cos_candidates}
            treasury={state.capital_treasury}
            blueprint={state.blueprint}
            onSelectCandidate={handleSelectChiefCandidate}
          />
        )}

        {(state.phase === "autonomous_execution" || state.phase === "completed") && (
          <ExecutiveDashboard
            state={state}
            onApprovalDecision={handleApprovalDecision}
            onExecuteCeoAction={handleExecuteCeoAction}
            isHitlDrawerOpen={isHitlDrawerOpen}
            setIsHitlDrawerOpen={setIsHitlDrawerOpen}
            isSettingsOpen={isSettingsOpen}
            setIsSettingsOpen={setIsSettingsOpen}
          />
        )}
      </main>

      {/* Persistent Investor Valuation Modal if triggered in onboarding */}
      <InvestorValuationModal
        open={showValuationModal}
        blueprint={state.blueprint}
        valuation={state.valuation}
        onProceedToChiefSelection={handleProceedToChiefSelection}
      />

      {/* Global System & Model Settings Modal */}
      <SystemSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        state={state}
        onExecuteCeoAction={handleExecuteCeoAction}
      />
    </div>
  );
}
