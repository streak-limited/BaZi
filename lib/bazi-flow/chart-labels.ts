import { calculateBazi } from "@/lib/bazi/calculate";
import type { UserFormInput } from "@/lib/user-input";

const TEN_GOD_NAMES = [
  "比肩",
  "劫財",
  "食神",
  "傷官",
  "偏財",
  "正財",
  "偏官",
  "正官",
  "偏印",
  "正印",
] as const;

const EXTRA_LABELS = ["長生", "沐浴", "冠帶", "華蓋煞", "亡神煞", "地煞", "年煞"];

/** Up to 12 overlay labels for the pre-report chart section */
export function extractChartLabels(input: UserFormInput): string[] {
  const { chart } = calculateBazi(input);
  if (!chart) return ["日干(我)"];

  const found: string[] = [];
  for (const name of TEN_GOD_NAMES) {
    if (chart.tenGodsSummary.includes(name) && !found.includes(name)) {
      found.push(name);
    }
  }
  for (const name of EXTRA_LABELS) {
    if (chart.hiddenStems.includes(name) && !found.includes(name)) {
      found.push(name);
    }
  }

  const out: string[] = [];
  for (let i = 0; i < 11; i++) {
    out.push(found[i] ?? "—");
  }
  out.push("日干(我)");
  return out;
}
