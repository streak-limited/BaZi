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

/** Match deliverable entry to a CMS slot (page + slot id from entry_key suffix) */
export function aiEntryForSlot(
  entries: { type?: string; entry_key?: string; id?: string; page?: number; content?: string }[],
  page: number,
  slotId: number,
): string {
  const suffix = `-${page}-${slotId}`;
  const e = entries.find(
    (x) =>
      x.type === "ai" &&
      (x.entry_key?.endsWith(suffix) || x.id?.endsWith(suffix)),
  );
  return e?.content ?? "";
}
