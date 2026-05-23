import type { ReportEntry } from "@/lib/report-types";
import {
  chipLabels,
  entriesForPage,
  pickAllByDescription,
  pickByDescription,
  sortEntries,
} from "@/lib/report-display";

export type ReportLayoutType =
  | "cover"
  | "chapter-divider"
  | "profile"
  | "content"
  | "closing";

export const CHAPTER_DIVIDER_PAGES = [2, 5, 10, 15] as const;
const CHAPTER_LABELS = ["第一章", "第二章", "第三章", "第四章"];

export function layoutTypeForPage(page: number): ReportLayoutType {
  if (page === 1) return "cover";
  if (CHAPTER_DIVIDER_PAGES.includes(page as (typeof CHAPTER_DIVIDER_PAGES)[number]))
    return "chapter-divider";
  if (page === 3) return "profile";
  if (page === 20) return "closing";
  return "content";
}

export function entryImageSrc(entry: ReportEntry | undefined): string | undefined {
  if (!entry) return undefined;
  return entry.image_url ?? undefined;
}

export function pickImageByAlt(
  entries: ReportEntry[],
  altFragment: string,
): ReportEntry | undefined {
  return entries.find(
    (e) =>
      e.image_url &&
      (e.description.includes(altFragment) || e.content.includes(altFragment)),
  );
}

export function pickImagesByAlt(
  entries: ReportEntry[],
  altFragment: string,
): ReportEntry[] {
  return entries.filter(
    (e) =>
      e.image_url &&
      (e.description.includes(altFragment) || e.content.includes(altFragment)),
  );
}

export function decorativeImages(entries: ReportEntry[]): ReportEntry[] {
  return sortEntries(entries).filter(
    (e) =>
      e.image_url &&
      (e.description.includes("固定插圖") ||
        e.description.includes("插圖（Next/Image")),
  );
}

export function chartGlyphEntries(entries: ReportEntry[]): ReportEntry[] {
  return sortEntries(entries).filter(
    (e) => e.description.includes("命盤天干地支圖") && e.image_url,
  );
}

export interface ChapterMeta {
  chapterLabel: string;
  sectionSubtitle?: string;
}

/** Chapter badge + numbered section title from preceding divider TOC entries */
export function chapterMetaForPage(
  page: number,
  allEntries: ReportEntry[],
): ChapterMeta | null {
  if (page === 1 || page === 20) return null;

  let chapterIdx = 0;
  let dividerPage: number = CHAPTER_DIVIDER_PAGES[0];
  for (let i = 0; i < CHAPTER_DIVIDER_PAGES.length; i++) {
    if (page >= CHAPTER_DIVIDER_PAGES[i]) {
      chapterIdx = i;
      dividerPage = CHAPTER_DIVIDER_PAGES[i];
    }
  }

  const nextDivider =
    CHAPTER_DIVIDER_PAGES[chapterIdx + 1] ?? REPORT_END_PAGE + 1;
  const contentPages: number[] = [];
  for (let p = dividerPage + 1; p < nextDivider; p++) contentPages.push(p);

  const sectionIdx = contentPages.indexOf(page);
  if (sectionIdx < 0) {
    if (CHAPTER_DIVIDER_PAGES.includes(page as (typeof CHAPTER_DIVIDER_PAGES)[number])) {
      return { chapterLabel: CHAPTER_LABELS[chapterIdx] ?? CHAPTER_LABELS[0] };
    }
    return null;
  }

  const tocItems = pickAllByDescription(
    entriesForPage(allEntries, dividerPage),
    "章節目錄項目",
  );
  const raw = tocItems[sectionIdx]?.content?.trim();
  const sectionSubtitle = raw ? `${sectionIdx + 1}. ${raw}` : undefined;

  return {
    chapterLabel: CHAPTER_LABELS[chapterIdx] ?? CHAPTER_LABELS[0],
    sectionSubtitle,
  };
}

export interface ContentBlock {
  heading?: string;
  body: string;
  isIntro?: boolean;
}

/** Pair 區塊小標題（固定模板）：* with following AI 分析內文 / 章節開場導語 */
export function pairContentBlocks(entries: ReportEntry[]): ContentBlock[] {
  const sorted = sortEntries(entries);
  const blocks: ContentBlock[] = [];

  for (const entry of sorted) {
    if (entry.type === "ai" && entry.description.includes("AI 章節開場導語")) {
      blocks.push({ body: entry.content, isIntro: true });
      continue;
    }
    if (entry.type !== "ai" || !entry.description.includes("AI 分析內文")) {
      continue;
    }

    const headingEntry = [...sorted]
      .reverse()
      .find(
        (e) =>
          e.display_order < entry.display_order &&
          e.description.includes("區塊小標題（固定模板）："),
      );

    blocks.push({
      heading: headingEntry?.content?.trim() || undefined,
      body: entry.content,
    });
  }

  return blocks;
}

export function chapterBorderNumber(page: number): number {
  const idx = CHAPTER_DIVIDER_PAGES.indexOf(
    page as (typeof CHAPTER_DIVIDER_PAGES)[number],
  );
  return idx >= 0 ? idx + 1 : 1;
}

export const REPORT_END_PAGE = 20;

export function pageNavLabel(page: number, allEntries: ReportEntry[]): string {
  if (page === 1) return "封面";
  if (page === 20) return "結尾";
  if (CHAPTER_DIVIDER_PAGES.includes(page as (typeof CHAPTER_DIVIDER_PAGES)[number])) {
    const meta = chapterMetaForPage(page, allEntries);
    return meta?.chapterLabel ?? `目錄`;
  }
  const meta = chapterMetaForPage(page, allEntries);
  if (meta?.sectionSubtitle) {
    const short = meta.sectionSubtitle.replace(/^\d+\.\s*/, "").slice(0, 12);
    return short.length < meta.sectionSubtitle.length ? `${short}…` : short;
  }
  return `第 ${page} 頁`;
}

export function userNameFromEntries(entries: ReportEntry[]): string {
  return (
    pickByDescription(entries, "用戶姓名")?.content?.trim() ||
    pickByDescription(entries, "命盤標示姓名")
      ?.content?.replace(/\s*\(.*\)$/, "")
      ?.trim() ||
    ""
  );
}

export function pillarsFromEntries(entries: ReportEntry[]): string {
  return (
    pickByDescription(entries, "八字四柱顯示")?.content?.trim() ||
    pickByDescription(entries, "八字四柱（由 DOB")?.content?.trim() ||
    ""
  );
}

export function dobFromEntries(entries: ReportEntry[]): string {
  return pickByDescription(entries, "出生日期時間")?.content?.trim() ?? "";
}

export { chipLabels };
