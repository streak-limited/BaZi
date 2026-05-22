import { enqueueReportGeneration } from "@/lib/products/report-generation";
import {
  isSupabaseConfigured,
  markPaymentSucceeded,
  updateTrialStatus,
} from "@/lib/products/trial-store";
import { getStripe } from "@/lib/stripe";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  let event: Stripe.Event;
  try {
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid payload";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const trialId = session.metadata?.trial_id?.trim();

    if (trialId && isSupabaseConfigured()) {
      const trial = await markPaymentSucceeded(
        session.id,
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : undefined,
        event,
      );

      if (trial) {
        await updateTrialStatus(trial.id, "report_generating");
        enqueueReportGeneration(trial.id);
      }
    }
  }

  return NextResponse.json({ received: true });
}
