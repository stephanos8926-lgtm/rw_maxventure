"use client";

import React from "react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { InvestorValuation, BusinessBlueprint } from "@/types/enterprise";
import {
  TrendingUp,
  Coins,
  ShieldCheck,
  CheckCircle,
  FileCheck,
  ArrowRight,
  Briefcase
} from "lucide-react";

interface InvestorValuationModalProps {
  open: boolean;
  blueprint: BusinessBlueprint | null;
  valuation: InvestorValuation | null;
  onProceedToChiefSelection: () => void;
}

export function InvestorValuationModal({
  open,
  blueprint,
  valuation,
  onProceedToChiefSelection
}: InvestorValuationModalProps) {
  if (!valuation || !blueprint) return null;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <div className="space-y-6">
        {/* Header */}
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="cyan" className="font-mono text-xs">
              PHASE 2: INVESTOR STAGE
            </Badge>
            <Badge variant="emerald" className="font-mono text-xs">
              TERM SHEET ISSUED
            </Badge>
          </div>
          <DialogTitle className="text-xl sm:text-2xl text-slate-100 flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-cyan-400" />
            Virtual Investor Valuation Ratified
          </DialogTitle>
          <DialogDescription>
            The autonomous Investor Evaluation Agent has reviewed {blueprint.company_name}&apos;s Business Blueprint
            and underwritten initial seed capital.
          </DialogDescription>
        </DialogHeader>

        {/* Valuation & Capital Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Valuation Card */}
          <div className="p-4 rounded-xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/40 to-slate-900 shadow-xl space-y-1">
            <div className="text-xs font-mono uppercase text-cyan-400 flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4" />
              Pre-Money Valuation
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              ${valuation.valuation_usd.toLocaleString()} <span className="text-xs font-mono font-normal text-slate-400">USD</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Risk Rating: <span className="text-emerald-400 font-bold font-mono">{valuation.risk_rating}</span> | Equity stake: {valuation.equity_stake_percent}%
            </div>
          </div>

          {/* Capital Treasury Grant */}
          <div className="p-4 rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-950/40 to-slate-900 shadow-xl space-y-1">
            <div className="text-xs font-mono uppercase text-amber-400 flex items-center gap-1.5">
              <Coins className="h-4 w-4" />
              Virtual Capital Pool Granted
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-300 tracking-tight">
              {valuation.initial_capital.toLocaleString()} <span className="text-xs font-mono font-normal text-slate-400">$CLIP</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Immediate operational treasury unlocked for recruitment & compute.
            </div>
          </div>
        </div>

        {/* Investor Thesis Box */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-400 font-mono text-[11px]">
            <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
              <ShieldCheck className="h-4 w-4 text-cyan-400" />
              Underwriter: {valuation.firm_name}
            </span>
            <span className="text-slate-500">Lead Partner: {valuation.investor_name}</span>
          </div>
          <p className="text-slate-300 italic leading-relaxed border-l-2 border-cyan-500/60 pl-3 py-1">
            &ldquo;{valuation.thesis}&rdquo;
          </p>
        </div>

        {/* Term Sheet Highlights */}
        <div className="space-y-2 text-xs">
          <div className="font-mono text-slate-400 uppercase text-[11px] flex items-center gap-1">
            <FileCheck className="h-3.5 w-3.5 text-emerald-400" />
            Term Sheet Covenants
          </div>
          <ul className="space-y-1.5 bg-slate-900/60 border border-slate-800 rounded-lg p-3">
            {valuation.term_sheet_notes.map((note, idx) => (
              <li key={idx} className="flex items-start gap-2 text-slate-300">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Button */}
        <DialogFooter>
          <Button
            size="lg"
            variant="cyan"
            onClick={onProceedToChiefSelection}
            className="w-full sm:w-auto gap-2 font-bold tracking-wide"
          >
            <span>Accept Capital & Recruit Chief of Staff</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </DialogFooter>
      </div>
    </Dialog>
  );
}
