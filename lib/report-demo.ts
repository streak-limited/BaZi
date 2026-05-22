import { getReportData } from "@/lib/report-data";
import type { ReportDeliverable } from "@/lib/products/types";

/** Demo full report from refereence/ai_generated_content.json — no LLM calls */
export function buildDemoReportDeliverable(): ReportDeliverable {
  const data = getReportData();
  return {
    metadata: {
      ...data.metadata,
      notes: "Demo data from ai_generated_content.json",
      demo_mode: true,
    },
    entries: data.entries,
    aiOutputs: {},
    generatedAt: new Date().toISOString(),
  };
}
