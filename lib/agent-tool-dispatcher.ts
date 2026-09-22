// File: lib/agent-tool-dispatcher.ts
import { ToolExecution } from "@/types/enterprise";
import {
  toolReadFile,
  toolWriteFile,
  toolPatchFile,
  toolDirectoryList,
  toolTerminalExecute,
  toolWebSearch,
  toolWebFetch,
  toolTodoList
} from "./agent-workspace";
import { storeSemanticMemory, recallSemanticMemories } from "./semantic-memory";

const recentToolExecutions: ToolExecution[] = [];

/**
 * Execute any requested tool on behalf of an agent
 */
export async function executeAgentTool(
  toolName: ToolExecution["toolName"],
  args: Record<string, unknown>,
  agentId = "agent_system",
  agentName = "Enterprise Specialist"
): Promise<ToolExecution> {
  const start = Date.now();
  let result: unknown = null;
  let status: ToolExecution["status"] = "success";

  try {
    switch (toolName) {
      case "web_search":
        result = await toolWebSearch({
          query: String(args.query || ""),
          num_results: Number(args.num_results || 3)
        });
        break;

      case "web_fetch":
        result = await toolWebFetch({
          url: String(args.url || ""),
          max_chars: Number(args.max_chars || 4000)
        });
        break;

      case "read_file":
        result = await toolReadFile({
          path: String(args.path || ""),
          offset: args.offset ? Number(args.offset) : undefined,
          limit: args.limit ? Number(args.limit) : undefined
        });
        break;

      case "write_file":
        result = await toolWriteFile({
          path: String(args.path || ""),
          content: String(args.content || ""),
          overwrite: args.overwrite !== false
        });
        break;

      case "patch_file":
        result = await toolPatchFile({
          path: String(args.path || ""),
          search: String(args.search || ""),
          replace: String(args.replace || "")
        });
        break;

      case "directory_list":
        result = await toolDirectoryList({
          path: args.path ? String(args.path) : undefined,
          recursive: Boolean(args.recursive)
        });
        break;

      case "terminal_tool":
        result = await toolTerminalExecute({
          command: String(args.command || ""),
          timeout_ms: args.timeout_ms ? Number(args.timeout_ms) : undefined
        });
        break;

      case "todo_list_tools":
        result = await toolTodoList({
          action: (args.action as "list" | "add" | "update" | "complete" | "delete") || "list",
          task_id: args.task_id ? String(args.task_id) : undefined,
          title: args.title ? String(args.title) : undefined,
          priority: args.priority ? (args.priority as "critical" | "high" | "medium" | "low") : undefined,
          department: args.department ? String(args.department) : undefined
        });
        break;

      case "memory_store":
        result = await storeSemanticMemory({
          agentId,
          agentName,
          content: String(args.content || ""),
          category: (args.category as "reflection" | "observation" | "code_pattern" | "factual" | "strategy" | "todo") || "observation",
          importance: args.importance ? Number(args.importance) : 5,
          metadata: (args.metadata as Record<string, unknown>) || {}
        });
        break;

      case "memory_recall":
        result = await recallSemanticMemories({
          query: String(args.query || ""),
          limit: args.limit ? Number(args.limit) : 5,
          category: args.category ? String(args.category) : undefined
        });
        break;

      default:
        throw new Error(`Unsupported agent tool: ${toolName}`);
    }
  } catch (err: unknown) {
    status = "error";
    result = { error: err instanceof Error ? err.message : String(err) };
  }

  const executionRecord: ToolExecution = {
    id: `tool_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    timestamp: new Date().toISOString(),
    agentId,
    agentName,
    toolName,
    args,
    result,
    status,
    durationMs: Date.now() - start
  };

  recentToolExecutions.unshift(executionRecord);
  if (recentToolExecutions.length > 50) {
    recentToolExecutions.pop();
  }

  return executionRecord;
}

export function getRecentToolExecutions(): ToolExecution[] {
  return [...recentToolExecutions];
}
