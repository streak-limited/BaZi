/**
 * Result page layout — static copy & assets (not in CMS).
 * AI narratives: render order in result-ai-slots.ts (hardcoded UI).
 */
import { RESULT_AI_UI_SLOTS } from "@/lib/bazi-journey/result-ai-slots";
import type { ReportEntry } from "@/lib/report-types";
import preReportJson from "@/refereence/pre-report-analysis.json";

const TEASER_BASE =
  "https://wvgwlwaqlhewhobzauda.supabase.co/storage/v1/object/public/products-media/products/mzmudang-tw/teaser";

const layoutEntries = (preReportJson as { entries: ReportEntry[] }).entries.filter(
  (e) => e.type === "static" || e.type === "computed",
);

function bySection(section: string): ReportEntry[] {
  return layoutEntries
    .filter((e) => e.section === section)
    .sort((a, b) => a.display_order - b.display_order);
}

function content(section: string): string[] {
  return bySection(section).map((e) => e.content).filter(Boolean);
}

/** Default CMS slots when seeding (page + slot id 1…n — not UI order) */
export { RESULT_AI_UI_SLOTS as RESULT_AI_DEFAULT_SLOTS } from "@/lib/bazi-journey/result-ai-slots";

/** Hardcoded result page content (edit here, not in admin CMS) */
export const RESULT_PAGE_STATIC = {
  teaserBase: TEASER_BASE,
  heroVideo:
    bySection("hero_video")[0]?.content ??
    `${TEASER_BASE}/mzmudang_teaser_sales_video.mp4`,
  intro: bySection("intro"),
  personalityTags: content("personality_tags"),
  worry: bySection("worry_dialogue"),
  worryBg:
    bySection("worry_dialogue").find((e) => e.image_url)?.image_url ??
    `${TEASER_BASE}/04_worry_bg.png`,
  palzaBg: `${TEASER_BASE}/05_palza_bg.png`,
  flower: bySection("flower_mirror"),
  money: bySection("money_teaser"),
  expert: bySection("expert_card"),
  expertBg:
    bySection("expert_card").find((e) => e.description === "大師區背景")?.image_url ??
    `${TEASER_BASE}/20_price_character.png`,
  cta: bySection("cta")[0]?.content ?? "向韓國範山道令算命",
  introBg: `${TEASER_BASE}/03_intro_bg.png`,
} as const;

/** Layout entries for generation (static + computed slots, no AI) */
export function getResultLayoutEntries(): ReportEntry[] {
  return layoutEntries.map((e) => ({
    ...e,
    entry_key: e.entry_key ?? e.id,
    id: e.id ?? e.entry_key,
  }));
}

/** AI slot placeholders for generation fallback (page + slot id from result-ai-slots) */
export function getResultAiSlotEntries(): ReportEntry[] {
  const descriptions = (preReportJson as { entries: ReportEntry[] }).entries
    .filter((e) => e.type === "ai")
    .sort((a, b) => a.display_order - b.display_order);
  return RESULT_AI_UI_SLOTS.map((slot, i) => ({
    id: `ai-${slot.page}-${slot.slotId}`,
    entry_key: `ai-${slot.page}-${slot.slotId}`,
    page: slot.page,
    display_order: slot.slotId,
    type: "ai" as const,
    description: descriptions[i]?.description ?? `AI slot ${slot.slotId}`,
    content: "",
    section: "fortune_narrative",
  }));
}
