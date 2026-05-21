import { generateReportText } from "@/lib/ai-generate";
import { buildGuanyinPrompt, GUANYIN_SECTION_DESCRIPTION } from "@/lib/guanyin/interpret-prompt";
import { getLotById } from "@/lib/guanyin/lots";
import type { GuanyinLot } from "@/lib/guanyin/types";
import { isAllowedCompareModel } from "@/lib/gemini-models";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const preferredRegion = ["iad1"];

export async function POST(request: Request) {
  let body: {
    question?: string;
    lot?: GuanyinLot;
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

  const lotFromBody = body.lot;
  if (
    !lotFromBody ||
    typeof lotFromBody.id !== "number" ||
    lotFromBody.id < 1 ||
    lotFromBody.id > 100
  ) {
    return NextResponse.json({ error: "valid lot is required" }, { status: 400 });
  }

  const lot = getLotById(lotFromBody.id) ?? lotFromBody;
  const geminiModel = body.model?.trim();
  if (geminiModel && !isAllowedCompareModel(geminiModel)) {
    return NextResponse.json({ error: "Model not allowed" }, { status: 400 });
  }

  const prompt = buildGuanyinPrompt(question, lot);

  try {
    const { text, model, provider } = await generateReportText(prompt, {
      geminiModel: geminiModel || undefined,
      sectionDescription: GUANYIN_SECTION_DESCRIPTION,
    });
    return NextResponse.json({ text, model, provider, lot });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
