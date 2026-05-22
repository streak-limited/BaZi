"use client";

import ResultView from "@/app/bazi/intro/ResultView";
import type { ResultPayload } from "@/lib/bazi-journey/types";
import type { ResultDeliverable } from "@/lib/products/types";
import { useEffect, useState } from "react";
import styles from "./r.module.css";

export default function SharedResultClient({ token }: { token: string }) {
  const [payload, setPayload] = useState<ResultPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/trials/${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.error) throw new Error(json.error);
        const row =
          json.deliverables?.result ?? json.deliverables?.pre_report;
        const d = row?.content as ResultDeliverable | undefined;
        if (!d?.entries) throw new Error("Result 尚未生成");
        setPayload({
          entries: d.entries as ResultPayload["entries"],
          chart: d.chart as ResultPayload["chart"],
          variables: d.variables as ResultPayload["variables"],
          generatedAt: d.generatedAt,
        });
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "載入失敗"),
      );
  }, [token]);

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.inner}>
          <div className={styles.error}>{error}</div>
        </div>
      </div>
    );
  }

  if (!payload) {
    return (
      <p style={{ padding: 24, color: "#fff", textAlign: "center" }}>
        載入 result…
      </p>
    );
  }

  return <ResultView payload={payload} publicToken={token} />;
}
