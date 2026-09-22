import { NextRequest, NextResponse } from "next/server";
import { getSimulationEngine } from "@/lib/simulation-engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, payload } = body;

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 });
    }

    const engine = getSimulationEngine();
    const state = engine.executeCeoAction(action, payload || {});

    return NextResponse.json({ status: "success", action, state });
  } catch (error) {
    console.error("Execute action error:", error);
    return NextResponse.json({ error: "Failed to execute CEO action" }, { status: 500 });
  }
}
