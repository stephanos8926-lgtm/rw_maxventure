// File: lib/config-store.ts
import { EnterpriseSystemSettings, LlmConfig, EmbeddingConfig, WorkspaceConfig } from "@/types/enterprise";

export const DEFAULT_LLM_CONFIG: LlmConfig = {
  provider: "openai_compatible",
  baseUrl: process.env.OPENAI_API_BASE_URL || "https://api.openai.com/v1",
  apiKey: process.env.OPENAI_API_KEY || "",
  model: process.env.OPENAI_MODEL || "gpt-4o",
  temperature: 0.7,
  maxTokens: 2048
};

export const DEFAULT_EMBEDDING_CONFIG: EmbeddingConfig = {
  baseUrl: process.env.OPENAI_EMBEDDING_BASE_URL || process.env.OPENAI_API_BASE_URL || "https://api.openai.com/v1",
  apiKey: process.env.OPENAI_EMBEDDING_API_KEY || process.env.OPENAI_API_KEY || "",
  model: process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small",
  dimensions: 1536
};

export const DEFAULT_WORKSPACE_CONFIG: WorkspaceConfig = {
  workspacePath: process.env.AGENT_WORKSPACE_DIR || "./agent_workspace",
  readOnly: false,
  allowedExtensions: [".ts", ".tsx", ".js", ".jsx", ".json", ".md", ".txt", ".py", ".yaml", ".yml", ".css", ".html", ".sh", ".sql", ".env"],
  maxFileSizeKb: 2048,
  maxTerminalTimeoutMs: 25000,
  sandboxed: true
};

export const DEFAULT_SYSTEM_SETTINGS: EnterpriseSystemSettings = {
  llm: { ...DEFAULT_LLM_CONFIG },
  embedding: { ...DEFAULT_EMBEDDING_CONFIG },
  workspace: { ...DEFAULT_WORKSPACE_CONFIG },
  enabledTools: [
    "web_search",
    "web_fetch",
    "read_file",
    "write_file",
    "patch_file",
    "directory_list",
    "terminal_tool",
    "todo_list_tools",
    "memory_store",
    "memory_recall"
  ]
};

// Global singleton settings for dev server
declare global {
  var __enterpriseSystemSettings: EnterpriseSystemSettings | undefined;
}

export function getSystemSettings(): EnterpriseSystemSettings {
  if (!global.__enterpriseSystemSettings) {
    global.__enterpriseSystemSettings = {
      llm: { ...DEFAULT_LLM_CONFIG },
      embedding: { ...DEFAULT_EMBEDDING_CONFIG },
      workspace: { ...DEFAULT_WORKSPACE_CONFIG },
      enabledTools: [...DEFAULT_SYSTEM_SETTINGS.enabledTools]
    };
  }
  return global.__enterpriseSystemSettings;
}

export function updateSystemSettings(partial: Partial<EnterpriseSystemSettings>): EnterpriseSystemSettings {
  const current = getSystemSettings();
  
  if (partial.llm) {
    current.llm = { ...current.llm, ...partial.llm };
  }
  if (partial.embedding) {
    current.embedding = { ...current.embedding, ...partial.embedding };
  }
  if (partial.workspace) {
    current.workspace = { ...current.workspace, ...partial.workspace };
  }
  if (partial.enabledTools) {
    current.enabledTools = [...partial.enabledTools];
  }
  
  global.__enterpriseSystemSettings = current;
  return current;
}
