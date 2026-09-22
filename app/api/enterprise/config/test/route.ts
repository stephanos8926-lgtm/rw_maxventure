// File: app/api/enterprise/config/test/route.ts
import { NextRequest, NextResponse } from "next/server";
import { testLlmEndpoint, testEmbeddingEndpoint } from "@/lib/llm-client";
import { getSystemSettings } from "@/lib/config-store";
import { LlmConfig, EmbeddingConfig } from "@/types/enterprise";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, config } = body;
    const current = getSystemSettings();

    if (type === "llm") {
      const llmConfig: LlmConfig = {
        ...current.llm,
        ...config,
        apiKey: config.apiKey && !config.apiKey.includes("••••") ? config.apiKey : current.llm.apiKey
      };
      const result = await testLlmEndpoint(llmConfig);
      return NextResponse.json({ success: true, result });
    } else if (type === "embedding") {
      const embConfig: EmbeddingConfig = {
        ...current.embedding,
        ...config,
        apiKey: config.apiKey && !config.apiKey.includes("••••") ? config.apiKey : current.embedding.apiKey
      };
      const result = await testEmbeddingEndpoint(embConfig);
      return NextResponse.json({ success: true, result });
    }

    return NextResponse.json({ success: false, error: "Invalid test type. Expected 'llm' or 'embedding'." }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Testing failed" },
      { status: 500 }
    );
  }
}
