"use client";

import PreReportView from "@/app/bazi/flow/PreReportView";
import type { PreReportPayload } from "@/lib/bazi-flow/types";
import type { PreReportDeliverable } from "@/lib/products/types";
import { useEffect, useState } from "react";
import styles from "./r.module.css";

export default function SharedPreReportClient({ token }: { token: string }) {
  const [payload, setPayload] = useState<PreReportPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/trials/${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.error) throw new Error(json.error);
        const d = json.deliverables?.pre_report?.content as
          | PreReportDeliverable
          | undefined;
        if (!d?.entries) throw new Error("Pre-report 尚未生成");
        setPayload({
          entries: d.entries as PreReportPayload["entries"],
          chart: d.chart as PreReportPayload["chart"],
          variables: d.variables as PreReportPayload["variables"],
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
        載入 pre-report…
      </p>
    );
  }

  return <PreReportView payload={payload} publicToken={token} />;
}
