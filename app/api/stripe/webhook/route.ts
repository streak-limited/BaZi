import { handleCheckoutSessionCompleted } from "@/lib/products/stripe-checkout";
import { isSupabaseConfigured } from "@/lib/products/trial-store";
import { getStripe } from "@/lib/stripe";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * Stripe webhook — primary path after real payment.
 * Local: `npm run stripe:webhook` → copy whsec_… to STRIPE_WEBHOOK_SECRET
 * Prod: Dashboard → Webhooks → POST /api/stripe/webhook
 *        Event: checkout.session.completed
 */
export async function POST(request: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  if (isProduction() && !webhookSecret) {
    console.error("[stripe webhook] STRIPE_WEBHOOK_SECRET missing in production");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    );
  }

  let event: Stripe.Event;
  try {
    if (webhookSecret) {
      if (!sig) {
        return NextResponse.json(
          { error: "Missing stripe-signature header" },
          { status: 400 },
        );
      }
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      console.warn(
        "[stripe webhook] STRIPE_WEBHOOK_SECRET unset — accepting unsigned body (dev only). Run: npm run stripe:webhook",
      );
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid payload";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    try {
      const result = await handleCheckoutSessionCompleted(session, event);
      if (result) {
        console.info(
          `[stripe webhook] trial=${result.trialId} report=${result.report}`,
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Webhook handler failed";
      console.error("[stripe webhook]", message, err);
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
