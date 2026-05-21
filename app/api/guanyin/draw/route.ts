import { drawGuanyinLot } from "@/lib/guanyin/lots";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** 僅抽籤（程式 random），不呼叫 LLM */
export async function POST(request: Request) {
  let body: { question?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const question = body.question?.trim();
  if (!question) {
    return NextResponse.json({ error: "question is required" }, { status: 400 });
  }

  const lot = drawGuanyinLot();
  return NextResponse.json({ question, lot });
}
