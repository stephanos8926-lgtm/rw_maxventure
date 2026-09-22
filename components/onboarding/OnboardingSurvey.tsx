"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { BusinessBlueprint } from "@/types/enterprise";
import { Sparkles, ArrowRight, Zap, Target, DollarSign, Eye } from "lucide-react";

interface OnboardingSurveyProps {
  initialBlueprint: BusinessBlueprint;
  onCompleteSurvey: (blueprint: BusinessBlueprint) => void;
}

const PRESET_VENTURES = [
  {
    name: "AetherOps AI",
    ticker: "ATHR",
    tagline: "Autonomous Agent Orchestration & Self-Healing Cloud Systems",
    industry: "Autonomous Cloud Infrastructure & AI DevTools",
    target_audience: "Enterprise SRE Teams, DevOps Architects, and AI Labs",
    revenue_model: "Per-Node Compute Arbitrage + Tiered Autonomous Workload Licensing",
    vision: "Build the self-operating enterprise where autonomous AI agents run, optimize, and heal cloud infra with zero human downtime.",
    core_value_prop: "Deterministic multi-agent runtime delivering 10x developer velocity with real-time financial telemetry.",
    archetype: "The Master Architect",
    tone: "Hyper-Precise, Cybernetic, Authoritative",
    colors: ["#090D16", "#06B6D4", "#10B981", "#6366F1"],
    kpis: ["Sub-150ms cross-agent coordination latency", "99.95% verified self-healing task execution", "$1.2M pilot enterprise commitments"],
    gtm: "Open-source developer runtime protocol to capture developer mindshare, combined with enterprise HITL governance licensing."
  },
  {
    name: "SentinelZero",
    ticker: "SNTZ",
    tagline: "Autonomous Red-Team & Zero-Day Threat Mitigation Swarm",
    industry: "Cybersecurity & Autonomous Defense",
    target_audience: "Chief Information Security Officers & Financial Institutions",
    revenue_model: "High-Margin Continuous Penetration Retainers ($120K/yr base)",
    vision: "Counter weaponized adversarial AI with 24/7 self-evolving defensive agent swarms that patch vulnerabilities in memory.",
    core_value_prop: "Real-time threat neutralizer operating at silicon speeds before human analysts can triage alerts.",
    archetype: "The Guardian Protector",
    tone: "Vigilant, Impenetrable, Military-Grade",
    colors: ["#080C14", "#EF4444", "#3B82F6", "#E2E8F0"],
    kpis: ["0-day patch synthesis in under 4 minutes", "Zero false-positive critical halts", "$2.5M pipeline in FinTech and Defense"],
    gtm: "Free confidential zero-day attack vulnerability assessment audit followed by enterprise agent swarm subscription."
  },
  {
    name: "OmniFlow Media",
    ticker: "OMNI",
    tagline: "Autonomous Synthetic Cinematic Production Studio",
    industry: "Generative Media & Entertainment",
    target_audience: "Global Advertising Agencies, Streaming Networks & Game Studios",
    revenue_model: "Volume Render Credits + IP Royalties & Exclusive Syndication",
    vision: "Enable a single creative director to produce Hollywood-caliber episodic television and interactive video games with AI agents.",
    core_value_prop: "Full multi-agent creative pipeline: scriptwriting, 3D world gen, character voice synthesis, and dynamic scoring.",
    archetype: "The Visionary Magician",
    tone: "Imaginative, Cinematic, Trendsetting",
    colors: ["#0B0F19", "#A855F7", "#EC4899", "#38BDF8"],
    kpis: ["30-second photorealistic render in <12 minutes", "Multi-modal consistency score >98%", "$800K contracted brand activations"],
    gtm: "Viral showcase drops of AI-generated short films leading to brand partner enterprise creative deals."
  }
];

export function OnboardingSurvey({ initialBlueprint, onCompleteSurvey }: OnboardingSurveyProps) {
  const [formData, setFormData] = useState({
    company_name: initialBlueprint.company_name || "AetherOps AI",
    ticker: initialBlueprint.ticker || "ATHR",
    industry: initialBlueprint.industry || "Autonomous Cloud Infrastructure & AI DevTools",
    target_audience: initialBlueprint.target_audience || "Enterprise SRE Teams, DevOps Architects, and AI Labs",
    revenue_model: initialBlueprint.revenue_model || "Per-Node Compute Arbitrage + Tiered Autonomous Workload Licensing",
    vision: initialBlueprint.vision || "Build the self-operating enterprise where autonomous AI agents run, optimize, and heal cloud infra with zero human downtime.",
    core_value_prop: initialBlueprint.core_value_prop || "Deterministic multi-agent runtime delivering 10x developer velocity with real-time financial telemetry."
  });

  const applyPreset = (preset: typeof PRESET_VENTURES[0]) => {
    setFormData({
      company_name: preset.name,
      ticker: preset.ticker,
      industry: preset.industry,
      target_audience: preset.target_audience,
      revenue_model: preset.revenue_model,
      vision: preset.vision,
      core_value_prop: preset.core_value_prop
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: BusinessBlueprint = {
      ...initialBlueprint,
      company_name: formData.company_name.trim() || "Enterprise One",
      ticker: formData.ticker.trim() || "ENT1",
      industry: formData.industry,
      target_audience: formData.target_audience,
      revenue_model: formData.revenue_model,
      vision: formData.vision,
      core_value_prop: formData.core_value_prop,
      readiness_score: Math.max(70, initialBlueprint.readiness_score || 70)
    };
    onCompleteSurvey(updated);
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-6 px-4">
      {/* Hero Heading */}
      <div className="text-center mb-8 space-y-2">
        <Badge variant="cyan" className="font-mono text-xs px-3 py-1">
          PHASE 1: VENTURE BOOTSTRAP
        </Badge>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-100">
          Act as CEO. Bootstrap Your Virtual Enterprise.
        </h1>
        <p className="text-slate-400 text-sm max-w-2xl mx-auto leading-relaxed">
          Define your venture parameters. The autonomous multi-agent system will analyze your concept,
          generate a structured Business Blueprint, and orchestrate investor capital.
        </p>
      </div>

      {/* Quick Presets */}
      <div className="mb-8">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5 font-mono">
          <Zap className="h-3.5 w-3.5 text-cyan-400" />
          Quick Blueprint Archetypes (Click to load)
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PRESET_VENTURES.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => applyPreset(p)}
              className="text-left p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-cyan-500/50 hover:bg-slate-800/60 transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm text-slate-200 group-hover:text-cyan-300">
                  {p.name}
                </span>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
                  {p.ticker}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                {p.tagline}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Survey Form */}
      <form onSubmit={handleSubmit}>
        <Card className="border-slate-800 bg-slate-900/90 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-base text-slate-100 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              Enterprise Foundation Parameters
            </CardTitle>
            <CardDescription>
              Configure basic market boundaries. You will refine and stress-test these with the Concept Artist agent.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Company Name & Ticker */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Company Name</label>
                <Input
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  placeholder="e.g. AetherOps AI"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Ticker Symbol</label>
                <Input
                  value={formData.ticker}
                  onChange={(e) => setFormData({ ...formData, ticker: e.target.value.toUpperCase() })}
                  placeholder="e.g. ATHR"
                  maxLength={5}
                  required
                />
              </div>
            </div>

            {/* Industry */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-cyan-400" />
                Industry & Market Sector
              </label>
              <Input
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                placeholder="e.g. Autonomous Cloud Infrastructure & AI DevTools"
                required
              />
            </div>

            {/* Target Audience */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Target Audience / Buyers</label>
              <Input
                value={formData.target_audience}
                onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                placeholder="e.g. Enterprise SRE Teams, DevOps Architects & AI Labs"
                required
              />
            </div>

            {/* Revenue Model */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
                Revenue & Monetization Model
              </label>
              <Input
                value={formData.revenue_model}
                onChange={(e) => setFormData({ ...formData, revenue_model: e.target.value })}
                placeholder="e.g. Usage-Based Compute + High-Yield Enterprise Licensing"
                required
              />
            </div>

            {/* Vision */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-indigo-400" />
                Enterprise Vision & Endgame
              </label>
              <Textarea
                rows={2}
                value={formData.vision}
                onChange={(e) => setFormData({ ...formData, vision: e.target.value })}
                placeholder="Describe what your venture looks like when fully scaled..."
                required
              />
            </div>

            {/* Core Value Prop */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Core Value Proposition / Defensible Moat</label>
              <Input
                value={formData.core_value_prop}
                onChange={(e) => setFormData({ ...formData, core_value_prop: e.target.value })}
                placeholder="Why do customers choose you over legacy competitors?"
                required
              />
            </div>
          </CardContent>

          <CardFooter className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-mono">
              Ready to feed to Concept Artist agent
            </span>
            <Button type="submit" variant="default" className="gap-2">
              <span>Engage Concept Artist</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
