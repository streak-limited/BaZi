import { generateReportText } from "@/lib/ai-generate";
import { isAllowedCompareModel } from "@/lib/gemini-models";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { prompt?: string; model?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const prompt = body.prompt?.trim();
  if (!prompt) {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }

  const geminiModel = body.model?.trim();
  if (geminiModel && !isAllowedCompareModel(geminiModel)) {
    return NextResponse.json({ error: "Model not allowed for compare" }, { status: 400 });
  }

  try {
    const { text, model, provider } = await generateReportText(prompt, {
      geminiModel: geminiModel || undefined,
    });
    return NextResponse.json({ text, model, provider });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
