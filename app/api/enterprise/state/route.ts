import { NextResponse } from "next/server";
import { getSimulationEngine } from "@/lib/simulation-engine";

export async function GET() {
  try {
    const engine = getSimulationEngine();
    return NextResponse.json(engine.getState());
  } catch (error) {
    console.error("Get state error:", error);
    return NextResponse.json({ error: "Failed to fetch state" }, { status: 500 });
  }
}
