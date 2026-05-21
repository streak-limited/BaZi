import { generateReportText } from "@/lib/ai-generate";
import { getLotBySystemAndId } from "@/lib/fortune-lots/draw";
import {
  buildFortuneLotPrompt,
  sectionDescriptionForLot,
} from "@/lib/fortune-lots/interpret-prompt";
import type { DrawnLot, LotSystem } from "@/lib/fortune-lots/types";
import { isAllowedCompareModel } from "@/lib/gemini-models";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const preferredRegion = ["iad1"];

function parseSystem(value: unknown): LotSystem | null {
  if (value === "guanyin" || value === "jiazi") return value;
  return null;
}

export async function POST(request: Request) {
  let body: {
    question?: string;
    system?: string;
    lot?: DrawnLot;
    model?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const question = body.question?.trim();
  if (!question) {
    return NextResponse.json({ error: "question is required" }, { status: 400 });
  }

  const system = parseSystem(body.system);
  if (!system) {
    return NextResponse.json(
      { error: "system must be 'guanyin' or 'jiazi'" },
      { status: 400 },
    );
  }

  const lotFromBody = body.lot;
  if (!lotFromBody || lotFromBody.system !== system) {
    return NextResponse.json({ error: "valid lot matching system is required" }, { status: 400 });
  }

  const maxId = system === "guanyin" ? 100 : 60;
  if (
    typeof lotFromBody.id !== "number" ||
    lotFromBody.id < 1 ||
    lotFromBody.id > maxId
  ) {
    return NextResponse.json({ error: "invalid lot id" }, { status: 400 });
  }

  const stored = getLotBySystemAndId(system, lotFromBody.id);
  const lot: DrawnLot = stored
    ? ({ ...stored, system } as DrawnLot)
    : (lotFromBody as DrawnLot);

  const geminiModel = body.model?.trim();
  if (geminiModel && !isAllowedCompareModel(geminiModel)) {
    return NextResponse.json({ error: "Model not allowed" }, { status: 400 });
  }

  const prompt = buildFortuneLotPrompt(question, lot);

  try {
    const { text, model, provider } = await generateReportText(prompt, {
      geminiModel: geminiModel || undefined,
      sectionDescription: sectionDescriptionForLot(lot),
    });
    return NextResponse.json({ text, model, provider, system, lot });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
