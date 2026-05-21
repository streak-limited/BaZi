import { generateReportText } from "@/lib/ai-generate";
import { computeDailyFortune } from "@/lib/daily-fortune/compute";
import {
  buildDailyFortunePrompt,
  DAILY_FORTUNE_SECTION,
} from "@/lib/daily-fortune/interpret-prompt";
import type { DailyFortuneComputed } from "@/lib/daily-fortune/types";
import type { UserFormInput } from "@/lib/user-input";
import { isAllowedCompareModel } from "@/lib/gemini-models";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const preferredRegion = ["iad1"];

const guideCache = new Map<string, { text: string; model: string; at: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function cacheKey(subjectId: string | undefined, dateKey: string): string {
  return `${dateKey}:${subjectId ?? "anonymous"}`;
}

export async function POST(request: Request) {
  let body: {
    input?: UserFormInput;
    date?: string;
    computed?: DailyFortuneComputed;
    subjectId?: string;
    model?: string;
    skipCache?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.input?.birthDate?.trim()) {
    return NextResponse.json({ error: "input.birthDate is required" }, { status: 400 });
  }

  let computed = body.computed;
  if (!computed) {
    const { result, error } = computeDailyFortune(body.input, { date: body.date });
    if (error || !result) {
      return NextResponse.json({ error: error ?? "Compute failed" }, { status: 400 });
    }
    computed = result;
  }

  const key = cacheKey(body.subjectId, computed.dateKey);
  if (!body.skipCache) {
    const hit = guideCache.get(key);
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
      return NextResponse.json({
        text: hit.text,
        model: hit.model,
        provider: "cache",
        computed,
        cached: true,
      });
    }
  }

  const geminiModel = body.model?.trim();
  if (geminiModel && !isAllowedCompareModel(geminiModel)) {
    return NextResponse.json({ error: "Model not allowed" }, { status: 400 });
  }

  const prompt = buildDailyFortunePrompt(computed, body.input.name);

  try {
    const { text, model, provider } = await generateReportText(prompt, {
      geminiModel: geminiModel || undefined,
      sectionDescription: DAILY_FORTUNE_SECTION,
    });
    guideCache.set(key, { text, model, at: Date.now() });
    return NextResponse.json({ text, model, provider, computed, cached: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
