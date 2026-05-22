import type { ModalTemplateConfig, ModalTemplateId } from "@/lib/products/types";

export interface ModalDefinition {
  id: ModalTemplateId;
  slug: string;
  displayName: string;
  family: string;
  config: ModalTemplateConfig;
  templateEntriesRef: string;
}

/** In-code registry — keep in sync with Supabase seed `modal_templates` */
export const MODAL_REGISTRY: Record<string, ModalDefinition> = {
  bazi_full: {
    id: "bazi_full",
    slug: "bazi-full-report",
    displayName: "八字完整命理報告",
    family: "bazi",
    templateEntriesRef: "bazi_full_v1",
    config: {
      phases: ["pre_report", "full_report"],
      page_count: 20,
      price_hkd: 88,
      pre_report_entries_ref: "pre-report-analysis.json",
      full_report_entries_ref: "ai_generated_content.json",
    },
  },
  // Future modals — same pattern:
  // wealth_focus: { id: 'wealth_focus', family: 'bazi', phases: ['pre_report','full_report'], ... },
};

export const DEFAULT_BAZI_MODAL: ModalTemplateId = "bazi_full";

export function getModalDefinition(id: ModalTemplateId): ModalDefinition {
  const def = MODAL_REGISTRY[id];
  if (!def) throw new Error(`Unknown modal template: ${id}`);
  return def;
}
