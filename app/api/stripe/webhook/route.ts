import { queueReportReadyEmail } from "@/lib/products/email";
import { getModalDefinition, DEFAULT_BAZI_MODAL } from "@/lib/products/modal-registry";
import {
  getTrialById,
  isSupabaseConfigured,
  markPaymentSucceeded,
  saveFullReportDeliverable,
  updateTrialStatus,
} from "@/lib/products/trial-store";
import type { FullReportDeliverable } from "@/lib/products/types";
import { getReportData } from "@/lib/report-data";
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
        await updateTrialStatus(trial.id, "full_generating");

        // Placeholder full report until batch AI gen is wired — user still gets link + email
        const modal = getModalDefinition(
          trial.modal_template_id ?? DEFAULT_BAZI_MODAL,
        );
        const template = getReportData();
        const placeholder: FullReportDeliverable = {
          metadata: {
            ...template.metadata,
            notes:
              "Full AI generation pending — template structure saved. Revisit /r/token/report after batch job.",
          },
          entries: template.entries,
          aiOutputs: {},
          generatedAt: new Date().toISOString(),
        };

        await saveFullReportDeliverable(trial.id, placeholder, {
          stub: true,
          modal: modal.id,
          page_count: modal.config.page_count,
        });

        await queueReportReadyEmail(trial);
      }
    }
  }

  return NextResponse.json({ received: true });
}
