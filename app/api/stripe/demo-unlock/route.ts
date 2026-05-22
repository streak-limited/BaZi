import {
  getTrialByToken,
  isSupabaseConfigured,
  updateTrialStatus,
} from "@/lib/products/trial-store";
import { allowStripeSkip } from "@/lib/stripe";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Dev / demo: skip Stripe → payment success hub → background report + email */
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

  if (publicToken && isSupabaseConfigured()) {
    const trial = await getTrialByToken(publicToken);
    if (trial) {
      await updateTrialStatus(trial.id, "paid", {
        paid_at: new Date().toISOString(),
        stripe_payment_status: "demo",
      });
      // Report is generated on the payment-success hub (spinner → open report).
    }
  }

  const params = new URLSearchParams({ paid: "1", demo: "1" });
  const redirectUrl = publicToken
    ? `${origin}/r/${publicToken}?${params.toString()}`
    : `${origin}/bazi/input?${params.toString()}`;

  return NextResponse.json({
    ok: true,
    redirectUrl,
    message: "測試模式：已略過 Stripe 付款",
  });
}
