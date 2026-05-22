import { generateReportText } from "@/lib/ai-generate";
import { calculateBazi, type BaziChart, type PromptVariableMap } from "@/lib/bazi/calculate";
import { extractChartLabels } from "@/lib/bazi-journey/chart-labels";
import {
  getResultAiSlotEntries,
  getResultLayoutEntries,
} from "@/lib/bazi-journey/result-page-static";
import type { ResultPayload } from "@/lib/bazi-journey/types";
import { fillPrompt } from "@/lib/fill-prompt";
import { getPreReportData } from "@/lib/pre-report-data";
import { PRE_REPORT_PROMPTS_BY_DESCRIPTION } from "@/lib/pre-report-prompts";
import {
  aiSlotsFromDbRows,
  mergeAiPromptsIntoSlots,
} from "@/lib/products/merge-ai-prompts";
import { getModelById } from "@/lib/products/model-store";
import {
  buildPromptSlotId,
  promptSlotPositionKey,
} from "@/lib/products/prompt-slot-id";
import { listAiPromptEntries } from "@/lib/products/prompt-store";
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

function loadLayoutEntries(phase: PromptPhase): ReportEntry[] {
  if (phase === "result") return getResultLayoutEntries();
  return getPreReportData().entries.filter((e) => e.type !== "ai");
}

function loadCodeAiSlots(phase: PromptPhase): ReportEntry[] {
  if (phase === "result") return getResultAiSlotEntries();
  return getPreReportData().entries.filter((e) => e.type === "ai");
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
): Promise<string> {
  const template =
    entry.prompt ??
    PRE_REPORT_PROMPTS_BY_DESCRIPTION[entry.description];
  if (!template) {
    throw new Error(
      `Missing prompt at page ${entry.page} slot ${entry.display_order}: ${entry.description}`,
    );
  }
  const prompt = fillPrompt(template, variables);
  const { text } = await generateReportText(prompt, {
    sectionDescription: entry.description,
  });
  return text.replace(/\s{2,}/g, " ").trim();
}

function assignSlotId(
  entry: ReportEntry,
  modelSlug: string,
  phase: PromptPhase,
): ReportEntry {
  const slotId = buildPromptSlotId(
    modelSlug,
    phase,
    entry.page,
    entry.display_order,
  );
  return { ...entry, entry_key: slotId, id: slotId };
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

  const model = await getModelById(modelId);
  const modelSlug = model?.slug ?? modelId;

  const layout = loadLayoutEntries(phase);

  const aiDbRows = await listAiPromptEntries(modelId, phase, { activeOnly: true });

  let aiWithPrompts: ReportEntry[];
  if (aiDbRows.length > 0) {
    const fromDb = aiSlotsFromDbRows(aiDbRows, modelSlug);
    const codeSlots = loadCodeAiSlots(phase);
    aiWithPrompts =
      codeSlots.length > 0
        ? mergeAiPromptsIntoSlots(
            codeSlots.map((e) => assignSlotId(e, modelSlug, phase)),
            aiDbRows,
          )
        : fromDb;
    if (fromDb.length > codeSlots.length) {
      const mergedPositions = new Set(
        aiWithPrompts.map((e) => promptSlotPositionKey(e.page, e.display_order)),
      );
      for (const extra of fromDb) {
        const pos = promptSlotPositionKey(extra.page, extra.display_order);
        if (!mergedPositions.has(pos)) {
          aiWithPrompts.push(extra);
          mergedPositions.add(pos);
        }
      }
    }
  } else {
    const codeSlots = loadCodeAiSlots(phase);
    if (codeSlots.length === 0 && phase === "report") {
      aiWithPrompts = getResultAiSlotEntries().map((e) =>
        assignSlotId(e, modelSlug, phase),
      );
    } else {
      aiWithPrompts = codeSlots.map((e) => assignSlotId(e, modelSlug, phase));
    }
  }

  const template = [...layout, ...aiWithPrompts].sort(
    (a, b) => a.page - b.page || a.display_order - b.display_order,
  );

  const boundsByPosition = new Map(
    aiDbRows.map((r) => [
      promptSlotPositionKey(r.page, r.display_order),
      { min: r.length_min, max: r.length_max },
    ]),
  );

  const computedMap = buildComputedMap(
    userInput,
    bazi.chart.fourPillars,
    bazi.variables.name,
  );

  const aiEntries = template.filter((e) => e.type === "ai");
  const aiContents = await Promise.all(
    aiEntries.map(async (entry) => {
      const slotId = buildPromptSlotId(
        modelSlug,
        phase,
        entry.page,
        entry.display_order,
      );
      const pos = promptSlotPositionKey(entry.page, entry.display_order);
      const b = boundsByPosition.get(pos);
      void b;
      return {
        slotId,
        content: await resolveAiContent(entry, bazi.variables!),
      };
    }),
  );
  const aiBySlotId = Object.fromEntries(aiContents.map((a) => [a.slotId, a.content]));

  const entries = template.map((entry) => {
    const slotId = buildPromptSlotId(
      modelSlug,
      phase,
      entry.page,
      entry.display_order,
    );
    if (entry.type === "ai") {
      return {
        ...entry,
        entry_key: slotId,
        id: slotId,
        content: aiBySlotId[slotId] ?? "",
      };
    }
    if (entry.type === "computed") {
      const legacyId = entry.id ?? entry.entry_key ?? "";
      return {
        ...entry,
        entry_key: slotId,
        id: legacyId || slotId,
        content: computedMap[legacyId] ?? entry.content ?? "",
      };
    }
    return {
      ...entry,
      entry_key: slotId,
      id: slotId,
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
