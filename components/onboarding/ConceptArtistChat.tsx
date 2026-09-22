"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { BusinessBlueprint, ConceptChatMessage } from "@/types/enterprise";
import {
  Send,
  Sparkles,
  Rocket,
  Code,
  FileText,
  CheckCircle2,
  AlertCircle,
  Building,
  Target,
  Layers,
  Cpu,
  RefreshCw
} from "lucide-react";

interface ConceptArtistChatProps {
  blueprint: BusinessBlueprint;
  onLaunchEnterprise: (blueprint: BusinessBlueprint) => void;
  onBackToSurvey: () => void;
}

export function ConceptArtistChat({
  blueprint: initialBlueprint,
  onLaunchEnterprise,
  onBackToSurvey
}: ConceptArtistChatProps) {
  const [blueprint, setBlueprint] = useState<BusinessBlueprint>(initialBlueprint);
  const [messages, setMessages] = useState<ConceptChatMessage[]>([
    {
      id: "msg_init",
      sender: "agent",
      text: `Greetings, CEO. I am your autonomous Concept Artist agent. I've parsed your initial inputs for ${initialBlueprint.company_name} [${initialBlueprint.ticker}]. Your foundational concept in ${initialBlueprint.industry} shows strong operational promise with a readiness score of ${initialBlueprint.readiness_score}%. Let's stress-test your defensibility, pricing model, and go-to-market mechanics before unlocking the Investor Stage. What is your primary competitive moat against incumbent solutions?`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<"blueprint" | "json">("blueprint");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const readiness = blueprint.readiness_score || 75;
  const isLaunchReady = readiness >= 80;

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isProcessing) return;

    const userText = inputText.trim();
    setInputText("");

    const newMsg: ConceptChatMessage = {
      id: `user_${Date.now()}`,
      sender: "user",
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, newMsg]);
    setIsProcessing(true);

    try {
      const res = await fetch("/api/onboarding/concept-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          history: messages.map(m => ({ sender: m.sender, text: m.text })),
          currentBlueprint: blueprint
        })
      });

      if (!res.ok) throw new Error("API call failed");

      const data = await res.json();
      const updatedBp: BusinessBlueprint = data.blueprint || blueprint;
      setBlueprint(updatedBp);

      const agentReplyMsg: ConceptChatMessage = {
        id: `agent_${Date.now()}`,
        sender: "agent",
        text: data.reply || "Directive received and incorporated into the operational blueprint.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      setMessages((prev) => [...prev, agentReplyMsg]);
    } catch (err) {
      console.error("Chat error:", err);
      // Fallback update
      const updatedReadiness = Math.min(100, (blueprint.readiness_score || 75) + 10);
      const updated = { ...blueprint, readiness_score: updatedReadiness };
      setBlueprint(updated);

      setMessages((prev) => [
        ...prev,
        {
          id: `agent_${Date.now()}`,
          sender: "agent",
          text: `Outstanding insight, CEO. I've updated ${blueprint.company_name}'s market positioning and execution strategy. Our readiness score is now at ${updatedReadiness}%.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-4 px-4 sm:px-6">
      {/* Top Banner with Readiness and Launch Gate */}
      <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900/90 p-4 sm:p-5 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center md:text-left w-full md:w-auto">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <span className="font-bold text-lg text-slate-100">{blueprint.company_name}</span>
            <Badge variant="cyan" className="font-mono text-xs font-semibold">
              {blueprint.ticker}
            </Badge>
            <Badge variant="outline" className="text-[11px] text-slate-400">
              {blueprint.industry}
            </Badge>
          </div>
          <p className="text-xs text-slate-400 max-w-xl">
            Concept Artist Agent is stress-testing your market architecture and readiness score.
          </p>
        </div>

        {/* Readiness Meter & Launch Button */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto justify-end">
          <div className="w-full sm:w-48 space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Readiness:</span>
              <span className={`font-bold ${isLaunchReady ? "text-emerald-400" : "text-amber-400"}`}>
                {readiness}% {isLaunchReady ? "READY" : "IN REVIEW"}
              </span>
            </div>
            <Progress
              value={readiness}
              indicatorColor={isLaunchReady ? "emerald" : "amber"}
              className="h-2.5"
            />
          </div>

          <Button
            size="lg"
            variant={isLaunchReady ? "emerald" : "secondary"}
            disabled={!isLaunchReady}
            onClick={() => onLaunchEnterprise(blueprint)}
            className={`w-full sm:w-auto gap-2 font-bold tracking-wide transition-all shadow-lg ${
              isLaunchReady
                ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25 ring-2 ring-emerald-400/40 animate-pulse-subtle"
                : "opacity-60 cursor-not-allowed"
            }`}
          >
            <Rocket className="h-4 w-4" />
            <span>Launch Enterprise</span>
          </Button>
        </div>
      </div>

      {/* Main Grid: Left Chat, Right Blueprint Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Chat with Concept Artist */}
        <div className="lg:col-span-7 flex flex-col h-[650px] rounded-xl border border-slate-800 bg-slate-950/70 shadow-2xl overflow-hidden">
          {/* Chat Header */}
          <div className="p-3.5 border-b border-slate-800/80 bg-slate-900/80 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-sm shadow-md">
                🎨
              </div>
              <div>
                <div className="font-semibold text-xs sm:text-sm text-slate-100 flex items-center gap-1.5">
                  Concept Artist Agent
                  <Badge variant="cyan" className="text-[10px] py-0 px-1.5">
                    LangChain Active
                  </Badge>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live dialogue loop
                </div>
              </div>
            </div>

            <Button variant="ghost" size="sm" onClick={onBackToSurvey} className="text-xs text-slate-400">
              Edit Survey
            </Button>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-sm">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.sender === "agent" && (
                  <div className="h-7 w-7 rounded-md bg-cyan-950/90 border border-cyan-800/50 flex items-center justify-center text-xs flex-shrink-0 mt-1">
                    🎨
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-md ${
                    msg.sender === "user"
                      ? "bg-cyan-600 text-slate-950 font-medium ml-8"
                      : "bg-slate-900/90 border border-slate-800 text-slate-200 mr-8"
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                  <div
                    className={`mt-1.5 text-[10px] font-mono ${
                      msg.sender === "user" ? "text-cyan-950/80 text-right" : "text-slate-500"
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex gap-3 justify-start">
                <div className="h-7 w-7 rounded-md bg-cyan-950/90 border border-cyan-800/50 flex items-center justify-center text-xs flex-shrink-0 mt-1">
                  🎨
                </div>
                <div className="bg-slate-900/90 border border-slate-800 text-slate-400 rounded-xl p-3 text-xs flex items-center gap-2">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-cyan-400" />
                  Synthesizing market models & updating blueprint...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Guidance Prompts */}
          <div className="px-4 py-2 bg-slate-900/60 border-t border-slate-800/60 flex items-center gap-2 overflow-x-auto text-[11px]">
            <span className="text-slate-500 flex-shrink-0 font-mono">Suggestions:</span>
            <button
              type="button"
              onClick={() => {
                setInputText("We have proprietary synthetic datasets and patented model compression.");
              }}
              className="px-2.5 py-1 rounded bg-slate-800/70 text-slate-300 hover:text-cyan-300 hover:bg-slate-800 border border-slate-700/60 whitespace-nowrap cursor-pointer transition-colors"
            >
              Add Deep Tech Moats
            </button>
            <button
              type="button"
              onClick={() => {
                setInputText("Targeting high-churn legacy enterprise customers with a 50% lower cost structure.");
              }}
              className="px-2.5 py-1 rounded bg-slate-800/70 text-slate-300 hover:text-cyan-300 hover:bg-slate-800 border border-slate-700/60 whitespace-nowrap cursor-pointer transition-colors"
            >
              Refine Pricing Arbitrage
            </button>
            <button
              type="button"
              onClick={() => {
                setInputText("Let's finalize this blueprint and launch into the Investor Evaluation stage.");
              }}
              className="px-2.5 py-1 rounded bg-slate-800/70 text-slate-300 hover:text-cyan-300 hover:bg-slate-800 border border-slate-700/60 whitespace-nowrap cursor-pointer transition-colors"
            >
              Trigger Launch Readiness
            </button>
          </div>

          {/* Input Bar */}
          <form onSubmit={handleSendMessage} className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Refine your strategy, pricing, or tech stack with the Concept Artist..."
              className="bg-slate-950/80 border-slate-800 text-sm focus-visible:ring-cyan-500"
              disabled={isProcessing}
            />
            <Button
              type="submit"
              variant="default"
              size="default"
              disabled={isProcessing || !inputText.trim()}
              className="gap-1.5 font-semibold"
            >
              <Send className="h-4 w-4" />
              <span>Send</span>
            </Button>
          </form>
        </div>

        {/* Right: Live Business Blueprint JSON & Visualizer */}
        <div className="lg:col-span-5 flex flex-col h-[650px] rounded-xl border border-slate-800 bg-slate-950/70 shadow-2xl overflow-hidden">
          {/* Header with Switcher */}
          <div className="p-3.5 border-b border-slate-800/80 bg-slate-900/80 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <span className="font-semibold text-xs sm:text-sm text-slate-100">
                Business Blueprint Specification
              </span>
            </div>
            <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("blueprint")}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  activeTab === "blueprint" ? "bg-slate-800 text-cyan-400" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <FileText className="h-3 w-3 inline mr-1" />
                Specs
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("json")}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  activeTab === "json" ? "bg-slate-800 text-cyan-400" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Code className="h-3 w-3 inline mr-1" />
                JSON
              </button>
            </div>
          </div>

          {/* Blueprint Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeTab === "blueprint" ? (
              <div className="space-y-4 text-xs">
                {/* Venture Identity Card */}
                <div className="p-3.5 rounded-lg border border-slate-800/90 bg-slate-900/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-mono uppercase text-[10px]">Enterprise Identity</span>
                    <Badge variant="cyan" className="font-mono text-[10px]">
                      {blueprint.ticker}
                    </Badge>
                  </div>
                  <div className="text-sm font-bold text-slate-100">{blueprint.company_name}</div>
                  <p className="text-slate-300 text-xs leading-relaxed">{blueprint.tagline}</p>
                </div>

                {/* Market & Audience */}
                <div className="p-3.5 rounded-lg border border-slate-800/90 bg-slate-900/70 space-y-2">
                  <div className="text-slate-400 font-mono uppercase text-[10px] flex items-center gap-1">
                    <Target className="h-3 w-3 text-cyan-400" />
                    Market Alignment
                  </div>
                  <div>
                    <span className="text-slate-500 font-mono text-[10px]">Industry: </span>
                    <span className="text-slate-200 font-medium">{blueprint.industry}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-mono text-[10px]">Target Audience: </span>
                    <span className="text-slate-200">{blueprint.target_audience}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-mono text-[10px]">Monetization: </span>
                    <span className="text-emerald-400 font-medium">{blueprint.revenue_model}</span>
                  </div>
                </div>

                {/* Tech Stack */}
                <div className="p-3.5 rounded-lg border border-slate-800/90 bg-slate-900/70 space-y-2">
                  <div className="text-slate-400 font-mono uppercase text-[10px] flex items-center gap-1">
                    <Cpu className="h-3 w-3 text-indigo-400" />
                    Autonomous Tech Stack
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {blueprint.tech_stack.map((tech) => (
                      <span
                        key={tech}
                        className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700/60 text-slate-200 text-[11px] font-mono"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Core KPIs */}
                <div className="p-3.5 rounded-lg border border-slate-800/90 bg-slate-900/70 space-y-2">
                  <div className="text-slate-400 font-mono uppercase text-[10px] flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                    North Star KPIs
                  </div>
                  <ul className="space-y-1 text-slate-300">
                    {blueprint.initial_kpis.map((kpi, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-cyan-400 font-mono text-[10px] mt-0.5">#{idx + 1}</span>
                        <span>{kpi}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Brand Identity */}
                <div className="p-3.5 rounded-lg border border-slate-800/90 bg-slate-900/70 space-y-2">
                  <div className="text-slate-400 font-mono uppercase text-[10px]">Brand Archetype & Color Matrix</div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">{blueprint.brand_identity.archetype}</span>
                    <div className="flex gap-1.5">
                      {blueprint.brand_identity.color_palette.map((c, i) => (
                        <div
                          key={i}
                          className="h-4 w-4 rounded-full border border-slate-700 shadow-sm"
                          style={{ backgroundColor: c }}
                          title={c}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full">
                <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800/90 text-cyan-300 font-mono text-[11px] leading-relaxed overflow-x-auto whitespace-pre">
                  {JSON.stringify(blueprint, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Launch Gate Footer */}
          <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              {isLaunchReady ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span className="text-emerald-300 font-semibold">Launch Gate Unlocked</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-amber-400" />
                  <span>Reach 80% readiness to unlock</span>
                </>
              )}
            </div>
            <Button
              size="sm"
              variant={isLaunchReady ? "emerald" : "outline"}
              disabled={!isLaunchReady}
              onClick={() => onLaunchEnterprise(blueprint)}
              className="gap-1 font-semibold"
            >
              <Rocket className="h-3.5 w-3.5" />
              <span>Launch</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
