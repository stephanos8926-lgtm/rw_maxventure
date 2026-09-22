# Paperclip Enterprise Simulator - Python Backend (LangGraph + FastAPI)

This directory contains the production-grade multi-agent business orchestration backend built with **LangGraph**, **LangChain**, and **FastAPI**.

## Architecture Overview

```
backend/
├── state.py           # Pydantic schemas and LangGraph TypedDict definitions
├── agents.py          # Chief of Staff candidates, specialist sub-agents, and prompts
├── graph.py           # Stateful LangGraph with interrupt nodes (HITL) and directed edges
├── main.py            # FastAPI REST & SSE endpoints
├── requirements.txt   # Python dependencies
```

## LangGraph Multi-Agent Flow

1. **`investor_valuation_node`**:
   - Parses the `BusinessBlueprint` generated during the onboarding phase.
   - Computes pre-money valuation and allocates initial virtual capital ($CLIP treasury).

2. **`chief_of_staff_orchestrator_node`**:
   - Binds the user-selected Chief of Staff personality.
   - Spawns specialist sub-agents (Lead Developer, Growth Marketer, UI/UX Designer, SecOps Analyst, Content Author).
   - Generates initial operational roadmaps and evaluates tasks for CEO Human-In-The-Loop approval gates.

3. **`hitl_gate_node`**:
   - Implements LangGraph stateful interrupts for high-stakes decisions (budget thresholds, critical pivots).
   - Suspends downstream execution until CEO approval is submitted via `POST /api/enterprise/approval`.

4. **`specialist_execution_node`**:
   - Simulates autonomous task execution, builds code PRs, design systems, and marketing assets.
   - Generates revenue yield upon task completion to replenish the enterprise treasury.

5. **`treasury_reconcile_node`**:
   - Calculates dynamic burn rate based on active agent compute and heartbeat cycles.
   - Emits telemetry logs and metrics.

## Running the Backend Standalone

```bash
# 1. Create virtual environment
python3 -m venv venv
source venv/bin/activate

# 2. Install dependencies
pip install -r backend/requirements.txt

# 3. Launch FastAPI server
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

## API Endpoints

- `POST /api/onboarding/concept-chat`: Interactive Concept Artist chat refining the Business Blueprint JSON.
- `POST /api/enterprise/launch`: Finalizes blueprint and executes investor valuation.
- `GET /api/enterprise/chief-of-staff-candidates`: Generates 3 unique Chief of Staff personas.
- `POST /api/enterprise/select-chief`: Binds chosen Chief of Staff and spawns specialist agents.
- `GET /api/enterprise/stream`: Real-time Server-Sent Events (SSE) streaming heartbeats and state changes.
- `POST /api/enterprise/approval`: Submits CEO decision (Approve / Reject) to resume interrupted graph nodes.
- `POST /api/enterprise/action`: Execute CEO directives, adjust simulation speed, or inject capital.
- `GET /api/enterprise/state`: Returns complete enterprise state snapshot.
