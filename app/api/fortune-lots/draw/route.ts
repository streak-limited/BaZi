import { drawLot } from "@/lib/fortune-lots/draw";
import type { LotSystem } from "@/lib/fortune-lots/types";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function parseSystem(value: unknown): LotSystem | null {
  if (value === "guanyin" || value === "jiazi") return value;
  return null;
}

/** 程式 random 抽籤（觀音 1–100 / 甲子 1–60），不呼叫 LLM */
export async function POST(request: Request) {
  let body: { question?: string; system?: string };
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

  const lot = drawLot(system);
  return NextResponse.json({ question, system, lot });
}
