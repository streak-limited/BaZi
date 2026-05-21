"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import {
  DEFAULT_COMPARE_MODELS,
  GEMINI_COMPARE_MODELS,
} from "@/lib/gemini-models";
import type { DrawnLot, LotSystem } from "@/lib/fortune-lots/types";
import { LOT_SYSTEM_META } from "@/lib/fortune-lots/types";
import { isJiaziLot } from "@/lib/fortune-lots/draw";
import { jiaziLotImagePath } from "@/lib/fortune-lots/jiazi-images";
import styles from "./fortune-lots.module.css";

type Step = "input" | "lot" | "loading" | "report";

function levelClass(level: string): string {
  if (level.includes("上上") || level.includes("上吉") || level.includes("大吉")) {
    return `${styles.lotLevel} ${level.includes("上上") || level.includes("大吉") ? styles.levelGreat : styles.levelGood}`;
  }
  if (level.includes("下")) return `${styles.lotLevel} ${styles.levelBad}`;
  return `${styles.lotLevel} ${styles.levelMid}`;
}

export default function FortuneLotsClient() {
  const [system, setSystem] = useState<LotSystem>("guanyin");
  const [step, setStep] = useState<Step>("input");
  const [question, setQuestion] = useState("");
  const [lot, setLot] = useState<DrawnLot | null>(null);
  const [model, setModel] = useState(DEFAULT_COMPARE_MODELS[0]);
  const [analysis, setAnalysis] = useState("");
  const [interpretModel, setInterpretModel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [drawing, setDrawing] = useState(false);

  const meta = LOT_SYSTEM_META[system];

  const reset = useCallback(() => {
    setStep("input");
    setLot(null);
    setAnalysis("");
    setInterpretModel("");
    setError(null);
    setDrawing(false);
  }, []);

  const drawLot = useCallback(async () => {
    const q = question.trim();
    if (!q) {
      setError("請先輸入你想問的事。");
      return;
    }
    setError(null);
    setDrawing(true);
    try {
      const res = await fetch("/api/fortune-lots/draw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, system }),
      });
      const payload = (await res.json()) as {
        lot?: DrawnLot;
        error?: string;
      };
      if (!res.ok || !payload.lot) {
        throw new Error(payload.error ?? "抽籤失敗");
      }
      setLot(payload.lot);
      setAnalysis("");
      setStep("lot");
    } catch (e) {
      setError(e instanceof Error ? e.message : "抽籤失敗");
    } finally {
      setDrawing(false);
    }
  }, [question, system]);

  const requestInterpretation = useCallback(async () => {
    if (!lot) return;
    const q = question.trim();
    setError(null);
    setStep("loading");
    try {
      const res = await fetch("/api/fortune-lots/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, system: lot.system, lot, model }),
      });
      const payload = (await res.json()) as {
        text?: string;
        model?: string;
        error?: string;
      };
      if (!res.ok || !payload.text) {
        throw new Error(payload.error ?? "解籤失敗");
      }
      setAnalysis(payload.text);
      setInterpretModel(payload.model ?? model);
      setStep("report");
    } catch (e) {
      setError(e instanceof Error ? e.message : "解籤失敗");
      setStep("lot");
    }
  }, [lot, question, model]);

  const busy = drawing || step === "loading";
  const showLot = lot && (step === "lot" || step === "loading" || step === "report");
  const showGenerate = lot && (step === "lot" || step === "loading");
  const deityLabel = lot ? LOT_SYSTEM_META[lot.system].deity : meta.deity;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div>
            <h1 className={styles.title}>靈籤求籤 · AI 解籤</h1>
            <p className={styles.subtitle}>
              先揀觀音靈籤（100 首）或六十甲子籤（60 支）；後端程式 random 抽籤，解籤時才呼叫 Gemini。
            </p>
          </div>
          <nav className={styles.nav}>
            <Link href="/">← Home</Link>
          </nav>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>求籤</h2>
          <fieldset className={styles.systemPicker} disabled={step !== "input" || busy}>
            <legend className={styles.label}>籤種</legend>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="lotSystem"
                value="guanyin"
                checked={system === "guanyin"}
                onChange={() => setSystem("guanyin")}
              />
              觀音靈籤（1–100）
            </label>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="lotSystem"
                value="jiazi"
                checked={system === "jiazi"}
                onChange={() => setSystem("jiazi")}
              />
              六十甲子籤（1–60）
            </label>
          </fieldset>
          <label className={styles.label} htmlFor="question">
            你想問什麼？
          </label>
          <textarea
            id="question"
            className={styles.textarea}
            placeholder="例如：我聽日去面試會唔會成功？"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={step !== "input" || busy}
            maxLength={500}
          />
          <div className={styles.actions}>
            {step === "input" && (
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={() => void drawLot()}
                disabled={!question.trim() || drawing}
              >
                {drawing ? "求籤中…" : `開始求${meta.label}`}
              </button>
            )}
            {step !== "input" && (
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={reset}
                disabled={busy}
              >
                重新求籤
              </button>
            )}
          </div>
          <p className={styles.hint}>
            籤文來自標準 JSON；AI 只負責解籤，不會隨機改籤號。
          </p>
        </section>

        {showLot && lot && (
          <section className={styles.card}>
            {isJiaziLot(lot) && jiaziLotImagePath(lot.id, lot.code) && (
              <figure className={styles.lotFigure}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={jiaziLotImagePath(lot.id, lot.code)!}
                  alt={`六十甲子籤 第 ${lot.id} 支 ${lot.code}`}
                  className={styles.lotImage}
                />
                <figcaption className={styles.lotImageCaption}>
                  籤詩圖 · 台北新莊地藏庵（
                  <a
                    href="https://github.com/tutorial0/chouqian"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    chouqian
                  </a>
                  ）
                </figcaption>
              </figure>
            )}
            <div className={styles.lotPaper}>
              <p className={styles.lotNumber}>
                {LOT_SYSTEM_META[lot.system].label}
                {isJiaziLot(lot)
                  ? ` · 第 ${lot.id} 支（${lot.code}）`
                  : ` · 第 ${lot.id} 首`}
              </p>
              <p className={levelClass(lot.level)}>{lot.level}</p>
              <p className={styles.lotPoem}>{lot.poem}</p>
              <p className={styles.lotAllusion}>典故：{lot.allusion}</p>
            </div>
            <p className={styles.hint} style={{ textAlign: "center" }}>
              所問：{question.trim()}
            </p>
          </section>
        )}

        {showGenerate && (
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>{deityLabel}解籤</h2>
            <div className={styles.generateRow}>
              <div className={styles.generateModel}>
                <label className={styles.label} htmlFor="model">
                  解籤模型
                </label>
                <select
                  id="model"
                  className={styles.select}
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  disabled={busy}
                >
                  {GEMINI_COMPARE_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={() => void requestInterpretation()}
                disabled={busy}
              >
                {step === "loading" ? "解籤中…" : "生成解籤"}
              </button>
            </div>
          </section>
        )}

        {step === "report" && analysis && (
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>解籤內容</h2>
            <div className={styles.report}>{analysis}</div>
            <p className={styles.hint}>模型：{interpretModel}</p>
            <div className={styles.followUp}>
              <p className={styles.followUpNote}>
                追問功能（例如再問著咩色衫）可之後再加；目前請「重新求籤」問新題。
              </p>
            </div>
          </section>
        )}

        {error && <p className={styles.error}>{error}</p>}
      </main>
    </div>
  );
}
