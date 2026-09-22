// File: app/api/enterprise/tools/execute/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSimulationEngine } from "@/lib/simulation-engine";
import { ToolExecution } from "@/types/enterprise";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { toolName, args, agentId, agentName } = body;

    if (!toolName) {
      return NextResponse.json({ success: false, error: "toolName is required" }, { status: 400 });
    }

    const engine = getSimulationEngine();
    const execution = await engine.executeToolDirectly(
      toolName as ToolExecution["toolName"],
      args || {},
      agentId || "agent_dev_main",
      agentName || "Kaelen Voss (Staff Systems Engineer)"
    );

    return NextResponse.json({ success: true, execution });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Tool execution failed" },
      { status: 500 }
    );
  }
}
