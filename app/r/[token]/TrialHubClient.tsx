"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import styles from "./r.module.css";

interface TrialApi {
  trial: {
    status: string;
    email: string;
    model_id: string;
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

  const sessionId = searchParams.get("session_id");

  const load = useCallback(() => {
    return fetch(`/api/trials/${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.error) throw new Error(json.error);
        setData(json);
        return json as TrialApi;
      });
  }, [token]);

  const fulfillReport = useCallback(async () => {
    const res = await fetch(
      `/api/trials/${encodeURIComponent(token)}/fulfill-report`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionId ?? undefined }),
      },
    );
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "無法載入報告");
    return json;
  }, [token, sessionId]);

  useEffect(() => {
    load().catch((e) =>
      setError(e instanceof Error ? e.message : "無法載入"),
    );
  }, [load]);

  const status = data?.trial.status ?? "";
  const dels = data?.deliverables as Record<string, unknown> | undefined;
  const reportDel =
    dels?.report ??
    dels?.full_report ??
    (dels && typeof dels === "object"
      ? Object.values(dels).find(
          (d) =>
            d &&
            typeof d === "object" &&
            ((d as { phase?: string }).phase === "report" ||
              (d as { phase?: string }).phase === "full_report"),
        )
      : undefined);
  const hasReport = Boolean(reportDel);
  const reportFailed = status === "failed";
  const reportReady = hasReport || status === "completed";
  const needsFulfill =
    !reportReady &&
    !reportFailed &&
    (status === "paid" || status === "report_generating");
  const reportGenerating = needsFulfill;

  useEffect(() => {
    if (!needsFulfill) return;
    let cancelled = false;
    (async () => {
      try {
        await fulfillReport();
        if (!cancelled) await load();
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "報告載入失敗");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [needsFulfill, fulfillReport, load]);

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
            {name}，多謝你的訂閱。
            {isDemo ? (
              <>
                {" "}
                正在載入 <strong>Demo 完整報告（20 頁樣本）</strong>
                — 使用預先準備的示範資料，不會呼叫 AI。
              </>
            ) : (
              <>
                {" "}
                完整 <strong>Report（20 頁）</strong> 正在準備中。
              </>
            )}
          </p>

          {error && <div className={styles.error}>{error}</div>}

          {reportFailed && (
            <div className={styles.error}>
              報告載入失敗。請重新整理，或使用「測試解鎖」再試。
            </div>
          )}

          {reportGenerating && !reportReady && (
            <div className={`${styles.card} ${styles.cardGenerating}`}>
              <div className={styles.spinner} />
              <p className={styles.generatingTitle}>
                {isDemo ? "載入 Demo 報告中…" : "Report 準備中…"}
              </p>
              <p className={styles.generatingSub}>
                {isDemo
                  ? "約數秒內完成。完成後會自動更新此頁，並"
                  : "通常需要數十秒至數分鐘。完成後會自動更新此頁，並"}
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
          模組：{data?.trial.model_id ?? "—"} · 狀態：
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
