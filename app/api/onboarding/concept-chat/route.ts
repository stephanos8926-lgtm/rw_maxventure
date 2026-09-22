import { NextRequest, NextResponse } from "next/server";
import { getSimulationEngine } from "@/lib/simulation-engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history, currentBlueprint } = body;

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const engine = getSimulationEngine();
    const result = await engine.handleConceptChat(message, history || [], currentBlueprint);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Concept chat error:", error);
    return NextResponse.json({ error: "Failed to process concept chat" }, { status: 500 });
  }
}
