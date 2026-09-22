export interface BusinessBlueprint {
  company_name: string;
  ticker: string;
  tagline: string;
  industry: string;
  target_audience: string;
  revenue_model: string;
  vision: string;
  core_value_prop: string;
  tech_stack: string[];
  brand_identity: {
    archetype: string;
    tone: string;
    color_palette: string[];
  };
  initial_kpis: string[];
  readiness_score: number; // 0 to 100
  gtm_strategy: string;
}

export const DEFAULT_BLUEPRINT: BusinessBlueprint = {
  company_name: "AetherOps AI",
  ticker: "ATHR",
  tagline: "Autonomous Agent Orchestration & Self-Healing Cloud Systems",
  industry: "Autonomous Cloud Infrastructure & AI DevTools",
  target_audience: "Enterprise SRE Teams, Cloud Architects & Autonomous Software Labs",
  revenue_model: "Per-Node Compute Arbitrage + Tiered Autonomous Workload Licensing",
  vision: "Build the self-operating enterprise where autonomous AI agents run, optimize, and scale fault-tolerant infrastructure with zero human downtime.",
  core_value_prop: "Deterministic, auditable multi-agent runtime delivering 10x developer velocity with real-time financial telemetry.",
  tech_stack: ["Next.js 15", "TypeScript", "Python", "FastAPI", "LangGraph", "Docker", "PostgreSQL"],
  brand_identity: {
    archetype: "The Master Architect",
    tone: "Hyper-Precise, Cybernetic, Authoritative",
    color_palette: ["#090D16", "#06B6D4", "#10B981", "#6366F1", "#F8FAFC"]
  },
  initial_kpis: [
    "Sub-150ms cross-agent coordination latency",
    "99.95% verified self-healing task execution rate",
    "$1.2M pipeline in initial enterprise pilot commitments"
  ],
  readiness_score: 75,
  gtm_strategy: "Open-source developer runtime protocol to capture developer mindshare, combined with enterprise HITL governance licensing."
};

export interface InvestorValuation {
  valuation_usd: number;
  initial_capital: number; // e.g. 150,000 $CLIP
  investor_name: string;
  firm_name: string;
  thesis: string;
  risk_rating: "A+" | "A" | "B+" | "B" | "Speculative";
  equity_stake_percent: number;
  term_sheet_notes: string[];
}

export type AgentStatus = "idle" | "thinking" | "executing" | "waiting_approval" | "completed";

export interface AgentRole {
  id: string;
  name: string;
  role: string;
  title: string;
  avatar: string;
  department: "Executive" | "Engineering" | "Design" | "Growth" | "Security" | "Product";
  personality: string;
  leadership_style?: string;
  status: AgentStatus;
  current_task?: string;
  cost_per_cycle: number; // $CLIP deducted per heartbeat
  tokens_burned: number;
  efficiency_rating: number; // 0-100
  parent_agent_id?: string;
  last_thought?: string;
}

export interface TaskArtifact {
  title: string;
  type: "code" | "document" | "diagram" | "metrics" | "marketing";
  content: string;
  language?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  department: "Engineering" | "Design" | "Growth" | "Security" | "Executive" | "Product";
  assigned_to_role_id: string;
  status: "backlog" | "in_progress" | "pending_approval" | "completed" | "failed";
  priority: "low" | "medium" | "high" | "critical";
  cost: number; // in $CLIP
  revenue_yield?: number; // capital earned upon completion
  progress: number; // 0 to 100
  requires_hitl: boolean;
  artifacts?: TaskArtifact[];
  created_at_cycle: number;
  completed_at_cycle?: number;
}

export interface ApprovalRequest {
  id: string;
  task_id: string;
  title: string;
  description: string;
  proposed_by_role: string;
  proposed_by_name: string;
  budget_impact: number; // in $CLIP
  risk_level: "low" | "medium" | "high" | "critical";
  status: "pending" | "approved" | "rejected";
  timestamp: string;
  strategic_justification: string;
  alternative_option?: string;
}

export interface EnterpriseLog {
  id: string;
  cycle: number;
  timestamp: string;
  agent_id: string;
  agent_name: string;
  type: "heartbeat" | "thought" | "action" | "approval" | "finance" | "milestone" | "alert";
  message: string;
  metadata?: Record<string, unknown>;
}

export interface ChiefOfStaffCandidate {
  id: string;
  name: string;
  title: string;
  avatar: string;
  personality: string;
  leadership_style: string;
  operational_traits: string[];
  quote: string;
  recruitment_cost: number;
  specialty: string;
  projected_velocity: string;
  risk_profile: "Aggressive" | "Balanced" | "Methodical";
}

export interface LlmConfig {
  provider: "openai_compatible" | "ollama" | "openrouter" | "vllm" | "gemini" | "custom";
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface EmbeddingConfig {
  provider?: "openai_compatible" | "ollama" | "openrouter" | "vllm" | "gemini" | "custom" | string;
  baseUrl: string;
  apiKey: string;
  model: string;
  dimensions: number;
}

export interface WorkspaceConfig {
  workspacePath: string;
  readOnly: boolean;
  allowedExtensions: string[];
  maxFileSizeKb: number;
  maxTerminalTimeoutMs?: number;
  sandboxed?: boolean;
}

export interface EnterpriseSystemSettings {
  llm: LlmConfig;
  embedding: EmbeddingConfig;
  workspace: WorkspaceConfig;
  enabledTools: string[];
}

export interface ToolExecution {
  id: string;
  timestamp: string;
  agentId: string;
  agentName: string;
  toolName:
    | "web_search"
    | "web_fetch"
    | "read_file"
    | "write_file"
    | "patch_file"
    | "directory_list"
    | "terminal_tool"
    | "todo_list_tools"
    | "memory_store"
    | "memory_recall";
  args: Record<string, unknown>;
  result: unknown;
  status: "success" | "error" | "running";
  durationMs: number;
}

export interface SemanticMemoryEntry {
  id: string;
  agentId: string;
  agentName: string;
  category: "reflection" | "observation" | "code_pattern" | "factual" | "strategy" | "todo";
  content: string;
  embedding?: number[];
  importance: number;
  createdAt: string;
  similarity?: number;
  metadata?: Record<string, unknown>;
}

export interface WorkspaceFile {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  updatedAt: string;
  content?: string;
}

export interface TerminalExecution {
  id: string;
  timestamp: string;
  command: string;
  output: string;
  exitCode: number;
  cwd: string;
  durationMs: number;
}

export interface EnterpriseState {
  is_initialized: boolean;
  is_running: boolean;
  phase: "onboarding" | "launch_valuation" | "chief_selection" | "autonomous_execution" | "completed";
  blueprint: BusinessBlueprint;
  valuation: InvestorValuation | null;
  chief_of_staff: AgentRole | null;
  cos_candidates: ChiefOfStaffCandidate[];
  active_agents: AgentRole[];
  tasks: Task[];
  approvals: ApprovalRequest[];
  capital_treasury: number; // Current virtual capital ($CLIP)
  initial_capital: number;
  burn_rate_per_cycle: number;
  total_revenue_generated: number;
  heartbeat_count: number;
  simulation_speed: number; // 0 = paused, 1 = 1x, 2 = 2x, 5 = 5x
  hitl_strictness: "all" | "high_cost_only" | "auto_pilot"; // all = require approval for all tasks, high_cost_only = require if cost > threshold, auto_pilot = auto-approve
  hitl_cost_threshold: number; // threshold in $CLIP
  logs: EnterpriseLog[];
  completed_milestones: string[];
  settings: EnterpriseSystemSettings;
  recent_tool_executions: ToolExecution[];
  memories_count: number;
}

export interface ConceptChatMessage {
  id: string;
  sender: "user" | "agent";
  text: string;
  timestamp: string;
  suggested_blueprint_update?: Partial<BusinessBlueprint>;
}
