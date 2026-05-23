"use client";

import PaymentDrawer from "@/app/bazi/intro/PaymentDrawer";
import AltarCtaButton from "@/components/models/bazi-v1/AltarCtaButton";
import { aiEntryForSlot, RESULT_AI_UI_SLOTS } from "@/lib/bazi-journey/result-ai-slots";
import { RESULT_PAGE_STATIC } from "@/lib/bazi-journey/result-page-static";
import type { ResultPayload } from "@/lib/bazi-journey/types";
import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./bazi-intro.module.css";

const S = RESULT_PAGE_STATIC;

interface ResultViewProps {
  payload: ResultPayload;
  subjectId?: string | null;
  publicToken?: string | null;
}

export default function ResultView({
  payload,
  subjectId = null,
  publicToken = null,
}: ResultViewProps) {
  const router = useRouter();
  const [payOpen, setPayOpen] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const pillars =
    payload.entries.find(
      (e) => e.type === "computed" && e.section === "four_pillars",
    )?.content ?? "";
  const name =
    payload.entries.find(
      (e) => e.type === "computed" && e.section === "name_display",
    )?.content ?? "命主";
  const age =
    payload.variables?.current_age ??
    payload.entries.find((e) => e.description?.includes("年齡"))?.content ??
    "";

  const chartLabels = payload.entries
    .filter((e) => e.section === "bazi_labels" && e.content)
    .sort((a, b) => a.display_order - b.display_order);

  const narratives = RESULT_AI_UI_SLOTS.map(({ page, slotId }, i) => ({
    id: `ai-${page}-${slotId}`,
    content: aiEntryForSlot(payload.entries, page, slotId),
    index: i,
  })).filter((n) => n.content);

  const worryLines = S.worry.filter((e) => e.content && !e.image_url);
  const money = S.money;
  const expert = S.expert;
  const flower = S.flower;

  const handleCheckout = async () => {
    setPayError(null);
    setPayLoading(true);
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId,
          publicToken: publicToken ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "付款建立失敗");
      if (data.url) {
        window.location.href = data.url as string;
        return;
      }
      throw new Error("未取得 Stripe 付款連結");
    } catch (e) {
      setPayError(e instanceof Error ? e.message : "付款失敗");
    } finally {
      setPayLoading(false);
    }
  };

  const handleDemoUnlock = async () => {
    setPayError(null);
    setPayLoading(true);
    try {
      const res = await fetch("/api/stripe/demo-unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId, publicToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "測試解鎖失敗");
      if (data.redirectUrl) {
        router.push(data.redirectUrl as string);
        return;
      }
      if (publicToken) {
        router.push(`/r/${publicToken}?paid=1&demo=1`);
        return;
      }
      router.push("/bazi/input?paid=1&demo=1");
    } catch (e) {
      setPayError(e instanceof Error ? e.message : "測試解鎖失敗");
    } finally {
      setPayLoading(false);
    }
  };

  return (
    <div className={styles.resultShell}>
      <div className={`${styles.narrow} ${styles.preRoot}`}>
        <section className={styles.section}>
          <video
            className={styles.heroVideo}
            src={S.heroVideo}
            autoPlay
            muted
            playsInline
            loop
            preload="auto"
          />
        </section>

        <section className={`${styles.section} ${styles.introBlock}`}>
          <img className={styles.introBg} src={S.introBg} alt="" />
          <div className={styles.introLines}>
            {S.intro.map((line) => (
              <p
                key={line.id}
                className={
                  line.description === "副標"
                    ? styles.introAccent
                    : styles.introLine
                }
              >
                {line.content}
              </p>
            ))}
          </div>
        </section>

        <section className={`${styles.section} ${styles.pillarSection}`}>
          <p className={styles.pillarText}>{pillars}</p>
          {age ? (
            <p className={styles.ageGradient} aria-hidden>
              {age}
            </p>
          ) : null}
          <h2 className={styles.nameGradient}>{name}</h2>
        </section>

        {chartLabels.length > 0 && (
          <section className={styles.section}>
            <div className={styles.chartLabelGrid}>
              {chartLabels.map((label) => (
                <span key={label.id} className={styles.chartLabel}>
                  {label.content}
                </span>
              ))}
            </div>
          </section>
        )}

        <section className={styles.section}>
          <div className={styles.tagRow}>
            {S.personalityTags.map((t) => (
              <span key={t} className={styles.tag}>
                {t}
              </span>
            ))}
          </div>
        </section>

        <section className={`${styles.section} ${styles.worrySection}`}>
          <img className={styles.worryBg} src={S.worryBg} alt="" />
          <div className={styles.worryOverlay} />
          <div className={styles.worryContent}>
            {worryLines.map((line) => (
              <p key={line.id} className={styles.worryLine}>
                {line.content}
              </p>
            ))}
          </div>
        </section>

        {narratives.map((block) => (
          <section
            key={block.id}
            className={`${styles.section} ${styles.narrativeSection}`}
          >
            {block.index === 0 && (
              <>
                <img className={styles.narrativeBg} src={S.palzaBg} alt="" />
                <div className={styles.narrativePalzaOverlay} />
              </>
            )}
            <div className={styles.speechBubbleWrap}>
              <img
                className={styles.speechBubbleImg}
                src={S.speechBubble}
                alt=""
              />
              <p className={styles.speechBubbleText}>{block.content}</p>
            </div>
          </section>
        ))}

        {flower.length > 0 && (
          <section className={`${styles.section} ${styles.flowerSection}`}>
            <img
              className={styles.flowerDecoration}
              src={S.unionDecoration}
              alt=""
            />
            {flower.map((f) => (
              <p key={f.id} className={styles.flowerLine}>
                {f.content}
              </p>
            ))}
            {flower[0]?.image_url && (
              <img className={styles.flowerAsset} src={flower[0].image_url} alt="" />
            )}
          </section>
        )}

        <section className={`${styles.section} ${styles.moneySection}`}>
          {money[0] && (
            <h3 className={styles.moneyHeadline}>{money[0].content}</h3>
          )}
          <ul className={styles.moneyList}>
            {money.slice(1, 5).map((m) => (
              <li key={m.id}>{m.content}</li>
            ))}
          </ul>
          {money[5] && <p className={styles.moneySub}>{money[5].content}</p>}
        </section>

        <section className={`${styles.section} ${styles.expertSection}`}>
          <img className={styles.expertBg} src={S.expertBg} alt="" />
          <div className={styles.expertOverlay} />
          <div className={styles.expertText}>
            {expert[0] && (
              <p className={styles.expertTitle}>{expert[0].content}</p>
            )}
            <ul className={styles.expertList}>
              {expert.slice(1).map((e) => (
                <li key={e.id}>{e.content}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className={`${styles.section} ${styles.chapterPreviewSection}`}>
          <p className={styles.chapterPreviewLead}>
            至少需要2個小時以上
            <br />
            相當於一本百頁書的份量
          </p>
          <div className={styles.chapterPreviewImages}>
            <img src={S.chapterPreviewBg} alt="" className={styles.chapterPreviewImg} />
            <p className={styles.chapterPreviewNote}>*實際結果報告頁面示例</p>
          </div>
        </section>

        <section className={`${styles.section} ${styles.chaptersSection}`}>
          {S.chapters.map((chapter, i) => (
            <div
              key={chapter.title}
              className={styles.chapterCard}
              style={
                {
                  ["--chapter-border" as string]: `url(${S.chapterBorders[i] ?? S.chapterBorders[0]})`,
                } as React.CSSProperties
              }
            >
              <div className={styles.chapterBorder} aria-hidden />
              <div className={styles.chapterInner}>
                <div className={styles.chapterBadge}>{chapter.title}</div>
                <p className={styles.chapterLead}>{chapter.lead}</p>
                <img
                  className={styles.chapterDivider}
                  src={S.chapterDivider}
                  alt=""
                />
                <ul className={styles.chapterBullets}>
                  {chapter.bullets.map((b, bi) => (
                    <li key={bi}>
                      <span className={styles.chapterMuted}>{b.muted}</span>
                      <span className={styles.chapterBold}>{b.bold}</span>
                      {"tail" in b && b.tail ? (
                        <span className={styles.chapterMuted}>{b.tail}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </section>

        <section className={`${styles.section} ${styles.finalSajuSection}`}>
          <img className={styles.finalSajuBg} src={S.finalSajuBg} alt="" />
          <p className={styles.finalSajuText}>
            向下滑動解鎖完整 20 頁命理報告
          </p>
        </section>
      </div>

      <div className={styles.resultCtaBar}>
        <div className={styles.resultCtaInner}>
          <AltarCtaButton onClick={() => setPayOpen(true)}>
            {S.cta}
          </AltarCtaButton>
        </div>
      </div>

      <PaymentDrawer
        open={payOpen}
        onClose={() => setPayOpen(false)}
        publicToken={publicToken}
        subjectId={subjectId}
        onCheckout={handleCheckout}
        onDemoUnlock={handleDemoUnlock}
        payLoading={payLoading}
        payError={payError}
      />
    </div>
  );
}
