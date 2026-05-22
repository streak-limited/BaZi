import type { BaziChart, PromptVariableMap } from "@/lib/bazi/calculate";
import type { ReportEntry } from "@/lib/report-types";
import type { UserFormInput } from "@/lib/user-input";

export type BaziFlowStep = "immersion" | "input" | "generating" | "pre-report" | "paid";

export type ResolvedPreReportEntry = ReportEntry & {
  content: string;
};

export interface PreReportPayload {
  entries: ResolvedPreReportEntry[];
  chart: BaziChart;
  variables: PromptVariableMap;
  generatedAt: string;
}

export interface BaziFlowDraft {
  step: BaziFlowStep;
  input: UserFormInput;
  inputStepIndex: number;
  subjectId: string | null;
  preReport: PreReportPayload | null;
  /** Supabase trial — shareable report link */
  publicToken?: string | null;
  trialId?: string | null;
  reportHubUrl?: string | null;
}

export const BAZI_FLOW_DRAFT_KEY = "bazi-flow-draft";
