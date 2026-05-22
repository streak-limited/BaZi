import { getReportData } from "@/lib/report-data";
import type { ReportDeliverable } from "@/lib/products/types";
import type { ReportData, ReportEntry } from "@/lib/report-types";

/** Merge template entries with saved AI outputs for read-only report view */
export function mergeReportForDisplay(
  deliverable: ReportDeliverable | null,
): ReportData {
  const template = getReportData();
  if (!deliverable?.entries?.length) {
    return template;
  }

  if (
    deliverable.metadata?.demo_mode === true ||
    (deliverable.entries.length >= 50 &&
      deliverable.entries.some((e) => e.type === "ai" && e.content.length > 100))
  ) {
    return {
      metadata: { ...template.metadata, ...deliverable.metadata },
      entries: deliverable.entries,
    };
  }

  const aiByKey = deliverable.aiOutputs ?? {};
  const entries: ReportEntry[] = template.entries.map((entry) => {
    if (entry.type !== "ai") return entry;
    const key = entry.id ?? `${entry.page}-${entry.display_order}`;
    const saved = aiByKey[key];
    if (saved?.text) {
      return { ...entry, content: saved.text };
    }
    const fromDeliverable = deliverable.entries?.find(
      (e) =>
        e.page === entry.page &&
        e.display_order === entry.display_order,
    );
    if (fromDeliverable?.content) {
      return { ...entry, content: fromDeliverable.content };
    }
    return entry;
  });

  return {
    metadata: { ...template.metadata, ...deliverable.metadata },
    entries,
  };
}

/** @deprecated Use mergeReportForDisplay */
export const mergeFullReportForDisplay = mergeReportForDisplay;

export function pageNumbersFromReport(data: ReportData): number[] {
  const pages = new Set<number>();
  for (const e of data.entries) pages.add(e.page);
  return [...pages].sort((a, b) => a - b);
}
