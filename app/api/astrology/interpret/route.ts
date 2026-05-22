import { generateReportText } from "@/lib/ai-generate";
import {
  ASTRO_NATAL_SECTION,
  ASTRO_SYNASTRY_SECTION,
  ASTRO_TRANSIT_SECTION,
  buildNatalDecodePrompt,
  buildSynastryAspectPrompt,
  buildSynastryPrompt,
  buildTransitPrompt,
} from "@/lib/astrology/prompts";
import type {
  NatalChart,
  NatalFocusPlanet,
  SynastryAspect,
  SynastryChart,
  TransitChart,
} from "@/lib/astrology/types";
import { isAllowedCompareModel } from "@/lib/gemini-models";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const preferredRegion = ["iad1"];

type InterpretMode = "natal" | "synastry" | "transits" | "aspect";

export async function POST(request: Request) {
  let body: {
    mode?: InterpretMode;
    chart?: NatalChart;
    synastry?: SynastryChart;
    transits?: TransitChart;
    aspect?: SynastryAspect;
    focus?: NatalFocusPlanet;
    name?: string;
    roleHint?: string;
    model?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const geminiModel = body.model?.trim();
  if (geminiModel && !isAllowedCompareModel(geminiModel)) {
    return NextResponse.json({ error: "Model not allowed" }, { status: 400 });
  }

  let prompt: string;
  let section: string;

  switch (body.mode) {
    case "natal":
      if (!body.chart) {
        return NextResponse.json({ error: "chart is required" }, { status: 400 });
      }
      prompt = buildNatalDecodePrompt(body.chart, body.focus);
      section = ASTRO_NATAL_SECTION;
      break;
    case "synastry":
      if (!body.synastry) {
        return NextResponse.json({ error: "synastry is required" }, { status: 400 });
      }
      prompt = buildSynastryPrompt(body.synastry, body.roleHint);
      section = ASTRO_SYNASTRY_SECTION;
      break;
    case "transits":
      if (!body.transits) {
        return NextResponse.json({ error: "transits is required" }, { status: 400 });
      }
      prompt = buildTransitPrompt(body.transits, body.name);
      section = ASTRO_TRANSIT_SECTION;
      break;
    case "aspect":
      if (!body.aspect || !body.synastry) {
        return NextResponse.json(
          { error: "aspect and synastry.couple_type required" },
          { status: 400 },
        );
      }
      prompt = buildSynastryAspectPrompt(
        body.aspect,
        body.synastry.couple_type,
      );
      section = "占星：合盤單相位";
      break;
    default:
      return NextResponse.json({ error: "mode is required" }, { status: 400 });
  }

  try {
    const { text, model, provider } = await generateReportText(prompt, {
      geminiModel: geminiModel || undefined,
      sectionDescription: section,
    });
    return NextResponse.json({ text, model, provider });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
