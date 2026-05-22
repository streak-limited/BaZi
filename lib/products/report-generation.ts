import { buildDemoReportDeliverable } from "@/lib/report-demo";
import { queueReportReadyEmail } from "@/lib/products/email";
import { DEFAULT_BAZI_MODAL } from "@/lib/products/modal-registry";
import { getModalById } from "@/lib/products/modal-store";
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

/** Background job: save demo report → completed → email */
export async function completeReportGeneration(trialId: string): Promise<void> {
  const trial = await getTrialById(trialId);
  if (!trial) return;

  const modal =
    (await getModalById(trial.modal_template_id ?? DEFAULT_BAZI_MODAL)) ??
    (await getModalById(DEFAULT_BAZI_MODAL));
  if (!modal) return;
  const demo = buildDemoReportDeliverable();

  await saveReportDeliverable(trial.id, demo, {
    demo: true,
    modal: modal.id,
    page_count: modal.config.page_count,
  });

  await updateTrialStatus(trial.id, "completed");
  await queueReportReadyEmail(trial);
}

/** Queue report generation after payment (simulated delay for UX testing) */
export function enqueueReportGeneration(trialId: string): void {
  const delayMs = reportGenerationDelayMs();

  after(async () => {
    try {
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
      await completeReportGeneration(trialId);
    } catch (err) {
      console.error("[report-generation]", trialId, err);
      await updateTrialStatus(trialId, "failed", {
        error_message:
          err instanceof Error ? err.message : "Report generation failed",
      });
    }
  });
}
