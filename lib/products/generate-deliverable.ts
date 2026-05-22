import { generateReportText } from "@/lib/ai-generate";
import { calculateBazi, type PromptVariableMap } from "@/lib/bazi/calculate";
import { extractChartLabels } from "@/lib/bazi-journey/chart-labels";
import type { ResultPayload } from "@/lib/bazi-journey/types";
import type { BaziChart } from "@/lib/bazi/calculate";
import { fillPrompt } from "@/lib/fill-prompt";
import { getPreReportData } from "@/lib/pre-report-data";
import { PRE_REPORT_PROMPTS_BY_DESCRIPTION } from "@/lib/pre-report-prompts";
import { promptRowToReportEntry } from "@/lib/report/entries";
import { getPromptTemplatesAsEntries, listPromptEntries } from "@/lib/products/prompt-store";
import type { PromptPhase } from "@/lib/products/prompt-types";
import type { ReportDeliverable, ResultDeliverable } from "@/lib/products/types";
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

async function loadTemplateEntries(
  modelId: string,
  phase: PromptPhase,
): Promise<ReportEntry[]> {
  const fromDb = await getPromptTemplatesAsEntries(modelId, phase);
  if (fromDb.length > 0) return fromDb;
  if (phase === "result") {
    return getPreReportData().entries.map((e) => ({
      ...e,
      entry_key: e.id,
      prompt:
        e.prompt ??
        (e.type === "ai"
          ? PRE_REPORT_PROMPTS_BY_DESCRIPTION[e.description]
          : undefined),
    }));
  }
  return [];
}

function formatFourPillars(fourPillars: string): string {
  return fourPillars.split(" ").join("\n");
}

function buildComputedMap(
  input: UserFormInput,
  fourPillars: string,
  name: string,
): Record<string, string> {
  const labels = extractChartLabels(input);
  const map: Record<string, string> = {
    "pre-four-pillars": formatFourPillars(fourPillars),
    "pre-subject-name": name.trim() || "命主",
  };
  CHART_LABEL_IDS.forEach((id, i) => {
    map[id] = labels[i] ?? "—";
  });
  return map;
}

async function resolveAiContent(
  entry: ReportEntry,
  variables: PromptVariableMap,
  bounds?: { min: number | null; max: number | null },
): Promise<string> {
  const template =
    entry.prompt ??
    PRE_REPORT_PROMPTS_BY_DESCRIPTION[entry.description];
  if (!template) {
    throw new Error(`Missing prompt for ${entry.entry_key ?? entry.id}: ${entry.description}`);
  }
  const prompt = fillPrompt(template, variables);
  const { text } = await generateReportText(prompt, {
    sectionDescription: entry.description,
  });
  void bounds;
  return text.replace(/\s{2,}/g, " ").trim();
}

function entryKey(e: ReportEntry): string {
  return e.entry_key ?? e.id ?? `p${e.page}-o${e.display_order}`;
}

async function generatePhaseEntries(
  modelId: string,
  phase: PromptPhase,
  userInput: UserFormInput,
): Promise<{
  entries: ReportEntry[];
  chart: BaziChart;
  variables: PromptVariableMap;
}> {
  const bazi = calculateBazi(userInput);
  if (bazi.error || !bazi.chart || !bazi.variables) {
    throw new Error(bazi.error ?? "八字計算失敗");
  }

  let template = await loadTemplateEntries(modelId, phase);
  if (template.length === 0 && phase === "report") {
    template = await loadTemplateEntries(modelId, "result");
  }

  const dbRows = await listPromptEntries(modelId, phase);
  const boundsByKey = new Map(
    dbRows.map((r) => [r.entry_key, { min: r.length_min, max: r.length_max }]),
  );

  const computedMap = buildComputedMap(
    userInput,
    bazi.chart.fourPillars,
    bazi.variables.name,
  );

  const aiEntries = template.filter((e) => e.type === "ai");
  const aiContents = await Promise.all(
    aiEntries.map(async (entry) => {
      const key = entryKey(entry);
      const b = boundsByKey.get(key);
      return {
        key,
        content: await resolveAiContent(entry, bazi.variables!, {
          min: b?.min ?? null,
          max: b?.max ?? null,
        }),
      };
    }),
  );
  const aiByKey = Object.fromEntries(aiContents.map((a) => [a.key, a.content]));

  const entries = template.map((entry) => {
    const key = entryKey(entry);
    if (entry.type === "ai") {
      return { ...entry, entry_key: key, id: key, content: aiByKey[key] ?? "" };
    }
    if (entry.type === "computed") {
      const id = entry.id ?? key;
      return {
        ...entry,
        entry_key: key,
        id: key,
        content: computedMap[id] ?? computedMap[key] ?? entry.content ?? "",
      };
    }
    return {
      ...entry,
      entry_key: key,
      id: key,
      content: entry.content ?? "",
    };
  });

  return { entries, chart: bazi.chart, variables: bazi.variables };
}

export async function generateResultDeliverable(
  modelId: string,
  userInput: UserFormInput,
): Promise<ResultDeliverable> {
  const { entries, chart, variables } = await generatePhaseEntries(
    modelId,
    "result",
    userInput,
  );
  return {
    entries,
    chart,
    variables,
    generatedAt: new Date().toISOString(),
  };
}

/** Report phase — uses DB report templates; falls back to result layout if empty */
export async function generateReportDeliverable(
  modelId: string,
  userInput: UserFormInput,
): Promise<ReportDeliverable> {
  const { entries } = await generatePhaseEntries(modelId, "report", userInput);
  return {
    metadata: {
      source: `model:${modelId}`,
      type_legend: {
        static: "Static",
        computed: "Computed",
        ai: "AI",
      },
      user_inputs: [],
      sample_subject: {},
      total_entries: entries.length,
    },
    entries,
    generatedAt: new Date().toISOString(),
  };
}

export async function generateResultPayload(
  modelId: string,
  userInput: UserFormInput,
): Promise<ResultPayload> {
  const d = await generateResultDeliverable(modelId, userInput);
  return {
    entries: d.entries as ResultPayload["entries"],
    chart: d.chart as ResultPayload["chart"],
    variables: d.variables as ResultPayload["variables"],
    generatedAt: d.generatedAt,
  };
}
