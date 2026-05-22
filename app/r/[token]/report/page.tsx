import FullReportReader from "@/app/r/[token]/report/FullReportReader";
import type { FullReportDeliverable } from "@/lib/products/types";
import { isSupabaseConfigured } from "@/lib/products/trial-store";
import { loadTrialBundle } from "@/lib/products/trial-store";
import Link from "next/link";
import styles from "../r.module.css";

export const dynamic = "force-dynamic";

export default async function SharedFullReportPage({
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

  const raw = bundle.deliverables.full_report?.content;
  if (!raw) {
    return (
      <div className={styles.page}>
        <div className={styles.inner}>
          <h1 className={styles.title}>完整報告尚未就緒</h1>
          <p className={styles.sub}>
            狀態：{bundle.trial.status}。付款成功後系統會生成並 Email 通知你。
          </p>
          <Link href={`/r/${token}`} className={styles.btn}>
            返回報告首頁
          </Link>
        </div>
      </div>
    );
  }

  return (
    <FullReportReader
      token={token}
      deliverable={raw as FullReportDeliverable}
    />
  );
}
