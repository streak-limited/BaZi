import ReportReader from "@/app/r/[token]/report/ReportReader";
import { buildDemoReportDeliverable } from "@/lib/report-demo";
import type { ReportDeliverable } from "@/lib/products/types";
import { isSupabaseConfigured, loadTrialBundle } from "@/lib/products/trial-store";
import Link from "next/link";
import styles from "../r.module.css";

export const dynamic = "force-dynamic";

export default async function SharedReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (!isSupabaseConfigured()) {
    return (
      <div className={styles.page}>
        <div className={styles.inner}>
          <p>Supabase 未設定，無法載入報告。</p>
        </div>
      </div>
    );
  }

  const bundle = await loadTrialBundle(token);
  if (!bundle) {
    return (
      <div className={styles.page}>
        <div className={styles.inner}>
          <p>找不到報告連結。</p>
        </div>
      </div>
    );
  }

  const legacy = bundle.deliverables as Record<string, { content?: unknown }>;
  const raw =
    bundle.deliverables.report?.content ?? legacy.full_report?.content;

  const legacyDels = bundle.deliverables as Record<string, unknown>;
  const hasReportDeliverable = Boolean(
    bundle.deliverables.report ?? legacyDels.full_report,
  );
  const canAccess =
    bundle.trial.status === "completed" || hasReportDeliverable;

  if (!canAccess) {
    return (
      <div className={styles.page}>
        <div className={styles.inner}>
          <h1 className={styles.title}>Report 生成中</h1>
          <p className={styles.sub}>
            完整報告仍在準備中。請回到付款成功頁等候，完成後會通知你。
          </p>
          <Link href={`/r/${token}?paid=1`} className={styles.btn}>
            返回付款成功頁
          </Link>
          <Link href={`/r/${token}/result`} className={styles.btnSecondary}>
            查看 Result 預覽
          </Link>
        </div>
      </div>
    );
  }

  let deliverable: ReportDeliverable;
  let isDemo = false;

  if (raw) {
    deliverable = raw as ReportDeliverable;
    isDemo = Boolean(
      (deliverable.metadata as { demo_mode?: boolean })?.demo_mode,
    );
  } else {
    deliverable = buildDemoReportDeliverable();
    isDemo = true;
  }

  return (
    <ReportReader token={token} deliverable={deliverable} isDemo={isDemo} />
  );
}
