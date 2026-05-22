"use client";

import {
  chipLabels,
  entriesForPage,
  headingBlocks,
  heroImages,
  isDecorativeAsset,
  narrativeBlocks,
  PAGE_NAV_LABELS,
  pickAllByDescription,
  pickByDescription,
  REPORT_PAGE_COUNT,
  visibleEntries,
} from "@/lib/report-display";
import { mergeReportForDisplay, pageNumbersFromReport } from "@/lib/products/merge-report";
import type { ReportDeliverable } from "@/lib/products/types";
import type { ReportEntry } from "@/lib/report-types";
import Link from "next/link";
import { useMemo, useState } from "react";
import styles from "./report-reader.module.css";

const TEASER =
  "https://wvgwlwaqlhewhobzauda.supabase.co/storage/v1/object/public/products-media/products/mzmudang-tw/teaser";

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
    return nums.length ? nums : Array.from({ length: REPORT_PAGE_COUNT }, (_, i) => i + 1);
  }, [report]);

  const [page, setPage] = useState(pages[0] ?? 1);
  const pageEntries = useMemo(
    () => entriesForPage(report.entries, page),
    [report.entries, page],
  );
  const idx = pages.indexOf(page);

  return (
    <div className={styles.shell}>
      <header className={styles.topBar}>
        <Link href={`/r/${token}`} className={styles.backLink}>
          ← 報告首頁
        </Link>
        {isDemo && <span className={styles.demoBadge}>Demo 資料</span>}
      </header>

      <main className={styles.pageContent}>
        {page === 1 && <PageCover entries={pageEntries} />}
        {page === 2 && <PageChapter entries={pageEntries} />}
        {page === 3 && <PageProfile entries={pageEntries} />}
        {page > 3 && <PageDefault entries={pageEntries} page={page} />}
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
            {PAGE_NAV_LABELS[page] ?? `第 ${page} 頁`} · {page}/{pages[pages.length - 1]}
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

function PageCover({ entries }: { entries: ReportEntry[] }) {
  const cover =
    entries.find((e) => e.image_url && e.page === 1) ?? entries[0];
  const src =
    cover?.image_url ??
    `${TEASER}/../result/mzmudang_result_cover.png`.replace("/teaser/../result/", "/result/");

  return (
    <section className={styles.coverPage}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={styles.coverImg} src={src} alt={cover?.content ?? "韓國範山道令"} />
      <div className={styles.coverOverlay}>
        <h1 className={styles.coverTitle}>{cover?.content ?? "韓國範山道令"}</h1>
        <p className={styles.metaLine}>完整命理報告 · Report</p>
      </div>
    </section>
  );
}

function PageChapter({ entries }: { entries: ReportEntry[] }) {
  const visible = visibleEntries(entries);
  const texts = visible.filter((e) => !e.image_url || e.content.length > 20);
  const art = entries.find(
    (e) => e.image_url && !isDecorativeAsset(e) && e.content.includes("asset"),
  );

  return (
    <section className={styles.chapterPage}>
      {texts[0] && <p className={styles.chapterLead}>{texts[0].content}</p>}
      {texts.slice(1, 4).map((e) => (
        <p key={`${e.page}-${e.display_order}`} className={styles.chapterItem}>
          {e.content}
        </p>
      ))}
      {art?.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className={styles.chapterArt} src={art.image_url} alt="" />
      )}
    </section>
  );
}

function PageProfile({ entries }: { entries: ReportEntry[] }) {
  const name =
    pickByDescription(entries, "用戶姓名")?.content ??
    pickByDescription(entries, "命盤標示姓名")?.content?.replace(/\s*\(.*\)$/, "") ??
    "命主";
  const pillars =
    pickByDescription(entries, "八字四柱顯示")?.content ??
    pickByDescription(entries, "八字四柱（由 DOB")?.content ??
    "";
  const hero = heroImages(entries)[0] ?? entries.find((e) => e.image_url?.includes("hero"));
  const headings = pickAllByDescription(entries, "區塊小標題");
  const chips = chipLabels(entries);

  const blocks: { heading?: string; body: ReportEntry[] }[] = [];
  let current: { heading?: string; body: ReportEntry[] } = { body: [] };
  for (const e of narrativeBlocks(entries)) {
    const h = headings.find((x) => x.display_order < e.display_order && x.content);
    if (e.type === "ai") {
      if (current.body.length) blocks.push(current);
      const title = headings.find(
        (x) =>
          Math.abs(x.display_order - e.display_order) <= 2 &&
          x.description.includes("區塊小標題"),
      );
      current = { heading: title?.content, body: [e] };
      blocks.push(current);
      current = { body: [] };
    }
  }

  if (blocks.length === 0) {
    const aiOnly = entries.filter((e) => e.type === "ai");
    aiOnly.forEach((e, i) => {
      blocks.push({
        heading: headings[i]?.content,
        body: [e],
      });
    });
  }

  return (
    <section className={styles.profilePage}>
      <div className={styles.pillarBlock}>
        {pillars && <p className={styles.pillars}>{pillars}</p>}
        <h2 className={styles.nameGradient}>{name}</h2>
      </div>
      {hero?.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className={styles.heroImg} src={hero.image_url} alt="" />
      )}
      {chips.length > 0 && (
        <div className={styles.chipRow}>
          {chips.map((c) => (
            <span key={c} className={styles.chip}>
              {c}
            </span>
          ))}
        </div>
      )}
      {blocks.map((block, i) => (
        <div key={i}>
          {block.heading && <h3 className={styles.subheading}>{block.heading}</h3>}
          {block.body.map((e) => (
            <p
              key={`${e.page}-${e.display_order}`}
              className={`${styles.narrative} ${e.type === "ai" ? styles.narrativeAi : ""}`}
            >
              {e.content}
            </p>
          ))}
        </div>
      ))}
    </section>
  );
}

function PageDefault({ entries, page }: { entries: ReportEntry[]; page: number }) {
  const visible = visibleEntries(entries);
  const heroes = heroImages(entries);
  const heads = headingBlocks(entries);
  const narratives = narrativeBlocks(entries);

  return (
    <section className={styles.defaultPage}>
      <p className={styles.metaLine}>第 {page} 頁</p>
      {heroes[0]?.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className={styles.blockImg} src={heroes[0].image_url} alt="" />
      )}
      {heads.map((h) => (
        <h3 key={`${h.page}-${h.display_order}`} className={styles.pageHeading}>
          {h.content}
        </h3>
      ))}
      {narratives.map((e) => (
        <p
          key={`${e.page}-${e.display_order}`}
          className={`${styles.narrative} ${e.type === "ai" ? styles.narrativeAi : ""}`}
        >
          {e.content}
        </p>
      ))}
      {visible.length === 0 && (
        <p className={styles.metaLine}>此頁內容載入中</p>
      )}
    </section>
  );
}
