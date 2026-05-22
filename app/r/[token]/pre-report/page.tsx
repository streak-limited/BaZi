import { Suspense } from "react";
import SharedPreReportClient from "@/app/r/[token]/SharedPreReportClient";

export const dynamic = "force-dynamic";

export default async function SharedPreReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <Suspense fallback={<p style={{ padding: 24, color: "#fff" }}>載入中…</p>}>
      <SharedPreReportClient token={token} />
    </Suspense>
  );
}
