"use client";

import { mergeFullReportForDisplay, pageNumbersFromReport } from "@/lib/products/merge-report";
import type { FullReportDeliverable } from "@/lib/products/types";
import type { ReportEntry } from "@/lib/report-types";
import Link from "next/link";
import { useMemo, useState } from "react";
import styles from "../r.module.css";

export default function FullReportReader({
  deliverable,
  token,
}: {
  deliverable: FullReportDeliverable;
  token: string;
}) {
  const report = useMemo(
    () => mergeFullReportForDisplay(deliverable),
    [deliverable],
  );
  const pages = useMemo(() => pageNumbersFromReport(report), [report]);
  const [page, setPage] = useState(pages[0] ?? 1);

  const entries = report.entries.filter((e) => e.page === page);
  const idx = pages.indexOf(page);

  return (
    <div className={styles.reader}>
      <div style={{ padding: "12px 16px" }}>
        <Link href={`/r/${token}`} style={{ color: "#a78bfa", fontSize: "0.85rem" }}>
          ← 報告首頁
        </Link>
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>第 {page} 頁</h2>
        {entries.map((entry) => (
          <EntryBlock key={`${entry.page}-${entry.display_order}`} entry={entry} />
        ))}
        {entries.length === 0 && (
          <p style={{ opacity: 0.6 }}>此頁尚無內容（待 AI 生成）。</p>
        )}
      </section>

      <nav className={styles.pageNav}>
        <button
          type="button"
          disabled={idx <= 0}
          onClick={() => setPage(pages[idx - 1])}
        >
          上一頁
        </button>
        <span className={styles.pageIndicator}>
          {page} / {pages[pages.length - 1] ?? 20}
        </span>
        <button
          type="button"
          disabled={idx >= pages.length - 1}
          onClick={() => setPage(pages[idx + 1])}
        >
          下一頁
        </button>
      </nav>
    </div>
  );
}

function EntryBlock({ entry }: { entry: ReportEntry }) {
  return (
    <article className={styles.entry}>
      <span className={styles.badge}>{entry.type}</span>
      <strong>{entry.description}</strong>
      <div style={{ marginTop: 8 }}>{entry.content || "—"}</div>
      {entry.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={entry.image_url}
          alt=""
          style={{ maxWidth: "100%", marginTop: 12, borderRadius: 8 }}
        />
      )}
    </article>
  );
}
