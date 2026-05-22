import {
  saveAstrologyChart,
  verifyAstrologyWebhookSecret,
} from "@/lib/astrology/chart-store";
import type { BirthPlace } from "@/lib/astrology/types";
import type { AstrologyMode } from "@/lib/astrology/types";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Persist computed chart JSON (for n8n, Stripe flow, or internal callbacks).
 * Header: x-astrology-webhook-secret or Authorization: Bearer <ASTROLOGY_WEBHOOK_SECRET>
 */
export async function POST(request: Request) {
  if (!verifyAstrologyWebhookSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    subjectId?: string;
    mode?: AstrologyMode;
    birthPlace?: BirthPlace;
    birthPlaceB?: BirthPlace;
    partnerSubjectId?: string;
    coupleType?: string;
    chartJson?: unknown;
    chartId?: string;
    event?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const subjectId = body.subjectId?.trim();
  const mode = body.mode;
  if (!subjectId || !mode || !["natal", "synastry", "transits"].includes(mode)) {
    return NextResponse.json(
      { error: "subjectId and mode (natal|synastry|transits) are required" },
      { status: 400 },
    );
  }
  if (!body.birthPlace?.lat || !body.birthPlace?.timezone) {
    return NextResponse.json({ error: "birthPlace is required" }, { status: 400 });
  }
  if (body.chartJson === undefined) {
    return NextResponse.json({ error: "chartJson is required" }, { status: 400 });
  }

  try {
    const saved = await saveAstrologyChart({
      subjectId,
      mode,
      birthPlace: body.birthPlace,
      birthPlaceB: body.birthPlaceB,
      partnerSubjectId: body.partnerSubjectId?.trim(),
      coupleType: body.coupleType,
      chartJson: body.chartJson,
      chartId: body.chartId,
    });

    return NextResponse.json({
      ok: true,
      event: body.event ?? "chart.saved",
      chart: {
        id: saved.id,
        subjectId: saved.subjectId,
        mode: saved.mode,
        createdAt: saved.createdAt,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook save failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  const configured = Boolean(process.env.ASTROLOGY_WEBHOOK_SECRET?.trim());
  return NextResponse.json({
    endpoint: "/api/astrology/webhook",
    method: "POST",
    secretConfigured: configured,
    headers: ["x-astrology-webhook-secret", "Authorization: Bearer <secret>"],
  });
}
