// File: components/dashboard/SystemSettingsModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Sheet, SheetHeader, SheetTitle, SheetDescription, SheetContent } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { EnterpriseState, EnterpriseSystemSettings } from "@/types/enterprise";
import {
  Cpu,
  Database,
  FolderCode,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Eye,
  EyeOff,
  Coins,
  Send,
  Zap,
  HardDrive
} from "lucide-react";

interface SystemSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: EnterpriseState;
  onExecuteCeoAction: (action: string, payload: Record<string, unknown>) => Promise<void>;
  onSettingsSaved?: (newSettings: EnterpriseSystemSettings) => void;
}

export function SystemSettingsModal({
  isOpen,
  onClose,
  state,
  onExecuteCeoAction,
  onSettingsSaved
}: SystemSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"llm" | "embedding" | "workspace" | "governance">("llm");
  const [settings, setSettings] = useState<EnterpriseSystemSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showLlmKey, setShowLlmKey] = useState(false);
  const [showEmbKey, setShowEmbKey] = useState(false);

  // Testing status
  const [testingLlm, setTestingLlm] = useState(false);
  const [llmTestResult, setLlmTestResult] = useState<{ success: boolean; message: string; latencyMs?: number } | null>(null);

  const [testingEmb, setTestingEmb] = useState(false);
  const [embTestResult, setEmbTestResult] = useState<{ success: boolean; message: string; latencyMs?: number; dimensions?: number } | null>(null);

  // Quick Directive Text
  const [ceoDirectiveText, setCeoDirectiveText] = useState("");
  const [isSubmittingDirective, setIsSubmittingDirective] = useState(false);

  // Load active settings from API when modal opens
  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    fetch("/api/enterprise/config")
      .then(res => res.json())
      .then(data => {
        if (!active) return;
        if (data.success && data.settings) {
          setSettings(data.settings);
        } else if (state.settings) {
          setSettings(state.settings);
        }
      })
      .catch(() => {
        if (active && state.settings) {
          setSettings(state.settings);
        }
      });

    return () => {
      active = false;
    };
  }, [isOpen, state.settings]);

  // Presets
  const applyPreset = (preset: string) => {
    if (!settings) return;
    switch (preset) {
      case "ollama":
        setSettings({
          ...settings,
          llm: {
            ...settings.llm,
            provider: "ollama",
            baseUrl: "http://localhost:11434/v1",
            model: "llama3.2:latest",
            apiKey: ""
          },
          embedding: {
            ...settings.embedding,
            provider: "ollama",
            baseUrl: "http://localhost:11434/v1",
            model: "nomic-embed-text",
            apiKey: "",
            dimensions: 768
          }
        });
        break;
      case "lmstudio":
        setSettings({
          ...settings,
          llm: {
            ...settings.llm,
            provider: "openai_compatible",
            baseUrl: "http://localhost:1234/v1",
            model: "local-model",
            apiKey: ""
          }
        });
        break;
      case "openrouter":
        setSettings({
          ...settings,
          llm: {
            ...settings.llm,
            provider: "openrouter",
            baseUrl: "https://openrouter.ai/api/v1",
            model: "meta-llama/llama-3.3-70b-instruct"
          }
        });
        break;
      case "openai":
        setSettings({
          ...settings,
          llm: {
            ...settings.llm,
            provider: "openai_compatible",
            baseUrl: "https://api.openai.com/v1",
            model: "gpt-4o"
          },
          embedding: {
            ...settings.embedding,
            provider: "openai_compatible",
            baseUrl: "https://api.openai.com/v1",
            model: "text-embedding-3-small",
            dimensions: 1536
          }
        });
        break;
      case "gemini":
        setSettings({
          ...settings,
          llm: {
            ...settings.llm,
            provider: "gemini",
            baseUrl: "https://generativelanguage.googleapis.com/v1beta",
            model: "gemini-2.5-flash"
          }
        });
        break;
    }
  };

  async function handleTestLlm() {
    if (!settings) return;
    setTestingLlm(true);
    setLlmTestResult(null);
    try {
      const res = await fetch("/api/enterprise/config/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "llm", config: settings.llm })
      });
      const data = await res.json();
      if (data.result) {
        setLlmTestResult(data.result);
      } else {
        setLlmTestResult({ success: false, message: data.error || "Connection failed" });
      }
    } catch (e: unknown) {
      setLlmTestResult({ success: false, message: e instanceof Error ? e.message : "Network error" });
    } finally {
      setTestingLlm(false);
    }
  }

  async function handleTestEmbedding() {
    if (!settings) return;
    setTestingEmb(true);
    setEmbTestResult(null);
    try {
      const res = await fetch("/api/enterprise/config/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "embedding", config: settings.embedding })
      });
      const data = await res.json();
      if (data.result) {
        setEmbTestResult(data.result);
      } else {
        setEmbTestResult({ success: false, message: data.error || "Connection failed" });
      }
    } catch (e: unknown) {
      setEmbTestResult({ success: false, message: e instanceof Error ? e.message : "Network error" });
    } finally {
      setTestingEmb(false);
    }
  }

  async function handleSaveSettings() {
    if (!settings) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/enterprise/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (data.success) {
        if (onSettingsSaved) onSettingsSaved(data.settings);
        onClose();
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setIsSaving(false);
    }
  }

  const handleSendCeoDirective = async () => {
    if (!ceoDirectiveText.trim() || isSubmittingDirective) return;
    setIsSubmittingDirective(true);
    try {
      await onExecuteCeoAction("issue_directive", { directive: ceoDirectiveText.trim() });
      setCeoDirectiveText("");
      onClose();
    } finally {
      setIsSubmittingDirective(false);
    }
  };

  return (
    <Sheet open={isOpen} onClose={onClose}>
      <SheetHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-800 text-cyan-400">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <SheetTitle>Enterprise System Configuration</SheetTitle>
              <SheetDescription>
                OpenAI-compatible LLM endpoints, vector embeddings, isolated workspace, and HITL governance.
              </SheetDescription>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 mt-4 gap-1">
          <button
            onClick={() => setActiveTab("llm")}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === "llm"
                ? "border-cyan-400 text-cyan-300 font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Cpu className="h-3.5 w-3.5" />
            <span>LLM Endpoint</span>
          </button>

          <button
            onClick={() => setActiveTab("embedding")}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === "embedding"
                ? "border-cyan-400 text-cyan-300 font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Database className="h-3.5 w-3.5" />
            <span>Embeddings & Vector</span>
          </button>

          <button
            onClick={() => setActiveTab("workspace")}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === "workspace"
                ? "border-cyan-400 text-cyan-300 font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <FolderCode className="h-3.5 w-3.5" />
            <span>Agent Workspace</span>
          </button>

          <button
            onClick={() => setActiveTab("governance")}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === "governance"
                ? "border-cyan-400 text-cyan-300 font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Coins className="h-3.5 w-3.5" />
            <span>HITL & Capital</span>
          </button>
        </div>
      </SheetHeader>

      <SheetContent>
        {isLoading || !settings ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-3">
            <Loader2 className="h-7 w-7 animate-spin text-cyan-400" />
            <p className="text-xs">Loading active enterprise runtime parameters...</p>
          </div>
        ) : (
          <div className="space-y-5 text-xs py-2">
            {/* 1. LLM ENDPOINT TAB */}
            {activeTab === "llm" && (
              <div className="space-y-4">
                {/* Presets Bar */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                    Quick Provider Preset
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: "ollama", label: "Local Ollama" },
                      { id: "lmstudio", label: "LM Studio" },
                      { id: "openrouter", label: "OpenRouter" },
                      { id: "openai", label: "OpenAI API" },
                      { id: "gemini", label: "Google Gemini" }
                    ].map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => applyPreset(p.id)}
                        className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 hover:border-cyan-500/50 hover:bg-cyan-950/20 text-slate-300 hover:text-cyan-300 text-[11px] font-mono transition-colors cursor-pointer"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Base URL */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="font-semibold text-slate-200 font-mono uppercase text-[11px]">
                      OpenAI-Compatible Base URL
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">Appends /chat/completions</span>
                  </div>
                  <Input
                    value={settings.llm.baseUrl}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        llm: { ...settings.llm, baseUrl: e.target.value }
                      })
                    }
                    placeholder="https://api.openai.com/v1 or http://localhost:11434/v1"
                    className="font-mono text-xs"
                  />
                </div>

                {/* API Key */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="font-semibold text-slate-200 font-mono uppercase text-[11px]">
                      API Key / Auth Bearer Token
                    </label>
                    <span className="text-[10px] text-slate-400">Optional for local Ollama / LM Studio</span>
                  </div>
                  <div className="relative">
                    <Input
                      type={showLlmKey ? "text" : "password"}
                      value={settings.llm.apiKey}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          llm: { ...settings.llm, apiKey: e.target.value }
                        })
                      }
                      placeholder="sk-..."
                      className="font-mono text-xs pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLlmKey(!showLlmKey)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {showLlmKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Model Name */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-200 font-mono uppercase text-[11px]">
                    Model Identifier
                  </label>
                  <Input
                    value={settings.llm.model}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        llm: { ...settings.llm, model: e.target.value }
                      })
                    }
                    placeholder="gpt-4o, llama3.2:latest, deepseek-chat, mistral-large"
                    className="font-mono text-xs"
                  />
                </div>

                {/* Sliders: Temp & Max Tokens */}
                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="space-y-1">
                    <div className="flex justify-between font-mono text-[11px]">
                      <span className="text-slate-400">Temperature:</span>
                      <span className="text-cyan-400 font-bold">{settings.llm.temperature}</span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="1.5"
                      step="0.05"
                      value={settings.llm.temperature}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          llm: { ...settings.llm, temperature: parseFloat(e.target.value) }
                        })
                      }
                      className="w-full accent-cyan-500 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between font-mono text-[11px]">
                      <span className="text-slate-400">Max Tokens:</span>
                      <span className="text-cyan-400 font-bold">{settings.llm.maxTokens}</span>
                    </div>
                    <input
                      type="range"
                      min="512"
                      max="8192"
                      step="256"
                      value={settings.llm.maxTokens}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          llm: { ...settings.llm, maxTokens: parseInt(e.target.value) }
                        })
                      }
                      className="w-full accent-cyan-500 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Test Connection Button */}
                <div className="pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleTestLlm}
                    disabled={testingLlm}
                    className="w-full gap-2 border-slate-700 hover:border-cyan-500 font-mono text-xs cursor-pointer"
                  >
                    {testingLlm ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5 text-cyan-400" />}
                    <span>Test LLM Endpoint Connectivity</span>
                  </Button>

                  {llmTestResult && (
                    <div
                      className={`mt-2 p-2.5 rounded-lg border text-xs flex items-start gap-2 ${
                        llmTestResult.success
                          ? "bg-emerald-950/30 border-emerald-800 text-emerald-300"
                          : "bg-rose-950/30 border-rose-800 text-rose-300"
                      }`}
                    >
                      {llmTestResult.success ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-rose-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="font-semibold font-mono">
                          {llmTestResult.success ? "Connection Verified" : "Connection Error"}
                        </div>
                        <div className="text-[11px] opacity-90 mt-0.5">{llmTestResult.message}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. EMBEDDINGS TAB */}
            {activeTab === "embedding" && (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-indigo-950/20 border border-indigo-900/40 text-slate-300">
                  <div className="flex items-center gap-2 text-indigo-400 font-semibold mb-1">
                    <Database className="h-4 w-4" />
                    <span>SQLite + Vec Semantic Embeddings</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-400">
                    Embeddings power the agents&apos; long-term episodic and semantic memory. Any OpenAI-compatible
                    <code className="text-cyan-300 mx-1">/embeddings</code> endpoint is supported (e.g. OpenAI, Ollama, LM Studio, vLLM).
                  </p>
                </div>

                {/* Embedding Base URL */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="font-semibold text-slate-200 font-mono uppercase text-[11px]">
                      Embeddings Base URL
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">Appends /embeddings</span>
                  </div>
                  <Input
                    value={settings.embedding.baseUrl}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        embedding: { ...settings.embedding, baseUrl: e.target.value }
                      })
                    }
                    placeholder="https://api.openai.com/v1 or http://localhost:11434/v1"
                    className="font-mono text-xs"
                  />
                </div>

                {/* Embedding API Key */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-200 font-mono uppercase text-[11px]">
                    API Key / Bearer Token
                  </label>
                  <div className="relative">
                    <Input
                      type={showEmbKey ? "text" : "password"}
                      value={settings.embedding.apiKey}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          embedding: { ...settings.embedding, apiKey: e.target.value }
                        })
                      }
                      placeholder="sk-..."
                      className="font-mono text-xs pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEmbKey(!showEmbKey)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {showEmbKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Model & Dimensions */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-200 font-mono uppercase text-[11px]">
                      Embedding Model
                    </label>
                    <Input
                      value={settings.embedding.model}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          embedding: { ...settings.embedding, model: e.target.value }
                        })
                      }
                      placeholder="text-embedding-3-small, nomic-embed-text"
                      className="font-mono text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-200 font-mono uppercase text-[11px]">
                      Vector Dimensions
                    </label>
                    <Input
                      type="number"
                      value={settings.embedding.dimensions}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          embedding: { ...settings.embedding, dimensions: parseInt(e.target.value) || 1536 }
                        })
                      }
                      placeholder="1536"
                      className="font-mono text-xs"
                    />
                  </div>
                </div>

                {/* Test Embeddings Button */}
                <div className="pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleTestEmbedding}
                    disabled={testingEmb}
                    className="w-full gap-2 border-slate-700 hover:border-indigo-500 font-mono text-xs cursor-pointer"
                  >
                    {testingEmb ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Database className="h-3.5 w-3.5 text-indigo-400" />}
                    <span>Verify Embeddings & Vector Space</span>
                  </Button>

                  {embTestResult && (
                    <div
                      className={`mt-2 p-2.5 rounded-lg border text-xs flex items-start gap-2 ${
                        embTestResult.success
                          ? "bg-emerald-950/30 border-emerald-800 text-emerald-300"
                          : "bg-rose-950/30 border-rose-800 text-rose-300"
                      }`}
                    >
                      {embTestResult.success ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-rose-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="font-semibold font-mono">
                          {embTestResult.success ? "Embedding Verified" : "Embedding Error"}
                        </div>
                        <div className="text-[11px] opacity-90 mt-0.5">{embTestResult.message}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. AGENT WORKSPACE TAB */}
            {activeTab === "workspace" && (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/40 text-slate-300">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1">
                    <FolderCode className="h-4 w-4" />
                    <span>Isolated Agent Sandbox Root</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-400">
                    Specialist agents execute tools (file reads, writes, code patches, directory traversal, shell commands)
                    strictly scoped within this designated workspace root.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-200 font-mono uppercase text-[11px]">
                    Workspace Relative / Absolute Path
                  </label>
                  <Input
                    value={settings.workspace.workspacePath}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        workspace: { ...settings.workspace, workspacePath: e.target.value }
                      })
                    }
                    placeholder="./agent_workspace"
                    className="font-mono text-xs"
                  />
                  <div className="text-[10px] text-slate-500 font-mono">
                    Auto-creates subdirectories: /src, /docs, /tasks, /data (SQLite vec memory)
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-200 font-mono uppercase text-[11px]">
                    Max Terminal Command Execution Timeout (ms)
                  </label>
                  <Input
                    type="number"
                    value={settings.workspace.maxTerminalTimeoutMs}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        workspace: {
                          ...settings.workspace,
                          maxTerminalTimeoutMs: parseInt(e.target.value) || 25000
                        }
                      })
                    }
                    placeholder="25000"
                    className="font-mono text-xs"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div>
                    <div className="font-semibold text-slate-200 text-xs">Strict Sandbox Enforcement</div>
                    <div className="text-[11px] text-slate-400">Block path traversal beyond workspace root</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.workspace.sandboxed}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        workspace: { ...settings.workspace, sandboxed: e.target.checked }
                      })
                    }
                    className="h-4 w-4 accent-cyan-500 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* 4. GOVERNANCE & HITL TAB */}
            {activeTab === "governance" && (
              <div className="space-y-5">
                {/* Strictness Mode */}
                <div className="space-y-2">
                  <label className="font-semibold text-slate-200 font-mono uppercase text-[11px] block">
                    HITL Governance Strictness
                  </label>
                  <Select
                    value={state.hitl_strictness}
                    onChange={(e) =>
                      onExecuteCeoAction("set_strictness", {
                        strictness: e.target.value,
                        threshold: state.hitl_cost_threshold
                      })
                    }
                  >
                    <option value="high_cost_only">Threshold Gate: Require CEO Approval for Tasks &gt; Threshold</option>
                    <option value="all">Fiduciary Micro-Management: Require CEO Approval for ALL Tasks</option>
                    <option value="auto_pilot">Full Autonomy: Auto-approve All Specialist Tasks</option>
                  </Select>
                </div>

                {/* Threshold Slider */}
                {state.hitl_strictness === "high_cost_only" && (
                  <div className="space-y-2 p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-400">Approval Cost Threshold:</span>
                      <span className="text-cyan-400 font-bold">{state.hitl_cost_threshold} $CLIP</span>
                    </div>
                    <input
                      type="range"
                      min="500"
                      max="3000"
                      step="100"
                      value={state.hitl_cost_threshold}
                      onChange={(e) =>
                        onExecuteCeoAction("set_strictness", {
                          strictness: state.hitl_strictness,
                          threshold: Number(e.target.value)
                        })
                      }
                      className="w-full accent-cyan-500 cursor-pointer"
                    />
                  </div>
                )}

                {/* Emergency Treasury Injection */}
                <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 space-y-3">
                  <div className="flex items-center gap-2 text-amber-300 font-semibold">
                    <Coins className="h-4 w-4" />
                    Emergency Capital Injection
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Grant an emergency tranche of +25,000 $CLIP to replenish treasury runway and prevent enterprise liquidation.
                  </p>
                  <Button
                    variant="cyan"
                    size="sm"
                    onClick={() => onExecuteCeoAction("inject_capital", { amount: 25000 })}
                    className="w-full font-bold cursor-pointer"
                  >
                    Inject +25,000 $CLIP
                  </Button>
                </div>

                {/* Direct Executive Order */}
                <div className="space-y-2">
                  <label className="font-semibold text-slate-200 font-mono uppercase text-[11px] block">
                    Dispatch Direct CEO Order
                  </label>
                  <Input
                    value={ceoDirectiveText}
                    onChange={(e) => setCeoDirectiveText(e.target.value)}
                    placeholder="Instruct Chief of Staff to execute immediate strategic sprint..."
                    className="text-xs"
                  />
                  <Button
                    variant="default"
                    size="sm"
                    disabled={!ceoDirectiveText.trim() || isSubmittingDirective}
                    onClick={handleSendCeoDirective}
                    className="w-full gap-1.5 font-bold cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Dispatch Directive to Chief of Staff</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Bottom Save & Close Controls */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
              <Button variant="ghost" size="sm" onClick={onClose} className="cursor-pointer">
                Cancel
              </Button>
              <Button
                variant="cyan"
                size="sm"
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="gap-2 font-bold cursor-pointer"
              >
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                <span>Save Runtime Configuration</span>
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
