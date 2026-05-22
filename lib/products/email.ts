import { getAppBaseUrl } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { TrialRow } from "@/lib/products/types";

export async function queueReportReadyEmail(trial: TrialRow): Promise<void> {
  const email = trial.email?.trim();
  if (!email) return;

  const base = getAppBaseUrl();
  const link = `${base}/r/${trial.public_token}`;
  const subject = "你的命理報告已準備好";
  const body = `你的報告已生成完成。\n\n隨時查看：${link}\n\n此連結永久有效，無需重新生成。`;

  const db = getSupabaseAdmin();
  await db.from("email_log").insert({
    trial_id: trial.id,
    to_email: email,
    template: "report_ready",
    subject,
    status: process.env.RESEND_API_KEY ? "queued" : "logged_dev",
  });

  if (process.env.RESEND_API_KEY) {
    // TODO: Resend API integration
    console.info("[email] report_ready", { to: email, link });
  } else {
    console.info("[email:dev]", subject, body);
  }
}
