"""
LangGraph Multi-Agent Workflow Specification for Paperclip Enterprise.

Defines the stateful graph with human-in-the-loop (HITL) interrupt gates,
directed edge transitions, agent delegation, and state mutations.
"""
from typing import Dict, Any, Literal
import datetime
import uuid

try:
    from langgraph.graph import StateGraph, END
    from backend.state import EnterpriseGraphState
except ImportError:
    # Fallback representation for environments without langgraph pre-installed
    StateGraph = None
    END = "__end__"
    EnterpriseGraphState = dict

from backend.agents import spawn_sub_agents_for_blueprint, generate_initial_roadmap_tasks


def investor_valuation_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Evaluates the BusinessBlueprint and assigns enterprise valuation and capital pool."""
    blueprint = state.get("blueprint", {})
    readiness = blueprint.get("readiness_score", 85)
    industry = blueprint.get("industry", "Deep Tech")
    company_name = blueprint.get("company_name", "Enterprise")

    # Valuation algorithm grounded in readiness and industry multiplier
    base_val = 3_000_000.0
    multiplier = 1.0 + (readiness / 100.0) * 0.8
    if "AI" in industry or "Autonomous" in industry:
        multiplier += 0.5
    
    valuation_usd = round(base_val * multiplier, -4)
    initial_capital = round(valuation_usd * 0.05, -3)  # 5% capital allocation as virtual points ($CLIP)

    valuation = {
        "valuation_usd": valuation_usd,
        "initial_capital": initial_capital,
        "investor_name": "Sovereign Frontier Ventures",
        "firm_name": "Apex Syndicate Capital",
        "thesis": f"High conviction in {company_name}'s autonomous execution capability within the {industry} sector.",
        "risk_rating": "A" if readiness > 80 else "B+",
        "equity_stake_percent": 12.5,
        "term_sheet_notes": [
            f"Pre-money valuation indexed at ${valuation_usd:,.0f} USD.",
            f"Initial treasury endowment of {initial_capital:,.0f} $CLIP granted.",
            "Board seat reserved; CEO maintains super-voting governance with HITL veto."
        ]
    }

    return {
        "valuation": valuation,
        "capital_treasury": initial_capital,
        "initial_capital": initial_capital,
        "phase": "chief_selection"
    }


def chief_of_staff_orchestrator_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Chief of Staff node:
    - Parses blueprint and current task pipeline
    - Spawns specialist sub-agents if not yet spawned
    - Delegates new tasks or promotes backlog items
    - Assesses pending approvals according to HITL strictness
    """
    blueprint = state.get("blueprint") or {}
    cos = state.get("chief_of_staff") or {}
    active_agents = state.get("active_agents") or []
    tasks = state.get("tasks") or []
    approvals = state.get("approvals") or []
    strictness = state.get("hitl_strictness", "high_cost_only")
    threshold = state.get("hitl_cost_threshold", 1000.0)
    cycle = state.get("heartbeat_count", 0) + 1

    # 1. Spawn sub-agents if initial setup
    if not active_agents and blueprint:
        active_agents = spawn_sub_agents_for_blueprint(blueprint, cos.get("id", "cos_main"))
        tasks = generate_initial_roadmap_tasks(blueprint, active_agents)

    # 2. Check for tasks requiring CEO Approval
    hitl_pending = False
    current_interrupt_task_id = None

    for t in tasks:
        if t["status"] == "backlog":
            # Decide if task needs CEO approval based on strictness
            needs_approval = False
            if strictness == "all":
                needs_approval = True
            elif strictness == "high_cost_only" and t["cost"] >= threshold:
                needs_approval = True
            elif t.get("requires_hitl", False):
                needs_approval = True

            if needs_approval and not any(a["task_id"] == t["id"] and a["status"] == "pending" for a in approvals):
                t["status"] = "pending_approval"
                hitl_pending = True
                current_interrupt_task_id = t["id"]

                # Find proposing agent
                agent = next((a for a in active_agents if a["id"] == t["assigned_to_role_id"]), None)
                agent_name = agent["name"] if agent else cos.get("name", "Chief of Staff")
                agent_role = agent["title"] if agent else "Executive Office"

                approvals.append({
                    "id": f"appr_{uuid.uuid4().hex[:6]}",
                    "task_id": t["id"],
                    "title": t["title"],
                    "description": t["description"],
                    "proposed_by_role": agent_role,
                    "proposed_by_name": agent_name,
                    "budget_impact": t["cost"],
                    "risk_level": "high" if t["cost"] > 2000 else "medium",
                    "status": "pending",
                    "timestamp": datetime.datetime.now().strftime("%H:%M:%S"),
                    "strategic_justification": f"Essential operational milestone yielding up to ${t.get('revenue_yield', 0):,.0f} $CLIP in enterprise equity.",
                    "alternative_option": "Delay execution to preserve current treasury runway."
                })
                break
            elif not needs_approval:
                t["status"] = "in_progress"

    return {
        "active_agents": active_agents,
        "tasks": tasks,
        "approvals": approvals,
        "heartbeat_count": cycle,
        "hitl_interrupt_pending": hitl_pending,
        "current_interrupt_task_id": current_interrupt_task_id
    }


def hitl_gate_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Human-In-The-Loop gate node.
    In LangGraph runtime, this is configured with `interrupt_before` or `interrupt()`.
    """
    decision = state.get("ceo_decision")
    task_id = state.get("current_interrupt_task_id")
    tasks = state.get("tasks", [])
    approvals = state.get("approvals", [])

    if decision and task_id:
        target_task = next((t for t in tasks if t["id"] == task_id), None)
        target_approval = next((a for a in approvals if a["task_id"] == task_id), None)

        if decision == "approved":
            if target_task:
                target_task["status"] = "in_progress"
            if target_approval:
                target_approval["status"] = "approved"
        elif decision == "rejected":
            if target_task:
                target_task["status"] = "failed"
            if target_approval:
                target_approval["status"] = "rejected"

    # Reset interrupt triggers
    return {
        "tasks": tasks,
        "approvals": approvals,
        "hitl_interrupt_pending": False,
        "current_interrupt_task_id": None,
        "ceo_decision": None
    }


def specialist_execution_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Specialist agents execute tasks in progress:
    - Increments progress
    - Synthesizes artifacts (code, documentation, designs) upon completion
    - Updates agent statuses
    """
    tasks = state.get("tasks", [])
    active_agents = state.get("active_agents", [])
    completed_milestones = state.get("completed_milestones", [])
    total_rev = state.get("total_revenue_generated", 0.0)
    treasury = state.get("capital_treasury", 0.0)
    cycle = state.get("heartbeat_count", 0)

    for task in tasks:
        if task["status"] == "in_progress":
            task["progress"] = min(100, task["progress"] + 25)
            
            # Find assigned agent
            agent = next((a for a in active_agents if a["id"] == task["assigned_to_role_id"]), None)
            if agent:
                agent["status"] = "executing"
                agent["current_task"] = task["title"]
                agent["tokens_burned"] += 450
                agent["last_thought"] = f"Executing sub-routine: {task['title']} [Progress {task['progress']}%]"

            if task["progress"] >= 100:
                task["status"] = "completed"
                task["completed_at_cycle"] = cycle
                yield_rev = task.get("revenue_yield", 0.0)
                total_rev += yield_rev
                treasury += yield_rev
                if task["title"] not in completed_milestones:
                    completed_milestones.append(task["title"])

                # Attach completed artifact
                if not task.get("artifacts"):
                    task["artifacts"] = [{
                        "title": f"Deliverable Artifact: {task['title']}",
                        "type": "code" if task["department"] == "Engineering" else "document",
                        "content": f"// Automated production output for {task['title']}\n"
                                   f"// Generated at Cycle #{cycle}\n"
                                   f"// Quality assurance rating: 98.4%\n"
                                   f"export const DeliverableSpecs = {{\n"
                                   f"  department: '{task['department']}',\n"
                                   f"  roiMultiplier: 3.2,\n"
                                   f"  status: 'VERIFIED_ACTIVE'\n"
                                   f"}};"
                    }]
                if agent:
                    agent["status"] = "idle"
                    agent["current_task"] = None

    return {
        "tasks": tasks,
        "active_agents": active_agents,
        "completed_milestones": completed_milestones,
        "total_revenue_generated": total_rev,
        "capital_treasury": treasury
    }


def treasury_reconcile_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Deducts operating cycle burn rate from treasury based on active agents.
    Calculates runway and emits telemetry logs.
    """
    active_agents = state.get("active_agents", [])
    treasury = state.get("capital_treasury", 0.0)
    cycle = state.get("heartbeat_count", 0)
    logs = state.get("logs", [])

    burn = sum(a.get("cost_per_cycle", 50.0) for a in active_agents if a.get("status") in ["executing", "thinking"])
    treasury = max(0.0, treasury - burn)

    # Append heartbeat log
    logs.append({
        "id": f"log_{uuid.uuid4().hex[:6]}",
        "cycle": cycle,
        "timestamp": datetime.datetime.now().strftime("%H:%M:%S"),
        "agent_id": "system",
        "agent_name": "Enterprise Controller",
        "type": "heartbeat",
        "message": f"Cycle #{cycle} complete: Burn -{burn:.0f} $CLIP | Treasury balance {treasury:,.0f} $CLIP",
        "metadata": {"burn": burn, "treasury": treasury}
    })

    return {
        "capital_treasury": treasury,
        "burn_rate_per_cycle": burn,
        "logs": logs[-100:]  # Keep last 100 logs
    }


def route_next_step(state: Dict[str, Any]) -> Literal["hitl_gate", "specialist_execution", "treasury_reconcile"]:
    """Conditional router determining whether to pause at HITL gate or proceed."""
    if state.get("hitl_interrupt_pending"):
        return "hitl_gate"
    return "specialist_execution"


def build_enterprise_graph():
    """Compiles the stateful LangGraph for the enterprise orchestration."""
    if StateGraph is None:
        return None

    builder = StateGraph(EnterpriseGraphState)

    builder.add_node("investor_valuation", investor_valuation_node)
    builder.add_node("chief_of_staff_orchestrator", chief_of_staff_orchestrator_node)
    builder.add_node("hitl_gate", hitl_gate_node)
    builder.add_node("specialist_execution", specialist_execution_node)
    builder.add_node("treasury_reconcile", treasury_reconcile_node)

    # Edges
    builder.set_entry_point("chief_of_staff_orchestrator")
    builder.add_conditional_edges(
        "chief_of_staff_orchestrator",
        route_next_step,
        {
            "hitl_gate": "hitl_gate",
            "specialist_execution": "specialist_execution"
        }
    )
    builder.add_edge("hitl_gate", "specialist_execution")
    builder.add_edge("specialist_execution", "treasury_reconcile")
    builder.add_edge("treasury_reconcile", END)

    return builder.compile()
