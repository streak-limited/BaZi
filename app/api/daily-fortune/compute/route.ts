import { computeDailyFortune } from "@/lib/daily-fortune/compute";
import type { UserFormInput } from "@/lib/user-input";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { input?: UserFormInput; date?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.input?.birthDate?.trim()) {
    return NextResponse.json({ error: "input.birthDate is required" }, { status: 400 });
  }

  const { result, error } = computeDailyFortune(body.input, { date: body.date });
  if (error || !result) {
    return NextResponse.json({ error: error ?? "Compute failed" }, { status: 400 });
  }

  return NextResponse.json({ computed: result });
}
