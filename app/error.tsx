"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "#000",
        color: "#fff",
        fontFamily: "system-ui, sans-serif",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: "1.25rem", marginBottom: 8 }}>頁面載入失敗</h1>
      <p style={{ color: "#9aa3ad", marginBottom: 20, maxWidth: 360 }}>
        伺服器發生錯誤。若為首次部署，請確認 Vercel 已設定 Supabase 環境變數並執行
        migration 007。
      </p>
      <button
        type="button"
        onClick={reset}
        style={{
          padding: "10px 20px",
          borderRadius: 8,
          border: "none",
          background: "#fafafa",
          color: "#000",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        重試
      </button>
    </div>
  );
}
