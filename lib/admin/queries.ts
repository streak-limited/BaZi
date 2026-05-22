import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";
import { listActiveModels } from "@/lib/products/model-store";

export interface AdminTrialRow {
  id: string;
  public_token: string;
  model_id: string;
  model_display_name: string;
  email: string;
  status: string;
  created_at: string;
  paid_at: string | null;
}

export interface AdminPaymentRow {
  id: string;
  trial_id: string;
  public_token: string | null;
  stripe_session_id: string | null;
  amount_cents: number | null;
  currency: string;
  status: string;
  created_at: string;
}

export interface AdminEmailRow {
  id: string;
  trial_id: string | null;
  to_email: string;
  template: string;
  status: string;
  created_at: string;
}

export async function fetchAdminDashboard() {
  const models = await listActiveModels();

  if (!isSupabaseConfigured()) {
    return {
      configured: false,
      models,
      trials: [] as AdminTrialRow[],
      payments: [] as AdminPaymentRow[],
      emails: [] as AdminEmailRow[],
      stats: { trialCount: 0, paidCount: 0, paymentCount: 0 },
    };
  }

  const db = getSupabaseAdmin();
  const modelName = new Map(models.map((m) => [m.id, m.display_name]));

  const { data: trialsRaw, error: te } = await db
    .from("trials")
    .select("id, public_token, model_id, email, status, created_at, paid_at")
    .order("created_at", { ascending: false })
    .limit(80);

  if (te) {
    const legacy = await db
      .from("trials")
      .select(
        "id, public_token, modal_template_id, email, status, created_at, paid_at",
      )
      .order("created_at", { ascending: false })
      .limit(80);
    if (legacy.error) throw new Error(legacy.error.message);
    const trials: AdminTrialRow[] = (legacy.data ?? []).map((r) => ({
      id: String(r.id),
      public_token: String(r.public_token),
      model_id: String(r.modal_template_id),
      model_display_name:
        modelName.get(String(r.modal_template_id)) ??
        String(r.modal_template_id),
      email: String(r.email ?? ""),
      status: String(r.status),
      created_at: String(r.created_at),
      paid_at: r.paid_at ? String(r.paid_at) : null,
    }));
    return buildRest(db, models, trials);
  }

  const trials: AdminTrialRow[] = (trialsRaw ?? []).map((r) => ({
    id: String(r.id),
    public_token: String(r.public_token),
    model_id: String(r.model_id),
    model_display_name:
      modelName.get(String(r.model_id)) ?? String(r.model_id),
    email: String(r.email ?? ""),
    status: String(r.status),
    created_at: String(r.created_at),
    paid_at: r.paid_at ? String(r.paid_at) : null,
  }));

  return buildRest(db, models, trials);
}

async function buildRest(
  db: ReturnType<typeof getSupabaseAdmin>,
  models: Awaited<ReturnType<typeof listActiveModels>>,
  trials: AdminTrialRow[],
) {
  const { data: paymentsRaw, error: pe } = await db
    .from("payments")
    .select(
      "id, trial_id, stripe_session_id, amount_cents, currency, status, created_at, trials(public_token)",
    )
    .order("created_at", { ascending: false })
    .limit(80);
  if (pe) throw new Error(pe.message);

  const payments: AdminPaymentRow[] = (paymentsRaw ?? []).map((r) => {
    const trialJoin = r.trials as
      | { public_token?: string }
      | { public_token?: string }[]
      | null;
    const token = Array.isArray(trialJoin)
      ? trialJoin[0]?.public_token
      : trialJoin?.public_token;
    return {
      id: String(r.id),
      trial_id: String(r.trial_id),
      public_token: token ? String(token) : null,
      stripe_session_id: r.stripe_session_id
        ? String(r.stripe_session_id)
        : null,
      amount_cents: r.amount_cents != null ? Number(r.amount_cents) : null,
      currency: String(r.currency ?? "hkd"),
      status: String(r.status),
      created_at: String(r.created_at),
    };
  });

  const { data: emailsRaw, error: ee } = await db
    .from("email_log")
    .select("id, trial_id, to_email, template, status, created_at")
    .order("created_at", { ascending: false })
    .limit(40);
  if (ee) throw new Error(ee.message);

  const emails: AdminEmailRow[] = (emailsRaw ?? []).map((r) => ({
    id: String(r.id),
    trial_id: r.trial_id ? String(r.trial_id) : null,
    to_email: String(r.to_email),
    template: String(r.template),
    status: String(r.status),
    created_at: String(r.created_at),
  }));

  const paidCount = trials.filter(
    (t) =>
      t.status === "paid" ||
      t.status === "report_generating" ||
      t.status === "completed",
  ).length;

  return {
    configured: true,
    models,
    trials,
    payments,
    emails,
    stats: {
      trialCount: trials.length,
      paidCount,
      paymentCount: payments.length,
    },
  };
}
