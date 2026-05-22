import type { ModelConfig, ModelId, ProductTag } from "@/lib/products/types";

export interface ModelDefinition {
  id: ModelId;
  slug: string;
  displayName: string;
  family: string;
  config: ModelConfig;
  templateEntriesRef: string;
  tags?: ProductTag[];
}

const DEFAULT_BAZI_TAGS: ProductTag[] = [
  { id: "love", label: "戀愛", sort_order: 10 },
  { id: "general", label: "綜合", sort_order: 40 },
];

/** In-code registry — keep in sync with Supabase `models` table */
export const MODEL_REGISTRY: Record<string, ModelDefinition> = {
  bazi_full: {
    id: "bazi_full",
    slug: "bazi-full-report",
    displayName: "八字完整命理報告",
    family: "bazi",
    templateEntriesRef: "bazi_full_v1",
    tags: DEFAULT_BAZI_TAGS,
    config: {
      phases: ["result", "report"],
      page_count: 20,
      price_hkd: 88,
      result_entries_ref: "pre-report-analysis.json",
      report_entries_ref: "ai_generated_content.json",
      listing: {
        description: "完整八字命盤解讀，從性格、感情到事業與流年運勢",
        view_count: 12000,
        badge: "推薦",
      },
    },
  },
};

export const DEFAULT_BAZI_MODEL: ModelId = "bazi_full";

export function getModelDefinition(id: ModelId): ModelDefinition {
  const def = MODEL_REGISTRY[id];
  if (!def) throw new Error(`Unknown model: ${id}`);
  return def;
}
