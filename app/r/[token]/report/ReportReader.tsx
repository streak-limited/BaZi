"use client";

import { entriesForPage, REPORT_PAGE_COUNT } from "@/lib/report-display";
import {
  layoutTypeForPage,
  pageNavLabel,
} from "@/lib/report/page-layout";
import {
  mergeReportForDisplay,
  pageNumbersFromReport,
} from "@/lib/products/merge-report";
import type { ReportDeliverable } from "@/lib/products/types";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  PageChapterDivider,
  PageClosing,
  PageContent,
  PageCover,
  PageProfile,
} from "./ReportPageViews";
import styles from "./report-reader.module.css";

export default function ReportReader({
  deliverable,
  token,
  isDemo = false,
}: {
  deliverable: ReportDeliverable;
  token: string;
  isDemo?: boolean;
}) {
  const report = useMemo(
    () => mergeReportForDisplay(deliverable),
    [deliverable],
  );
  const pages = useMemo(() => {
    const nums = pageNumbersFromReport(report);
    return nums.length
      ? nums
      : Array.from({ length: REPORT_PAGE_COUNT }, (_, i) => i + 1);
  }, [report]);

  const [page, setPage] = useState(pages[0] ?? 1);
  const pageEntries = useMemo(
    () => entriesForPage(report.entries, page),
    [report.entries, page],
  );
  const idx = pages.indexOf(page);
  const layout = layoutTypeForPage(page);
  const navLabel = pageNavLabel(page, report.entries);

  return (
    <div className={styles.shell}>
      <header className={styles.topBar}>
        <Link href={`/r/${token}`} className={styles.backLink}>
          ← 報告首頁
        </Link>
        {isDemo && <span className={styles.demoBadge}>Demo 資料</span>}
      </header>

      <main className={styles.pageContent}>
        {layout === "cover" && <PageCover entries={pageEntries} />}
        {layout === "chapter-divider" && (
          <PageChapterDivider entries={pageEntries} page={page} />
        )}
        {layout === "profile" && (
          <PageProfile entries={pageEntries} allEntries={report.entries} />
        )}
        {layout === "content" && (
          <PageContent
            entries={pageEntries}
            page={page}
            allEntries={report.entries}
          />
        )}
        {layout === "closing" && <PageClosing entries={pageEntries} />}
      </main>

      <nav className={styles.bottomNav} aria-label="報告頁碼">
        <div className={styles.navRow}>
          <button
            type="button"
            className={styles.navBtn}
            disabled={idx <= 0}
            onClick={() => setPage(pages[idx - 1])}
          >
            上一頁
          </button>
          <span className={styles.pageIndicator}>
            {navLabel} · {page}/{pages[pages.length - 1]}
          </span>
          <button
            type="button"
            className={styles.navBtn}
            disabled={idx >= pages.length - 1}
            onClick={() => setPage(pages[idx + 1])}
          >
            下一頁
          </button>
        </div>
        <div className={styles.dotRow}>
          {pages.map((p) => (
            <button
              key={p}
              type="button"
              className={`${styles.dot} ${p === page ? styles.dotActive : ""}`}
              aria-label={`第 ${p} 頁`}
              onClick={() => setPage(p)}
            />
          ))}
        </div>
      </nav>
    </div>
  );
}
