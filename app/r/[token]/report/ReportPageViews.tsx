"use client";

import type { ReportEntry } from "@/lib/report-types";
import {
  chapterBorderNumber,
  chapterMetaForPage,
  chipLabels,
  decorativeImages,
  dobFromEntries,
  entryImageSrc,
  pairContentBlocks,
  pickImageByAlt,
  pillarsFromEntries,
  userNameFromEntries,
  chartGlyphEntries,
  type ChapterMeta,
} from "@/lib/report/page-layout";
import { pickAllByDescription } from "@/lib/report-display";
import styles from "./report-reader.module.css";

function ReportImage({
  entry,
  className,
  alt,
}: {
  entry?: ReportEntry;
  className?: string;
  alt?: string;
}) {
  const src = entryImageSrc(entry);
  if (!src) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={className}
      src={src}
      alt={alt ?? entry?.content ?? ""}
      loading="lazy"
    />
  );
}

function ChapterHeader({ meta }: { meta: ChapterMeta | null }) {
  if (!meta) return null;
  return (
    <header className={styles.chapterHeader}>
      <div className={styles.chapterBadge}>
        <span className={styles.chapterBadgeText}>{meta.chapterLabel}</span>
      </div>
      {meta.sectionSubtitle && (
        <p className={styles.sectionSubtitle}>{meta.sectionSubtitle}</p>
      )}
    </header>
  );
}

function ContentBlocks({
  blocks,
}: {
  blocks: ReturnType<typeof pairContentBlocks>;
}) {
  if (blocks.length === 0) return null;
  return (
    <div className={styles.contentBody}>
      {blocks.map((block, i) => (
        <article key={i} className={styles.contentBlock}>
          {block.isIntro ? (
            <p className={styles.introLead}>{block.body}</p>
          ) : (
            <>
              {block.heading && (
                <h3 className={styles.blockHeading}>{block.heading}</h3>
              )}
              <p className={styles.narrative}>{block.body}</p>
            </>
          )}
        </article>
      ))}
    </div>
  );
}

function pickCharacterImage(entries: ReportEntry[]): ReportEntry | undefined {
  return entries.find(
    (e) =>
      e.image_url &&
      !e.content.includes("_bg") &&
      !e.content.includes("Banner") &&
      !e.content.includes("chapter_") &&
      (e.content.includes("character") ||
        e.content.includes("hand_reach") ||
        e.content.includes("daewoon") ||
        e.content.includes("sin_male") ||
        e.content.includes("sin_female")),
  );
}

function pickBgImage(entries: ReportEntry[]): ReportEntry | undefined {
  return entries.find(
    (e) =>
      e.image_url &&
      (e.content.includes("_bg") || e.description.includes("_bg")),
  );
}

function pickBannerImage(entries: ReportEntry[]): ReportEntry | undefined {
  return entries.find((e) => e.image_url && e.content.includes("Banner"));
}

function pickByDescription(entries: ReportEntry[], includes: string) {
  return entries.find((e) => e.description.includes(includes));
}

export function PageCover({ entries }: { entries: ReportEntry[] }) {
  const cover = entries.find((e) => e.image_url && e.page === 1) ?? entries[0];
  const altMatch = cover?.description.match(/alt=([^)]+)/);
  const label = altMatch?.[1] ?? cover?.content ?? "";

  return (
    <section className={styles.coverPage}>
      <ReportImage entry={cover} className={styles.coverImg} alt={label} />
      <div className={styles.coverOverlay}>
        {label && <h1 className={styles.coverTitle}>{label}</h1>}
        <p className={styles.metaLine}>完整命理報告 · Report</p>
      </div>
    </section>
  );
}

export function PageChapterDivider({
  entries,
  page,
}: {
  entries: ReportEntry[];
  page: number;
}) {
  const lead = pickByDescription(entries, "章節開場標語");
  const toc = pickAllByDescription(entries, "章節目錄項目");
  const asset = pickImageByAlt(entries, "07_asset_2");
  const border = pickImageByAlt(
    entries,
    `chapter_border_${chapterBorderNumber(page)}`,
  );
  const divider = pickImageByAlt(entries, "chapter_divider");

  return (
    <section className={styles.chapterPage}>
      {lead && <p className={styles.chapterLead}>{lead.content}</p>}
      {toc.map((item) => (
        <p
          key={`${item.page}-${item.display_order}`}
          className={styles.chapterItem}
        >
          {item.content}
        </p>
      ))}
      <div className={styles.chapterArtStack}>
        {asset && <ReportImage entry={asset} className={styles.chapterArt} />}
        {border && (
          <ReportImage entry={border} className={styles.chapterBorder} />
        )}
        {divider && (
          <ReportImage entry={divider} className={styles.chapterDivider} />
        )}
      </div>
    </section>
  );
}

export function PageProfile({
  entries,
  allEntries,
}: {
  entries: ReportEntry[];
  allEntries: ReportEntry[];
}) {
  const meta = chapterMetaForPage(3, allEntries);
  const name = userNameFromEntries(entries);
  const pillars = pillarsFromEntries(entries);
  const dob = dobFromEntries(entries);
  const worryBg = pickImageByAlt(entries, "04_worry_bg");
  const introAsset = pickImageByAlt(entries, "03_intro_asset");
  const chartAsset = pickImageByAlt(entries, "07_asset_2");
  const banner = pickImageByAlt(entries, "Banner.png");
  const glyphs = chartGlyphEntries(entries);
  const chips = chipLabels(entries);
  const blocks = pairContentBlocks(entries);

  return (
    <section className={styles.profilePage}>
      <ChapterHeader meta={meta} />

      <div className={styles.profileHero}>
        {worryBg && (
          <ReportImage entry={worryBg} className={styles.profileHeroBg} alt="" />
        )}
        <div className={styles.profileHeroGradient} />
        <div className={styles.profileHeroText}>
          {pillars && <p className={styles.pillars}>{pillars}</p>}
          {name && <h2 className={styles.nameGradient}>{name}</h2>}
        </div>
      </div>

      {introAsset && (
        <div className={styles.profileIntroWrap}>
          <ReportImage
            entry={introAsset}
            className={styles.profileIntroImg}
            alt=""
          />
        </div>
      )}

      <div className={styles.chartSection}>
        <div className={styles.chartGlow} />
        {chartAsset && (
          <ReportImage
            entry={chartAsset}
            className={styles.chartBgFigure}
            alt=""
          />
        )}
        <div className={styles.chartPanel}>
          {glyphs.length > 0 && (
            <div className={styles.glyphGrid}>
              {glyphs.map((g) => (
                <div
                  key={`${g.page}-${g.display_order}`}
                  className={styles.glyphCell}
                >
                  <ReportImage
                    entry={g}
                    className={styles.glyphImg}
                    alt={g.content}
                  />
                </div>
              ))}
            </div>
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
          {dob && <p className={styles.dobLine}>{dob}</p>}
          {banner && (
            <ReportImage entry={banner} className={styles.chartBanner} alt="" />
          )}
        </div>
      </div>

      <ContentBlocks blocks={blocks} />
    </section>
  );
}

export function PageContent({
  entries,
  page,
  allEntries,
}: {
  entries: ReportEntry[];
  page: number;
  allEntries: ReportEntry[];
}) {
  const meta = chapterMetaForPage(page, allEntries);
  const character = pickCharacterImage(entries);
  const bg = pickBgImage(entries);
  const banner = pickBannerImage(entries);
  const chips = chipLabels(entries);
  const blocks = pairContentBlocks(entries);
  const hasBgScene = Boolean(bg);

  return (
    <section className={styles.contentPage}>
      <ChapterHeader meta={meta} />

      {character && !hasBgScene && (
        <div className={styles.heroFigureWrap}>
          <ReportImage entry={character} className={styles.heroFigure} alt="" />
        </div>
      )}

      {hasBgScene && (
        <div className={styles.sceneWrap}>
          {bg && <ReportImage entry={bg} className={styles.sceneBg} alt="" />}
          <div className={styles.sceneGradient} />
          {character && (
            <ReportImage
              entry={character}
              className={styles.sceneCharacter}
              alt=""
            />
          )}
          {banner && (
            <ReportImage entry={banner} className={styles.sceneBanner} alt="" />
          )}
        </div>
      )}

      {!hasBgScene && banner && (
        <ReportImage entry={banner} className={styles.standaloneBanner} alt="" />
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

      <ContentBlocks blocks={blocks} />
    </section>
  );
}

export function PageClosing({ entries }: { entries: ReportEntry[] }) {
  const thanks = pickByDescription(entries, "章節開場標語");
  const ctaTitle = pickByDescription(entries, "結尾 CTA 標題");
  const ctaDesc = pickByDescription(entries, "結尾 CTA 說明");
  const reportBtn = pickByDescription(entries, "回報錯誤按鈕文案");
  const reportNote = pickByDescription(entries, "回報說明");
  const recTitle = pickByDescription(entries, "推薦區標題");
  const recSub = pickByDescription(entries, "推薦區副標");
  const recCategory = pickByDescription(entries, "推薦分類標題");
  const heroBg = pickImageByAlt(entries, "02_hero_character");
  const products = decorativeImages(entries).filter(
    (e) =>
      !e.content.includes("리뷰") &&
      e.description.includes("Next/Image"),
  );

  return (
    <section className={styles.closingPage}>
      <div
        className={styles.ctaCard}
        style={
          heroBg?.image_url
            ? { backgroundImage: `url(${heroBg.image_url})` }
            : undefined
        }
      >
        <div className={styles.ctaCardInner}>
          {ctaTitle && <h2 className={styles.ctaTitle}>{ctaTitle.content}</h2>}
          {ctaDesc && <p className={styles.ctaDesc}>{ctaDesc.content}</p>}
          <button type="button" className={styles.ctaButton}>
            前往提問 →
          </button>
        </div>
      </div>

      <div className={styles.closingSection}>
        {thanks && <p className={styles.thanksLine}>{thanks.content}</p>}
        {reportBtn && (
          <button type="button" className={styles.reportBtn}>
            {reportBtn.content}
          </button>
        )}
        {reportNote && (
          <p className={styles.reportNote}>{reportNote.content}</p>
        )}
      </div>

      {(recTitle || products.length > 0) && (
        <div className={styles.recSection}>
          {recTitle && <h3 className={styles.recTitle}>{recTitle.content}</h3>}
          {recSub && <p className={styles.recSub}>{recSub.content}</p>}
          {recCategory && (
            <p className={styles.recCategory}>{recCategory.content}</p>
          )}
          <div className={styles.recGrid}>
            {products.map((p) => (
              <div
                key={`${p.page}-${p.display_order}`}
                className={styles.recCard}
              >
                <ReportImage entry={p} className={styles.recImg} alt={p.content} />
                <p className={styles.recLabel}>{p.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
