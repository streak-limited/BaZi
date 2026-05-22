import { fulfillReportAfterPayment } from "@/lib/products/report-generation";
import { handleCheckoutSessionCompleted } from "@/lib/products/stripe-checkout";
import {
  getTrialByToken,
  isSupabaseConfigured,
  loadTrialBundle,
} from "@/lib/products/trial-store";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Fallback when the user lands on the success page before the webhook finishes
 * (or when stripe listen is not running locally). Idempotent with webhook.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const { token } = await context.params;
  let body: { sessionId?: string };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const bundle = await loadTrialBundle(token);
  if (!bundle) {
    return NextResponse.json({ error: "Trial not found" }, { status: 404 });
  }

  const trial = bundle.trial;
  const hasReport = Boolean(
    bundle.deliverables.report ??
      (bundle.deliverables as Record<string, unknown>).full_report,
  );

  if (hasReport || trial.status === "completed") {
    return NextResponse.json({
      ok: true,
      status: trial.status,
      alreadyReady: true,
    });
  }

  const sessionId = body.sessionId?.trim();
  if (sessionId && isStripeConfigured()) {
    const stripe = getStripe();
    if (stripe) {
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (session.payment_status === "paid") {
          await handleCheckoutSessionCompleted(session);
          const afterWebhookPath = await getTrialByToken(token);
          if (afterWebhookPath?.status === "completed") {
            return NextResponse.json({
              ok: true,
              status: "completed",
              alreadyReady: false,
              via: "checkout_session",
            });
          }
        }
      } catch {
        /* continue to fulfill by trial id */
      }
    }
  }

  const fresh = await getTrialByToken(token);
  if (!fresh) {
    return NextResponse.json({ error: "Trial not found" }, { status: 404 });
  }

  try {
    const { alreadyReady } = await fulfillReportAfterPayment(fresh.id);
    const after = await getTrialByToken(token);
    return NextResponse.json({
      ok: true,
      status: after?.status ?? "completed",
      alreadyReady,
      via: "fulfill",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Fulfill failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
