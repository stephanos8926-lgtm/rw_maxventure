"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ChiefOfStaffCandidate, BusinessBlueprint } from "@/types/enterprise";
import {
  UserCheck,
  Zap,
  Shield,
  Rocket,
  CheckCircle2,
  Coins,
  Crown,
  Sparkles,
  ArrowRight
} from "lucide-react";

interface ChiefOfStaffSelectorProps {
  candidates: ChiefOfStaffCandidate[];
  treasury: number;
  blueprint: BusinessBlueprint | null;
  onSelectCandidate: (candidateId: string) => void;
}

export function ChiefOfStaffSelector({
  candidates,
  treasury,
  blueprint,
  onSelectCandidate
}: ChiefOfStaffSelectorProps) {
  const [selectedId, setSelectedId] = useState<string>(candidates[0]?.id || "cos_aria");
  const [isHiring, setIsHiring] = useState(false);

  const selectedCandidate = candidates.find(c => c.id === selectedId) || candidates[0];

  const handleConfirmHiring = () => {
    setIsHiring(true);
    onSelectCandidate(selectedId);
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4 sm:px-6">
      {/* Header */}
      <div className="text-center mb-8 space-y-2">
        <Badge variant="cyan" className="font-mono text-xs px-3 py-1">
          PHASE 3: EXECUTIVE HIRING
        </Badge>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-100 flex items-center justify-center gap-3">
          <Crown className="h-7 w-7 text-amber-400" />
          Select Your Chief of Staff
        </h1>
        <p className="text-slate-400 text-sm max-w-2xl mx-auto leading-relaxed">
          Your Chief of Staff will act as the principal orchestrator for {blueprint?.company_name || "your enterprise"}.
          They will parse the Business Blueprint, dynamically spawn specialist sub-agents, and manage operational roadmaps.
        </p>

        {/* Treasury Notice */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
          <Coins className="h-3.5 w-3.5 text-amber-400" />
          <span>Available Treasury: </span>
          <span className="font-bold text-amber-300">{treasury.toLocaleString()} $CLIP</span>
        </div>
      </div>

      {/* Candidate Dossier Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {candidates.map((cand) => {
          const isSelected = cand.id === selectedId;

          return (
            <div
              key={cand.id}
              onClick={() => setSelectedId(cand.id)}
              className={`rounded-xl border p-5 transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? "border-cyan-400 bg-gradient-to-b from-slate-900 via-slate-900 to-cyan-950/40 shadow-2xl ring-2 ring-cyan-500/30 scale-[1.02]"
                  : "border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900"
              }`}
            >
              <div className="space-y-4">
                {/* Avatar and Top Badges */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl shadow-inner">
                      {cand.avatar}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-100 flex items-center gap-1.5">
                        {cand.name}
                        {isSelected && <CheckCircle2 className="h-4 w-4 text-cyan-400" />}
                      </h3>
                      <p className="text-xs text-slate-400 font-medium">{cand.title}</p>
                    </div>
                  </div>

                  <Badge
                    variant={
                      cand.risk_profile === "Aggressive"
                        ? "amber"
                        : cand.risk_profile === "Methodical"
                        ? "cyan"
                        : "emerald"
                    }
                    className="font-mono text-[10px]"
                  >
                    {cand.risk_profile}
                  </Badge>
                </div>

                {/* Quote */}
                <p className="text-xs italic text-slate-300 leading-relaxed border-l-2 border-slate-700 pl-2.5 py-0.5">
                  &ldquo;{cand.quote}&rdquo;
                </p>

                {/* Personality & Leadership Style */}
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-500 font-mono text-[10px] uppercase block mb-0.5">
                      Leadership Style
                    </span>
                    <span className="text-slate-200 font-medium">{cand.leadership_style}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 font-mono text-[10px] uppercase block mb-0.5">
                      Core Specialty
                    </span>
                    <span className="text-cyan-300">{cand.specialty}</span>
                  </div>
                </div>

                {/* Operational Traits Badges */}
                <div className="space-y-1.5">
                  <span className="text-slate-500 font-mono text-[10px] uppercase block">
                    Operational Traits
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {cand.operational_traits.map((trait) => (
                      <span
                        key={trait}
                        className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 text-slate-300 text-[10px] font-mono"
                      >
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Recruitment Fee */}
              <div className="pt-4 border-t border-slate-800/80 mt-5 flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px]">Recruitment Fee</span>
                  <span className="font-bold text-amber-300">{cand.recruitment_cost} $CLIP</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] text-right">Projected Velocity</span>
                  <span className="text-slate-200 font-semibold">{cand.projected_velocity}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation Hiring Bar */}
      <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/90 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-xl">
            {selectedCandidate.avatar}
          </div>
          <div>
            <div className="text-sm font-bold text-slate-100 flex items-center gap-2">
              Confirm Appointment: {selectedCandidate.name}
              <Badge variant="cyan" className="text-[10px] font-mono">
                {selectedCandidate.risk_profile}
              </Badge>
            </div>
            <div className="text-xs text-slate-400">
              Fee: {selectedCandidate.recruitment_cost} $CLIP will be deducted from your treasury.
            </div>
          </div>
        </div>

        <Button
          size="lg"
          variant="cyan"
          disabled={isHiring || treasury < selectedCandidate.recruitment_cost}
          onClick={handleConfirmHiring}
          className="w-full sm:w-auto gap-2 font-bold tracking-wide"
        >
          <UserCheck className="h-4 w-4" />
          <span>Authorize Chief of Staff & Start Autonomous Operations</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
