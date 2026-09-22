// File: app/api/enterprise/memory/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { recallSemanticMemories } from "@/lib/semantic-memory";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, limit, category, agentId, minSimilarity } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { success: false, error: "Search query is required" },
        { status: 400 }
      );
    }

    const matches = await recallSemanticMemories({
      query,
      limit: limit ? Number(limit) : 5,
      category,
      agentId,
      minSimilarity: minSimilarity ? Number(minSimilarity) : 0.1
    });

    return NextResponse.json({
      success: true,
      query,
      matchCount: matches.length,
      matches
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Semantic search failed" },
      { status: 500 }
    );
  }
}
