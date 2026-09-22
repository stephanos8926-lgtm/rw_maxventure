import { NextRequest, NextResponse } from "next/server";
import { getSimulationEngine } from "@/lib/simulation-engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { chief_id } = body;

    if (!chief_id) {
      return NextResponse.json({ error: "Chief ID is required" }, { status: 400 });
    }

    const engine = getSimulationEngine();
    const updatedState = engine.selectChiefOfStaff(chief_id);

    return NextResponse.json({
      status: "chief_selected",
      chief_of_staff: updatedState.chief_of_staff,
      active_agents: updatedState.active_agents,
      tasks: updatedState.tasks,
      capital_treasury: updatedState.capital_treasury
    });
  } catch (error) {
    console.error("Select chief error:", error);
    return NextResponse.json({ error: "Failed to select chief of staff" }, { status: 500 });
  }
}
