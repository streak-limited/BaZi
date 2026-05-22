import { getModalById } from "@/lib/products/modal-store";
import { DEFAULT_BAZI_MODAL } from "@/lib/products/modal-registry";
import { modalInputPath } from "@/lib/modals/paths";
import {
  getTrialById,
  getTrialByToken,
  isSupabaseConfigured,
  recordPayment,
  updateTrialStatus,
} from "@/lib/products/trial-store";
import {
  getStripe,
  getStripeAmountHkd,
  isStripeConfigured,
  isStripeTestMode,
} from "@/lib/stripe";
import { getAppBaseUrl } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      {
        error:
          "Stripe 未設定。請在 .env.local 加入 STRIPE_SECRET_KEY（測試帳號可用 sk_test_…）。",
      },
      { status: 503 },
    );
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe 初始化失敗" }, { status: 503 });
  }

  let body: {
    subjectId?: string;
    trialId?: string;
    publicToken?: string;
  };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const origin =
    request.headers.get("origin") ?? getAppBaseUrl();

  let trialId = body.trialId?.trim();
  let publicToken = body.publicToken?.trim();
  let modalTemplateId = DEFAULT_BAZI_MODAL;
  let modalSlug = "bazi-full-report";

  if (isSupabaseConfigured() && (trialId || publicToken)) {
    const trial = publicToken
      ? await getTrialByToken(publicToken)
      : trialId
        ? await getTrialById(trialId)
        : null;
    if (!trial) {
      return NextResponse.json({ error: "Trial not found" }, { status: 404 });
    }
    trialId = trial.id;
    publicToken = trial.public_token;
    modalTemplateId = trial.modal_template_id;
    const modal = await getModalById(trial.modal_template_id);
    if (modal) modalSlug = modal.slug;
  }

  const modal =
    (await getModalById(modalTemplateId)) ??
    (await getModalById(DEFAULT_BAZI_MODAL));

  const priceId = process.env.STRIPE_PRICE_ID?.trim();
  const amountHkd =
    modal?.config.price_hkd ?? getStripeAmountHkd();
  const productName =
    process.env.STRIPE_PRODUCT_NAME?.trim() ??
    modal?.display_name ??
    "八字完整命理報告";

  const successUrl = publicToken
    ? `${origin}/r/${publicToken}?paid=1&session_id={CHECKOUT_SESSION_ID}`
    : `${origin}/m/${modalSlug}/input?paid=1&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = publicToken
    ? `${origin}/r/${publicToken}/result`
    : `${origin}${modalInputPath(modalSlug)}`;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: priceId
        ? [{ price: priceId, quantity: 1 }]
        : [
            {
              price_data: {
                currency: "hkd",
                unit_amount: Math.round(amountHkd * 100),
                product_data: { name: productName },
              },
              quantity: 1,
            },
          ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        subjectId: body.subjectId?.trim() ?? "",
        trial_id: trialId ?? "",
        public_token: publicToken ?? "",
        modal_template_id: modalTemplateId,
        product: modalSlug,
      },
    });

    if (!session.url) {
      return NextResponse.json({ error: "無法建立付款連結" }, { status: 500 });
    }

    if (trialId && isSupabaseConfigured()) {
      await updateTrialStatus(trialId, "checkout_pending", {
        stripe_checkout_session_id: session.id,
      });
      await recordPayment({
        trialId,
        stripeSessionId: session.id,
        amountCents: Math.round(amountHkd * 100),
        status: "pending",
      });
    }

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
      testMode: isStripeTestMode(),
      publicToken: publicToken ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe checkout failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
