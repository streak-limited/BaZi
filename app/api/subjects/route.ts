import { NextResponse } from "next/server";
import {
  createSubject,
  deleteSubject,
  ensureDefaultSubject,
  getPersistInfo,
  listSubjectSummaries,
  loadPersistedReportState,
} from "@/lib/report-persist";
import type { UserFormInput } from "@/lib/user-input";

export const runtime = "nodejs";

export async function GET() {
  try {
    let subjects = await listSubjectSummaries();
    if (subjects.length === 0) {
      await ensureDefaultSubject();
      subjects = await listSubjectSummaries();
    }
    const info = getPersistInfo();
    return NextResponse.json({
      subjects,
      storageMode: info.storageMode,
      databasePath: info.databasePath,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list subjects";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    let body: { displayName?: string; userInput?: Partial<UserFormInput> };
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    const displayName = body.displayName?.trim() || "新命主";
    const state = await createSubject(displayName, body.userInput);
    const subjects = await listSubjectSummaries();
    return NextResponse.json({ state, subjects });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create subject";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const subjectId = new URL(request.url).searchParams.get("id")?.trim();
    if (!subjectId) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    const deleted = await deleteSubject(subjectId);
    if (!deleted) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }
    let subjects = await listSubjectSummaries();
    let state = null;
    if (subjects.length === 0) {
      state = await ensureDefaultSubject();
      subjects = await listSubjectSummaries();
    } else {
      state = await loadPersistedReportState(subjects[0].id);
    }
    return NextResponse.json({ subjects, state, deletedId: subjectId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete subject";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
