"""
Enterprise State Schemas and LangGraph State definitions.
"""
from typing import TypedDict, List, Dict, Optional, Any, Literal
from pydantic import BaseModel, Field


class BrandIdentity(BaseModel):
    archetype: str
    tone: str
    color_palette: List[str] = Field(default_factory=list)


class BusinessBlueprint(BaseModel):
    company_name: str
    ticker: str
    tagline: str
    industry: str
    target_audience: str
    revenue_model: str
    vision: str
    core_value_prop: str
    tech_stack: List[str] = Field(default_factory=list)
    brand_identity: BrandIdentity
    initial_kpis: List[str] = Field(default_factory=list)
    readiness_score: int = Field(default=0, ge=0, le=100)
    gtm_strategy: str


class InvestorValuation(BaseModel):
    valuation_usd: float
    initial_capital: float
    investor_name: str
    firm_name: str
    thesis: str
    risk_rating: Literal["A+", "A", "B+", "B", "Speculative"]
    equity_stake_percent: float
    term_sheet_notes: List[str] = Field(default_factory=list)


class AgentRole(BaseModel):
    id: str
    name: str
    role: str
    title: str
    avatar: str
    department: Literal["Executive", "Engineering", "Design", "Growth", "Security", "Product"]
    personality: str
    leadership_style: Optional[str] = None
    status: Literal["idle", "thinking", "executing", "waiting_approval", "completed"] = "idle"
    current_task: Optional[str] = None
    cost_per_cycle: float = 50.0
    tokens_burned: int = 0
    efficiency_rating: int = 85
    parent_agent_id: Optional[str] = None
    last_thought: Optional[str] = None


class TaskArtifact(BaseModel):
    title: str
    type: Literal["code", "document", "diagram", "metrics", "marketing"]
    content: str
    language: Optional[str] = None


class Task(BaseModel):
    id: str
    title: str
    description: str
    department: Literal["Engineering", "Design", "Growth", "Security", "Executive", "Product"]
    assigned_to_role_id: str
    status: Literal["backlog", "in_progress", "pending_approval", "completed", "failed"] = "backlog"
    priority: Literal["low", "medium", "high", "critical"] = "medium"
    cost: float
    revenue_yield: float = 0.0
    progress: int = 0
    requires_hitl: bool = False
    artifacts: List[TaskArtifact] = Field(default_factory=list)
    created_at_cycle: int = 0
    completed_at_cycle: Optional[int] = None


class ApprovalRequest(BaseModel):
    id: str
    task_id: str
    title: str
    description: str
    proposed_by_role: str
    proposed_by_name: str
    budget_impact: float
    risk_level: Literal["low", "medium", "high", "critical"]
    status: Literal["pending", "approved", "rejected"] = "pending"
    timestamp: str
    strategic_justification: str
    alternative_option: Optional[str] = None


class EnterpriseLog(BaseModel):
    id: str
    cycle: int
    timestamp: str
    agent_id: str
    agent_name: str
    type: Literal["heartbeat", "thought", "action", "approval", "finance", "milestone", "alert"]
    message: str
    metadata: Dict[str, Any] = Field(default_factory=dict)


# LangGraph State Definition
class EnterpriseGraphState(TypedDict):
    """The central state dictionary mutated across LangGraph agent nodes."""
    blueprint: Optional[Dict[str, Any]]
    valuation: Optional[Dict[str, Any]]
    chief_of_staff: Optional[Dict[str, Any]]
    active_agents: List[Dict[str, Any]]
    tasks: List[Dict[str, Any]]
    approvals: List[Dict[str, Any]]
    capital_treasury: float
    initial_capital: float
    burn_rate_per_cycle: float
    total_revenue_generated: float
    heartbeat_count: int
    hitl_strictness: str  # "all" | "high_cost_only" | "auto_pilot"
    hitl_cost_threshold: float
    hitl_interrupt_pending: bool
    current_interrupt_task_id: Optional[str]
    ceo_decision: Optional[str]  # "approved" | "rejected"
    ceo_guidance: Optional[str]
    logs: List[Dict[str, Any]]
    completed_milestones: List[str]
    phase: str
