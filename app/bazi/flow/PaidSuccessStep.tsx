"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import styles from "./bazi-flow.module.css";

interface ReportUrls {
  hub: string;
  preReport: string;
  fullReport: string;
}

export default function PaidSuccessStep({
  demoPaid,
  publicToken,
  reportHubUrl,
}: {
  demoPaid: boolean;
  publicToken: string | null;
  reportHubUrl: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [urls, setUrls] = useState<ReportUrls | null>(null);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [resolving, setResolving] = useState(Boolean(sessionId));

  const fromToken = useMemo((): ReportUrls | null => {
    const token = publicToken?.trim();
    if (!token) return null;
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    return {
      hub: reportHubUrl ?? `${origin}/r/${token}`,
      preReport: `${origin}/r/${token}/pre-report`,
      fullReport: `${origin}/r/${token}/report`,
    };
  }, [publicToken, reportHubUrl]);

  useEffect(() => {
    if (fromToken) {
      setUrls(fromToken);
      return;
    }
    if (!sessionId) {
      setResolving(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setResolving(true);
      setResolveError(null);
      try {
        const res = await fetch(
          `/api/trials/resolve?session_id=${encodeURIComponent(sessionId)}`,
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "無法解析報告連結");
        if (cancelled) return;
        const u = data.urls as ReportUrls;
        setUrls(u);
        if (data.publicToken) {
          router.replace(`/r/${data.publicToken}?paid=1`);
        }
      } catch (e) {
        if (!cancelled) {
          setResolveError(
            e instanceof Error ? e.message : "無法解析報告連結",
          );
        }
      } finally {
        if (!cancelled) setResolving(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId, fromToken, router]);

  const active = urls ?? fromToken;

  return (
    <div className={`${styles.narrow} ${styles.paidMessage}`}>
      <h2>{demoPaid ? "測試解鎖成功" : "付款成功"}</h2>
      {demoPaid && (
        <p className={styles.testModeBadge} style={{ marginBottom: 12 }}>
          Demo 模式 · 已略過 Stripe
        </p>
      )}

      {resolving && (
        <p style={{ fontSize: "0.9rem", opacity: 0.75 }}>正在載入你的報告連結…</p>
      )}

      {active && (
        <>
          <p>你的報告已存入資料庫，用以下連結隨時查看（無需重新跑 AI）。</p>
          <div className={styles.reportLinkBox}>
            <span className={styles.reportLinkLabel}>專屬連結（請收藏）</span>
            <code className={styles.reportLinkCode}>{active.hub}</code>
          </div>
          <Link
            href={active.fullReport}
            className={styles.primaryBtn}
            style={{
              textDecoration: "none",
              textAlign: "center",
              display: "block",
              width: "100%",
              maxWidth: 320,
            }}
          >
            打開完整報告（20 頁）
          </Link>
          <Link
            href={active.hub}
            className={styles.ghostBtn}
            style={{ display: "block", textAlign: "center", maxWidth: 320 }}
          >
            報告首頁
          </Link>
          <Link
            href={active.preReport}
            className={styles.ghostBtn}
            style={{ display: "block", textAlign: "center", maxWidth: 320 }}
          >
            查看 Pre-report
          </Link>
        </>
      )}

      {!active && !resolving && (
        <>
          <p>你的報告已付款，但此頁找不到雲端報告連結。</p>
          {resolveError && (
            <p className={styles.resolveError}>{resolveError}</p>
          )}
          <p style={{ fontSize: "0.88rem", opacity: 0.8, maxWidth: 420 }}>
            請在 <code>.env.local</code> 設定{" "}
            <code>SUPABASE_URL</code> 與{" "}
            <code>SUPABASE_SERVICE_ROLE_KEY</code>，並執行{" "}
            <code>supabase/migrations/001_product_flow.sql</code>
            ，然後重新走一次流程（從輸入到 pre-report）以建立 trial。
          </p>
        </>
      )}

      <p style={{ fontSize: "0.85rem", opacity: 0.55, marginTop: 8 }}>
        開發用 Turso 編輯器（非客戶報告）：
      </p>
      <Link
        href="/bazi/report"
        className={styles.ghostBtn}
        style={{ display: "block", textAlign: "center", fontSize: "0.9rem" }}
      >
        前往開發報告頁
      </Link>
      <Link href="/" className={styles.ghostBtn} style={{ display: "block" }}>
        返回首頁
      </Link>
    </div>
  );
}
