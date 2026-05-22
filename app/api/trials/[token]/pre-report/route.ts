import {
  getTrialByToken,
  savePreReportDeliverable,
  updateTrialStatus,
  isSupabaseConfigured,
} from "@/lib/products/trial-store";
import type { PreReportDeliverable } from "@/lib/products/types";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function PUT(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const { token } = await context.params;
  let body: { deliverable: PreReportDeliverable; aiMeta?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const trial = await getTrialByToken(token);
    if (!trial) {
      return NextResponse.json({ error: "Trial not found" }, { status: 404 });
    }

    await savePreReportDeliverable(trial.id, body.deliverable, body.aiMeta);
    return NextResponse.json({ ok: true, status: "pre_report_ready" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Save failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const { token } = await context.params;
  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const trial = await getTrialByToken(token);
  if (!trial) {
    return NextResponse.json({ error: "Trial not found" }, { status: 404 });
  }

  if (body.status === "pre_report_generating") {
    await updateTrialStatus(trial.id, "pre_report_generating");
  }

  return NextResponse.json({ ok: true });
}
