import { generateReportText } from "@/lib/ai-generate";
import { calculateBazi } from "@/lib/bazi/calculate";
import { extractChartLabels } from "@/lib/bazi-flow/chart-labels";
import type { PreReportPayload, ResolvedPreReportEntry } from "@/lib/bazi-flow/types";
import { fillPrompt } from "@/lib/fill-prompt";
import { getPreReportData } from "@/lib/pre-report-data";
import { PRE_REPORT_PROMPTS_BY_DESCRIPTION } from "@/lib/pre-report-prompts";
import type { ReportEntry } from "@/lib/report-types";
import type { UserFormInput } from "@/lib/user-input";

const CHART_LABEL_IDS = [
  "pre-chart-label-正印",
  "pre-chart-label-pian-cai",
  "pre-chart-label-guan",
  "pre-chart-label-shang-guan",
  "pre-chart-label-zheng-cai",
  "pre-chart-label-changsheng",
  "pre-chart-label-muyu",
  "pre-chart-label-huagai",
  "pre-chart-label-niansha",
  "pre-chart-label-wangshen",
  "pre-chart-label-disha",
  "pre-chart-日干",
] as const;

function formatFourPillarsDisplay(fourPillars: string): string {
  return fourPillars.split(" ").join("\n");
}

function buildComputedMap(
  input: UserFormInput,
  fourPillars: string,
  name: string,
): Record<string, string> {
  const labels = extractChartLabels(input);
  const map: Record<string, string> = {
    "pre-four-pillars": formatFourPillarsDisplay(fourPillars),
    "pre-subject-name": name.trim() || "命主",
  };
  CHART_LABEL_IDS.forEach((id, i) => {
    map[id] = labels[i] ?? "—";
  });
  return map;
}

async function generateAiBlock(
  entry: ReportEntry,
  variables: NonNullable<ReturnType<typeof calculateBazi>["variables"]>,
): Promise<string> {
  const template = PRE_REPORT_PROMPTS_BY_DESCRIPTION[entry.description];
  if (!template) {
    throw new Error(`Missing pre-report prompt: ${entry.description}`);
  }
  const prompt = fillPrompt(template, variables);
  const { text } = await generateReportText(prompt, {
    sectionDescription: entry.description,
  });
  return text.replace(/\s{2,}/g, " ").trim();
}

/** Generate live pre-report: static template + computed bazi + 5 AI narratives */
export async function buildPreReport(
  input: UserFormInput,
): Promise<PreReportPayload> {
  const bazi = calculateBazi(input);
  if (bazi.error || !bazi.chart || !bazi.variables) {
    throw new Error(bazi.error ?? "八字計算失敗");
  }

  const template = getPreReportData();
  const aiEntries = template.entries.filter((e) => e.type === "ai");
  const computedMap = buildComputedMap(
    input,
    bazi.chart.fourPillars,
    bazi.variables.name,
  );

  const entryKey = (e: ReportEntry) =>
    e.id ?? `p${e.page}-o${e.display_order}`;

  const aiContents = await Promise.all(
    aiEntries.map(async (entry) => ({
      key: entryKey(entry),
      content: await generateAiBlock(entry, bazi.variables!),
    })),
  );
  const aiById = Object.fromEntries(aiContents.map((a) => [a.key, a.content]));

  const entries: ResolvedPreReportEntry[] = template.entries.map((entry) => {
    if (entry.type === "ai") {
      return { ...entry, content: aiById[entryKey(entry)] ?? "" };
    }
    if (entry.type === "computed") {
      const id = entry.id ?? entryKey(entry);
      return {
        ...entry,
        content: computedMap[id] ?? entry.content,
      };
    }
    return { ...entry, content: entry.content ?? "" };
  });

  return {
    entries,
    chart: bazi.chart,
    variables: bazi.variables,
    generatedAt: new Date().toISOString(),
  };
}

/** Group entries by section for the teaser UI */
export function groupEntriesBySection(
  entries: ResolvedPreReportEntry[],
): Map<string, ResolvedPreReportEntry[]> {
  const map = new Map<string, ResolvedPreReportEntry[]>();
  for (const e of [...entries].sort((a, b) => a.display_order - b.display_order)) {
    const section = e.section ?? "other";
    const list = map.get(section) ?? [];
    list.push(e);
    map.set(section, list);
  }
  return map;
}

export function contentByDescription(
  entries: ResolvedPreReportEntry[],
  description: string,
): string {
  return entries.find((e) => e.description === description)?.content ?? "";
}

export function imageByDescription(
  entries: ResolvedPreReportEntry[],
  description: string,
): string | null {
  const e = entries.find((x) => x.description === description);
  return e?.image_url ?? null;
}
