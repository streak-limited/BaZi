"use client";

import { groupEntriesBySection } from "@/lib/bazi-journey/build-result";
import type { ResultPayload } from "@/lib/bazi-journey/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./bazi-intro.module.css";

const TEASER_BASE =
  "https://wvgwlwaqlhewhobzauda.supabase.co/storage/v1/object/public/products-media/products/mzmudang-tw/teaser";

interface StripeUiConfig {
  enabled: boolean;
  testMode: boolean;
  priceLabel: string;
  allowSkip: boolean;
}

interface ResultViewProps {
  payload: ResultPayload;
  subjectId?: string | null;
  /** When set, checkout + saved deliverables use Supabase trial */
  publicToken?: string | null;
}

function pickImage(
  entries: ResultPayload["entries"],
  description: string,
): string | null {
  const e = entries.find((x) => x.description === description);
  return e?.image_url ?? null;
}

export default function ResultView({
  payload,
  subjectId = null,
  publicToken = null,
}: ResultViewProps) {
  const router = useRouter();
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [stripe, setStripe] = useState<StripeUiConfig | null>(null);

  useEffect(() => {
    fetch("/api/stripe/status")
      .then((r) => r.json())
      .then((data: StripeUiConfig) => setStripe(data))
      .catch(() =>
        setStripe({
          enabled: false,
          testMode: false,
          priceLabel: "解鎖完整報告",
          allowSkip: true,
        }),
      );
  }, []);

  const grouped = groupEntriesBySection(payload.entries);
  const heroUrl =
    grouped.get("hero_video")?.[0]?.content ??
    `${TEASER_BASE}/mzmudang_teaser_sales_video.mp4`;
  const intro = grouped.get("intro") ?? [];
  const pillars = grouped.get("four_pillars")?.[0]?.content ?? "";
  const name = grouped.get("name_display")?.[0]?.content ?? "命主";
  const tags = (grouped.get("personality_tags") ?? []).map((e) => e.content);
  const worry = grouped.get("worry_dialogue") ?? [];
  const narratives = grouped.get("fortune_narrative") ?? [];
  const flower = grouped.get("flower_mirror") ?? [];
  const money = grouped.get("money_teaser") ?? [];
  const expert = grouped.get("expert_card") ?? [];
  const cta = grouped.get("cta")?.[0]?.content ?? "向韓國範山道令算命";

  const worryBg =
    pickImage(payload.entries, "煩惱對話背景圖") ??
    `${TEASER_BASE}/04_worry_bg.png`;
  const palzaBg = `${TEASER_BASE}/05_palza_bg.png`;
  const expertBg =
    pickImage(payload.entries, "大師區背景") ??
    `${TEASER_BASE}/20_price_character.png`;

  const stripeReady = stripe?.enabled ?? false;
  const priceLabel = stripe?.priceLabel ?? "解鎖完整報告";

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
    <>
      <div className={`${styles.narrow} ${styles.preRoot}`}>
        <section className={styles.section}>
          <video
            className={styles.heroVideo}
            src={heroUrl}
            autoPlay
            muted
            playsInline
            loop
            preload="auto"
          />
        </section>

        <section className={`${styles.section} ${styles.introBlock}`}>
          <img
            className={styles.introBg}
            src={`${TEASER_BASE}/03_intro_bg.png`}
            alt=""
          />
          <div className={styles.introLines}>
            {intro.map((line) => (
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
          <h2 className={styles.nameGradient}>{name}</h2>
        </section>

        <section className={styles.section}>
          <div className={styles.tagRow}>
            {tags.map((t) => (
              <span key={t} className={styles.tag}>
                {t}
              </span>
            ))}
          </div>
        </section>

        <section className={`${styles.section} ${styles.worrySection}`}>
          <img className={styles.worryBg} src={worryBg} alt="" />
          <div className={styles.worryOverlay} />
          <div className={styles.worryContent}>
            {worry.map((line) => (
              <p key={line.id} style={{ marginBottom: 12, fontSize: "1.1rem" }}>
                {line.content}
              </p>
            ))}
          </div>
        </section>

        {narratives.map((block, i) => (
          <section
            key={block.id}
            className={`${styles.section} ${styles.narrativeSection}`}
          >
            {i === 0 && (
              <img className={styles.narrativeBg} src={palzaBg} alt="" />
            )}
            <div className={styles.bubble}>{block.content}</div>
          </section>
        ))}

        {flower.length > 0 && (
          <section className={styles.section} style={{ padding: "24px 20px" }}>
            {flower.map((f) => (
              <p
                key={f.id}
                style={{
                  textAlign: "center",
                  marginBottom: 12,
                  fontSize: "1.05rem",
                  whiteSpace: "pre-line",
                }}
              >
                {f.content}
              </p>
            ))}
            {flower[0]?.image_url && (
              <img
                src={flower[0].image_url}
                alt=""
                style={{ width: "100%", marginTop: 16 }}
              />
            )}
          </section>
        )}

        <section className={`${styles.section} ${styles.moneySection}`}>
          {money[0] && (
            <h3 className={styles.moneyHeadline}>{money[0].content}</h3>
          )}
          <ul className={styles.moneyList}>
            {money.slice(1, 5).map((m) => (
              <li key={m.id}>· {m.content}</li>
            ))}
          </ul>
          {money[5] && (
            <p style={{ marginTop: 16, opacity: 0.85 }}>{money[5].content}</p>
          )}
        </section>

        <section className={`${styles.section} ${styles.expertSection}`}>
          <img className={styles.expertBg} src={expertBg} alt="" />
          <div className={styles.expertOverlay} />
          <div className={styles.expertText}>
            {expert[0] && (
              <p className={styles.expertTitle}>{expert[0].content}</p>
            )}
            <ul className={styles.moneyList}>
              {expert.slice(1).map((e) => (
                <li key={e.id}>· {e.content}</li>
              ))}
            </ul>
          </div>
        </section>

        <section
          className={styles.section}
          style={{ padding: "0 20px 100px", textAlign: "center" }}
        >
          <p style={{ fontSize: "0.85rem", opacity: 0.6, marginBottom: 24 }}>
            向下滑動解鎖完整 20 頁命理報告
          </p>
        </section>
      </div>

      <div className={styles.paywall}>
        <div className={styles.paywallInner}>
          {publicToken && (
            <p
              style={{
                fontSize: "0.8rem",
                opacity: 0.75,
                marginBottom: 12,
                wordBreak: "break-all",
              }}
            >
              此頁即你的專屬連結，請收藏。付款後在
              <Link href={`/r/${publicToken}`} style={{ textDecoration: "underline" }}>
                {" "}
                報告首頁
              </Link>
              {" "}
              開完整 20 頁報告（內容不變、唔會重跑 AI）。
            </p>
          )}
          {stripe?.testMode && (
            <p className={styles.testModeBadge}>Stripe 測試模式 · 卡號 4242 4242 4242 4242</p>
          )}
          {payError && <p className={styles.errorBanner}>{payError}</p>}
          <button
            type="button"
            className={styles.primaryBtn}
            disabled={payLoading || !stripeReady}
            onClick={handleCheckout}
          >
            {payLoading
              ? "前往 Stripe Checkout…"
              : stripeReady
                ? `${cta} · ${priceLabel}`
                : "載入付款設定…"}
          </button>
          {stripe?.allowSkip && (
            <button
              type="button"
              className={`${styles.primaryBtn} ${styles.btnGhost}`}
              disabled={payLoading}
              onClick={handleDemoUnlock}
            >
              測試解鎖（略過付款 · 本地 demo）
            </button>
          )}
          <p className={styles.paywallNote}>
            {stripeReady
              ? "安全付款由 Stripe 處理。測試帳號請用測試卡，不會真的扣款。"
              : "正在讀取 Stripe 設定…"}
            付款成功後將生成完整報告（下一階段）。
          </p>
        </div>
      </div>
    </>
  );
}
