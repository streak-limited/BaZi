/** Inexpensive Gemini models only — for A/B testing prompts on /bazi/report */

export interface GeminiCompareModel {
  id: string;
  label: string;
  /** Short UX note (tier, stability, deprecation) */
  note: string;
  /** Paid tier, standard — per 1M text tokens (USD). Source: ai.google.dev pricing */
  priceInputPerM: number;
  priceOutputPerM: number;
  /** 1 = lowest $/token among compare set */
  priceRank: number;
}

export const GEMINI_COMPARE_MODELS: readonly GeminiCompareModel[] = [
  {
    id: "gemini-2.5-flash-lite",
    label: "2.5 Flash Lite",
    note: "付費最便宜 · 穩定 · 長文輸出 $0.40/M",
    priceInputPerM: 0.1,
    priceOutputPerM: 0.4,
    priceRank: 1,
  },
  {
    id: "gemini-2.0-flash-lite",
    label: "2.0 Flash Lite",
    note: "單價更低 · 2026/6 下架",
    priceInputPerM: 0.075,
    priceOutputPerM: 0.3,
    priceRank: 2,
  },
  {
    id: "gemini-3.1-flash-lite",
    label: "3.1 Flash Lite",
    note: "免費額度較友善 · 付費輸出較貴 $1.50/M",
    priceInputPerM: 0.25,
    priceOutputPerM: 1.5,
    priceRank: 3,
  },
  {
    id: "gemini-flash-latest",
    label: "Flash Latest",
    note: "Google 別名 · 指向目前 Flash（價格隨版本變）",
    priceInputPerM: 0.3,
    priceOutputPerM: 2.5,
    priceRank: 4,
  },
] as const;

export const GEMINI_COMPARE_MODEL_IDS = GEMINI_COMPARE_MODELS.map((m) => m.id);

export const MAX_COMPARE_COLUMNS = 4;

/** Default columns: cheapest stable + best free-tier option */
export const DEFAULT_COMPARE_MODELS: string[] = [
  "gemini-2.5-flash-lite",
  "gemini-3.1-flash-lite",
];

export const CHEAPEST_COMPARE_MODEL_ID = "gemini-2.5-flash-lite";

export function isAllowedCompareModel(id: string): boolean {
  return GEMINI_COMPARE_MODEL_IDS.includes(id);
}

export function getCompareModel(id: string): GeminiCompareModel | undefined {
  return GEMINI_COMPARE_MODELS.find((m) => m.id === id);
}

export function getCompareModelLabel(id: string): string {
  return getCompareModel(id)?.label ?? id;
}

export function getCompareModelNote(id: string): string {
  return getCompareModel(id)?.note ?? "";
}

export function formatCompareModelPrice(id: string): string {
  const m = getCompareModel(id);
  if (!m) return "";
  return `$${m.priceInputPerM}/M 入 · $${m.priceOutputPerM}/M 出`;
}

/** Rough paid-tier cost for a long report (e.g. 8k in + 40k out tokens). */
export function estimateReportCostUsd(id: string): number {
  const m = getCompareModel(id);
  if (!m) return 0;
  const inputTokens = 8_000;
  const outputTokens = 40_000;
  return (
    (inputTokens / 1_000_000) * m.priceInputPerM +
    (outputTokens / 1_000_000) * m.priceOutputPerM
  );
}

export function sanitizeCompareModels(models: string[] | undefined): string[] {
  if (!models?.length) return [...DEFAULT_COMPARE_MODELS];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of models) {
    if (!isAllowedCompareModel(id) || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
    if (out.length >= MAX_COMPARE_COLUMNS) break;
  }
  return out.length > 0 ? out : [...DEFAULT_COMPARE_MODELS];
}

export function nextUnusedCompareModel(used: string[]): string | null {
  return (
    GEMINI_COMPARE_MODEL_IDS.find((id) => !used.includes(id)) ?? null
  );
}
