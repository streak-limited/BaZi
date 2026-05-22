import { allowStripeSkip } from "@/lib/stripe";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Dev / demo: skip Stripe Checkout and go to paid step */
export async function POST(request: Request) {
  if (!allowStripeSkip()) {
    return NextResponse.json(
      { error: "Demo unlock is disabled in production" },
      { status: 403 },
    );
  }

  let body: { subjectId?: string; publicToken?: string };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const origin =
    request.headers.get("origin") ??
    process.env.NEXT_PUBLIC_APP_URL?.trim() ??
    "http://localhost:3000";

  const publicToken = body.publicToken?.trim();
  const params = new URLSearchParams({ paid: "1", demo: "1" });
  if (body.subjectId?.trim()) {
    params.set("subjectId", body.subjectId.trim());
  }

  const redirectUrl = publicToken
    ? `${origin}/r/${publicToken}?${params.toString()}`
    : `${origin}/bazi/flow?${params.toString()}`;

  return NextResponse.json({
    ok: true,
    redirectUrl,
    message: "測試模式：已略過 Stripe 付款",
  });
}
