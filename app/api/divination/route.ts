import { generateReportText } from "@/lib/ai-generate";
import { buildDivinationPrompt, DIVINATION_SECTION_DESCRIPTION } from "@/lib/iching/interpret-prompt";
import type { LineToss } from "@/lib/iching/coins";
import { buildReading } from "@/lib/iching/hexagrams";
import { isAllowedCompareModel } from "@/lib/gemini-models";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const preferredRegion = ["iad1"];

export async function POST(request: Request) {
  let body: {
    question?: string;
    lines?: LineToss[];
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

  const lines = body.lines;
  if (!Array.isArray(lines) || lines.length !== 6) {
    return NextResponse.json(
      { error: "lines must be an array of 6 toss results" },
      { status: 400 },
    );
  }

  const geminiModel = body.model?.trim();
  if (geminiModel && !isAllowedCompareModel(geminiModel)) {
    return NextResponse.json({ error: "Model not allowed" }, { status: 400 });
  }

  const reading = buildReading(question, lines);
  const prompt = buildDivinationPrompt(reading);

  try {
    const { text, model, provider } = await generateReportText(prompt, {
      geminiModel: geminiModel || undefined,
      sectionDescription: DIVINATION_SECTION_DESCRIPTION,
    });
    return NextResponse.json({
      text,
      model,
      provider,
      reading: {
        question: reading.question,
        base: reading.base,
        changed: reading.changed,
        changingPositions: reading.changingPositions,
        lines: reading.lines,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
