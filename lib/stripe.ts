import Stripe from "stripe";

/** Default test price when STRIPE_PRICE_ID is not set (HKD) */
export const DEFAULT_STRIPE_AMOUNT_HKD = 88;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  return new Stripe(key);
}

export function isStripeTestMode(): boolean {
  const key = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  return key.startsWith("sk_test_");
}

export function getStripeAmountHkd(): number {
  const raw = process.env.STRIPE_AMOUNT_HKD?.trim();
  if (raw && !Number.isNaN(Number(raw))) return Number(raw);
  return DEFAULT_STRIPE_AMOUNT_HKD;
}

/** Enabled when secret key exists (price defaults to STRIPE_AMOUNT_HKD or 88 HKD) */
export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function allowStripeSkip(): boolean {
  if (process.env.BAZI_SKIP_STRIPE === "1") return true;
  if (process.env.STRIPE_ALLOW_SKIP === "1") return true;
  return process.env.NODE_ENV === "development";
}

export function stripeDisplayPrice(): string {
  const label = process.env.STRIPE_PRICE_LABEL?.trim();
  if (label) return label;
  if (process.env.STRIPE_PRICE_ID?.trim()) {
    return process.env.STRIPE_PRICE_LABEL?.trim() || "解鎖完整報告";
  }
  return `HK$${getStripeAmountHkd()}`;
}

export function getStripePublicConfig() {
  return {
    enabled: isStripeConfigured(),
    testMode: isStripeTestMode(),
    priceLabel: stripeDisplayPrice(),
    amountHkd: getStripeAmountHkd(),
    allowSkip: allowStripeSkip(),
    hasPublishableKey: Boolean(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim(),
    ),
  };
}
