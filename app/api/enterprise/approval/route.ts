import { NextRequest, NextResponse } from "next/server";
import { getSimulationEngine } from "@/lib/simulation-engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { task_id, decision, guidance } = body;

    if (!task_id || !decision) {
      return NextResponse.json({ error: "task_id and decision are required" }, { status: 400 });
    }

    const engine = getSimulationEngine();
    const result = engine.submitApproval(task_id, decision, guidance);

    if (!result) {
      return NextResponse.json({ error: "Task or approval not found" }, { status: 404 });
    }

    return NextResponse.json({
      status: "decision_recorded",
      approval: result,
      state: engine.getState()
    });
  } catch (error) {
    console.error("Submit approval error:", error);
    return NextResponse.json({ error: "Failed to submit approval" }, { status: 500 });
  }
}
