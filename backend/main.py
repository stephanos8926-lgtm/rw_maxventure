"""
FastAPI Server for Paperclip Enterprise Simulator.

Provides full REST and SSE endpoints for the multi-agent orchestration lifecycle:
- Onboarding Concept Artist chat with streaming blueprint generation
- Enterprise launch and Investor valuation
- Chief of Staff candidate generation and selection
- Real-time SSE streaming for heartbeats, agent trees, tasks, and telemetry
- HITL approvals and CEO command directives
"""
import os
import json
import asyncio
import datetime
import uuid
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

from backend.state import BusinessBlueprint, InvestorValuation, AgentRole, Task, ApprovalRequest
from backend.agents import get_default_chief_of_staff_candidates, spawn_sub_agents_for_blueprint, generate_initial_roadmap_tasks
from backend.graph import investor_valuation_node, chief_of_staff_orchestrator_node, specialist_execution_node, treasury_reconcile_node

app = FastAPI(
    title="Paperclip Enterprise Simulator API",
    description="Multi-agent business orchestration backend powered by LangGraph, LangChain, and FastAPI.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global in-memory state repository for the active enterprise
enterprise_state: Dict[str, Any] = {
    "is_initialized": False,
    "phase": "onboarding",
    "blueprint": None,
    "valuation": None,
    "chief_of_staff": None,
    "active_agents": [],
    "tasks": [],
    "approvals": [],
    "capital_treasury": 100000.0,
    "initial_capital": 100000.0,
    "burn_rate_per_cycle": 0.0,
    "total_revenue_generated": 0.0,
    "heartbeat_count": 0,
    "simulation_speed": 1,
    "hitl_strictness": "high_cost_only",
    "hitl_cost_threshold": 1000.0,
    "hitl_interrupt_pending": False,
    "current_interrupt_task_id": None,
    "ceo_decision": None,
    "logs": [],
    "completed_milestones": []
}


# --- Request/Response Models ---
class ConceptChatRequest(BaseModel):
    message: str
    history: List[Dict[str, str]] = []
    current_blueprint: Optional[Dict[str, Any]] = None


class LaunchRequest(BaseModel):
    blueprint: Dict[str, Any]


class SelectChiefRequest(BaseModel):
    chief_id: str


class ApprovalDecisionRequest(BaseModel):
    task_id: str
    decision: str  # "approved" | "rejected"
    guidance: Optional[str] = None


class CeoActionRequest(BaseModel):
    action: str  # "set_speed" | "inject_capital" | "issue_directive" | "set_strictness"
    payload: Dict[str, Any]


# --- Endpoints ---

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "Paperclip Enterprise Backend", "timestamp": datetime.datetime.now().isoformat()}


@app.post("/api/onboarding/concept-chat")
async def concept_chat(request: ConceptChatRequest):
    """
    Simulates the Concept Artist agent analyzing input, asking refined questions,
    and returning structured updates to the Business Blueprint.
    """
    user_msg = request.message
    blueprint = request.current_blueprint or {
        "company_name": "NexusCore",
        "ticker": "NXCR",
        "tagline": "Autonomous Distributed Intelligence",
        "industry": "Artificial Intelligence & Developer Tools",
        "target_audience": "Enterprise Engineering Teams & Autonomous Agent Labs",
        "revenue_model": "Usage-Based Compute + High-Yield Enterprise Licensing",
        "vision": "Empower organizations to deploy 10,000 self-governing software agents with zero manual infrastructure friction.",
        "core_value_prop": "Deterministic, stateful multi-agent execution with cryptographically verified audit trails.",
        "tech_stack": ["TypeScript", "Next.js", "Python", "FastAPI", "LangGraph", "PostgreSQL", "Docker"],
        "brand_identity": {
            "archetype": "The Creator & Ruler",
            "tone": "Authoritative, Precise, Visionary",
            "color_palette": ["#090D16", "#06B6D4", "#10B981", "#E2E8F0"]
        },
        "initial_kpis": [
            "Sub-100ms multi-agent coordination latency",
            "99.98% verifiable transaction execution rate",
            "$500K ARR in pilot enterprise commitments"
        ],
        "readiness_score": 60,
        "gtm_strategy": "Bottom-up developer adoption fueled by open architecture, transitioning into top-down security licenses."
    }

    # Increment readiness and update attributes based on interaction
    readiness = min(100, blueprint.get("readiness_score", 60) + 15)
    blueprint["readiness_score"] = readiness

    # Dynamically adapt blueprint if user specifies details
    if "security" in user_msg.lower():
        blueprint["initial_kpis"].append("SOC2 Type II & Zero-Trust Verification")
    if "b2b" in user_msg.lower() or "enterprise" in user_msg.lower():
        blueprint["target_audience"] = "Global 2000 CTOs & VP of Engineering"

    reply_text = (
        f"Brilliant vision. I've updated the operational blueprint for {blueprint.get('company_name', 'your enterprise')}. "
        f"Readiness index is now at {readiness}%. We've refined the target market, defensible competitive moats, "
        f"and the unit economics model. When you're ready, activate the 'Launch Enterprise' gate to trigger our investor evaluation."
    )

    return {
        "reply": reply_text,
        "blueprint": blueprint,
        "readiness_score": readiness,
        "is_ready_for_launch": readiness >= 85
    }


@app.post("/api/enterprise/launch")
async def launch_enterprise(request: LaunchRequest):
    """
    Finalize blueprint, execute investor valuation, and initialize state machine.
    """
    blueprint = request.blueprint
    blueprint["readiness_score"] = max(85, blueprint.get("readiness_score", 85))

    # Run investor valuation node
    temp_state = {"blueprint": blueprint}
    valuation_result = investor_valuation_node(temp_state)
    valuation = valuation_result["valuation"]

    enterprise_state["is_initialized"] = True
    enterprise_state["phase"] = "launch_valuation"
    enterprise_state["blueprint"] = blueprint
    enterprise_state["valuation"] = valuation
    enterprise_state["capital_treasury"] = valuation["initial_capital"]
    enterprise_state["initial_capital"] = valuation["initial_capital"]

    enterprise_state["logs"].append({
        "id": f"log_{uuid.uuid4().hex[:6]}",
        "cycle": 0,
        "timestamp": datetime.datetime.now().strftime("%H:%M:%S"),
        "agent_id": "investor",
        "agent_name": valuation["investor_name"],
        "type": "milestone",
        "message": f"Enterprise seed valuation issued at ${valuation['valuation_usd']:,.0f} USD. Granted {valuation['initial_capital']:,.0f} $CLIP initial capital.",
        "metadata": {"valuation": valuation}
    })

    return {
        "status": "launched",
        "blueprint": blueprint,
        "valuation": valuation,
        "capital_treasury": enterprise_state["capital_treasury"],
        "next_step": "select_chief_of_staff"
    }


@app.get("/api/enterprise/chief-of-staff-candidates")
async def get_chief_candidates():
    """Returns 3 generated Chief of Staff candidates with distinct traits."""
    candidates = get_default_chief_of_staff_candidates()
    return {"candidates": candidates}


@app.post("/api/enterprise/select-chief")
async def select_chief(request: SelectChiefRequest):
    """Binds the selected Chief of Staff and spawns specialist sub-agents and roadmap."""
    candidates = get_default_chief_of_staff_candidates()
    selected = next((c for c in candidates if c["id"] == request.chief_id), candidates[0])

    cos_role = {
        "id": selected["id"],
        "name": selected["name"],
        "role": "chief_of_staff",
        "title": selected["title"],
        "avatar": selected["avatar"],
        "department": "Executive",
        "personality": selected["personality"],
        "leadership_style": selected["leadership_style"],
        "status": "executing",
        "cost_per_cycle": 150.0,
        "tokens_burned": 0,
        "efficiency_rating": 95,
        "last_thought": f"Assumed command of {enterprise_state.get('blueprint', {}).get('company_name', 'Enterprise')}. Initiating specialist agent deployment."
    }

    enterprise_state["chief_of_staff"] = cos_role
    enterprise_state["phase"] = "autonomous_execution"
    enterprise_state["capital_treasury"] = max(0, enterprise_state["capital_treasury"] - selected["recruitment_cost"])

    # Spawn specialist sub-agents
    blueprint = enterprise_state.get("blueprint") or {}
    sub_agents = spawn_sub_agents_for_blueprint(blueprint, selected["id"])
    enterprise_state["active_agents"] = [cos_role] + sub_agents

    # Generate initial roadmap tasks
    tasks = generate_initial_roadmap_tasks(blueprint, sub_agents)
    enterprise_state["tasks"] = tasks

    enterprise_state["logs"].append({
        "id": f"log_{uuid.uuid4().hex[:6]}",
        "cycle": 1,
        "timestamp": datetime.datetime.now().strftime("%H:%M:%S"),
        "agent_id": selected["id"],
        "agent_name": selected["name"],
        "type": "action",
        "message": f"Chief of Staff {selected['name']} onboarded. Deducted {selected['recruitment_cost']} $CLIP. Spawning {len(sub_agents)} specialist sub-agents.",
        "metadata": {"cos": selected}
    })

    return {
        "status": "chief_selected",
        "chief_of_staff": cos_role,
        "active_agents": enterprise_state["active_agents"],
        "tasks": enterprise_state["tasks"],
        "capital_treasury": enterprise_state["capital_treasury"]
    }


@app.post("/api/enterprise/approval")
async def submit_approval(request: ApprovalDecisionRequest):
    """Submit CEO decision for an interrupted HITL node."""
    task_id = request.task_id
    decision = request.decision
    guidance = request.guidance or ""

    task = next((t for t in enterprise_state["tasks"] if t["id"] == task_id), None)
    approval = next((a for a in enterprise_state["approvals"] if a["task_id"] == task_id), None)

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if decision == "approved":
        task["status"] = "in_progress"
        if approval:
            approval["status"] = "approved"
        msg = f"CEO APPROVED execution of '{task['title']}'."
    else:
        task["status"] = "failed"
        if approval:
            approval["status"] = "rejected"
        msg = f"CEO REJECTED execution of '{task['title']}'. Guidance: {guidance}"

    enterprise_state["logs"].append({
        "id": f"log_{uuid.uuid4().hex[:6]}",
        "cycle": enterprise_state["heartbeat_count"],
        "timestamp": datetime.datetime.now().strftime("%H:%M:%S"),
        "agent_id": "ceo",
        "agent_name": "Executive CEO",
        "type": "approval",
        "message": msg,
        "metadata": {"task_id": task_id, "decision": decision}
    })

    return {
        "status": "decision_recorded",
        "task": task,
        "approval": approval
    }


@app.post("/api/enterprise/action")
async def execute_ceo_action(request: CeoActionRequest):
    """Handle ad-hoc CEO adjustments: speed, strictness, treasury grant, directives."""
    action = request.action
    payload = request.payload

    if action == "set_speed":
        speed = payload.get("speed", 1)
        enterprise_state["simulation_speed"] = speed
        return {"status": "speed_updated", "speed": speed}

    elif action == "set_strictness":
        strictness = payload.get("strictness", "high_cost_only")
        enterprise_state["hitl_strictness"] = strictness
        threshold = payload.get("threshold", 1000.0)
        enterprise_state["hitl_cost_threshold"] = threshold
        return {"status": "strictness_updated", "strictness": strictness, "threshold": threshold}

    elif action == "inject_capital":
        amount = payload.get("amount", 25000.0)
        enterprise_state["capital_treasury"] += amount
        enterprise_state["logs"].append({
            "id": f"log_{uuid.uuid4().hex[:6]}",
            "cycle": enterprise_state["heartbeat_count"],
            "timestamp": datetime.datetime.now().strftime("%H:%M:%S"),
            "agent_id": "ceo",
            "agent_name": "Executive CEO",
            "type": "finance",
            "message": f"CEO injected emergency treasury grant of +{amount:,.0f} $CLIP.",
            "metadata": {"amount": amount}
        })
        return {"status": "capital_injected", "new_balance": enterprise_state["capital_treasury"]}

    elif action == "issue_directive":
        directive = payload.get("directive", "")
        # Add new priority task from CEO
        cos = enterprise_state.get("chief_of_staff")
        new_task = {
            "id": f"task_{uuid.uuid4().hex[:6]}",
            "title": f"CEO Priority Directive: {directive[:40]}...",
            "description": directive,
            "department": "Executive",
            "assigned_to_role_id": cos.get("id", "cos_main") if cos else "cos_main",
            "status": "in_progress",
            "priority": "critical",
            "cost": 500.0,
            "revenue_yield": 2500.0,
            "progress": 10,
            "requires_hitl": False,
            "artifacts": [],
            "created_at_cycle": enterprise_state["heartbeat_count"]
        }
        enterprise_state["tasks"].insert(0, new_task)
        enterprise_state["logs"].append({
            "id": f"log_{uuid.uuid4().hex[:6]}",
            "cycle": enterprise_state["heartbeat_count"],
            "timestamp": datetime.datetime.now().strftime("%H:%M:%S"),
            "agent_id": "ceo",
            "agent_name": "Executive CEO",
            "type": "action",
            "message": f"Direct executive order dispatched to Chief of Staff: '{directive}'",
            "metadata": {"directive": directive}
        })
        return {"status": "directive_issued", "task": new_task}

    return {"status": "unknown_action"}


@app.get("/api/enterprise/state")
async def get_state():
    """Returns the current state snapshot of the enterprise."""
    return enterprise_state


@app.get("/api/enterprise/stream")
async def stream_enterprise_heartbeats(request: Request):
    """
    Server-Sent Events (SSE) endpoint streaming real-time heartbeat cycles,
    agent states, task progress, and telemetry logs.
    """
    async def event_generator():
        while True:
            if await request.is_disconnected():
                break

            speed = enterprise_state.get("simulation_speed", 1)

            if speed > 0 and enterprise_state.get("phase") == "autonomous_execution":
                # Execute one orchestration cycle through the LangGraph node logic
                chief_out = chief_of_staff_orchestrator_node(enterprise_state)
                enterprise_state.update(chief_out)

                spec_out = specialist_execution_node(enterprise_state)
                enterprise_state.update(spec_out)

                treasury_out = treasury_reconcile_node(enterprise_state)
                enterprise_state.update(treasury_out)

            # Package state payload
            data_payload = {
                "heartbeat_count": enterprise_state["heartbeat_count"],
                "phase": enterprise_state["phase"],
                "capital_treasury": enterprise_state["capital_treasury"],
                "burn_rate_per_cycle": enterprise_state["burn_rate_per_cycle"],
                "total_revenue_generated": enterprise_state["total_revenue_generated"],
                "active_agents": enterprise_state["active_agents"],
                "tasks": enterprise_state["tasks"],
                "approvals": enterprise_state["approvals"],
                "hitl_interrupt_pending": enterprise_state.get("hitl_interrupt_pending", False),
                "completed_milestones": enterprise_state.get("completed_milestones", []),
                "latest_log": enterprise_state["logs"][-1] if enterprise_state["logs"] else None,
                "timestamp": datetime.datetime.now().strftime("%H:%M:%S")
            }

            yield {
                "event": "enterprise_update",
                "data": json.dumps(data_payload)
            }

            # Sleep interval inversely proportional to simulation speed
            interval = max(0.5, 2.5 / max(1, speed))
            await asyncio.sleep(interval)

    return EventSourceResponse(event_generator())


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
