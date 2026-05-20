import { NextResponse } from "next/server";
import { sanitizeCompareModels } from "@/lib/gemini-models";
import {
  getPersistInfo,
  loadPersistedReportState,
  savePersistedReportState,
} from "@/lib/report-persist";
import type { AiOutputsMap } from "@/lib/report-storage-types";
import { DEFAULT_USER_INPUT, type UserFormInput } from "@/lib/user-input";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const subjectId = new URL(request.url).searchParams.get("subjectId")?.trim();
    if (!subjectId) {
      return NextResponse.json({ error: "subjectId is required" }, { status: 400 });
    }
    const state = await loadPersistedReportState(subjectId);
    const info = getPersistInfo();
    return NextResponse.json({
      state,
      storageMode: info.storageMode,
      databasePath: info.databasePath,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load state";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const subjectId = new URL(request.url).searchParams.get("subjectId")?.trim();
    if (!subjectId) {
      return NextResponse.json({ error: "subjectId is required" }, { status: 400 });
    }

    let body: {
      displayName?: string;
      userInput?: Partial<UserFormInput>;
      aiOutputs?: AiOutputsMap;
      compareModels?: string[];
    };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const existing = await loadPersistedReportState(subjectId);
    const userInput: UserFormInput = {
      ...DEFAULT_USER_INPUT,
      ...existing?.userInput,
      ...body.userInput,
    };
    const aiOutputs: AiOutputsMap = body.aiOutputs ?? existing?.aiOutputs ?? {};
    const compareModels = sanitizeCompareModels(
      body.compareModels ?? existing?.compareModels,
    );
    const displayName =
      body.displayName?.trim() ||
      userInput.name.trim() ||
      existing?.displayName ||
      "未命名命主";

    const state = await savePersistedReportState(
      subjectId,
      displayName,
      userInput,
      aiOutputs,
      compareModels,
    );
    const info = getPersistInfo();

    return NextResponse.json({
      state,
      storageMode: info.storageMode,
      databasePath: info.databasePath,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save state";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
