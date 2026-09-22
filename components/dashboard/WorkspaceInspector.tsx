// File: components/dashboard/WorkspaceInspector.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import {
  WorkspaceFile,
  TerminalExecution,
  ToolExecution,
  EnterpriseState
} from "@/types/enterprise";
import {
  Terminal,
  FolderCode,
  FileCode,
  Play,
  RotateCw,
  Search,
  Globe,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Layers,
  Sparkles,
  Send,
  Loader2,
  Folder
} from "lucide-react";

interface WorkspaceInspectorProps {
  state: EnterpriseState;
}

export function WorkspaceInspector({ state }: WorkspaceInspectorProps) {
  const [subTab, setSubTab] = useState<"terminal" | "files" | "tool_stream" | "playground">("terminal");

  // Terminal state
  const [command, setCommand] = useState("ls -la");
  const [isExecutingCmd, setIsExecutingCmd] = useState(false);
  const [terminalHistory, setTerminalHistory] = useState<TerminalExecution[]>([]);
  const [activeOutput, setActiveOutput] = useState<TerminalExecution | null>(null);

  // Files state
  const [workspaceFiles, setWorkspaceFiles] = useState<WorkspaceFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  // Tool Stream state
  const [toolFilter, setToolFilter] = useState<string>("all");

  // Playground state
  const [playgroundTool, setPlaygroundTool] = useState<ToolExecution["toolName"]>("web_search");
  const [playgroundArgs, setPlaygroundArgs] = useState<string>(
    JSON.stringify({ query: "Autonomous AI Agent Architecture best practices", num_results: 2 }, null, 2)
  );
  const [playgroundResult, setPlaygroundResult] = useState<unknown>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleReadFile = React.useCallback(async (path: string) => {
    setSelectedFile(path);
    setIsLoadingContent(true);
    try {
      const res = await fetch(`/api/enterprise/workspace?file=${encodeURIComponent(path)}`);
      const data = await res.json();
      if (data.success && data.file) {
        setFileContent(data.file.content);
      }
    } catch (e) {
      console.error("Read file error:", e);
    } finally {
      setIsLoadingContent(false);
    }
  }, []);

  const loadTerminalHistory = React.useCallback(async () => {
    try {
      const res = await fetch("/api/enterprise/workspace/terminal");
      const data = await res.json();
      if (data.success && data.history) {
        setTerminalHistory(data.history);
        if (data.history.length > 0) {
          setActiveOutput(prev => prev || data.history[0]);
        }
      }
    } catch (e) {
      console.error("Failed to load terminal history:", e);
    }
  }, []);

  const loadWorkspaceFiles = React.useCallback(async () => {
    setIsLoadingFiles(true);
    try {
      const res = await fetch("/api/enterprise/workspace?recursive=true");
      const data = await res.json();
      if (data.success && data.entries) {
        setWorkspaceFiles(data.entries);
        if (!selectedFile && data.entries.length > 0) {
          const firstNonDir = data.entries.find((f: WorkspaceFile) => !f.isDirectory);
          if (firstNonDir) {
            handleReadFile(firstNonDir.path);
          }
        }
      }
    } catch (e) {
      console.error("Failed to load workspace files:", e);
    } finally {
      setIsLoadingFiles(false);
    }
  }, [selectedFile, handleReadFile]);

  // Load initial data
  useEffect(() => {
    let active = true;
    fetch("/api/enterprise/workspace/terminal")
      .then(res => res.json())
      .then(data => {
        if (!active) return;
        if (data.success && data.history) {
          setTerminalHistory(data.history);
          if (data.history.length > 0) {
            setActiveOutput(prev => prev || data.history[0]);
          }
        }
      })
      .catch(e => console.error("Failed to load terminal history:", e));

    fetch("/api/enterprise/workspace?recursive=true")
      .then(res => res.json())
      .then(data => {
        if (!active) return;
        if (data.success && data.entries) {
          setWorkspaceFiles(data.entries);
          if (!selectedFile && data.entries.length > 0) {
            const firstNonDir = data.entries.find((f: WorkspaceFile) => !f.isDirectory);
            if (firstNonDir) {
              handleReadFile(firstNonDir.path);
            }
          }
        }
      })
      .catch(e => console.error("Failed to load workspace files:", e));

    return () => {
      active = false;
    };
  }, [selectedFile, handleReadFile]);

  async function handleExecuteCommand(cmdToRun?: string) {
    const toExecute = cmdToRun || command;
    if (!toExecute.trim() || isExecutingCmd) return;
    setIsExecutingCmd(true);
    try {
      const res = await fetch("/api/enterprise/workspace/terminal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: toExecute })
      });
      const data = await res.json();
      if (data.success && data.execution) {
        setActiveOutput(data.execution);
        setTerminalHistory(prev => [data.execution, ...prev]);
        // Also refresh files in case command modified them
        loadWorkspaceFiles();
      }
    } catch (e) {
      console.error("Terminal command error:", e);
    } finally {
      setIsExecutingCmd(false);
    }
  }

  async function handleRunPlaygroundTool() {
    setIsPlaying(true);
    setPlaygroundResult(null);
    try {
      let parsedArgs: Record<string, unknown> = {};
      try {
        parsedArgs = JSON.parse(playgroundArgs);
      } catch {
        parsedArgs = { query: playgroundArgs };
      }

      const res = await fetch("/api/enterprise/tools/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolName: playgroundTool,
          args: parsedArgs,
          agentId: "agent_dev_main",
          agentName: "Kaelen Voss (Staff Systems Engineer)"
        })
      });
      const data = await res.json();
      setPlaygroundResult(data.execution || data);
      loadWorkspaceFiles();
    } catch (e) {
      setPlaygroundResult({ error: e instanceof Error ? e.message : "Execution failed" });
    } finally {
      setIsPlaying(false);
    }
  }

  // Filter tools
  const toolExecutions = state.recent_tool_executions || [];
  const filteredTools = toolExecutions.filter(t => {
    if (toolFilter === "all") return true;
    return t.toolName === toolFilter;
  });

  return (
    <div className="space-y-4">
      {/* Subtab Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-lg p-1 text-xs">
          <button
            onClick={() => setSubTab("terminal")}
            className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              subTab === "terminal" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Terminal className="h-3.5 w-3.5" />
            <span>Interactive Terminal</span>
          </button>

          <button
            onClick={() => setSubTab("files")}
            className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              subTab === "files" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <FolderCode className="h-3.5 w-3.5" />
            <span>Workspace Files</span>
            <Badge variant="outline" className="text-[10px] py-0 px-1 ml-0.5">
              {workspaceFiles.length}
            </Badge>
          </button>

          <button
            onClick={() => setSubTab("tool_stream")}
            className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              subTab === "tool_stream" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Agent Tool Stream</span>
            {toolExecutions.length > 0 && (
              <Badge variant="cyan" className="text-[10px] py-0 px-1 ml-0.5">
                {toolExecutions.length}
              </Badge>
            )}
          </button>

          <button
            onClick={() => setSubTab("playground")}
            className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              subTab === "playground" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Tool Playground</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span>Sandbox Root:</span>
          <span className="text-cyan-400 font-semibold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            {state.settings?.workspace.workspacePath || "./agent_workspace"}
          </span>
        </div>
      </div>

      {/* 1. INTERACTIVE TERMINAL */}
      {subTab === "terminal" && (
        <div className="space-y-3">
          {/* Quick presets */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-mono text-[11px]">Quick Shell Snippets:</span>
            {[
              "ls -la",
              "cat tasks/todos.json",
              "cat src/index.ts",
              "cat README.md",
              "node -v"
            ].map(cmd => (
              <button
                key={cmd}
                onClick={() => {
                  setCommand(cmd);
                  handleExecuteCommand(cmd);
                }}
                className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 font-mono text-[11px] transition-colors cursor-pointer"
              >
                {cmd}
              </button>
            ))}
          </div>

          {/* Command Prompt */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-2.5 font-mono text-cyan-400 text-xs">$</span>
              <Input
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleExecuteCommand();
                }}
                placeholder="Type shell command to execute in workspace root..."
                className="pl-7 font-mono text-xs bg-slate-950 border-slate-800 text-slate-100"
                disabled={isExecutingCmd}
              />
            </div>
            <Button
              variant="cyan"
              size="sm"
              onClick={() => handleExecuteCommand()}
              disabled={isExecutingCmd || !command.trim()}
              className="gap-1.5 font-mono text-xs px-4 cursor-pointer"
            >
              {isExecutingCmd ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
              <span>Execute</span>
            </Button>
          </div>

          {/* Terminal Screen */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 font-mono text-xs overflow-hidden shadow-2xl">
            {/* Window title bar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900/60 text-slate-400">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-[11px] text-slate-300 font-semibold ml-2">
                  Paperclip Sandboxed Agent Terminal (bash)
                </span>
              </div>
              {activeOutput && (
                <div className="flex items-center gap-3 text-[11px]">
                  <span>Exit: <strong className={activeOutput.exitCode === 0 ? "text-emerald-400" : "text-rose-400"}>{activeOutput.exitCode}</strong></span>
                  <span>Duration: <strong>{activeOutput.durationMs}ms</strong></span>
                </div>
              )}
            </div>

            {/* Terminal Body */}
            <div className="p-4 max-h-[420px] min-h-[220px] overflow-y-auto space-y-3">
              {activeOutput ? (
                <div>
                  <div className="text-cyan-400 font-bold mb-1 flex items-center gap-1.5">
                    <span className="text-emerald-400">agent@paperclip-workspace:</span>
                    <span className="text-slate-400">~{activeOutput.cwd}$</span>
                    <span className="text-slate-100">{activeOutput.command}</span>
                  </div>
                  <pre className="text-slate-200 text-xs whitespace-pre-wrap leading-relaxed font-mono bg-slate-900/40 p-3 rounded-lg border border-slate-800/80">
                    {activeOutput.output || "(Command exited cleanly with no output)"}
                  </pre>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Executed at {activeOutput.timestamp} • ID: {activeOutput.id}
                  </div>
                </div>
              ) : (
                <div className="text-slate-500 flex flex-col items-center justify-center py-10 space-y-2">
                  <Terminal className="h-8 w-8 text-slate-600" />
                  <p>No terminal commands run yet. Type a command above to begin.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. WORKSPACE FILE EXPLORER */}
      {subTab === "files" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[420px]">
          {/* File Tree Column */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <FolderCode className="h-4 w-4 text-cyan-400" />
                Workspace Files
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={loadWorkspaceFiles}
                className="h-6 w-6 text-slate-400 hover:text-slate-100 cursor-pointer"
                title="Refresh File Tree"
              >
                <RotateCw className="h-3.5 w-3.5" />
              </Button>
            </div>

            {isLoadingFiles ? (
              <div className="py-12 flex justify-center text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
              </div>
            ) : (
              <div className="space-y-1 max-h-[380px] overflow-y-auto">
                {workspaceFiles.map((file) => {
                  const isSelected = selectedFile === file.path;
                  return (
                    <button
                      key={file.path}
                      onClick={() => !file.isDirectory && handleReadFile(file.path)}
                      className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-mono flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30"
                          : file.isDirectory
                          ? "text-slate-400 font-semibold bg-slate-900/40"
                          : "text-slate-300 hover:bg-slate-900 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {file.isDirectory ? (
                          <Folder className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
                        ) : (
                          <FileCode className="h-3.5 w-3.5 text-cyan-400 flex-shrink-0" />
                        )}
                        <span className="truncate">{file.path}</span>
                      </div>
                      {!file.isDirectory && (
                        <span className="text-[10px] text-slate-500 ml-1">
                          {file.size ? `${Math.round(file.size / 1024 * 10) / 10}k` : ""}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* File Viewer / Editor Column */}
          <div className="md:col-span-2 rounded-xl border border-slate-800 bg-slate-950 flex flex-col overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-800 bg-slate-900/70 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono">
                <FileText className="h-4 w-4 text-cyan-400" />
                <span className="font-bold text-slate-200">
                  {selectedFile || "No file selected"}
                </span>
              </div>
              {selectedFile && (
                <Badge variant="outline" className="text-[10px] font-mono">
                  Read Only
                </Badge>
              )}
            </div>

            <div className="p-4 flex-1 overflow-auto max-h-[400px]">
              {isLoadingContent ? (
                <div className="flex items-center justify-center py-20 text-slate-500">
                  <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
                </div>
              ) : selectedFile ? (
                <pre className="font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {fileContent}
                </pre>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                  <FileCode className="h-8 w-8 text-slate-600 mb-2" />
                  <p className="text-xs">Select any file on the left to inspect its contents</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. AGENT TOOL STREAM */}
      {subTab === "tool_stream" && (
        <div className="space-y-3">
          {/* Tool Filters */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1 text-xs">
              {[
                { id: "all", label: "All Tools" },
                { id: "web_search", label: "Web Search" },
                { id: "write_file", label: "Write File" },
                { id: "read_file", label: "Read File" },
                { id: "terminal_tool", label: "Terminal" },
                { id: "todo_list_tools", label: "Todos" },
                { id: "memory_store", label: "Memory Store" }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setToolFilter(f.id)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                    toolFilter === f.id
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                      : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Total Tool Calls: <strong>{toolExecutions.length}</strong>
            </span>
          </div>

          {/* List of executions */}
          {filteredTools.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-12 text-center text-slate-500">
              <Layers className="h-8 w-8 mx-auto text-slate-600 mb-2" />
              <p className="text-xs">No tool executions logged under filter &apos;{toolFilter}&apos; yet.</p>
              <p className="text-[11px] text-slate-600 mt-1">
                Tools are invoked dynamically as agents execute tasks during autonomous simulation cycles.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto">
              {filteredTools.map((t) => (
                <div
                  key={t.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 space-y-2 text-xs font-mono"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="cyan" className="font-mono text-[10px]">
                        {t.toolName}
                      </Badge>
                      <span className="text-slate-300 font-semibold">{t.agentName}</span>
                      <span className="text-slate-500 text-[10px]">({t.agentId})</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span>{t.durationMs}ms</span>
                      <span className={t.status === "success" ? "text-emerald-400 flex items-center gap-1" : "text-rose-400 flex items-center gap-1"}>
                        {t.status === "success" ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                        {t.status}
                      </span>
                      <span>{new Date(t.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>

                  {/* Arguments */}
                  <div className="bg-slate-900/60 p-2 rounded border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                      Arguments:
                    </span>
                    <pre className="text-slate-300 text-[11px] whitespace-pre-wrap font-mono">
                      {JSON.stringify(t.args, null, 2)}
                    </pre>
                  </div>

                  {/* Result snippet */}
                  <div className="bg-slate-900/40 p-2 rounded border border-slate-800/40">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                      Output Result:
                    </span>
                    <pre className="text-slate-400 text-[11px] whitespace-pre-wrap font-mono max-h-28 overflow-y-auto">
                      {JSON.stringify(t.result, null, 2)}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. TOOL PLAYGROUND */}
      {subTab === "playground" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-4">
            <div>
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                Manual Tool Execution Console
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Dispatch tools directly into the agent workspace to test tool behaviors and workspace isolation.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase text-slate-400 font-semibold">
                Select Tool
              </label>
              <select
                value={playgroundTool}
                onChange={(e) => {
                  const val = e.target.value as ToolExecution["toolName"];
                  setPlaygroundTool(val);
                  if (val === "web_search") {
                    setPlaygroundArgs(JSON.stringify({ query: "Autonomous AI Agent architecture", num_results: 3 }, null, 2));
                  } else if (val === "read_file") {
                    setPlaygroundArgs(JSON.stringify({ path: "README.md", limit: 20 }, null, 2));
                  } else if (val === "write_file") {
                    setPlaygroundArgs(JSON.stringify({ path: "src/test_probe.ts", content: "// Probe from CEO\nexport const probe = true;\n" }, null, 2));
                  } else if (val === "terminal_tool") {
                    setPlaygroundArgs(JSON.stringify({ command: "ls -la" }, null, 2));
                  } else if (val === "todo_list_tools") {
                    setPlaygroundArgs(JSON.stringify({ action: "list" }, null, 2));
                  } else if (val === "memory_recall") {
                    setPlaygroundArgs(JSON.stringify({ query: "Strategic unit economics and runway", limit: 3 }, null, 2));
                  }
                }}
                className="w-full h-9 rounded-md bg-slate-900 border border-slate-800 px-3 text-xs text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
              >
                <option value="web_search">web_search (Real-time public web research)</option>
                <option value="web_fetch">web_fetch (Fetch URL contents)</option>
                <option value="read_file">read_file (Read file in workspace)</option>
                <option value="write_file">write_file (Write file in workspace)</option>
                <option value="terminal_tool">terminal_tool (Sandboxed shell execution)</option>
                <option value="todo_list_tools">todo_list_tools (Manage roadmap tasks)</option>
                <option value="memory_recall">memory_recall (SQLite+Vec semantic search)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase text-slate-400 font-semibold">
                Tool Arguments (JSON)
              </label>
              <Textarea
                rows={6}
                value={playgroundArgs}
                onChange={(e) => setPlaygroundArgs(e.target.value)}
                className="font-mono text-xs"
              />
            </div>

            <Button
              variant="cyan"
              size="sm"
              onClick={handleRunPlaygroundTool}
              disabled={isPlaying}
              className="w-full gap-2 font-bold cursor-pointer"
            >
              {isPlaying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              <span>Execute Tool as Agent</span>
            </Button>
          </div>

          {/* Playground Result Display */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
            <h4 className="text-sm font-bold text-slate-100 flex items-center justify-between">
              <span>Tool Execution Result</span>
              {playgroundResult ? (
                <Badge variant="cyan" className="font-mono text-[10px]">
                  Output Received
                </Badge>
              ) : null}
            </h4>

            {playgroundResult ? (
              <pre className="font-mono text-xs text-slate-200 bg-slate-900/70 p-3.5 rounded-lg border border-slate-800 max-h-[380px] overflow-auto whitespace-pre-wrap leading-relaxed">
                {JSON.stringify(playgroundResult, null, 2)}
              </pre>
            ) : (
              <div className="py-24 text-center text-slate-500 text-xs">
                Run a tool on the left to see immediate output results here.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
