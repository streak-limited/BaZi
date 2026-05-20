import { DEFAULT_COMPARE_MODELS } from "@/lib/gemini-models";
import type { UserFormInput } from "@/lib/user-input";

export interface SavedAiOutput {
  text: string;
  model?: string;
  updatedAt: string;
}

/** Entry key → model id → output */
export type AiOutputsMap = Record<string, Record<string, SavedAiOutput>>;

export interface SubjectSummary {
  id: string;
  displayName: string;
  updatedAt: string;
  birthDate?: string;
  generatedCount: number;
}

export interface PersistedReportState {
  sessionId: string;
  displayName: string;
  userInput: UserFormInput;
  compareModels: string[];
  aiOutputs: AiOutputsMap;
  updatedAt: string;
}

export function aiOutputKey(page: number, displayOrder: number): string {
  return `${page}-${displayOrder}`;
}

export function isLegacyFlatOutput(
  value: unknown,
): value is SavedAiOutput {
  return (
    typeof value === "object" &&
    value !== null &&
    "text" in value &&
    typeof (value as SavedAiOutput).text === "string"
  );
}

/** Migrate old DB shape: `{ "3-1": { text } }` → nested by model */
export function migrateAiOutputs(raw: unknown): AiOutputsMap {
  if (!raw || typeof raw !== "object") return {};
  const parsed = raw as Record<string, unknown>;
  const result: AiOutputsMap = {};
  const fallbackModel = DEFAULT_COMPARE_MODELS[0];

  for (const [entryKey, val] of Object.entries(parsed)) {
    if (!val || typeof val !== "object") continue;
    if (isLegacyFlatOutput(val)) {
      result[entryKey] = { [fallbackModel]: val };
      continue;
    }
    const byModel: Record<string, SavedAiOutput> = {};
    for (const [modelId, out] of Object.entries(val as Record<string, unknown>)) {
      if (isLegacyFlatOutput(out)) byModel[modelId] = out;
    }
    if (Object.keys(byModel).length > 0) result[entryKey] = byModel;
  }
  return result;
}

export function countSavedOutputs(map: AiOutputsMap): number {
  let n = 0;
  for (const byModel of Object.values(map)) {
    n += Object.keys(byModel).length;
  }
  return n;
}

export function newSubjectId(): string {
  return `sub_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}
