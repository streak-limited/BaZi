import type { ReportData, ReportEntry } from "@/lib/report-types";

export const REPORT_PAGE_COUNT = 20;

export const PAGE_NAV_LABELS: Record<number, string> = {
  1: "封面",
  2: "目錄",
  3: "命盤",
  4: "武器",
  5: "性格",
  6: "大運",
  7: "流年",
  8: "事業",
  9: "財運",
  10: "感情",
  11: "健康",
  12: "貴人",
  13: "風水",
  14: "開運",
  15: "時機",
  16: "警示",
  17: "總結",
  18: "建議",
  19: "祝福",
  20: "結語",
};

export function sortEntries(entries: ReportEntry[]): ReportEntry[] {
  return [...entries].sort(
    (a, b) => a.page - b.page || a.display_order - b.display_order,
  );
}

export function entriesForPage(entries: ReportEntry[], page: number): ReportEntry[] {
  return sortEntries(entries).filter((e) => e.page === page);
}

/** Hide filename-only asset rows from readable layout */
export function isDecorativeAsset(entry: ReportEntry): boolean {
  if (!entry.image_url) return false;
  const d = entry.description ?? "";
  if (!d.includes("固定插圖") && !d.includes("裝飾")) return false;
  const c = entry.content.trim();
  return /\.(png|svg|jpg|jpeg|webp)$/i.test(c) || c.length < 4;
}

export function isChartGlyph(entry: ReportEntry): boolean {
  const url = entry.image_url ?? "";
  return url.includes("/saju/gan/") || url.includes("/saju/ji/");
}

export function visibleEntries(entries: ReportEntry[]): ReportEntry[] {
  return entries.filter((e) => !isDecorativeAsset(e) && !isChartGlyph(e));
}

export function pickByDescription(
  entries: ReportEntry[],
  includes: string,
): ReportEntry | undefined {
  return entries.find((e) => e.description.includes(includes));
}

export function pickAllByDescription(
  entries: ReportEntry[],
  includes: string,
): ReportEntry[] {
  return entries.filter((e) => e.description.includes(includes));
}

export function narrativeBlocks(entries: ReportEntry[]): ReportEntry[] {
  return visibleEntries(entries).filter(
    (e) =>
      e.type === "ai" ||
      (e.type === "static" &&
        e.content.length > 40 &&
        !e.description.includes("章節目錄")),
  );
}

export function headingBlocks(entries: ReportEntry[]): ReportEntry[] {
  return visibleEntries(entries).filter(
    (e) =>
      e.type === "static" &&
      (e.description.includes("區塊小標題") ||
        e.description.includes("章節開場") ||
        e.description.includes("固定模板")),
  );
}

export function heroImages(entries: ReportEntry[]): ReportEntry[] {
  return visibleEntries(entries).filter(
    (e) =>
      e.image_url &&
      !isDecorativeAsset(e) &&
      (e.description.includes("hero") ||
        e.description.includes("character") ||
        e.description.includes("daewoon") ||
        e.content.includes("hero") ||
        e.content.includes("character")),
  );
}

export function chipLabels(entries: ReportEntry[]): string[] {
  return visibleEntries(entries)
    .filter(
      (e) =>
        e.type === "computed" &&
        e.description.includes("十神") &&
        e.content.length <= 8,
    )
    .map((e) => e.content.trim())
    .filter(Boolean);
}
