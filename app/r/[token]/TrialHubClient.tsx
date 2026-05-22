"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import styles from "./r.module.css";

interface TrialApi {
  trial: {
    status: string;
    email: string;
    modal_template_id: string;
    user_input: { name?: string };
  };
  urls: { hub: string; result: string; report: string };
  deliverables: Record<string, { phase: string }>;
}

const POLL_MS = 3000;

export default function TrialHubClient({ token }: { token: string }) {
  const searchParams = useSearchParams();
  const justPaid = searchParams.get("paid") === "1";
  const isDemo = searchParams.get("demo") === "1";

  const [data, setData] = useState<TrialApi | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    return fetch(`/api/trials/${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.error) throw new Error(json.error);
        setData(json);
        return json as TrialApi;
      });
  }, [token]);

  useEffect(() => {
    load().catch((e) =>
      setError(e instanceof Error ? e.message : "無法載入"),
    );
  }, [load]);

  const status = data?.trial.status ?? "";
  const dels = data?.deliverables as Record<string, unknown> | undefined;
  const hasReport = Boolean(dels?.report ?? dels?.full_report);
  const reportReady = hasReport || status === "completed";
  const reportGenerating =
    status === "report_generating" ||
    (justPaid && !reportReady && status !== "failed");

  useEffect(() => {
    if (!reportGenerating) return;
    const id = setInterval(() => {
      load().catch(() => {});
    }, POLL_MS);
    return () => clearInterval(id);
  }, [reportGenerating, load]);

  const name = data?.trial.user_input?.name?.trim() || "命主";
  const email = data?.trial.email?.trim();

  if (justPaid) {
    return (
      <div className={styles.page}>
        <div className={styles.inner}>
          <div className={styles.successHero}>
            <span className={styles.successIcon}>✓</span>
            <h1 className={styles.title}>付款成功</h1>
            {isDemo && (
              <span className={styles.demoPill}>Demo 測試模式</span>
            )}
          </div>

          <p className={styles.sub}>
            {name}，多謝你的訂閱。完整 <strong>Report（20 頁）</strong>
            正在生成中。
          </p>

          {error && <div className={styles.error}>{error}</div>}

          {reportGenerating && !reportReady && (
            <div className={`${styles.card} ${styles.cardGenerating}`}>
              <div className={styles.spinner} />
              <p className={styles.generatingTitle}>Report 生成中…</p>
              <p className={styles.generatingSub}>
                通常需要數十秒至數分鐘。完成後會自動更新此頁，並
                {email ? (
                  <>
                    {" "}
                    寄送 Email 至 <strong>{email}</strong>
                  </>
                ) : (
                  " 透過你留下的聯絡方式通知你"
                )}
                。
              </p>
            </div>
          )}

          {reportReady && data && (
            <div className={`${styles.card} ${styles.cardReady}`}>
              <p className={styles.readyTitle}>Report 已就緒</p>
              <p className={styles.generatingSub}>
                {email
                  ? `通知已發送至 ${email}（或即將送達）。`
                  : "你現在可以開啟完整報告。"}
              </p>
              <Link href={data.urls.report} className={styles.btn}>
                打開完整 Report（20 頁）
              </Link>
            </div>
          )}

          {data && (
            <>
              <div className={styles.card}>
                <p className={styles.cardLabel}>你的專屬連結（請收藏）</p>
                <code className={styles.linkCode}>{data.urls.hub}</code>
              </div>

              <Link href={data.urls.result} className={styles.btnSecondary}>
                查看 Result（付款前預覽頁）
              </Link>
            </>
          )}

          <p className={styles.footerHint}>
            此頁即付款成功頁 · 狀態：
            <span className={styles.status}> {status || "載入中…"}</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <h1 className={styles.title}>{name} 的命理報告</h1>
        <p className={styles.sub}>
          模組：{data?.trial.modal_template_id ?? "—"} · 狀態：
          <span className={styles.status}> {status || "載入中…"}</span>
        </p>

        {error && <div className={styles.error}>{error}</div>}

        {data && (
          <>
            <div className={styles.card}>
              <p>你的專屬連結（建議收藏）：</p>
              <code className={styles.linkCode}>{data.urls.hub}</code>
            </div>

            {reportReady && (
              <Link href={data.urls.report} className={styles.btn}>
                查看 Report（20 頁完整報告）
              </Link>
            )}

            {reportGenerating && (
              <div className={`${styles.card} ${styles.cardGenerating}`}>
                <div className={styles.spinner} />
                <p>Report 生成中，請稍候…</p>
              </div>
            )}

            <Link href={data.urls.result} className={styles.btnSecondary}>
              查看 Result
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
