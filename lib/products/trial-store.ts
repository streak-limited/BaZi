import { getAppBaseUrl, getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";
import type { BirthPlace } from "@/lib/astrology/types";
import type {
  ModalTemplateId,
  PaymentRow,
  PaymentStatus,
  ReportDeliverable,
  ResultDeliverable,
  TrialBundle,
  TrialDeliverableRow,
  TrialPhase,
  TrialRow,
  TrialStatus,
} from "@/lib/products/types";
import type { UserFormInput } from "@/lib/user-input";
import { customAlphabet } from "nanoid";

const tokenAlphabet = customAlphabet(
  "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz",
  24,
);

function newPublicToken(): string {
  return tokenAlphabet();
}

function rowToTrial(row: Record<string, unknown>): TrialRow {
  return {
    id: String(row.id),
    public_token: String(row.public_token),
    modal_template_id: String(row.modal_template_id) as ModalTemplateId,
    email: String(row.email ?? ""),
    user_input: row.user_input as UserFormInput,
    birth_place: (row.birth_place as BirthPlace | null) ?? null,
    locale: String(row.locale ?? "zh-Hant"),
    status: String(row.status) as TrialStatus,
    stripe_checkout_session_id: row.stripe_checkout_session_id
      ? String(row.stripe_checkout_session_id)
      : null,
    stripe_payment_status: row.stripe_payment_status
      ? String(row.stripe_payment_status)
      : null,
    paid_at: row.paid_at ? String(row.paid_at) : null,
    error_message: row.error_message ? String(row.error_message) : null,
    legacy_subject_id: row.legacy_subject_id
      ? String(row.legacy_subject_id)
      : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function urlsForToken(publicToken: string) {
  const base = getAppBaseUrl();
  return {
    hubUrl: `${base}/r/${publicToken}`,
    resultUrl: `${base}/r/${publicToken}/result`,
    reportUrl: `${base}/r/${publicToken}/report`,
  };
}

export async function createTrial(params: {
  modalTemplateId: ModalTemplateId;
  userInput: UserFormInput;
  email?: string;
  birthPlace?: BirthPlace | null;
  legacySubjectId?: string;
}): Promise<TrialRow> {
  const db = getSupabaseAdmin();
  const public_token = newPublicToken();

  const { data, error } = await db
    .from("trials")
    .insert({
      public_token,
      modal_template_id: params.modalTemplateId,
      email: params.email?.trim() || params.userInput.email?.trim() || "",
      user_input: params.userInput,
      birth_place: params.birthPlace ?? null,
      status: "started",
      legacy_subject_id: params.legacySubjectId ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return rowToTrial(data as Record<string, unknown>);
}

export async function updateTrialStatus(
  trialId: string,
  status: TrialStatus,
  extra?: Partial<{
    error_message: string;
    stripe_checkout_session_id: string;
    stripe_payment_status: string;
    paid_at: string;
  }>,
): Promise<void> {
  const db = getSupabaseAdmin();
  const { error } = await db
    .from("trials")
    .update({ status, ...extra })
    .eq("id", trialId);
  if (error) throw new Error(error.message);
}

export async function getTrialByToken(
  publicToken: string,
): Promise<TrialRow | null> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("trials")
    .select("*")
    .eq("public_token", publicToken.trim())
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return rowToTrial(data as Record<string, unknown>);
}

export async function getTrialById(trialId: string): Promise<TrialRow | null> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("trials")
    .select("*")
    .eq("id", trialId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return rowToTrial(data as Record<string, unknown>);
}

export async function saveDeliverable(
  trialId: string,
  phase: TrialPhase,
  content: unknown,
  aiMeta?: Record<string, unknown>,
  deliverableKey = "main",
): Promise<void> {
  const db = getSupabaseAdmin();
  const { error } = await db.from("trial_deliverables").upsert(
    {
      trial_id: trialId,
      phase,
      deliverable_key: deliverableKey,
      content,
      ai_meta: aiMeta ?? null,
    },
    { onConflict: "trial_id,phase,deliverable_key" },
  );
  if (error) throw new Error(error.message);
}

export async function getDeliverable<T = unknown>(
  trialId: string,
  phase: TrialPhase,
  deliverableKey = "main",
): Promise<T | null> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("trial_deliverables")
    .select("content")
    .eq("trial_id", trialId)
    .eq("phase", phase)
    .eq("deliverable_key", deliverableKey)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data?.content as T) ?? null;
}

export async function recordPayment(params: {
  trialId: string;
  stripeSessionId: string;
  amountCents: number;
  currency?: string;
  status?: PaymentStatus;
  rawEvent?: unknown;
}): Promise<PaymentRow> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("payments")
    .upsert(
      {
        trial_id: params.trialId,
        stripe_session_id: params.stripeSessionId,
        amount_cents: params.amountCents,
        currency: params.currency ?? "hkd",
        status: params.status ?? "pending",
        raw_event: params.rawEvent ?? null,
      },
      { onConflict: "stripe_session_id" },
    )
    .select()
    .single();
  if (error) throw new Error(error.message);
  const row = data as Record<string, unknown>;
  return {
    id: String(row.id),
    trial_id: String(row.trial_id),
    stripe_session_id: row.stripe_session_id
      ? String(row.stripe_session_id)
      : null,
    stripe_payment_intent_id: row.stripe_payment_intent_id
      ? String(row.stripe_payment_intent_id)
      : null,
    amount_cents: row.amount_cents != null ? Number(row.amount_cents) : null,
    currency: String(row.currency ?? "hkd"),
    status: String(row.status) as PaymentStatus,
    created_at: String(row.created_at),
  };
}

/** Resolve trial from Stripe Checkout session id (payments row or trials.stripe_checkout_session_id). */
export async function getTrialByStripeSessionId(
  stripeSessionId: string,
): Promise<TrialRow | null> {
  const db = getSupabaseAdmin();
  const sid = stripeSessionId.trim();
  if (!sid) return null;

  const { data: pay } = await db
    .from("payments")
    .select("trial_id")
    .eq("stripe_session_id", sid)
    .maybeSingle();
  if (pay?.trial_id) {
    return getTrialById(String(pay.trial_id));
  }

  const { data: trialRow } = await db
    .from("trials")
    .select("*")
    .eq("stripe_checkout_session_id", sid)
    .maybeSingle();
  if (trialRow) return rowToTrial(trialRow as Record<string, unknown>);

  return null;
}

export async function markPaymentSucceeded(
  stripeSessionId: string,
  paymentIntentId?: string,
  rawEvent?: unknown,
): Promise<TrialRow | null> {
  const db = getSupabaseAdmin();
  const { data: pay, error: payErr } = await db
    .from("payments")
    .update({
      status: "succeeded",
      stripe_payment_intent_id: paymentIntentId ?? null,
      raw_event: rawEvent ?? null,
    })
    .eq("stripe_session_id", stripeSessionId)
    .select("trial_id")
    .single();
  if (payErr || !pay) return null;

  const trialId = String(pay.trial_id);
  await updateTrialStatus(trialId, "paid", {
    paid_at: new Date().toISOString(),
    stripe_payment_status: "paid",
  });

  return getTrialById(trialId);
}

export async function loadTrialBundle(
  publicToken: string,
): Promise<TrialBundle | null> {
  const trial = await getTrialByToken(publicToken);
  if (!trial) return null;

  const db = getSupabaseAdmin();
  const { data: dels, error: dErr } = await db
    .from("trial_deliverables")
    .select("*")
    .eq("trial_id", trial.id);
  if (dErr) throw new Error(dErr.message);

  const { data: pays } = await db
    .from("payments")
    .select("*")
    .eq("trial_id", trial.id)
    .order("created_at", { ascending: false })
    .limit(1);

  const deliverables: Partial<Record<TrialPhase, TrialDeliverableRow>> = {};
  for (const d of dels ?? []) {
    const row = d as Record<string, unknown>;
    const phase = String(row.phase) as TrialPhase;
    deliverables[phase] = {
      id: String(row.id),
      trial_id: String(row.trial_id),
      phase,
      deliverable_key: String(row.deliverable_key),
      content: row.content,
      ai_meta: row.ai_meta as Record<string, unknown> | null,
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    };
  }

  const urls = urlsForToken(trial.public_token);
  let payment: PaymentRow | null = null;
  if (pays?.[0]) {
    const p = pays[0] as Record<string, unknown>;
    payment = {
      id: String(p.id),
      trial_id: String(p.trial_id),
      stripe_session_id: p.stripe_session_id
        ? String(p.stripe_session_id)
        : null,
      stripe_payment_intent_id: p.stripe_payment_intent_id
        ? String(p.stripe_payment_intent_id)
        : null,
      amount_cents: p.amount_cents != null ? Number(p.amount_cents) : null,
      currency: String(p.currency ?? "hkd"),
      status: String(p.status) as PaymentStatus,
      created_at: String(p.created_at),
    };
  }

  return { trial, deliverables, payment, ...urls };
}

export async function saveResultDeliverable(
  trialId: string,
  payload: ResultDeliverable,
  aiMeta?: Record<string, unknown>,
): Promise<void> {
  await saveDeliverable(trialId, "result", payload, aiMeta);
  await updateTrialStatus(trialId, "result_ready");
}

export async function saveReportDeliverable(
  trialId: string,
  payload: ReportDeliverable,
  aiMeta?: Record<string, unknown>,
): Promise<void> {
  await saveDeliverable(trialId, "report", payload, aiMeta);
  await updateTrialStatus(trialId, "completed");
}

/** @deprecated Use saveResultDeliverable */
export const savePreReportDeliverable = saveResultDeliverable;
/** @deprecated Use saveReportDeliverable */
export const saveFullReportDeliverable = saveReportDeliverable;

export { isSupabaseConfigured };
