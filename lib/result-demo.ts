import { calculateBazi } from "@/lib/bazi/calculate";
import type { ResultPayload } from "@/lib/bazi-journey/types";
import { getPreReportData } from "@/lib/pre-report-data";
import type { ReportEntry } from "@/lib/report-types";
import type { UserFormInput } from "@/lib/user-input";
import type { ResultDeliverable } from "@/lib/products/types";

function formatPillars(fourPillars: string): string {
  return fourPillars.split(" ").join("\n");
}

/** Demo result from pre-report-analysis.json — optional user patches for name/pillars */
export function buildDemoResultPayload(
  userInput?: UserFormInput,
): ResultPayload {
  const template = getPreReportData();
  const bazi = userInput ? calculateBazi(userInput) : null;
  const name =
    userInput?.name?.trim() ||
    bazi?.variables?.name?.trim() ||
    template.metadata.sample_subject?.name ||
    "命主";
  const pillars = bazi?.chart?.fourPillars
    ? formatPillars(bazi.chart.fourPillars)
    : template.metadata.sample_subject?.pillars ?? "";

  const entries: ReportEntry[] = template.entries.map((entry) => {
    if (entry.section === "name_display" || entry.id === "pre-name") {
      return { ...entry, content: name };
    }
    if (entry.section === "four_pillars" || entry.id === "pre-four-pillars") {
      return { ...entry, content: pillars || entry.content };
    }
    return entry;
  });

  return {
    entries,
    chart: bazi?.chart ?? undefined,
    variables: bazi?.variables ?? undefined,
    generatedAt: new Date().toISOString(),
  };
}

export function buildDemoResultDeliverable(
  userInput?: UserFormInput,
): ResultDeliverable {
  const payload = buildDemoResultPayload(userInput);
  return {
    entries: payload.entries,
    chart: payload.chart,
    variables: payload.variables,
    generatedAt: payload.generatedAt,
  };
}
