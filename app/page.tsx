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
        View report content JSON →
      </Link>
    </main>
  );
}
