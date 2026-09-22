"""
Agent logic, prompt definitions, and persona generation for Paperclip Enterprise.
"""
import uuid
import datetime
from typing import List, Dict, Any


def get_default_chief_of_staff_candidates() -> List[Dict[str, Any]]:
    return [
        {
            "id": "cos_aria",
            "name": "Aria Vance",
            "title": "Principal Operations Architect",
            "avatar": "⚡",
            "personality": "Hyper-efficient, structured, relentless about unit economics and systemic rigor.",
            "leadership_style": "Systemic Decentralization & KPI Precision",
            "operational_traits": ["Zero-Waste Execution", "Automated Guardrails", "Strict Budget Adherence"],
            "quote": "Velocity without precision is merely accelerated failure. We will architect self-reinforcing operational loops.",
            "recruitment_cost": 2500,
            "specialty": "Operational Resilience & Scalable Infrastructure",
            "projected_velocity": "High / Predictable",
            "risk_profile": "Methodical"
        },
        {
            "id": "cos_marcus",
            "name": "Marcus Chen",
            "title": "Venture Blitzscaler & Product Catalyst",
            "avatar": "🚀",
            "personality": "Bold, aggressive, product-obsessed. Drives exponential user acquisition and market conquest.",
            "leadership_style": "Extreme Ownership & High-Risk Blitzscaling",
            "operational_traits": ["Aggressive Experimentation", "Hyper-Growth Funnels", "Rapid Prototyping"],
            "quote": "First-to-scale dominates the winner-take-all horizon. Let the specialists ship fast and conquer market mindshare.",
            "recruitment_cost": 3000,
            "specialty": "Rapid Go-To-Market & Viral Loops",
            "projected_velocity": "Maximum / Explosive",
            "risk_profile": "Aggressive"
        },
        {
            "id": "cos_elena",
            "name": "Dr. Elena Rostova",
            "title": "Chief Systems Architect & Cyberneticist",
            "avatar": "🛡️",
            "personality": "Analytical, defensive, deeply scientific. Balances rapid execution with unbreakable security.",
            "leadership_style": "Resilient Antifragility & Empirical Validation",
            "operational_traits": ["Pre-Mortem Auditing", "Risk-Adjusted Allocation", "Red-Team Testing"],
            "quote": "Sustainable advantage belongs to systems that survive turbulence. Every line of code and marketing claim must be tamper-proof.",
            "recruitment_cost": 2800,
            "specialty": "Risk Mitigation, Compliance & Deep Tech Moats",
            "projected_velocity": "Steady / Compounding",
            "risk_profile": "Balanced"
        }
    ]


def spawn_sub_agents_for_blueprint(blueprint: Dict[str, Any], cos_id: str) -> List[Dict[str, Any]]:
    """Dynamically spawn specialist sub-agents tailored to the enterprise blueprint."""
    return [
        {
            "id": f"agent_lead_dev_{uuid.uuid4().hex[:6]}",
            "name": "Kaelen Voss",
            "role": "lead_developer",
            "title": "Principal Systems Engineer",
            "avatar": "💻",
            "department": "Engineering",
            "personality": "Obsessed with clean architecture, fault-tolerant distributed services, and rapid CI/CD.",
            "status": "idle",
            "cost_per_cycle": 120.0,
            "tokens_burned": 0,
            "efficiency_rating": 94,
            "parent_agent_id": cos_id,
            "last_thought": "Analyzing core tech stack requirements and microservices boundary."
        },
        {
            "id": f"agent_growth_mk_{uuid.uuid4().hex[:6]}",
            "name": "Sienna Ray",
            "role": "growth_marketer",
            "title": "Head of Viral Distribution & Growth",
            "avatar": "📈",
            "department": "Growth",
            "personality": "Data-driven growth hacker, master of organic acquisition funnels and social proof engineering.",
            "status": "idle",
            "cost_per_cycle": 95.0,
            "tokens_burned": 0,
            "efficiency_rating": 89,
            "parent_agent_id": cos_id,
            "last_thought": "Mapping high-intent target persona touchpoints and conversion levers."
        },
        {
            "id": f"agent_ui_ux_{uuid.uuid4().hex[:6]}",
            "name": "Zephyr Thorne",
            "role": "ui_ux_designer",
            "title": "Design Systems Lead",
            "avatar": "🎨",
            "department": "Design",
            "personality": "Minimalist visionary, crafts hyper-refined high-contrast technical UI and intuitive flows.",
            "status": "idle",
            "cost_per_cycle": 85.0,
            "tokens_burned": 0,
            "efficiency_rating": 91,
            "parent_agent_id": cos_id,
            "last_thought": "Establishing typographic scale, dark obsidian tokens, and micro-interactions."
        },
        {
            "id": f"agent_security_{uuid.uuid4().hex[:6]}",
            "name": "Valerie Croft",
            "role": "security_analyst",
            "title": "Chief Information Security Analyst",
            "avatar": "🔒",
            "department": "Security",
            "personality": "Paranoid ethical hacker, zero-trust evangelist, compliance hardener.",
            "status": "idle",
            "cost_per_cycle": 110.0,
            "tokens_burned": 0,
            "efficiency_rating": 96,
            "parent_agent_id": cos_id,
            "last_thought": "Reviewing data boundary policies, API authentication schemas, and threat vectors."
        },
        {
            "id": f"agent_content_{uuid.uuid4().hex[:6]}",
            "name": "Dorian Grey",
            "role": "content_author",
            "title": "Brand Strategist & Narrative Architect",
            "avatar": "✍️",
            "department": "Product",
            "personality": "Punchy technical copywriter, articulates enterprise value propositions with zero fluff.",
            "status": "idle",
            "cost_per_cycle": 70.0,
            "tokens_burned": 0,
            "efficiency_rating": 88,
            "parent_agent_id": cos_id,
            "last_thought": "Drafting technical launch manifesto and developer ecosystem documentation."
        }
    ]


def generate_initial_roadmap_tasks(blueprint: Dict[str, Any], agents: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Creates the initial operational backlog distributed among the spawned specialist agents."""
    company_name = blueprint.get("company_name", "Enterprise")
    industry = blueprint.get("industry", "Deep Tech")
    
    agent_map = {a["role"]: a["id"] for a in agents}
    dev_id = agent_map.get("lead_developer", agents[0]["id"])
    growth_id = agent_map.get("growth_marketer", agents[1]["id"])
    design_id = agent_map.get("ui_ux_designer", agents[2]["id"])
    sec_id = agent_map.get("security_analyst", agents[3]["id"])
    content_id = agent_map.get("content_author", agents[4]["id"])

    return [
        {
            "id": f"task_{uuid.uuid4().hex[:6]}",
            "title": f"Architect Core {company_name} Infrastructure",
            "description": f"Design high-throughput, low-latency API contracts and database schema optimized for {industry}.",
            "department": "Engineering",
            "assigned_to_role_id": dev_id,
            "status": "in_progress",
            "priority": "critical",
            "cost": 1200.0,
            "revenue_yield": 4500.0,
            "progress": 35,
            "requires_hitl": False,
            "artifacts": [],
            "created_at_cycle": 1
        },
        {
            "id": f"task_{uuid.uuid4().hex[:6]}",
            "title": "Establish Dark Obsidian Technical Design System",
            "description": "Construct tokens, layout hierarchy, and component wireframes for enterprise executive view.",
            "department": "Design",
            "assigned_to_role_id": design_id,
            "status": "in_progress",
            "priority": "high",
            "cost": 850.0,
            "revenue_yield": 2800.0,
            "progress": 50,
            "requires_hitl": False,
            "artifacts": [],
            "created_at_cycle": 1
        },
        {
            "id": f"task_{uuid.uuid4().hex[:6]}",
            "title": f"GTM Launch: Phase 1 High-Intent Organic Campaign",
            "description": f"Develop targeted outreach strategy for early enterprise adopters in {industry} with automated nurture sequences.",
            "department": "Growth",
            "assigned_to_role_id": growth_id,
            "status": "backlog",
            "priority": "high",
            "cost": 1500.0,
            "revenue_yield": 6500.0,
            "progress": 0,
            "requires_hitl": True,  # High cost triggers HITL
            "artifacts": [],
            "created_at_cycle": 1
        },
        {
            "id": f"task_{uuid.uuid4().hex[:6]}",
            "title": "Zero-Trust Threat Modeling & Security Hardening",
            "description": "Conduct simulated penetration tests, establish audit logging, and enforce RBAC policy schemas.",
            "department": "Security",
            "assigned_to_role_id": sec_id,
            "status": "backlog",
            "priority": "medium",
            "cost": 950.0,
            "revenue_yield": 3200.0,
            "progress": 0,
            "requires_hitl": False,
            "artifacts": [],
            "created_at_cycle": 1
        },
        {
            "id": f"task_{uuid.uuid4().hex[:6]}",
            "title": f"Author {company_name} Whitepaper & Technical Manifesto",
            "description": "Publish authoritative market positioning paper highlighting competitive moats and technological edge.",
            "department": "Product",
            "assigned_to_role_id": content_id,
            "status": "backlog",
            "priority": "medium",
            "cost": 650.0,
            "revenue_yield": 2100.0,
            "progress": 0,
            "requires_hitl": False,
            "artifacts": [],
            "created_at_cycle": 1
        }
    ]
