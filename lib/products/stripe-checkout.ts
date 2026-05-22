import {
  fulfillReportAfterPayment,
} from "@/lib/products/report-generation";
import type { TrialRow } from "@/lib/products/types";
import {
  getTrialById,
  getTrialByStripeSessionId,
  getTrialByToken,
  markPaymentSucceeded,
  recordPayment,
  updateTrialStatus,
} from "@/lib/products/trial-store";
import type Stripe from "stripe";

/** Resolve trial from Checkout session metadata or payments row. */
export async function resolveTrialFromCheckoutSession(
  session: Stripe.Checkout.Session,
): Promise<TrialRow | null> {
  const trialId = session.metadata?.trial_id?.trim();
  if (trialId) {
    const byId = await getTrialById(trialId);
    if (byId) return byId;
  }

  const publicToken = session.metadata?.public_token?.trim();
  if (publicToken) {
    const byToken = await getTrialByToken(publicToken);
    if (byToken) return byToken;
  }

  return getTrialByStripeSessionId(session.id);
}

/**
 * Stripe `checkout.session.completed`: mark paid + generate report (idempotent).
 * Used by `/api/stripe/webhook` (primary) and can be reused from fulfill fallback.
 */
export async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  rawEvent?: unknown,
): Promise<{
  trialId: string;
  report: "already_ready" | "generated";
} | null> {
  if (session.payment_status !== "paid") return null;

  const trial = await resolveTrialFromCheckoutSession(session);
  if (!trial) {
    console.warn("[stripe] checkout.session.completed: no trial for", session.id);
    return null;
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : undefined;

  let paidTrial = await markPaymentSucceeded(
    session.id,
    paymentIntentId,
    rawEvent,
  );

  if (!paidTrial) {
    await recordPayment({
      trialId: trial.id,
      stripeSessionId: session.id,
      amountCents: session.amount_total ?? 0,
      status: "succeeded",
      rawEvent,
    });
    await updateTrialStatus(trial.id, "paid", {
      paid_at: new Date().toISOString(),
      stripe_payment_status: "paid",
      stripe_checkout_session_id: session.id,
    });
    paidTrial = await getTrialById(trial.id);
  }

  if (!paidTrial) return null;

  const { alreadyReady } = await fulfillReportAfterPayment(paidTrial.id);
  return {
    trialId: paidTrial.id,
    report: alreadyReady ? "already_ready" : "generated",
  };
}
