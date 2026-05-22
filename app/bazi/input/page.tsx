import BaziInputClient from "@/app/bazi/input/BaziInputClient";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "輸入命盤 · 範山道令",
  description: "輸入出生資料 → AI result → Stripe 解鎖完整報告",
};

export default function BaziInputPage() {
  return (
    <Suspense fallback={<p style={{ padding: 24, color: "#fff" }}>載入中…</p>}>
      <BaziInputClient />
    </Suspense>
  );
}
