"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./r.module.css";

interface TrialApi {
  trial: {
    status: string;
    email: string;
    modal_template_id: string;
    user_input: { name?: string };
  };
  urls: { hub: string; preReport: string; fullReport: string };
  deliverables: Record<string, { phase: string }>;
}

export default function TrialHubClient({ token }: { token: string }) {
  const searchParams = useSearchParams();
  const justPaid = searchParams.get("paid") === "1";
  const [data, setData] = useState<TrialApi | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/trials/${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.error) throw new Error(json.error);
        setData(json);
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "無法載入"),
      );
  }, [token]);

  const name = data?.trial.user_input?.name?.trim() || "命主";
  const hasPre = Boolean(data?.deliverables?.pre_report);
  const hasFull = Boolean(data?.deliverables?.full_report);
  const canFull =
    data?.trial.status === "completed" ||
    data?.trial.status === "paid" ||
    data?.trial.status === "full_generating";

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <h1 className={styles.title}>{name} 的命理報告</h1>
        <p className={styles.sub}>
          模組：{data?.trial.modal_template_id ?? "—"} · 狀態：
          <span className={styles.status}>
            {data?.trial.status ?? "載入中…"}
          </span>
        </p>

        {justPaid && (
          <div className={styles.card}>
            <p>付款成功。完整報告正在準備中（或已就緒），請用下方連結查看。</p>
          </div>
        )}

        {error && <div className={styles.error}>{error}</div>}

        {data && (
          <>
            <div className={styles.card}>
              <p>你的專屬連結（建議收藏或加入 Email 書籤）：</p>
              <code style={{ fontSize: "0.8rem", wordBreak: "break-all" }}>
                {data.urls.hub}
              </code>
            </div>

            {hasPre && (
              <Link href={data.urls.preReport} className={styles.btn}>
                查看 Pre-report 導流頁
              </Link>
            )}

            {(hasFull || canFull) && (
              <Link href={data.urls.fullReport} className={styles.btn}>
                查看完整 {20} 頁報告
              </Link>
            )}

            {!hasFull && data.trial.status === "paid" && (
              <p className={styles.sub}>
                完整報告生成中，請稍後再開「完整報告」連結。
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
