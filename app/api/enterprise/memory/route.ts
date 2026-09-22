// File: app/api/enterprise/memory/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  listSemanticMemories,
  storeSemanticMemory,
  deleteSemanticMemory,
  clearSemanticMemories,
  getSemanticMemoriesCount
} from "@/lib/semantic-memory";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || undefined;
    const agentId = searchParams.get("agentId") || undefined;
    const search = searchParams.get("search") || undefined;

    const memories = await listSemanticMemories({ category, agentId, search });
    return NextResponse.json({
      success: true,
      totalCount: getSemanticMemoriesCount(),
      memories
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to list memories" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { content, category, importance, agentId, agentName, metadata } = body;

    if (!content || !category) {
      return NextResponse.json(
        { success: false, error: "Content and category are required" },
        { status: 400 }
      );
    }

    const memory = await storeSemanticMemory({
      agentId: agentId || "agent_system",
      agentName: agentName || "System Agent",
      content,
      category,
      importance: Number(importance || 5),
      metadata
    });

    return NextResponse.json({ success: true, memory });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to store memory" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const deleted = await deleteSemanticMemory(id);
      return NextResponse.json({ success: true, deleted });
    } else {
      await clearSemanticMemories();
      return NextResponse.json({ success: true, cleared: true });
    }
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to delete memory" },
      { status: 500 }
    );
  }
}
