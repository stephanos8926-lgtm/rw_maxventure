// File: lib/llm-client.ts
import { GoogleGenAI } from "@google/genai";
import { LlmConfig, EmbeddingConfig } from "@/types/enterprise";
import { getSystemSettings } from "./config-store";

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  name?: string;
  tool_call_id?: string;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: {
      name: string;
      arguments: string;
    };
  }>;
}

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface ChatCompletionResult {
  content: string | null;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: {
      name: string;
      arguments: string;
    };
  }>;
  tokens_used?: number;
  model: string;
  finish_reason?: string;
}

/**
 * Standard OpenAI-Compatible Tool Schema for Paperclip Enterprise Agents
 */
export const ENTERPRISE_AGENT_TOOLS: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "web_search",
      description: "Search the public web for real-time market data, competitor analysis, technical documentation, or library APIs.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "The search query." },
          num_results: { type: "number", description: "Number of search results to retrieve (1-5)." }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "web_fetch",
      description: "Fetch and extract text content, headers, or metadata from an external URL.",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", description: "The HTTP/HTTPS URL to fetch." },
          max_chars: { type: "number", description: "Max characters to extract." }
        },
        required: ["url"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "read_file",
      description: "Read file contents from the agent operational workspace.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Relative path inside workspace (e.g. 'src/index.ts')." },
          offset: { type: "number", description: "Starting line number (1-based)." },
          limit: { type: "number", description: "Number of lines to read." }
        },
        required: ["path"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "write_file",
      description: "Write or create a file inside the agent operational workspace.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Relative path inside workspace." },
          content: { type: "string", description: "Complete file contents to write." },
          overwrite: { type: "boolean", description: "Whether to overwrite if file already exists." }
        },
        required: ["path", "content"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "patch_file",
      description: "Apply a targeted surgical search-and-replace patch to a file in the workspace.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Relative path to target file." },
          search: { type: "string", description: "Exact string or pattern to find." },
          replace: { type: "string", description: "Replacement string." }
        },
        required: ["path", "search", "replace"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "directory_list",
      description: "List files and directories inside the agent workspace.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Subdirectory path (empty for root)." },
          recursive: { type: "boolean", description: "Whether to list recursively." }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "terminal_tool",
      description: "Execute a command inside the agent operational workspace (sandboxed).",
      parameters: {
        type: "object",
        properties: {
          command: { type: "string", description: "Shell command to execute (e.g. 'ls -la', 'cat package.json', 'node -v')." },
          timeout_ms: { type: "number", description: "Timeout in milliseconds." }
        },
        required: ["command"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "todo_list_tools",
      description: "Manage agent task list (todos) within the enterprise roadmap.",
      parameters: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["list", "add", "update", "complete", "delete"], description: "Action to perform on todo list." },
          task_id: { type: "string", description: "Task ID when updating or completing." },
          title: { type: "string", description: "Task title for new todos." },
          priority: { type: "string", enum: ["critical", "high", "medium", "low"], description: "Priority level." },
          department: { type: "string", description: "Department assigned to." }
        },
        required: ["action"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "memory_store",
      description: "Store an observation, insight, code pattern, or fact into SQLite+Vec semantic long-term memory.",
      parameters: {
        type: "object",
        properties: {
          content: { type: "string", description: "Knowledge or memory text to store." },
          category: { type: "string", enum: ["reflection", "observation", "code_pattern", "factual", "strategy", "todo"], description: "Category of memory." },
          importance: { type: "number", description: "Importance score 1-10." }
        },
        required: ["content", "category"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "memory_recall",
      description: "Perform semantic similarity search over SQLite+Vec memory to recall relevant knowledge, past decisions, or code conventions.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Semantic search query." },
          limit: { type: "number", description: "Maximum number of memories to recall (1-10)." },
          category: { type: "string", description: "Optional category filter." }
        },
        required: ["query"]
      }
    }
  }
];

/**
 * Execute chat completion against ANY OpenAI-compatible endpoint
 */
export async function executeChatCompletion(params: {
  messages: ChatMessage[];
  tools?: ToolDefinition[];
  config?: Partial<LlmConfig>;
  stream?: boolean;
}): Promise<ChatCompletionResult> {
  const settings = getSystemSettings();
  const cfg: LlmConfig = { ...settings.llm, ...params.config };

  // If configured for native Gemini and no custom endpoint is explicitly targeted:
  if (cfg.provider === "gemini" && process.env.GEMINI_API_KEY && !cfg.baseUrl.includes("openai")) {
    return executeGeminiFallback(params.messages);
  }

  // Construct standard OpenAI-compatible endpoint
  let base = cfg.baseUrl.trim();
  if (base.endsWith("/")) base = base.slice(0, -1);
  const endpoint = base.endsWith("/chat/completions") ? base : `${base}/chat/completions`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };
  if (cfg.apiKey && cfg.apiKey.trim().length > 0) {
    headers["Authorization"] = `Bearer ${cfg.apiKey.trim()}`;
  }

  const payload: Record<string, unknown> = {
    model: cfg.model || "gpt-4o",
    messages: params.messages,
    temperature: cfg.temperature ?? 0.7,
    max_tokens: cfg.maxTokens ?? 2048
  };

  if (params.tools && params.tools.length > 0) {
    payload["tools"] = params.tools;
    payload["tool_choice"] = "auto";
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 35000);

    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text();
      // If endpoint failed and Gemini is available as backup, attempt fallback
      if (process.env.GEMINI_API_KEY) {
        console.warn(`[OpenAI Endpoint Warning] ${endpoint} returned ${res.status}: ${errText}. Attempting Gemini backup.`);
        return await executeGeminiFallback(params.messages);
      }
      throw new Error(`OpenAI-compatible endpoint error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const choice = data.choices?.[0];
    if (!choice) {
      throw new Error("No choices returned from OpenAI-compatible LLM endpoint");
    }

    return {
      content: choice.message?.content || null,
      tool_calls: choice.message?.tool_calls || undefined,
      tokens_used: data.usage?.total_tokens || 0,
      model: data.model || cfg.model,
      finish_reason: choice.finish_reason
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    if (process.env.GEMINI_API_KEY) {
      console.warn(`[LLM Fallback] External endpoint failed (${errMsg}), switching to server-side Gemini.`);
      return await executeGeminiFallback(params.messages);
    }
    throw new Error(`Failed to call OpenAI-compatible endpoint: ${errMsg}`);
  }
}

/**
 * Fallback to Google GenAI server-side client
 */
async function executeGeminiFallback(messages: ChatMessage[]): Promise<ChatCompletionResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("No OpenAI-compatible endpoint reachable and no GEMINI_API_KEY found in environment.");
  }
  const ai = new GoogleGenAI({ apiKey });

  const formattedPrompt = messages.map(m => `[${m.role.toUpperCase()}]: ${m.content}`).join("\n\n");
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: formattedPrompt
  });

  return {
    content: response.text || "",
    model: "gemini-2.5-flash",
    finish_reason: "stop"
  };
}

/**
 * Generate embedding vector using ANY OpenAI-compatible /embeddings endpoint
 */
export async function generateEmbeddingVector(
  text: string,
  config?: Partial<EmbeddingConfig>
): Promise<number[]> {
  const settings = getSystemSettings();
  const cfg: EmbeddingConfig = { ...settings.embedding, ...config };

  let base = cfg.baseUrl.trim();
  if (base.endsWith("/")) base = base.slice(0, -1);
  const endpoint = base.endsWith("/embeddings") ? base : `${base}/embeddings`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };
  if (cfg.apiKey && cfg.apiKey.trim().length > 0) {
    headers["Authorization"] = `Bearer ${cfg.apiKey.trim()}`;
  }

  const payload = {
    input: text.slice(0, 8000),
    model: cfg.model || "text-embedding-3-small"
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const embedding = data.data?.[0]?.embedding;
      if (Array.isArray(embedding) && embedding.length > 0) {
        return embedding;
      }
    }
  } catch {
    // Graceful fallback to deterministic semantic vector hash
  }

  // Deterministic 1536-dimensional semantic hash vector (ensures offline robustness)
  return generateDeterministicSemanticVector(text, cfg.dimensions || 1536);
}

/**
 * Deterministic semantic vector synthesis when external embedding endpoint is offline
 */
export function generateDeterministicSemanticVector(text: string, dimensions = 1536): number[] {
  const vector: number[] = new Array(dimensions).fill(0);
  const clean = text.toLowerCase().trim();
  
  // Feature hashing with word n-grams
  const words = clean.split(/\s+/);
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    let hash = 0;
    for (let j = 0; j < word.length; j++) {
      hash = ((hash << 5) - hash + word.charCodeAt(j)) | 0;
    }
    const idx = Math.abs(hash) % dimensions;
    const sign = (hash & 1) === 0 ? 1 : -1;
    vector[idx] += sign * (1 + 1 / (i + 1));

    // Bigrams
    if (i < words.length - 1) {
      const bi = word + "_" + words[i + 1];
      let biHash = 0;
      for (let k = 0; k < bi.length; k++) {
        biHash = ((biHash << 5) - biHash + bi.charCodeAt(k)) | 0;
      }
      const biIdx = Math.abs(biHash) % dimensions;
      vector[biIdx] += 0.8;
    }
  }

  // Normalize vector to unit length (L2 norm)
  let norm = 0;
  for (let i = 0; i < dimensions; i++) {
    norm += vector[i] * vector[i];
  }
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < dimensions; i++) {
      vector[i] = vector[i] / norm;
    }
  } else {
    vector[0] = 1.0;
  }

  return vector;
}

/**
 * Standard Cosine Similarity between two float vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const minLen = Math.min(a.length, b.length);
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < minLen; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom === 0) return 0;
  return Math.max(-1, Math.min(1, dot / denom));
}

/**
 * Test connectivity and latency for an OpenAI-compatible LLM endpoint
 */
export async function testLlmEndpoint(config: LlmConfig): Promise<{
  success: boolean;
  message: string;
  latencyMs: number;
  models?: string[];
}> {
  const start = Date.now();
  let base = config.baseUrl.trim();
  if (base.endsWith("/")) base = base.slice(0, -1);

  // Try fetching /models first
  const modelsEndpoint = base.endsWith("/v1") ? `${base}/models` : `${base}/v1/models`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (config.apiKey) headers["Authorization"] = `Bearer ${config.apiKey.trim()}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    const res = await fetch(modelsEndpoint, { method: "GET", headers, signal: controller.signal });
    clearTimeout(timeout);
    const latency = Date.now() - start;

    if (res.ok) {
      const data = await res.json();
      const list = Array.isArray(data.data) ? data.data.map((m: { id: string }) => m.id).slice(0, 10) : [];
      return {
        success: true,
        message: `Endpoint verified successfully. Latency: ${latency}ms`,
        latencyMs: latency,
        models: list
      };
    }
  } catch {
    // If models endpoint failed or is not implemented, test with minimal chat completion
  }

  // Fallback: test /chat/completions directly
  try {
    const start2 = Date.now();
    const endpoint = base.endsWith("/chat/completions") ? base : `${base}/chat/completions`;
    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: config.model || "gpt-4o",
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 5
      })
    });
    const latency = Date.now() - start2;
    if (res.ok) {
      return {
        success: true,
        message: `Chat completions verified successfully (${config.model}). Latency: ${latency}ms`,
        latencyMs: latency
      };
    }
    const txt = await res.text();
    return {
      success: false,
      message: `Endpoint returned HTTP ${res.status}: ${txt.slice(0, 120)}`,
      latencyMs: latency
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Connection failed",
      latencyMs: Date.now() - start
    };
  }
}

/**
 * Test connectivity for an OpenAI-compatible Embeddings endpoint
 */
export async function testEmbeddingEndpoint(config: EmbeddingConfig): Promise<{
  success: boolean;
  message: string;
  latencyMs: number;
  dimensions?: number;
}> {
  const start = Date.now();
  let base = config.baseUrl.trim();
  if (base.endsWith("/")) base = base.slice(0, -1);
  const endpoint = base.endsWith("/embeddings") ? base : `${base}/embeddings`;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (config.apiKey) headers["Authorization"] = `Bearer ${config.apiKey.trim()}`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: config.model || "text-embedding-3-small",
        input: "Test embedding connection"
      })
    });
    const latency = Date.now() - start;
    if (res.ok) {
      const data = await res.json();
      const dims = data.data?.[0]?.embedding?.length || config.dimensions;
      return {
        success: true,
        message: `Embeddings endpoint online. Vector dimensions: ${dims}. Latency: ${latency}ms`,
        latencyMs: latency,
        dimensions: dims
      };
    }
    const txt = await res.text();
    return {
      success: false,
      message: `Embedding error HTTP ${res.status}: ${txt.slice(0, 120)}`,
      latencyMs: latency
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Connection failed",
      latencyMs: Date.now() - start
    };
  }
}
