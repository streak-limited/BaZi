import type { ModelPromptEntryRow } from "@/lib/products/prompt-types";
import {
  buildPromptSlotId,
  promptSlotPositionKey,
} from "@/lib/products/prompt-slot-id";
import type { ReportEntry } from "@/lib/report-types";

function positionOf(entry: { page: number; display_order: number }): string {
  return promptSlotPositionKey(entry.page, entry.display_order);
}

/** Overlay DB prompt_template onto slots matched by page + display_order */
export function mergeAiPromptsIntoSlots(
  slots: ReportEntry[],
  dbRows: ModelPromptEntryRow[],
): ReportEntry[] {
  const byPosition = new Map(
    dbRows
      .filter((r) => r.entry_type === "ai")
      .map((r) => [positionOf(r), r]),
  );
  return slots.map((slot) => {
    const row = byPosition.get(positionOf(slot));
    if (!row) return slot;
    return {
      ...slot,
      description: row.description || slot.description,
      prompt: row.prompt_template ?? slot.prompt,
      section: row.section ?? slot.section,
      page: row.page,
      display_order: row.display_order,
    };
  });
}

/** Build AI generation slots purely from DB rows (admin-defined positions) */
export function aiSlotsFromDbRows(
  dbRows: ModelPromptEntryRow[],
  modelSlug: string,
): ReportEntry[] {
  return dbRows
    .filter((r) => r.entry_type === "ai" && r.is_active)
    .sort((a, b) => a.page - b.page || a.display_order - b.display_order)
    .map((row) => {
      const slotId = buildPromptSlotId(
        modelSlug,
        row.phase,
        row.page,
        row.display_order,
      );
      return {
        id: slotId,
        entry_key: slotId,
        page: row.page,
        display_order: row.display_order,
        type: "ai" as const,
        description: row.description,
        content: "",
        section: row.section ?? "fortune_narrative",
        prompt: row.prompt_template ?? undefined,
      };
    });
}
