import { getPreReportData } from "@/lib/pre-report-data";
import { PRE_REPORT_PROMPTS_BY_DESCRIPTION } from "@/lib/pre-report-prompts";
import { getReportData } from "@/lib/report-data";
import { PROMPTS_BY_DESCRIPTION } from "@/lib/report-prompts";
import { RESULT_AI_DEFAULT_SLOTS } from "@/lib/bazi-journey/result-page-static";
import type { ModelPromptEntryInput } from "@/lib/products/prompt-types";

export type DefaultPromptSlot = {
  page: number;
  slotId: number;
  description: string;
  prompt: string | null;
  section?: string | null;
};

/** Payment teaser — `refereence/pre-report-analysis.json` (5 AI slots, page 1). */
export function buildResultDefaultSlots(): DefaultPromptSlot[] {
  const aiFromJson = getPreReportData().entries.filter((e) => e.type === "ai");
  if (aiFromJson.length > 0) {
    return aiFromJson.map((e, i) => ({
      page: e.page,
      slotId: i + 1,
      description: e.description ?? "",
      prompt:
        e.prompt ?? PRE_REPORT_PROMPTS_BY_DESCRIPTION[e.description] ?? null,
      section: e.section ?? null,
    }));
  }
  return RESULT_AI_DEFAULT_SLOTS.map((s, i) => ({
    page: s.page,
    slotId: s.slotId,
    description: `AI slot ${i + 1}`,
    prompt: null,
  }));
}

/**
 * Full 20-page report — `refereence/ai_generated_content.json` (35 AI entries).
 * Slot id resets per page (1, 2, 3… within each page).
 */
export function buildReportDefaultSlots(): DefaultPromptSlot[] {
  const aiEntries = getReportData().entries.filter((e) => e.type === "ai");
  const slotCounterByPage = new Map<number, number>();

  return aiEntries.map((e) => {
    const page = e.page;
    const slotId = (slotCounterByPage.get(page) ?? 0) + 1;
    slotCounterByPage.set(page, slotId);
    const desc = e.description ?? "";
    const prompt =
      (e as { prompt?: string }).prompt ??
      PROMPTS_BY_DESCRIPTION[desc] ??
      null;
    return {
      page,
      slotId,
      description: desc,
      prompt,
      section: e.section ?? null,
    };
  });
}

export function slotsToPromptEntries(
  slots: DefaultPromptSlot[],
): ModelPromptEntryInput[] {
  return slots.map((slot) => ({
    page: slot.page,
    display_order: slot.slotId,
    entry_type: "ai" as const,
    description: slot.description,
    static_content: null,
    prompt_template: slot.prompt,
    is_active: true,
  }));
}
