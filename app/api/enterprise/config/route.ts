// File: app/api/enterprise/config/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSimulationEngine } from "@/lib/simulation-engine";
import { getSystemSettings, updateSystemSettings } from "@/lib/config-store";
import { EnterpriseSystemSettings } from "@/types/enterprise";

function maskApiKey(key: string): string {
  if (!key || key.length < 6) return key ? "••••••••" : "";
  return `${key.slice(0, 3)}••••••••${key.slice(-3)}`;
}

export async function GET() {
  try {
    const settings = getSystemSettings();
    const masked: EnterpriseSystemSettings = {
      ...settings,
      llm: {
        ...settings.llm,
        apiKey: maskApiKey(settings.llm.apiKey)
      },
      embedding: {
        ...settings.embedding,
        apiKey: maskApiKey(settings.embedding.apiKey)
      }
    };
    return NextResponse.json({ success: true, settings: masked });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to load settings" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const engine = getSimulationEngine();

    // Preserve existing real API key if user sent a masked placeholder
    const current = getSystemSettings();
    if (body.llm && body.llm.apiKey && body.llm.apiKey.includes("••••")) {
      body.llm.apiKey = current.llm.apiKey;
    }
    if (body.embedding && body.embedding.apiKey && body.embedding.apiKey.includes("••••")) {
      body.embedding.apiKey = current.embedding.apiKey;
    }

    const updated = engine.updateSettings(body);
    return NextResponse.json({ success: true, settings: updated });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to update settings" },
      { status: 400 }
    );
  }
}
