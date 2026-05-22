import type { UserFormInput } from "@/lib/user-input";
import type { BirthPlace } from "@/lib/astrology/types";
import type { ReportData } from "@/lib/report-types";

/** Product template id — add new modals here */
export type ModalTemplateId = "bazi_full" | (string & {});

export type TrialPhase = "pre_report" | "full_report";

export type TrialStatus =
  | "started"
  | "pre_report_generating"
  | "pre_report_ready"
  | "checkout_pending"
  | "paid"
  | "full_generating"
  | "completed"
  | "failed";

export type PaymentStatus = "pending" | "succeeded" | "failed" | "refunded";

export interface ModalTemplateConfig {
  phases: TrialPhase[];
  page_count?: number;
  price_hkd?: number;
  pre_report_entries_ref?: string;
  full_report_entries_ref?: string;
}

export interface ModalTemplateRow {
  id: ModalTemplateId;
  slug: string;
  display_name: string;
  family: string;
  version: number;
  config: ModalTemplateConfig;
  template_entries_ref: string | null;
  is_active: boolean;
}

export interface TrialRow {
  id: string;
  public_token: string;
  modal_template_id: ModalTemplateId;
  email: string;
  user_input: UserFormInput;
  birth_place: BirthPlace | null;
  locale: string;
  status: TrialStatus;
  stripe_checkout_session_id: string | null;
  stripe_payment_status: string | null;
  paid_at: string | null;
  error_message: string | null;
  legacy_subject_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TrialDeliverableRow {
  id: string;
  trial_id: string;
  phase: TrialPhase;
  deliverable_key: string;
  content: unknown;
  ai_meta: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentRow {
  id: string;
  trial_id: string;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  amount_cents: number | null;
  currency: string;
  status: PaymentStatus;
  created_at: string;
}

/** Pre-report deliverable shape */
export interface PreReportDeliverable {
  entries: import("@/lib/report-types").ReportEntry[];
  chart?: unknown;
  variables?: Record<string, string>;
  generatedAt: string;
}

/** Full report deliverable — same entry model as ReportData */
export interface FullReportDeliverable {
  metadata: ReportData["metadata"];
  entries: ReportData["entries"];
  aiOutputs?: Record<string, { text: string; model?: string; updatedAt: string }>;
  generatedAt: string;
}

export interface TrialBundle {
  trial: TrialRow;
  deliverables: Partial<Record<TrialPhase, TrialDeliverableRow>>;
  payment: PaymentRow | null;
  reportUrl: string;
  preReportUrl: string;
  fullReportUrl: string;
}
