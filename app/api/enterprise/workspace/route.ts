// File: app/api/enterprise/workspace/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  toolDirectoryList,
  toolReadFile,
  toolWriteFile,
  toolPatchFile,
  getWorkspaceRoot
} from "@/lib/agent-workspace";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filePath = searchParams.get("file");
    const subPath = searchParams.get("path") || undefined;
    const recursive = searchParams.get("recursive") !== "false";

    if (filePath) {
      // Read specific file
      const offset = searchParams.get("offset") ? Number(searchParams.get("offset")) : undefined;
      const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined;
      const fileData = await toolReadFile({ path: filePath, offset, limit });
      return NextResponse.json({ success: true, file: fileData });
    }

    // List directory
    const dirData = await toolDirectoryList({ path: subPath, recursive });
    return NextResponse.json({
      success: true,
      workspaceRoot: getWorkspaceRoot(),
      entries: dirData.entries
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to access workspace" },
      { status: 400 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, path, content, search, replace, overwrite } = body;

    if (action === "patch") {
      const result = await toolPatchFile({ path, search, replace });
      return NextResponse.json({ success: true, result });
    } else {
      const result = await toolWriteFile({ path, content, overwrite });
      return NextResponse.json({ success: true, result });
    }
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to modify workspace file" },
      { status: 400 }
    );
  }
}
