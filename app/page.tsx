import Link from "next/link";

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
        background: "#0f1419",
        color: "#e8eaed",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>BaZi</h1>
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
        <Link
          href="/report"
          style={{
            color: "#7eb8ff",
            textDecoration: "none",
            padding: "0.6rem 1.2rem",
            border: "1px solid #2a3441",
            borderRadius: "8px",
            background: "#1a222c",
          }}
        >
          完整報告 JSON →
        </Link>
        <Link
          href="/pre-report"
          style={{
            color: "#9fd4b8",
            textDecoration: "none",
            padding: "0.6rem 1.2rem",
            border: "1px solid #2a3441",
            borderRadius: "8px",
            background: "#1a222c",
          }}
        >
          Pre-report 拆解 →
        </Link>
        <Link
          href="/ask-gua"
          style={{
            color: "#c8a86e",
            textDecoration: "none",
            padding: "0.6rem 1.2rem",
            border: "1px solid #2a3441",
            borderRadius: "8px",
            background: "#1a222c",
          }}
        >
          AI 問卦 →
        </Link>
        <Link
          href="/fortune-lots"
          style={{
            color: "#d4a8e8",
            textDecoration: "none",
            padding: "0.6rem 1.2rem",
            border: "1px solid #2a3441",
            borderRadius: "8px",
            background: "#1a222c",
          }}
        >
          靈籤求籤 →
        </Link>
      </div>
    </main>
  );
}
