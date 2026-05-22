import { buildDemoReportDeliverable } from "@/lib/report-demo";
import { queueReportReadyEmail } from "@/lib/products/email";
import { generateReportDeliverable } from "@/lib/products/generate-deliverable";
import { DEFAULT_BAZI_MODEL } from "@/lib/products/model-registry";
import { getModelById } from "@/lib/products/model-store";
import {
  getDeliverable,
  getTrialById,
  saveReportDeliverable,
  updateTrialStatus,
} from "@/lib/products/trial-store";
import { after } from "next/server";

/** Default: demo JSON (refereence/ai_generated_content.json) — no LLM for 20 pages */
export function isDemoReportMode(): boolean {
  return process.env.USE_LIVE_AI_REPORT !== "1";
}

function reportGenerationDelayMs(): number {
  if (isDemoReportMode()) {
    const demo = process.env.REPORT_GENERATION_DELAY_MS?.trim();
    if (demo === "0") return 0;
    if (demo && !Number.isNaN(Number(demo))) return Number(demo);
    return 2000;
  }
  const raw = process.env.REPORT_GENERATION_DELAY_MS?.trim();
  if (raw === "0") return 0;
  if (raw && !Number.isNaN(Number(raw))) return Number(raw);
  return 5000;
}

/**
 * Load report into trial_deliverables.
 * Demo: copies pre-built 20-page JSON (instant, no AI).
 * Live: only when USE_LIVE_AI_REPORT=1.
 */
export async function completeReportGeneration(trialId: string): Promise<void> {
  const trial = await getTrialById(trialId);
  if (!trial) return;

  const model =
    (await getModelById(trial.model_id ?? DEFAULT_BAZI_MODEL)) ??
    (await getModelById(DEFAULT_BAZI_MODEL));
  if (!model) return;

  const modelId = trial.model_id ?? DEFAULT_BAZI_MODEL;
  const live = !isDemoReportMode();

  const deliverable = live
    ? await generateReportDeliverable(modelId, trial.user_input)
    : buildDemoReportDeliverable();

  await saveReportDeliverable(trial.id, deliverable, {
    demo: !live,
    model: model.id,
    page_count: model.config.page_count ?? 20,
    provider: live ? process.env.AI_PROVIDER ?? "gemini" : "demo_json",
    source: live ? "live_ai" : "refereence/ai_generated_content.json",
  });

  await updateTrialStatus(trial.id, "completed");
  try {
    await queueReportReadyEmail(trial);
  } catch (err) {
    console.warn("[report] email skipped:", err);
  }
}

/** Background job after payment (with optional delay for UX) */
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
      const message =
        err instanceof Error ? err.message : "Report generation failed";
      await updateTrialStatus(trialId, "failed", { error_message: message });
    }
  });
}

/**
 * Demo / test unlock: run immediately in the request (reliable in dev).
 * Skips `after()` so the hub poll always sees completed + report deliverable.
 */
export async function completeReportGenerationForDemoUnlock(
  trialId: string,
): Promise<void> {
  await updateTrialStatus(trialId, "report_generating");
  await completeReportGeneration(trialId);
}

/**
 * After payment (webhook or hub fallback): idempotent report fulfillment.
 * Runs synchronously so Stripe webhook + success page both see a saved deliverable.
 */
export async function fulfillReportAfterPayment(
  trialId: string,
): Promise<{ alreadyReady: boolean }> {
  const trial = await getTrialById(trialId);
  if (!trial) throw new Error(`Trial not found: ${trialId}`);

  const existing = await getDeliverable(trialId, "report");
  if (existing || trial.status === "completed") {
    return { alreadyReady: true };
  }

  if (isDemoReportMode()) {
    await completeReportGenerationForDemoUnlock(trialId);
  } else {
    await updateTrialStatus(trialId, "report_generating");
    await completeReportGeneration(trialId);
  }
  return { alreadyReady: false };
}
