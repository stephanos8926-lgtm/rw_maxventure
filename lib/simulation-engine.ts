import {
  EnterpriseState,
  BusinessBlueprint,
  InvestorValuation,
  ChiefOfStaffCandidate,
  AgentRole,
  Task,
  ApprovalRequest,
  EnterpriseLog,
  EnterpriseSystemSettings,
  ToolExecution
} from "@/types/enterprise";
import { GoogleGenAI } from "@google/genai";
import { getSystemSettings, updateSystemSettings } from "./config-store";
import { executeAgentTool, getRecentToolExecutions } from "./agent-tool-dispatcher";
import { initSemanticMemory, getSemanticMemoriesCount, storeSemanticMemory } from "./semantic-memory";

// Default initial state
const defaultBlueprint: BusinessBlueprint = {
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

class SimulationEngine {
  private timer: NodeJS.Timeout | null = null;
  private state: EnterpriseState = {
    is_initialized: false,
    is_running: false,
    phase: "onboarding",
    blueprint: defaultBlueprint,
    valuation: null,
    chief_of_staff: null,
    cos_candidates: [],
    active_agents: [],
    tasks: [],
    approvals: [],
    capital_treasury: 100000,
    initial_capital: 100000,
    burn_rate_per_cycle: 0,
    total_revenue_generated: 0,
    heartbeat_count: 0,
    simulation_speed: 1,
    hitl_strictness: "high_cost_only",
    hitl_cost_threshold: 1000,
    logs: [],
    completed_milestones: [],
    settings: getSystemSettings(),
    recent_tool_executions: [],
    memories_count: 0
  };

  private listeners: Array<(state: EnterpriseState) => void> = [];

  constructor() {
    this.state.cos_candidates = this.getChiefOfStaffCandidates();
    this.state.settings = getSystemSettings();
    this.state.recent_tool_executions = getRecentToolExecutions();
    initSemanticMemory().then(() => {
      this.state.memories_count = getSemanticMemoriesCount();
    }).catch(() => {});
    this.addLog("system", "System Kernel", "milestone", "Paperclip Enterprise Simulator engine initialized. OpenAI-compatible runtime, agent workspace, and SQLite+Vec memory active.");
  }

  public getState(): EnterpriseState {
    return { ...this.state };
  }

  public subscribe(callback: (state: EnterpriseState) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      try {
        listener(this.getState());
      } catch (err) {
        console.error("Simulation listener error:", err);
      }
    }
  }

  public addLog(
    agent_id: string,
    agent_name: string,
    type: EnterpriseLog["type"],
    message: string,
    metadata?: Record<string, unknown>
  ) {
    const log: EnterpriseLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      cycle: this.state.heartbeat_count,
      timestamp: new Date().toLocaleTimeString("en-US", { hour12: false }),
      agent_id,
      agent_name,
      type,
      message,
      metadata
    };
    this.state.logs = [log, ...this.state.logs.slice(0, 150)];
  }

  // --- Phase 1: Concept Chat & Blueprint Generation ---
  public async handleConceptChat(
    message: string,
    history: Array<{ sender: "user" | "agent"; text: string }>,
    currentBlueprint?: BusinessBlueprint
  ): Promise<{ reply: string; blueprint: BusinessBlueprint; readiness_score: number; is_ready_for_launch: boolean }> {
    const bp: BusinessBlueprint = currentBlueprint || this.state.blueprint || defaultBlueprint;
    
    // Check if Gemini API key exists
    let aiReply = "";
    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const prompt = `You are the "Concept Artist" agent for a high-stakes enterprise simulator called Paperclip Enterprise.
The user is acting as CEO, brainstorming and refining their virtual venture.
Current Blueprint:
${JSON.stringify(bp, null, 2)}

User's Latest Directive: "${message}"

Respond concisely (2-3 sentences max) with expert venture advice, acknowledging their idea, pointing out how it bolsters their market moat, and asking 1 strategic follow-up question or declaring readiness for the investor launch gate. Speak in a sharp, visionary, executive tone.`;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt
        });
        aiReply = response.text || "";
      } catch (err) {
        console.warn("Gemini call failed or timed out, using adaptive fallback:", err);
      }
    }

    // Adaptive blueprint updates based on user keywords
    const updatedBp = { ...bp };
    const lower = message.toLowerCase();

    if (lower.includes("name") || lower.includes("call it") || lower.includes("company")) {
      const match = message.match(/(?:call it|named|name is|company is)\s+([A-Za-z0-9\s\-]+)/i);
      if (match && match[1]) {
        updatedBp.company_name = match[1].trim();
        updatedBp.ticker = updatedBp.company_name.substring(0, 4).toUpperCase();
      }
    }
    if (lower.includes("security") || lower.includes("compliance") || lower.includes("audit")) {
      if (!updatedBp.initial_kpis.includes("SOC2 & Zero-Trust Verification")) {
        updatedBp.initial_kpis.push("SOC2 & Zero-Trust Verification");
      }
      updatedBp.tech_stack = Array.from(new Set([...updatedBp.tech_stack, "Zero-Trust Mesh", "eBPF"]));
    }
    if (lower.includes("b2b") || lower.includes("enterprise") || lower.includes("clients")) {
      updatedBp.target_audience = "Global 2000 Enterprise IT & DevOps Executives";
    }
    if (lower.includes("pricing") || lower.includes("subscription") || lower.includes("model")) {
      updatedBp.revenue_model = "Usage-based telemetry pricing with $50k annual platform tier";
    }

    // Increment readiness score
    const newReadiness = Math.min(100, (updatedBp.readiness_score || 70) + 10);
    updatedBp.readiness_score = newReadiness;
    this.state.blueprint = updatedBp;

    if (!aiReply) {
      if (newReadiness >= 85) {
        aiReply = `Superb strategic clarification. We have codified ${updatedBp.company_name}'s market positioning, technical defensibility, and initial go-to-market motion. The enterprise readiness score has reached ${newReadiness}%. The 'Launch Enterprise' gate is now fully active—you may trigger investor evaluation at your command.`;
      } else {
        aiReply = `Understood, CEO. I have integrated this directive into ${updatedBp.company_name}'s blueprint. We've enhanced our core value proposition and updated target audience parameters. How should we configure our initial revenue yield: upfront enterprise contracts or high-velocity usage billing?`;
      }
    }

    this.addLog("concept_artist", "Concept Artist", "thought", `Refined blueprint for ${updatedBp.company_name} (Readiness: ${newReadiness}%).`);
    this.notify();

    return {
      reply: aiReply,
      blueprint: updatedBp,
      readiness_score: newReadiness,
      is_ready_for_launch: newReadiness >= 85
    };
  }

  // --- Phase 2: Launch & Investor Valuation ---
  public launchEnterprise(blueprint: BusinessBlueprint): { valuation: InvestorValuation; capital_treasury: number } {
    const readiness = blueprint.readiness_score || 85;
    const baseValuation = 3500000;
    const multiplier = 1 + (readiness / 100) * 0.9;
    const valuation_usd = Math.round(baseValuation * multiplier / 50000) * 50000;
    const initial_capital = Math.round((valuation_usd * 0.04) / 1000) * 1000; // 4% granted as $CLIP points

    const valuation: InvestorValuation = {
      valuation_usd,
      initial_capital,
      investor_name: "Apex Syndicate Partners",
      firm_name: "Sovereign Frontier Ventures",
      thesis: `Strong unit economics and autonomous execution moats identified in ${blueprint.industry}. The technical architecture is capable of 100x scale with low human overhead.`,
      risk_rating: readiness >= 90 ? "A+" : readiness >= 80 ? "A" : "B+",
      equity_stake_percent: 10.0,
      term_sheet_notes: [
        `Pre-money valuation ratified at $${valuation_usd.toLocaleString()} USD.`,
        `Initial treasury grant of ${initial_capital.toLocaleString()} $CLIP deposited into the enterprise treasury.`,
        "100% CEO super-voting shares preserved with full Human-in-the-Loop veto rights.",
        "Chief of Staff recruitment mandate authorized."
      ]
    };

    this.state.is_initialized = true;
    this.state.phase = "launch_valuation";
    this.state.blueprint = blueprint;
    this.state.valuation = valuation;
    this.state.capital_treasury = initial_capital;
    this.state.initial_capital = initial_capital;

    this.addLog(
      "investor",
      valuation.investor_name,
      "milestone",
      `Enterprise launched! Seed valuation assigned: $${valuation_usd.toLocaleString()} USD. Granted ${initial_capital.toLocaleString()} $CLIP treasury capital.`
    );

    this.notify();
    return { valuation, capital_treasury: initial_capital };
  }

  // --- Phase 3: Chief of Staff Candidates & Selection ---
  public getChiefOfStaffCandidates(): ChiefOfStaffCandidate[] {
    return [
      {
        id: "cos_aria",
        name: "Aria Vance",
        title: "Principal Operations Architect",
        avatar: "⚡",
        personality: "Hyper-efficient, structured, relentless about unit economics and systemic rigor.",
        leadership_style: "Systemic Decentralization & KPI Precision",
        operational_traits: ["Zero-Waste Execution", "Automated Guardrails", "Strict Budget Adherence"],
        quote: "Velocity without precision is merely accelerated failure. We will architect self-reinforcing operational loops.",
        recruitment_cost: 2500,
        specialty: "Operational Resilience & Scalable Infrastructure",
        projected_velocity: "High / Predictable",
        risk_profile: "Methodical"
      },
      {
        id: "cos_marcus",
        name: "Marcus Chen",
        title: "Venture Blitzscaler & Product Catalyst",
        avatar: "🚀",
        personality: "Bold, aggressive, product-obsessed. Drives exponential user acquisition and market conquest.",
        leadership_style: "Extreme Ownership & High-Risk Blitzscaling",
        operational_traits: ["Aggressive Experimentation", "Hyper-Growth Funnels", "Rapid Prototyping"],
        quote: "First-to-scale dominates the winner-take-all horizon. Let the specialists ship fast and conquer market mindshare.",
        recruitment_cost: 3000,
        specialty: "Rapid Go-To-Market & Viral Loops",
        projected_velocity: "Maximum / Explosive",
        risk_profile: "Aggressive"
      },
      {
        id: "cos_elena",
        name: "Dr. Elena Rostova",
        title: "Chief Systems Architect & Cyberneticist",
        avatar: "🛡️",
        personality: "Analytical, defensive, deeply scientific. Balances rapid execution with unbreakable security.",
        leadership_style: "Resilient Antifragility & Empirical Validation",
        operational_traits: ["Pre-Mortem Auditing", "Risk-Adjusted Allocation", "Red-Team Testing"],
        quote: "Sustainable advantage belongs to systems that survive turbulence. Every line of code and marketing claim must be tamper-proof.",
        recruitment_cost: 2800,
        specialty: "Risk Mitigation, Compliance & Deep Tech Moats",
        projected_velocity: "Steady / Compounding",
        risk_profile: "Balanced"
      }
    ];
  }

  public selectChiefOfStaff(chiefId: string): EnterpriseState {
    const candidates = this.getChiefOfStaffCandidates();
    const candidate = candidates.find(c => c.id === chiefId) || candidates[0];

    const cosRole: AgentRole = {
      id: candidate.id,
      name: candidate.name,
      role: "chief_of_staff",
      title: candidate.title,
      avatar: candidate.avatar,
      department: "Executive",
      personality: candidate.personality,
      leadership_style: candidate.leadership_style,
      status: "executing",
      cost_per_cycle: 120,
      tokens_burned: 0,
      efficiency_rating: 96,
      last_thought: `Assumed command as Chief of Staff for ${this.state.blueprint?.company_name || "Enterprise"}. Deploying specialist team.`
    };

    // Deduct recruitment cost
    this.state.capital_treasury = Math.max(0, this.state.capital_treasury - candidate.recruitment_cost);
    this.state.chief_of_staff = cosRole;
    this.state.phase = "autonomous_execution";

    // Spawn specialist sub-agents dynamically based on blueprint
    const bp = this.state.blueprint || defaultBlueprint;
    const specialistAgents: AgentRole[] = [
      {
        id: `agent_dev_${Math.random().toString(36).substr(2, 5)}`,
        name: "Kaelen Voss",
        role: "lead_developer",
        title: "Principal Systems Engineer",
        avatar: "💻",
        department: "Engineering",
        personality: "Obsessed with clean architecture, sub-millisecond execution, and test coverage.",
        status: "idle",
        cost_per_cycle: 90,
        tokens_burned: 0,
        efficiency_rating: 94,
        parent_agent_id: cosRole.id,
        last_thought: "Analyzing core tech stack requirements and microservices boundary."
      },
      {
        id: `agent_growth_${Math.random().toString(36).substr(2, 5)}`,
        name: "Sienna Ray",
        role: "growth_marketer",
        title: "Head of Viral Distribution & Growth",
        avatar: "📈",
        department: "Growth",
        personality: "Data-driven growth hacker, master of organic acquisition funnels and social proof engineering.",
        status: "idle",
        cost_per_cycle: 75,
        tokens_burned: 0,
        efficiency_rating: 89,
        parent_agent_id: cosRole.id,
        last_thought: "Mapping high-intent target persona touchpoints and conversion levers."
      },
      {
        id: `agent_ui_${Math.random().toString(36).substr(2, 5)}`,
        name: "Zephyr Thorne",
        role: "ui_ux_designer",
        title: "Design Systems Lead",
        avatar: "🎨",
        department: "Design",
        personality: "Minimalist visionary, crafts hyper-refined high-contrast technical UI and intuitive flows.",
        status: "idle",
        cost_per_cycle: 65,
        tokens_burned: 0,
        efficiency_rating: 92,
        parent_agent_id: cosRole.id,
        last_thought: "Establishing typographic scale, dark obsidian tokens, and micro-interactions."
      },
      {
        id: `agent_sec_${Math.random().toString(36).substr(2, 5)}`,
        name: "Valerie Croft",
        role: "security_analyst",
        title: "Chief Information Security Analyst",
        avatar: "🔒",
        department: "Security",
        personality: "Paranoid ethical hacker, zero-trust evangelist, compliance hardener.",
        status: "idle",
        cost_per_cycle: 85,
        tokens_burned: 0,
        efficiency_rating: 95,
        parent_agent_id: cosRole.id,
        last_thought: "Reviewing data boundary policies, API authentication schemas, and threat vectors."
      },
      {
        id: `agent_content_${Math.random().toString(36).substr(2, 5)}`,
        name: "Dorian Grey",
        role: "content_author",
        title: "Brand Strategist & Narrative Architect",
        avatar: "✍️",
        department: "Product",
        personality: "Punchy technical copywriter, articulates enterprise value propositions with zero fluff.",
        status: "idle",
        cost_per_cycle: 60,
        tokens_burned: 0,
        efficiency_rating: 88,
        parent_agent_id: cosRole.id,
        last_thought: "Drafting technical launch manifesto and developer ecosystem documentation."
      }
    ];

    this.state.active_agents = [cosRole, ...specialistAgents];

    // Generate initial roadmap tasks
    const devId = specialistAgents[0].id;
    const growthId = specialistAgents[1].id;
    const designId = specialistAgents[2].id;
    const secId = specialistAgents[3].id;
    const contentId = specialistAgents[4].id;

    this.state.tasks = [
      {
        id: `task_${Math.random().toString(36).substr(2, 6)}`,
        title: `Architect Core ${bp.company_name} Infrastructure`,
        description: `Design high-throughput, low-latency API contracts and database schema optimized for ${bp.industry}.`,
        department: "Engineering",
        assigned_to_role_id: devId,
        status: "in_progress",
        priority: "critical",
        cost: 1200,
        revenue_yield: 4200,
        progress: 25,
        requires_hitl: false,
        created_at_cycle: 1
      },
      {
        id: `task_${Math.random().toString(36).substr(2, 6)}`,
        title: "Establish Dark Obsidian Technical Design System",
        description: "Construct tokens, layout hierarchy, and component wireframes for enterprise executive view.",
        department: "Design",
        assigned_to_role_id: designId,
        status: "in_progress",
        priority: "high",
        cost: 750,
        revenue_yield: 2500,
        progress: 40,
        requires_hitl: false,
        created_at_cycle: 1
      },
      {
        id: `task_${Math.random().toString(36).substr(2, 6)}`,
        title: `GTM Launch: Phase 1 High-Intent Organic Campaign`,
        description: `Develop targeted outreach strategy for early enterprise adopters in ${bp.industry} with automated nurture sequences.`,
        department: "Growth",
        assigned_to_role_id: growthId,
        status: "backlog",
        priority: "high",
        cost: 1600,
        revenue_yield: 6000,
        progress: 0,
        requires_hitl: true, // Triggers HITL because cost > threshold
        created_at_cycle: 1
      },
      {
        id: `task_${Math.random().toString(36).substr(2, 6)}`,
        title: "Zero-Trust Threat Modeling & Security Hardening",
        description: "Conduct simulated penetration tests, establish audit logging, and enforce RBAC policy schemas.",
        department: "Security",
        assigned_to_role_id: secId,
        status: "backlog",
        priority: "medium",
        cost: 900,
        revenue_yield: 3100,
        progress: 0,
        requires_hitl: false,
        created_at_cycle: 1
      },
      {
        id: `task_${Math.random().toString(36).substr(2, 6)}`,
        title: `Author ${bp.company_name} Whitepaper & Technical Manifesto`,
        description: "Publish authoritative market positioning paper highlighting competitive moats and technological edge.",
        department: "Product",
        assigned_to_role_id: contentId,
        status: "backlog",
        priority: "medium",
        cost: 550,
        revenue_yield: 1900,
        progress: 0,
        requires_hitl: false,
        created_at_cycle: 1
      }
    ];

    this.addLog(
      cosRole.id,
      cosRole.name,
      "action",
      `Chief of Staff ${cosRole.name} hired (-${candidate.recruitment_cost} $CLIP). Activated 5 specialist sub-agents and loaded operational roadmap.`
    );

    this.notify();
    return this.getState();
  }

  // --- Phase 4: Heartbeat Loop & LangGraph Multi-Agent Orchestration ---
  public advanceSimulationCycle(): EnterpriseState {
    if (this.state.phase !== "autonomous_execution" || this.state.simulation_speed === 0) {
      return this.getState();
    }

    this.state.heartbeat_count += 1;
    const cycle = this.state.heartbeat_count;

    // 1. Check backlog tasks and trigger HITL approvals if applicable
    const strictness = this.state.hitl_strictness;
    const threshold = this.state.hitl_cost_threshold;

    for (const task of this.state.tasks) {
      if (task.status === "backlog") {
        let needsApproval = false;
        if (strictness === "all") {
          needsApproval = true;
        } else if (strictness === "high_cost_only" && (task.cost >= threshold || task.requires_hitl)) {
          needsApproval = true;
        }

        const existingApproval = this.state.approvals.find(a => a.task_id === task.id && a.status === "pending");
        if (needsApproval && !existingApproval) {
          task.status = "pending_approval";
          const assignedAgent = this.state.active_agents.find(a => a.id === task.assigned_to_role_id);
          const newApproval: ApprovalRequest = {
            id: `appr_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            task_id: task.id,
            title: task.title,
            description: task.description,
            proposed_by_role: assignedAgent?.title || "Specialist Agent",
            proposed_by_name: assignedAgent?.name || "Autonomous Sub-Agent",
            budget_impact: task.cost,
            risk_level: task.cost >= 2000 ? "critical" : task.cost >= 1200 ? "high" : "medium",
            status: "pending",
            timestamp: new Date().toLocaleTimeString("en-US", { hour12: false }),
            strategic_justification: `High-ROI enterprise sprint. Projected revenue yield: +${task.revenue_yield?.toLocaleString() || 0} $CLIP points.`,
            alternative_option: "Defer execution to protect current treasury runway."
          };
          this.state.approvals.unshift(newApproval);
          this.addLog(
            assignedAgent?.id || "system",
            assignedAgent?.name || "Orchestrator",
            "approval",
            `[HITL INTERRUPT] Task '${task.title}' requires CEO approval (Budget: ${task.cost} $CLIP).`
          );
        } else if (!needsApproval) {
          task.status = "in_progress";
        }
      }
    }

    // 2. Advance In-Progress Tasks
    let cycleBurn = 0;

    for (const agent of this.state.active_agents) {
      // Find task assigned to agent
      const activeTask = this.state.tasks.find(t => t.assigned_to_role_id === agent.id && t.status === "in_progress");
      if (activeTask) {
        agent.status = "executing";
        agent.current_task = activeTask.title;
        agent.tokens_burned += Math.floor(Math.random() * 250 + 200);

        // Advance task progress
        const progressIncrement = Math.floor(Math.random() * 15 + 15);
        activeTask.progress = Math.min(100, activeTask.progress + progressIncrement);

        agent.last_thought = `Executing sprint for '${activeTask.title}' [${activeTask.progress}% completed]`;

        if (activeTask.progress >= 100) {
          activeTask.status = "completed";
          activeTask.completed_at_cycle = cycle;
          agent.status = "idle";
          agent.current_task = undefined;

          // Generate dynamic deliverables / artifacts
          const artifactContent = this.generateDeliverableArtifact(activeTask);
          activeTask.artifacts = [artifactContent];

          // Grant revenue yield to treasury
          const revenue = activeTask.revenue_yield || 0;
          this.state.total_revenue_generated += revenue;
          this.state.capital_treasury += revenue;

          if (!this.state.completed_milestones.includes(activeTask.title)) {
            this.state.completed_milestones.push(activeTask.title);
          }

          // Trigger automated agent tool execution & SQLite+Vec semantic memory recording
          if (agent.department === "Engineering") {
            executeAgentTool(
              "write_file",
              {
                path: `src/modules/${activeTask.id}.ts`,
                content: `// Automated artifact for: ${activeTask.title}\n// Department: Engineering\nexport const artifact_${activeTask.id.replace(/-/g, "_")} = {\n  task: "${activeTask.title.replace(/"/g, '\\"')}",\n  yield: ${revenue},\n  cycle: ${cycle},\n  timestamp: "${new Date().toISOString()}"\n};\n`
              },
              agent.id,
              agent.name
            ).then(() => {
              this.state.recent_tool_executions = getRecentToolExecutions();
            }).catch(() => {});
          } else if (agent.department === "Growth") {
            executeAgentTool(
              "web_search",
              { query: activeTask.title, num_results: 2 },
              agent.id,
              agent.name
            ).then(() => {
              this.state.recent_tool_executions = getRecentToolExecutions();
            }).catch(() => {});
          }

          // Store task completion in SQLite+Vec semantic memory
          storeSemanticMemory({
            agentId: agent.id,
            agentName: agent.name,
            category: "reflection",
            content: `Achieved deliverable: '${activeTask.title}'. Generated ${revenue.toLocaleString()} $CLIP yield. Department: ${agent.department}.`,
            importance: Math.min(10, Math.floor(revenue / 500) + 5)
          }).then(() => {
            this.state.memories_count = getSemanticMemoriesCount();
          }).catch(() => {});

          this.addLog(
            agent.id,
            agent.name,
            "milestone",
            `Completed deliverable '${activeTask.title}'! Revenue yield: +${revenue.toLocaleString()} $CLIP.`
          );

          // Chief of Staff dynamically spawns follow-up task
          this.spawnNextRoadmapTask(agent);
        }
      } else {
        const pendingApprovalTask = this.state.tasks.find(t => t.assigned_to_role_id === agent.id && t.status === "pending_approval");
        if (pendingApprovalTask) {
          agent.status = "waiting_approval";
          agent.current_task = pendingApprovalTask.title;
          agent.last_thought = `Awaiting CEO HITL authorization to release ${pendingApprovalTask.cost} $CLIP.`;
        } else {
          agent.status = "idle";
          agent.current_task = undefined;
          agent.last_thought = "Monitoring operational queue for next delegated priority.";
        }
      }

      // Add burn cost for active agents
      if (agent.status === "executing") {
        cycleBurn += agent.cost_per_cycle;
      } else {
        cycleBurn += Math.round(agent.cost_per_cycle * 0.25); // Baseline idle standby cost
      }
    }

    // 3. Reconcile Treasury
    this.state.burn_rate_per_cycle = cycleBurn;
    this.state.capital_treasury = Math.max(0, this.state.capital_treasury - cycleBurn);

    // Heartbeat log every 3 cycles
    if (cycle % 3 === 0) {
      this.addLog(
        "system",
        "Treasury Controller",
        "finance",
        `Heartbeat #${cycle}: Treasury: ${this.state.capital_treasury.toLocaleString()} $CLIP | Burn: -${cycleBurn} $CLIP/cycle.`
      );
    }

    this.notify();
    return this.getState();
  }

  private generateDeliverableArtifact(task: Task) {
    if (task.department === "Engineering") {
      return {
        title: `Production Service Architecture: ${task.title}`,
        type: "code" as const,
        language: "typescript",
        content: `// Automated Production Deliverable for: ${task.title}
// Generated by Autonomous Agent Engineering Cluster
import { createServer } from 'node:http';
import { AgentTelemetryBus } from '@enterprise/telemetry';

export interface EnterpriseClusterConfig {
  serviceId: string;
  throughputLimit: number;
  autoHealEnabled: boolean;
  quorumThreshold: number;
}

export class CoreMicroserviceNode {
  private config: EnterpriseClusterConfig;
  private telemetry = new AgentTelemetryBus();

  constructor(config: EnterpriseClusterConfig) {
    this.config = config;
    this.telemetry.logEvent('NODE_INITIALIZED', { id: config.serviceId });
  }

  public async handleAutonomousHeartbeat(cycleId: number): Promise<{ success: boolean; latencyMs: number }> {
    const start = performance.now();
    // Deterministic state consensus verification
    const verified = await this.telemetry.verifyConsensus(cycleId);
    return {
      success: verified,
      latencyMs: Math.round(performance.now() - start)
    };
  }
}
// Status: Production Ready | Verification: 100% Passed`
      };
    } else if (task.department === "Design") {
      return {
        title: `Design Tokens & Wireframe Specs: ${task.title}`,
        type: "diagram" as const,
        language: "json",
        content: `{
  "system": "Dark Obsidian Enterprise Design Language",
  "version": "2.4.0",
  "tokens": {
    "colors": {
      "surface_base": "#090D16",
      "surface_elevated": "#0F172A",
      "accent_cyan": "#06B6D4",
      "accent_emerald": "#10B981",
      "text_primary": "#F8FAFC",
      "border_subtle": "#1E293B"
    },
    "typography": {
      "display": "Space Grotesk / Inter Display",
      "mono": "JetBrains Mono",
      "ratio": 1.25
    },
    "layout_grid": "12-column adaptive bento grid with 24px gutters"
  },
  "approved_components": ["TreasuryMeter", "AgentHierarchyTree", "HITLApprovalDrawer", "EventStreamTicker"]
}`
      };
    } else if (task.department === "Growth") {
      return {
        title: `GTM Campaign Funnel: ${task.title}`,
        type: "marketing" as const,
        language: "markdown",
        content: `# Enterprise Go-To-Market Execution Matrix
**Target Audience**: Global 2000 CTOs, Autonomous AI Engineers
**Primary Value Prop**: 10x Operational Throughput with Guaranteed Auditable Control

### Campaign Touchpoints
1. **Developer Ecosystem**: Open-source SDK release on GitHub + Interactive Sandbox.
2. **Keynote Case Study**: "How Autonomous Agents Cut SRE Cloud Waste by 44% in 30 Days".
3. **Outbound Pipeline**: Automated personalized email drip targeting 500 Enterprise VPs of Engineering.
- Projected MQLs: 1,450
- Projected Pipeline Yield: $850,000 ARR`
      };
    } else {
      return {
        title: `Executive Strategic Brief: ${task.title}`,
        type: "document" as const,
        language: "markdown",
        content: `# Operational Audit & Strategy Directive
**Prepared for**: Chief Executive Officer
**Review Rating**: Passed All Governance Checks

The enterprise autonomous loop has successfully codified and executed this milestone.
- Operational Efficiency Rating: 94.6%
- Unit Economics: Positive contribution margin
- Compliance: ISO27001 / SOC2 Type II mapped`
      };
    }
  }

  private spawnNextRoadmapTask(agent: AgentRole) {
    const bp = this.state.blueprint || defaultBlueprint;
    const taskTemplates = [
      {
        title: `Scale Distributed Message Bus for ${bp.company_name}`,
        description: "Expand broker partitions to support 50,000 events/sec with sub-second latency.",
        department: "Engineering" as const,
        cost: 1400,
        yield: 5200,
        hitl: false
      },
      {
        title: "Automate Cross-Platform Customer Acquisition Ad Loops",
        description: "Deploy real-time ad bidding agents targeting high-intent developer keywords.",
        department: "Growth" as const,
        cost: 2100,
        yield: 7500,
        hitl: true
      },
      {
        title: "Interactive CEO Analytics Dashboard & Mobile PWA Spec",
        description: "Refine responsive executive command interface with real-time push alerts.",
        department: "Design" as const,
        cost: 800,
        yield: 2800,
        hitl: false
      },
      {
        title: "Automated Penetration Test & Smart Contract Security Audit",
        description: "Simulate red-team vector injections and generate cryptographically signed audit seal.",
        department: "Security" as const,
        cost: 1300,
        yield: 4600,
        hitl: false
      }
    ];

    const nextTemplate = taskTemplates[Math.floor(Math.random() * taskTemplates.length)];
    const newTask: Task = {
      id: `task_${Math.random().toString(36).substr(2, 6)}`,
      title: nextTemplate.title,
      description: nextTemplate.description,
      department: nextTemplate.department,
      assigned_to_role_id: agent.id,
      status: "backlog",
      priority: nextTemplate.hitl ? "high" : "medium",
      cost: nextTemplate.cost,
      revenue_yield: nextTemplate.yield,
      progress: 0,
      requires_hitl: nextTemplate.hitl,
      created_at_cycle: this.state.heartbeat_count
    };

    this.state.tasks.push(newTask);
    this.addLog(
      this.state.chief_of_staff?.id || "cos",
      this.state.chief_of_staff?.name || "Chief of Staff",
      "thought",
      `Chief of Staff scheduled next operational sprint: '${newTask.title}'.`
    );
  }

  public submitApproval(taskId: string, decision: "approved" | "rejected", guidance?: string): ApprovalRequest | null {
    const task = this.state.tasks.find(t => t.id === taskId);
    const approval = this.state.approvals.find(a => a.task_id === taskId);

    if (!task || !approval) return null;

    if (decision === "approved") {
      task.status = "in_progress";
      approval.status = "approved";
      this.addLog(
        "ceo",
        "Executive CEO",
        "approval",
        `CEO APPROVED execution for '${task.title}' (-${task.cost} $CLIP).`
      );
    } else {
      task.status = "failed";
      approval.status = "rejected";
      this.addLog(
        "ceo",
        "Executive CEO",
        "approval",
        `CEO REJECTED execution for '${task.title}'. Guidance: ${guidance || "Conserve treasury resources."}`
      );
    }

    this.notify();
    return approval;
  }

  public executeCeoAction(action: string, payload: Record<string, unknown>) {
    if (action === "set_speed") {
      const speed = Number(payload.speed ?? 1);
      this.state.simulation_speed = speed;
      this.addLog("ceo", "Executive CEO", "action", `Simulation speed set to ${speed}x.`);
    } else if (action === "set_strictness") {
      const strictness = payload.strictness as EnterpriseState["hitl_strictness"];
      this.state.hitl_strictness = strictness;
      if (payload.threshold) {
        this.state.hitl_cost_threshold = Number(payload.threshold);
      }
      this.addLog("ceo", "Executive CEO", "action", `HITL strictness updated to: ${strictness}.`);
    } else if (action === "inject_capital") {
      const amount = Number(payload.amount ?? 25000);
      this.state.capital_treasury += amount;
      this.addLog("ceo", "Executive CEO", "finance", `CEO authorized emergency treasury injection: +${amount.toLocaleString()} $CLIP.`);
    } else if (action === "issue_directive") {
      const directive = String(payload.directive || "");
      const cos = this.state.chief_of_staff;
      const newTask: Task = {
        id: `task_${Math.random().toString(36).substr(2, 6)}`,
        title: `CEO Directive: ${directive.substring(0, 45)}...`,
        description: directive,
        department: "Executive",
        assigned_to_role_id: cos?.id || this.state.active_agents[0]?.id || "agent_main",
        status: "in_progress",
        priority: "critical",
        cost: 600,
        revenue_yield: 3500,
        progress: 10,
        requires_hitl: false,
        created_at_cycle: this.state.heartbeat_count
      };
      this.state.tasks.unshift(newTask);
      this.addLog("ceo", "Executive CEO", "action", `Priority CEO Directive dispatched: "${directive}".`);
    }

    this.notify();
    return this.getState();
  }

  // --- Simulation Loop & Lifecycle Controls ---
  public startSimulation() {
    this.state.is_running = true;
    if (this.state.simulation_speed === 0) {
      this.state.simulation_speed = 1;
    }
    if (this.timer) {
      clearInterval(this.timer);
    }
    const intervalMs = Math.max(800, Math.floor(3000 / (this.state.simulation_speed || 1)));
    this.timer = setInterval(() => {
      if (this.state.phase === "autonomous_execution") {
        this.advanceSimulationCycle();
      }
    }, intervalMs);
    this.notify();
  }

  public pauseSimulation() {
    this.state.is_running = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.notify();
  }

  public stepHeartbeat(): EnterpriseState {
    return this.advanceSimulationCycle();
  }

  public setSimulationSpeed(speed: number) {
    this.state.simulation_speed = speed;
    if (speed === 0) {
      this.pauseSimulation();
    } else {
      if (this.state.is_running) {
        this.startSimulation();
      }
    }
    this.notify();
  }

  public resetSimulation() {
    this.pauseSimulation();
    this.state = {
      is_initialized: false,
      is_running: false,
      phase: "onboarding",
      blueprint: { ...defaultBlueprint },
      valuation: null,
      chief_of_staff: null,
      cos_candidates: this.getChiefOfStaffCandidates(),
      active_agents: [],
      tasks: [],
      approvals: [],
      capital_treasury: 100000,
      initial_capital: 100000,
      burn_rate_per_cycle: 0,
      total_revenue_generated: 0,
      heartbeat_count: 0,
      simulation_speed: 1,
      hitl_strictness: "high_cost_only",
      hitl_cost_threshold: 1000,
      logs: [],
      completed_milestones: [],
      settings: getSystemSettings(),
      recent_tool_executions: getRecentToolExecutions(),
      memories_count: getSemanticMemoriesCount()
    };
    this.addLog("system", "System Kernel", "milestone", "Paperclip Enterprise Simulator reset to factory state.");
    this.notify();
  }

  public updateSettings(partial: Partial<EnterpriseSystemSettings>) {
    const updated = updateSystemSettings(partial);
    this.state.settings = updated;
    this.addLog("ceo", "Executive CEO", "action", "System settings updated: OpenAI endpoint & workspace configuration applied.");
    this.notify();
    return updated;
  }

  public async executeToolDirectly(
    toolName: ToolExecution["toolName"],
    args: Record<string, unknown>,
    agentId?: string,
    agentName?: string
  ) {
    const res = await executeAgentTool(toolName, args, agentId, agentName);
    this.state.recent_tool_executions = getRecentToolExecutions();
    this.state.memories_count = getSemanticMemoriesCount();
    this.notify();
    return res;
  }

  public updateBlueprint(blueprint: BusinessBlueprint) {
    this.state.blueprint = { ...blueprint };
    this.notify();
  }

  public evaluateInvestorTermSheet(): InvestorValuation {
    const bp = this.state.blueprint || defaultBlueprint;
    const { valuation } = this.launchEnterprise(bp);
    return valuation;
  }

  public advanceToChiefOfStaffSelection() {
    this.state.phase = "chief_selection";
    this.state.cos_candidates = this.getChiefOfStaffCandidates();
    this.addLog("system", "Executive Board", "milestone", "Venture capital confirmed. Recruiter portal unlocked for Chief of Staff selection.");
    this.notify();
  }

  public submitApprovalDecision(taskId: string, decision: "approved" | "rejected", guidance?: string) {
    return this.submitApproval(taskId, decision, guidance);
  }

  public issueCeoDirective(directive: string) {
    return this.executeCeoAction("issue_directive", { directive });
  }

  public injectCapital(amount: number) {
    return this.executeCeoAction("inject_capital", { amount });
  }

  public setGovernanceStrictness(strictness: EnterpriseState["hitl_strictness"], threshold?: number) {
    return this.executeCeoAction("set_strictness", { strictness, threshold });
  }
}

// Global singleton instance across Next.js dev server requests
declare global {
  var __enterpriseSimulationEngine: SimulationEngine | undefined;
}

export const getSimulationEngine = (): SimulationEngine => {
  if (!global.__enterpriseSimulationEngine) {
    global.__enterpriseSimulationEngine = new SimulationEngine();
  }
  return global.__enterpriseSimulationEngine;
};
