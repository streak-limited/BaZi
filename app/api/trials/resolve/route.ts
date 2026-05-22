import {
  getTrialByStripeSessionId,
  isSupabaseConfigured,
} from "@/lib/products/trial-store";
import { getAppBaseUrl } from "@/lib/supabase/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Resolve report URLs from Stripe Checkout session_id (after payment redirect). */
export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams
    .get("session_id")
    ?.trim();
  if (!sessionId) {
    return NextResponse.json({ error: "session_id required" }, { status: 400 });
  }

  const base = getAppBaseUrl();

  if (isSupabaseConfigured()) {
    try {
      const trial = await getTrialByStripeSessionId(sessionId);
      if (trial) {
        return NextResponse.json({
          publicToken: trial.public_token,
          status: trial.status,
          urls: {
            hub: `${base}/r/${trial.public_token}`,
            result: `${base}/r/${trial.public_token}/result`,
            report: `${base}/r/${trial.public_token}/report`,
          },
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Lookup failed";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  if (isStripeConfigured()) {
    const stripe = getStripe();
    if (stripe) {
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        const token = session.metadata?.public_token?.trim();
        if (token) {
          return NextResponse.json({
            publicToken: token,
            status: session.payment_status ?? "unknown",
            urls: {
              hub: `${base}/r/${token}`,
              result: `${base}/r/${token}/result`,
              report: `${base}/r/${token}/report`,
            },
            source: "stripe_metadata",
          });
        }
      } catch {
        /* fall through */
      }
    }
  }

  return NextResponse.json(
    {
      error: isSupabaseConfigured()
        ? "找不到此付款對應的 trial"
        : "Supabase 未設定，無法載入已儲存的報告連結",
    },
    { status: 404 },
  );
}
