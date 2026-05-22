import { getAppBaseUrl } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { TrialRow } from "@/lib/products/types";
import { Resend } from "resend";

function reportLink(trial: TrialRow): string {
  return `${getAppBaseUrl()}/r/${trial.public_token}/report`;
}

function hubLink(trial: TrialRow): string {
  return `${getAppBaseUrl()}/r/${trial.public_token}`;
}

export async function queueReportReadyEmail(trial: TrialRow): Promise<void> {
  const email = trial.email?.trim();
  if (!email) {
    console.info("[email] skip — no email on trial", trial.id);
    return;
  }

  const name = trial.user_input?.name?.trim() || "命主";
  const reportUrl = reportLink(trial);
  const hubUrl = hubLink(trial);
  const subject = `${name}，你的完整命理報告已準備好`;
  const text = [
    `${name} 你好，`,
    "",
    "你已成功付款，完整 20 頁命理報告已生成完成。",
    "",
    `立即查看：${reportUrl}`,
    "",
    `或收藏此連結隨時開啟：${hubUrl}`,
    "",
    "此連結永久有效，無需重新生成。",
  ].join("\n");

  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 520px; line-height: 1.6; color: #111;">
      <p>${name} 你好，</p>
      <p>你已成功付款，<strong>完整 20 頁命理報告</strong>已生成完成。</p>
      <p style="margin: 28px 0;">
        <a href="${reportUrl}" style="display:inline-block;padding:14px 24px;background:linear-gradient(135deg,#7c3aed,#db2777);color:#fff;text-decoration:none;border-radius:10px;font-weight:600;">
          打開完整報告
        </a>
      </p>
      <p style="font-size: 14px; color: #555;">收藏連結：<a href="${hubUrl}">${hubUrl}</a></p>
      <p style="font-size: 13px; color: #888;">此連結永久有效，無需重新跑 AI。</p>
    </div>
  `.trim();

  const db = getSupabaseAdmin();
  const { data: logRow, error: logErr } = await db
    .from("email_log")
    .insert({
      trial_id: trial.id,
      to_email: email,
      template: "report_ready",
      subject,
      status: "queued",
    })
    .select("id")
    .single();

  if (logErr) {
    console.error("[email] log insert failed", logErr.message);
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.RESEND_FROM_EMAIL?.trim() ??
    "BaZi Report <onboarding@resend.dev>";

  if (!apiKey) {
    console.info("[email:dev]", { to: email, subject, text });
    if (logRow?.id) {
      await db
        .from("email_log")
        .update({ status: "logged_dev" })
        .eq("id", logRow.id);
    }
    return;
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from,
      to: email,
      subject,
      text,
      html,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (logRow?.id) {
      await db
        .from("email_log")
        .update({
          status: "sent",
          provider_message_id: data?.id ?? null,
        })
        .eq("id", logRow.id);
    }
    console.info("[email] sent report_ready", { to: email, id: data?.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Resend failed";
    console.error("[email] send failed", message);
    if (logRow?.id) {
      await db
        .from("email_log")
        .update({ status: "failed" })
        .eq("id", logRow.id);
    }
  }
}
