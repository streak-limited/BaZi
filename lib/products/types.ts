import type { JourneyVideoSource } from "@/lib/bazi-journey/video-sources";
import type { UserFormInput } from "@/lib/user-input";
import type { BirthPlace } from "@/lib/astrology/types";
import type { ReportData } from "@/lib/report-types";

/** Product model id — add new models in `models` table */
export type ModelId = "bazi_full" | (string & {});

export interface ProductTag {
  id: string;
  label: string;
  sort_order: number;
}

/** Saved deliverable phase: result (payment teaser) | report (full 20 pages) */
export type TrialPhase = "result" | "report";

export type TrialStatus =
  | "started"
  | "result_generating"
  | "result_ready"
  | "checkout_pending"
  | "paid"
  | "report_generating"
  | "completed"
  | "failed";

export type PaymentStatus = "pending" | "succeeded" | "failed" | "refunded";

export interface ModelConfig {
  phases: TrialPhase[];
  page_count?: number;
  price_hkd?: number;
  result_entries_ref?: string;
  report_entries_ref?: string;
  /** UI bundle key — maps to lib/models/ui-registry */
  ui_key?: string;
  media?: {
    welcomeVideo?: string | JourneyVideoSource;
    introVideo?: string | JourneyVideoSource;
    introVideo1?: string | JourneyVideoSource;
    introVideo2?: string | JourneyVideoSource;
    introVideo3?: string | JourneyVideoSource;
    inputVideo1?: string | JourneyVideoSource;
    inputVideo2?: string | JourneyVideoSource;
  };
  copy?: {
    introTitle?: string;
    introSubtitle?: string;
    inputHeaderTitle?: string;
    inputHeaderSubtitle?: string;
  };
  /** Home page product card (tags live in `tags` + `model_tags` tables) */
  listing?: {
    image?: string;
    description?: string;
    view_count?: number;
    badge?: string;
  };
  /** @deprecated */
  pre_report_entries_ref?: string;
  /** @deprecated */
  full_report_entries_ref?: string;
}

export interface ModelRow {
  id: ModelId;
  slug: string;
  display_name: string;
  family: string;
  version: number;
  config: ModelConfig;
  template_entries_ref: string | null;
  is_active: boolean;
}

export interface TrialRow {
  id: string;
  public_token: string;
  model_id: ModelId;
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

export interface ResultDeliverable {
  entries: import("@/lib/report-types").ReportEntry[];
  chart?: unknown;
  variables?: Record<string, string>;
  generatedAt: string;
}

export interface ReportDeliverable {
  metadata: ReportData["metadata"];
  entries: ReportData["entries"];
  aiOutputs?: Record<string, { text: string; model?: string; updatedAt: string }>;
  generatedAt: string;
}

export interface TrialBundle {
  trial: TrialRow;
  deliverables: Partial<Record<TrialPhase, TrialDeliverableRow>>;
  payment: PaymentRow | null;
  hubUrl: string;
  resultUrl: string;
  reportUrl: string;
}

/** @deprecated Use ResultDeliverable */
export type PreReportDeliverable = ResultDeliverable;
/** @deprecated Use ReportDeliverable */
export type FullReportDeliverable = ReportDeliverable;
