import type { ReportEntry } from "@/lib/report-types";

/** Stable key on each entry — matches model_prompt_entries.entry_key */
export function entryKeyOf(entry: { entry_key?: string; id?: string }): string {
  return entry.entry_key ?? entry.id ?? "";
}

export function entryByKey<T extends { entry_key?: string; id?: string }>(
  entries: T[],
  key: string,
): T | undefined {
  return entries.find(
    (e) => entryKeyOf(e) === key || e.id === key,
  );
}

export function entryContentByKey(
  entries: { entry_key?: string; id?: string; content?: string }[],
  key: string,
): string {
  return entryByKey(entries, key)?.content ?? "";
}

export function entriesBySection<T extends { section?: string }>(
  entries: T[],
): Map<string, T[]> {
  const map = new Map<string, T[]>();
  const sorted = [...entries].sort(
    (a, b) =>
      (a as { display_order?: number }).display_order! -
      (b as { display_order?: number }).display_order!,
  );
  for (const e of sorted) {
    const section = e.section ?? "other";
    const list = map.get(section) ?? [];
    list.push(e);
    map.set(section, list);
  }
  return map;
}

/** Template row → generation / deliverable shape */
export function promptRowToReportEntry(row: {
  entry_key: string;
  page: number;
  display_order: number;
  entry_type: string;
  description: string;
  section: string | null;
  static_content: string | null;
  prompt_template: string | null;
  image_url: string | null;
  image_url_proxy: string | null;
}): ReportEntry {
  return {
    id: row.entry_key,
    entry_key: row.entry_key,
    page: row.page,
    display_order: row.display_order,
    type: row.entry_type as ReportEntry["type"],
    description: row.description,
    content: row.static_content ?? "",
    section: row.section ?? undefined,
    image_url: row.image_url ?? undefined,
    image_url_proxy: row.image_url_proxy,
    prompt: row.prompt_template ?? undefined,
  };
}
