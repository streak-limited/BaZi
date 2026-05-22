import TrialHubClient from "@/app/r/[token]/TrialHubClient";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function TrialHubPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <Suspense fallback={<p style={{ padding: 24, color: "#fff" }}>載入中…</p>}>
      <TrialHubClient token={token} />
    </Suspense>
  );
}
