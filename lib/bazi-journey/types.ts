import type { BaziChart, PromptVariableMap } from "@/lib/bazi/calculate";
import type { ReportEntry } from "@/lib/report-types";
import type { UserFormInput } from "@/lib/user-input";

export type BaziJourneyStep = "intro" | "input" | "generating" | "paid";

export type ResolvedResultEntry = ReportEntry & {
  content: string;
};

export interface ResultPayload {
  entries: ResolvedResultEntry[];
  chart?: BaziChart;
  variables?: PromptVariableMap;
  generatedAt: string;
}

export interface BaziJourneyDraft {
  step: BaziJourneyStep;
  input: UserFormInput;
  inputStepIndex: number;
  subjectId: string | null;
  result: ResultPayload | null;
  publicToken?: string | null;
  trialId?: string | null;
  reportHubUrl?: string | null;
}

export const BAZI_JOURNEY_DRAFT_KEY = "bazi-journey-draft";

/** @deprecated Use BaziJourneyStep */
export type BaziFlowStep = BaziJourneyStep;
/** @deprecated Use ResultPayload */
export type PreReportPayload = ResultPayload;
/** @deprecated Use BaziJourneyDraft */
export type BaziFlowDraft = BaziJourneyDraft;
export const BAZI_FLOW_DRAFT_KEY = BAZI_JOURNEY_DRAFT_KEY;
