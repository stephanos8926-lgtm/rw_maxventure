import { NextResponse } from "next/server";
import { getSimulationEngine } from "@/lib/simulation-engine";

export async function GET() {
  try {
    const engine = getSimulationEngine();
    const candidates = engine.getChiefOfStaffCandidates();
    return NextResponse.json({ candidates });
  } catch (error) {
    console.error("Get candidates error:", error);
    return NextResponse.json({ error: "Failed to fetch candidates" }, { status: 500 });
  }
}
