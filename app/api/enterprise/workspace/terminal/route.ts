// File: app/api/enterprise/workspace/terminal/route.ts
import { NextRequest, NextResponse } from "next/server";
import { toolTerminalExecute, getRecentTerminalExecutions } from "@/lib/agent-workspace";

export async function GET() {
  try {
    const history = getRecentTerminalExecutions();
    return NextResponse.json({ success: true, history });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to retrieve terminal history" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { command, timeout_ms } = body;

    if (!command || typeof command !== "string") {
      return NextResponse.json({ success: false, error: "Command string required" }, { status: 400 });
    }

    const execution = await toolTerminalExecute({ command, timeout_ms });
    return NextResponse.json({ success: true, execution });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Terminal execution failed" },
      { status: 500 }
    );
  }
}
