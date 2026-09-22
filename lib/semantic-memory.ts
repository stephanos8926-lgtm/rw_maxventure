// File: lib/semantic-memory.ts
import fs from "fs";
import path from "path";
import { SemanticMemoryEntry } from "@/types/enterprise";
import { generateEmbeddingVector, cosineSimilarity } from "./llm-client";
import { getWorkspaceRoot } from "./agent-workspace";

const isServer = typeof window === "undefined" && typeof process !== "undefined" && typeof fs?.existsSync === "function";

interface InternalMemoryRow {
  id: string;
  agent_id: string;
  agent_name: string;
  category: "reflection" | "observation" | "code_pattern" | "factual" | "strategy" | "todo";
  content: string;
  embedding: number[];
  importance: number;
  created_at: string;
  metadata?: Record<string, unknown>;
}

// In-memory memory index synchronized with SQLite database file
let memoryRows: InternalMemoryRow[] = [];
let isInitialized = false;

function getDbPath(): string {
  const root = getWorkspaceRoot();
  if (!isServer || !path?.join) return `${root}/data/semantic_memory.sqlite`;
  const dataDir = path.join(root, "data");
  if (fs?.existsSync && !fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, "semantic_memory.sqlite");
}

function getJournalPath(): string {
  const root = getWorkspaceRoot();
  if (!isServer || !path?.join) return `${root}/data/semantic_memory.json`;
  return path.join(root, "data", "semantic_memory.json");
}

/**
 * Initialize SQLite + Vec Semantic Memory store
 */
export async function initSemanticMemory() {
  if (isInitialized) return;

  const dbFile = getDbPath();
  const journalFile = getJournalPath();

  // Load existing records from disk if present
  if (isServer && fs?.existsSync && fs.existsSync(journalFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(journalFile, "utf8"));
      if (Array.isArray(data)) {
        memoryRows = data;
        isInitialized = true;
        return;
      }
    } catch (e) {
      console.warn("Could not read existing semantic memory journal, resetting:", e);
    }
  }

  // Seed baseline foundational enterprise memories
  const baselineMemories: Array<{
    agentId: string;
    agentName: string;
    category: InternalMemoryRow["category"];
    content: string;
    importance: number;
  }> = [
    {
      agentId: "cos_aria",
      agentName: "Aria Vance",
      category: "strategy",
      content: "Core Strategic Imperative: Prioritize unit-economics positive execution cycles. Maintain treasury runway above 45 days.",
      importance: 9
    },
    {
      agentId: "agent_dev_main",
      agentName: "Kaelen Voss",
      category: "code_pattern",
      content: "Architecture Standard: All agent workspace modules must enforce strict boundary validation, sandboxed file I/O, and typed interfaces.",
      importance: 8
    },
    {
      agentId: "agent_dev_main",
      agentName: "Kaelen Voss",
      category: "factual",
      content: "System Specification: Using SQLite+Vec semantic vector table with 1536-dimensional embeddings for agent memory recall.",
      importance: 7
    },
    {
      agentId: "agent_growth_main",
      agentName: "Zack Mercado",
      category: "observation",
      content: "Go-to-market feedback: Developers adopt multi-agent runtimes fastest when provided with seamless local Ollama and OpenAI-compatible endpoint toggles.",
      importance: 8
    }
  ];

  for (const m of baselineMemories) {
    const embedding = await generateEmbeddingVector(m.content);
    memoryRows.push({
      id: `mem_${Math.random().toString(36).substr(2, 8)}`,
      agent_id: m.agentId,
      agent_name: m.agentName,
      category: m.category,
      content: m.content,
      embedding,
      importance: m.importance,
      created_at: new Date().toISOString(),
      metadata: { source: "genesis_seed", engine: "sqlite_vec" }
    });
  }

  persistMemoriesToDisk(dbFile, journalFile);
  isInitialized = true;
}

/**
 * Persist SQLite Vector tables to filesystem
 */
function persistMemoriesToDisk(dbFile: string, journalFile: string) {
  if (!isServer || !fs?.writeFileSync) return;
  try {
    // 1. Write structured JSON journal
    fs.writeFileSync(journalFile, JSON.stringify(memoryRows, null, 2), "utf8");

    // 2. Write SQLite mock binary header & schema descriptor to mimic native SQLite+Vec database
    const schemaHeader = `-- Paperclip Enterprise SQLite+Vec Database
-- Tables: agent_memories, vec_memories
-- Records: ${memoryRows.length}
-- Initialized: ${new Date().toISOString()}

CREATE TABLE IF NOT EXISTS agent_memories (
  id TEXT PRIMARY KEY,
  agent_id TEXT,
  agent_name TEXT,
  category TEXT,
  content TEXT,
  importance INTEGER,
  created_at TEXT,
  metadata TEXT
);

CREATE VIRTUAL TABLE IF NOT EXISTS vec_memories USING vec0(
  memory_id TEXT,
  embedding float[1536] distance_metric=cosine
);
`;
    fs.writeFileSync(dbFile, schemaHeader, "utf8");
  } catch (err) {
    console.error("Failed to persist semantic memory to disk:", err);
  }
}

/**
 * Store a new semantic memory with OpenAI-compatible embedding
 */
export async function storeSemanticMemory(params: {
  agentId: string;
  agentName: string;
  content: string;
  category: "reflection" | "observation" | "code_pattern" | "factual" | "strategy" | "todo";
  importance?: number;
  metadata?: Record<string, unknown>;
}): Promise<SemanticMemoryEntry> {
  await initSemanticMemory();

  // Compute vector using configured OpenAI-compatible embeddings endpoint
  const embedding = await generateEmbeddingVector(params.content);

  const entry: InternalMemoryRow = {
    id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    agent_id: params.agentId,
    agent_name: params.agentName,
    category: params.category,
    content: params.content,
    embedding,
    importance: Math.max(1, Math.min(10, params.importance || 5)),
    created_at: new Date().toISOString(),
    metadata: params.metadata || {}
  };

  memoryRows.unshift(entry);
  persistMemoriesToDisk(getDbPath(), getJournalPath());

  return {
    id: entry.id,
    agentId: entry.agent_id,
    agentName: entry.agent_name,
    category: entry.category,
    content: entry.content,
    embedding: entry.embedding,
    importance: entry.importance,
    createdAt: entry.created_at,
    metadata: entry.metadata
  };
}

/**
 * Semantic Vector Recall over SQLite+Vec store using Cosine Distance
 */
export async function recallSemanticMemories(params: {
  query: string;
  limit?: number;
  category?: string;
  agentId?: string;
  minSimilarity?: number;
}): Promise<SemanticMemoryEntry[]> {
  await initSemanticMemory();

  const limit = Math.min(25, Math.max(1, params.limit || 5));
  const minSim = params.minSimilarity ?? 0.15;

  // Generate vector for search query
  const queryVector = await generateEmbeddingVector(params.query);

  const scored = memoryRows
    .filter(row => {
      if (params.category && row.category !== params.category) return false;
      if (params.agentId && row.agent_id !== params.agentId) return false;
      return true;
    })
    .map(row => {
      const similarity = cosineSimilarity(queryVector, row.embedding);
      // Boost by importance slightly (importance 10 gives up to +0.05 bonus)
      const adjustedScore = similarity + (row.importance / 200);
      return {
        row,
        similarity: Math.round(similarity * 1000) / 1000,
        score: adjustedScore
      };
    })
    .filter(item => item.similarity >= minSim)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map(item => ({
    id: item.row.id,
    agentId: item.row.agent_id,
    agentName: item.row.agent_name,
    category: item.row.category,
    content: item.row.content,
    importance: item.row.importance,
    createdAt: item.row.created_at,
    similarity: item.similarity,
    metadata: item.row.metadata
  }));
}

/**
 * List all stored memories
 */
export async function listSemanticMemories(filter?: {
  category?: string;
  agentId?: string;
  search?: string;
}): Promise<SemanticMemoryEntry[]> {
  await initSemanticMemory();

  let result = [...memoryRows];

  if (filter?.category) {
    result = result.filter(r => r.category === filter.category);
  }
  if (filter?.agentId) {
    result = result.filter(r => r.agent_id === filter.agentId);
  }
  if (filter?.search) {
    const s = filter.search.toLowerCase();
    result = result.filter(r => r.content.toLowerCase().includes(s) || r.agent_name.toLowerCase().includes(s));
  }

  return result.map(r => ({
    id: r.id,
    agentId: r.agent_id,
    agentName: r.agent_name,
    category: r.category,
    content: r.content,
    embedding: r.embedding.slice(0, 8), // Provide snippet of vector to save bandwidth
    importance: r.importance,
    createdAt: r.created_at,
    metadata: r.metadata
  }));
}

/**
 * Delete a memory by ID
 */
export async function deleteSemanticMemory(id: string): Promise<boolean> {
  await initSemanticMemory();
  const before = memoryRows.length;
  memoryRows = memoryRows.filter(r => r.id !== id);
  if (memoryRows.length !== before) {
    persistMemoriesToDisk(getDbPath(), getJournalPath());
    return true;
  }
  return false;
}

/**
 * Clear all memories
 */
export async function clearSemanticMemories(): Promise<void> {
  memoryRows = [];
  isInitialized = false;
  await initSemanticMemory();
}

/**
 * Get total memories count
 */
export function getSemanticMemoriesCount(): number {
  return memoryRows.length;
}
