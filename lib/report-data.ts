import reportJson from "@/refereence/ai_generated_content.json";
import type { ReportData } from "@/lib/report-types";

export function getReportData(): ReportData {
  return reportJson as ReportData;
}

export function getPageNumbers(data: ReportData): number[] {
  const pages = new Set(data.entries.map((e) => e.page));
  return Array.from(pages).sort((a, b) => a - b);
}
