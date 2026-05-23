/**
 * Hardcoded result-page AI slot order (UI only — not from CMS).
 * CMS uses page + slot id to build entry_key; this defines render order.
 */
export const RESULT_AI_UI_SLOTS = [
  { page: 1, slotId: 1 },
  { page: 1, slotId: 2 },
  { page: 1, slotId: 3 },
  { page: 1, slotId: 4 },
  { page: 1, slotId: 5 },
] as const;

type AiEntry = {
  type?: string;
  entry_key?: string;
  id?: string;
  page?: number;
  display_order?: number;
  section?: string;
  content?: string;
};

/** Match deliverable entry to a CMS slot (page + slot id from entry_key suffix) */
export function aiEntryForSlot(
  entries: AiEntry[],
  page: number,
  slotId: number,
): string {
  const suffix = `-${page}-${slotId}`;
  let e = entries.find(
    (x) =>
      x.type === "ai" &&
      (x.entry_key?.endsWith(suffix) || x.id?.endsWith(suffix)),
  );

  if (!e) {
    const legacyId = `pre-ai-narrative-${slotId}`;
    e = entries.find(
      (x) =>
        x.type === "ai" &&
        (x.id === legacyId || x.entry_key === legacyId),
    );
  }

  if (!e) {
    const aiEntries = entries
      .filter((x) => x.type === "ai" && x.section === "fortune_narrative")
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
    e = aiEntries[slotId - 1];
  }

  return e?.content ?? "";
}
