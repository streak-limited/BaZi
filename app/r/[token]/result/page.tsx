import ResultView from "@/app/bazi/intro/ResultView";
import { buildDemoResultPayload } from "@/lib/result-demo";
import type { ResultPayload } from "@/lib/bazi-journey/types";
import type { ResultDeliverable } from "@/lib/products/types";
import { isSupabaseConfigured, loadTrialBundle } from "@/lib/products/trial-store";
import type { UserFormInput } from "@/lib/user-input";
import Link from "next/link";
import styles from "../r.module.css";

export const dynamic = "force-dynamic";

export default async function SharedResultPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (!isSupabaseConfigured()) {
    return (
      <div className={styles.page}>
        <div className={styles.inner}>
          <p>Supabase 未設定。</p>
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
    bundle.deliverables.result?.content ?? legacy.pre_report?.content;

  let payload: ResultPayload;
  let isDemo = false;

  if (raw) {
    const d = raw as ResultDeliverable;
    payload = {
      entries: d.entries as ResultPayload["entries"],
      chart: d.chart as ResultPayload["chart"],
      variables: d.variables as ResultPayload["variables"],
      generatedAt: d.generatedAt,
    };
    isDemo = Boolean((d as { metadata?: { demo_mode?: boolean } }).metadata?.demo_mode);
  } else {
    payload = buildDemoResultPayload(
      bundle.trial.user_input as UserFormInput,
    );
    isDemo = true;
  }

  return (
    <>
      {isDemo && (
        <div
          style={{
            textAlign: "center",
            padding: "8px",
            fontSize: "0.75rem",
            background: "rgba(124,58,237,0.25)",
            color: "#e9d5ff",
          }}
        >
          Demo 預覽資料 · 未接 AI
        </div>
      )}
      <ResultView payload={payload} publicToken={token} />
    </>
  );
}
