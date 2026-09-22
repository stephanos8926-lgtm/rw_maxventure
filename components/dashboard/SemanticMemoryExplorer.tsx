// File: components/dashboard/SemanticMemoryExplorer.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { SemanticMemoryEntry, EnterpriseState } from "@/types/enterprise";
import {
  Database,
  Search,
  Sparkles,
  PlusCircle,
  Clock,
  Layers,
  CheckCircle2,
  Trash2,
  Brain,
  Filter,
  Loader2,
  Cpu
} from "lucide-react";

interface SemanticMemoryExplorerProps {
  state: EnterpriseState;
}

export function SemanticMemoryExplorer({ state }: SemanticMemoryExplorerProps) {
  const [memories, setMemories] = useState<SemanticMemoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Semantic Vector Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SemanticMemoryEntry[] | null>(null);

  // Add Memory state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState<SemanticMemoryEntry["category"]>("strategy");
  const [newImportance, setNewImportance] = useState(8);
  const [isStoring, setIsStoring] = useState(false);

  const loadMemories = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const url = categoryFilter === "all" ? "/api/enterprise/memory" : `/api/enterprise/memory?category=${categoryFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.memories) {
        setMemories(data.memories);
      }
    } catch (e) {
      console.error("Failed to load memories:", e);
    } finally {
      setIsLoading(false);
    }
  }, [categoryFilter]);

  useEffect(() => {
    let active = true;
    const url = categoryFilter === "all" ? "/api/enterprise/memory" : `/api/enterprise/memory?category=${categoryFilter}`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (!active) return;
        if (data.success && data.memories) {
          setMemories(data.memories);
        }
      })
      .catch(e => console.error("Failed to load memories:", e));

    return () => {
      active = false;
    };
  }, [categoryFilter]);

  async function handleSemanticSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim() || isSearching) return;
    setIsSearching(true);
    try {
      const res = await fetch("/api/enterprise/memory/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchQuery.trim(),
          limit: 6,
          minSimilarity: 0.05
        })
      });
      const data = await res.json();
      if (data.success && data.matches) {
        setSearchResults(data.matches);
      }
    } catch (e) {
      console.error("Semantic search failed:", e);
    } finally {
      setIsSearching(false);
    }
  }

  async function handleAddMemory(e: React.FormEvent) {
    e.preventDefault();
    if (!newContent.trim() || isStoring) return;
    setIsStoring(true);
    try {
      const res = await fetch("/api/enterprise/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newContent.trim(),
          category: newCategory,
          importance: newImportance,
          agentId: "ceo_user",
          agentName: "Executive CEO Directive"
        })
      });
      const data = await res.json();
      if (data.success && data.memory) {
        setNewContent("");
        setShowAddForm(false);
        setSearchResults(null);
        loadMemories();
      }
    } catch (e) {
      console.error("Failed to store memory:", e);
    } finally {
      setIsStoring(false);
    }
  }

  async function handleDeleteMemory(id: string) {
    try {
      await fetch(`/api/enterprise/memory?id=${id}`, { method: "DELETE" });
      setMemories(prev => prev.filter(m => m.id !== id));
      if (searchResults) {
        setSearchResults(prev => (prev ? prev.filter(m => m.id !== id) : null));
      }
    } catch (e) {
      console.error("Failed to delete memory:", e);
    }
  }

  const displayedList = searchResults !== null ? searchResults : memories;

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="rounded-xl border border-indigo-900/50 bg-gradient-to-r from-indigo-950/40 via-slate-950 to-slate-950 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400">
              <Brain className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-100 font-mono tracking-tight">
                  SQLite + Vec Semantic Memory Engine
                </h3>
                <Badge variant="cyan" className="font-mono text-[10px]">
                  1536-D Vector Space
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Episodic and long-term knowledge repository powered by vector embeddings. Agents query this database to ground their strategic decisions and technical patterns.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddForm(!showAddForm)}
              className="gap-1.5 text-xs font-mono border-indigo-800 hover:border-indigo-500 cursor-pointer"
            >
              <PlusCircle className="h-3.5 w-3.5 text-indigo-400" />
              <span>{showAddForm ? "Cancel Directive" : "Inject Memory"}</span>
            </Button>
          </div>
        </div>

        {/* Semantic Vector Search Bar */}
        <form onSubmit={handleSemanticSearch} className="mt-4 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search memories with natural language (e.g. 'unit economics runway' or 'workspace architecture')..."
              className="pl-9 text-xs bg-slate-900/90 border-slate-800 text-slate-100"
            />
          </div>
          <Button
            type="submit"
            variant="cyan"
            size="sm"
            disabled={isSearching || !searchQuery.trim()}
            className="gap-1.5 text-xs font-mono px-4 cursor-pointer"
          >
            {isSearching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            <span>Vector Recall</span>
          </Button>
          {searchResults !== null && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchResults(null);
                setSearchQuery("");
              }}
              className="text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              Reset
            </Button>
          )}
        </form>
      </div>

      {/* Manual Memory Injection Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddMemory}
          className="rounded-xl border border-indigo-700/60 bg-slate-950 p-4 space-y-3 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-mono font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              Inject Permanent Enterprise Fact or Directive
            </span>
            <span className="text-[11px] text-slate-400">
              Vector embedding will be calculated and persisted to SQLite table
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase text-slate-400">
              Memory Content
            </label>
            <Textarea
              rows={3}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="e.g. Core Rule: Every agent task must verify against the isolated workspace directory boundary."
              className="text-xs font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase text-slate-400">
                Category
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as SemanticMemoryEntry["category"])}
                className="w-full h-8 rounded-md bg-slate-900 border border-slate-800 px-2.5 text-xs text-slate-200 font-mono"
              >
                <option value="strategy">Strategy</option>
                <option value="code_pattern">Code Pattern</option>
                <option value="factual">Factual Specification</option>
                <option value="observation">Market Observation</option>
                <option value="reflection">Agent Reflection</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase text-slate-400">
                Importance Rating (1-10)
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={newImportance}
                onChange={(e) => setNewImportance(parseInt(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer mt-2"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>Low (1)</span>
                <span className="text-indigo-400 font-bold">{newImportance}</span>
                <span>Critical (10)</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAddForm(false)}
              className="text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="cyan"
              size="sm"
              disabled={isStoring || !newContent.trim()}
              className="gap-1.5 text-xs font-bold cursor-pointer"
            >
              {isStoring ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              <span>Compute Vector & Store</span>
            </Button>
          </div>
        </form>
      )}

      {/* Filter Chips & Count */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1 text-xs">
          {[
            { id: "all", label: "All Memories" },
            { id: "strategy", label: "Strategy" },
            { id: "code_pattern", label: "Code Patterns" },
            { id: "factual", label: "Factual Specs" },
            { id: "observation", label: "Observations" },
            { id: "reflection", label: "Reflections" }
          ].map(c => (
            <button
              key={c.id}
              onClick={() => {
                setCategoryFilter(c.id);
                setSearchResults(null);
              }}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                categoryFilter === c.id && searchResults === null
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
          {searchResults !== null && (
            <Badge variant="cyan" className="font-mono text-[10px]">
              {searchResults.length} Vector Match{searchResults.length === 1 ? "" : "es"}
            </Badge>
          )}
          <span>Total Records: <strong className="text-slate-200">{memories.length}</strong></span>
        </div>
      </div>

      {/* Memory Cards Grid */}
      {isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center text-slate-500 space-y-2">
          <Loader2 className="h-7 w-7 animate-spin text-indigo-400" />
          <p className="text-xs">Querying SQLite+Vec table...</p>
        </div>
      ) : displayedList.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-12 text-center text-slate-500">
          <Database className="h-8 w-8 mx-auto text-slate-600 mb-2" />
          <p className="text-xs">No memories found matching current search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {displayedList.map((mem) => {
            const isSearchResult = typeof mem.similarity === "number";
            return (
              <div
                key={mem.id}
                className={`rounded-xl border p-4 space-y-2.5 transition-all text-xs flex flex-col justify-between ${
                  isSearchResult
                    ? "bg-indigo-950/20 border-indigo-500/50 shadow-lg shadow-indigo-950/20"
                    : "bg-slate-950/80 border-slate-800"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          mem.category === "strategy"
                            ? "cyan"
                            : mem.category === "code_pattern"
                            ? "default"
                            : "outline"
                        }
                        className="font-mono text-[10px] uppercase"
                      >
                        {mem.category}
                      </Badge>
                      <span className="font-semibold text-slate-300 font-mono text-[11px]">
                        {mem.agentName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isSearchResult && (
                        <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono font-bold text-[10px] border border-indigo-500/30">
                          {Math.round((mem.similarity || 0) * 100)}% match
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-slate-500">
                        Imp: {mem.importance}/10
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <p className="text-slate-200 leading-relaxed font-sans text-xs">
                    {mem.content}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(mem.createdAt).toLocaleTimeString()}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDeleteMemory(mem.id)}
                      className="text-slate-600 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Delete Memory"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
