import { PRE_REPORT_PROMPTS_BY_DESCRIPTION } from "@/lib/pre-report-prompts";
import type { ReportData, ReportEntry } from "@/lib/report-types";
import preReportJson from "@/refereence/pre-report-analysis.json";

function attachPreReportPrompts(entries: ReportEntry[]): ReportEntry[] {
  return entries.map((entry) => {
    if (entry.type !== "ai") return entry;
    const prompt =
      entry.prompt ?? PRE_REPORT_PROMPTS_BY_DESCRIPTION[entry.description];
    return prompt ? { ...entry, prompt } : entry;
  });
}

export function getPreReportData(): ReportData {
  const raw = preReportJson as ReportData;
  return {
    ...raw,
    entries: attachPreReportPrompts(raw.entries),
  };
}