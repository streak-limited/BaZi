import BaziFlowClient from "@/app/bazi/flow/BaziFlowClient";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "開始八字 · 範山道令",
  description: "沉浸故事 → 輸入命盤 → AI pre-report → Stripe 解鎖完整報告",
};

export default function BaziFlowPage() {
  return (
    <Suspense fallback={<p style={{ padding: 24, color: "#fff" }}>載入中…</p>}>
      <BaziFlowClient />
    </Suspense>
  );
}
