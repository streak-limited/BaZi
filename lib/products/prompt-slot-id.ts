import type { PromptPhase } from "@/lib/products/prompt-types";

/** Normalize slug segment for slot ids (lowercase, hyphens only) */
export function normalizeSlugForSlotId(slug: string): string {
  return slug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Stable slot id: {model-slug}-{phase}-{page}-{slotId}
 * e.g. bazi-full-report-result-1-3
 * slotId is a CMS identifier only — UI render order is hardcoded in components.
 */
export function buildPromptSlotId(
  modelSlug: string,
  phase: PromptPhase,
  page: number,
  slotId: number,
): string {
  const slug = normalizeSlugForSlotId(modelSlug);
  return `${slug}-${phase}-${page}-${slotId}`;
}

/** DB row identity: model + phase + page + slot id (stored in display_order column) */
export function promptSlotPositionKey(page: number, slotId: number): string {
  return `${page}-${slotId}`;
}

export function parsePromptSlotId(id: string): {
  slug: string;
  phase: PromptPhase;
  page: number;
  slotId: number;
} | null {
  const m = id.match(/^(.+)-(result|report)-(\d+)-(\d+)$/);
  if (!m) return null;
  return {
    slug: m[1],
    phase: m[2] as PromptPhase,
    page: Number(m[3]),
    slotId: Number(m[4]),
  };
}

/** slot id lives in display_order column historically */
export function slotIdFromRow(row: { display_order: number }): number {
  return row.display_order;
}
