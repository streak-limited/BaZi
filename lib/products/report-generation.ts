import { buildDemoReportDeliverable } from "@/lib/report-demo";
import { queueReportReadyEmail } from "@/lib/products/email";
import { DEFAULT_BAZI_MODEL } from "@/lib/products/model-registry";
import { getModelById } from "@/lib/products/model-store";
import {
  getTrialById,
  saveReportDeliverable,
  updateTrialStatus,
} from "@/lib/products/trial-store";
import { after } from "next/server";

function reportGenerationDelayMs(): number {
  const raw = process.env.REPORT_GENERATION_DELAY_MS?.trim();
  if (raw === "0") return 0;
  if (raw && !Number.isNaN(Number(raw))) return Number(raw);
  return 5000;
}

export async function completeReportGeneration(trialId: string): Promise<void> {
  const trial = await getTrialById(trialId);
  if (!trial) return;

  const model =
    (await getModelById(trial.model_id ?? DEFAULT_BAZI_MODEL)) ??
    (await getModelById(DEFAULT_BAZI_MODEL));
  if (!model) return;

  const demo = buildDemoReportDeliverable();

  await saveReportDeliverable(trial.id, demo, {
    demo: true,
    model: model.id,
    page_count: model.config.page_count,
  });

  await updateTrialStatus(trial.id, "completed");
  await queueReportReadyEmail(trial);
}

export function enqueueReportGeneration(trialId: string): void {
  const delayMs = reportGenerationDelayMs();

  after(async () => {
    if (delayMs > 0) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
    await updateTrialStatus(trialId, "report_generating");
    try {
      await completeReportGeneration(trialId);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Report generation failed";
      await updateTrialStatus(trialId, "failed", { error_message: message });
    }
  });
}
