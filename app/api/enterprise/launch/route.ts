import { NextRequest, NextResponse } from "next/server";
import { getSimulationEngine } from "@/lib/simulation-engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { blueprint } = body;

    if (!blueprint) {
      return NextResponse.json({ error: "Blueprint is required" }, { status: 400 });
    }

    const engine = getSimulationEngine();
    const result = engine.launchEnterprise(blueprint);

    return NextResponse.json({
      status: "launched",
      blueprint,
      valuation: result.valuation,
      capital_treasury: result.capital_treasury,
      next_step: "select_chief_of_staff"
    });
  } catch (error) {
    console.error("Launch enterprise error:", error);
    return NextResponse.json({ error: "Failed to launch enterprise" }, { status: 500 });
  }
}
