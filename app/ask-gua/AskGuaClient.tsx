"use client";

import PageHeader from "@/components/PageHeader";
import { useCallback, useState } from "react";
import { generateHexagramLines } from "@/lib/iching/coins";
import {
  buildReading,
  formatLinesTopDown,
  type HexagramReading,
} from "@/lib/iching/hexagrams";
import {
  DEFAULT_COMPARE_MODELS,
  GEMINI_COMPARE_MODELS,
} from "@/lib/gemini-models";
import styles from "./ask-gua.module.css";

type Step = "input" | "hexagram" | "loading" | "report";

function LineTable({ reading }: { reading: HexagramReading }) {
  return (
    <table className={styles.lineTable}>
      <thead>
        <tr>
          <th>爻位</th>
          <th>象</th>
          <th>名</th>
          <th>三錢</th>
          <th>變</th>
        </tr>
      </thead>
      <tbody>
        {formatLinesTopDown(reading.lines).map((l) => (
          <tr
            key={l.position}
            className={l.changing ? styles.lineChanging : undefined}
          >
            <td>
              {l.position === 6 ? "上爻" : l.position === 1 ? "初爻" : `第${l.position}爻`}
            </td>
            <td className={styles.symbol}>{l.symbol}</td>
            <td>{l.term}</td>
            <td>
              {l.coin1}+{l.coin2}+{l.coin3}={l.sum}
            </td>
            <td>{l.changing ? "是" : "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function HexCard({
  label,
  name,
  alias,
  number,
}: {
  label: string;
  name: string;
  alias?: string;
  number: number;
}) {
  return (
    <div className={styles.hexCard}>
      <div className={styles.hexCardHead}>
        <p className={styles.hexMeta}>{label}</p>
        <p className={styles.hexName}>
          {name}
          {alias ? ` · ${alias}` : ""}
        </p>
        <p className={styles.hexMeta}>文王第 {number} 卦</p>
      </div>
    </div>
  );
}

export default function AskGuaClient() {
  const [step, setStep] = useState<Step>("input");
  const [question, setQuestion] = useState("");
  const [model, setModel] = useState(DEFAULT_COMPARE_MODELS[0]);
  const [reading, setReading] = useState<HexagramReading | null>(null);
  const [interpretation, setInterpretation] = useState("");
  const [interpretModel, setInterpretModel] = useState("");
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStep("input");
    setReading(null);
    setInterpretation("");
    setInterpretModel("");
    setError(null);
  }, []);

  const castHexagram = useCallback(() => {
    const q = question.trim();
    if (!q) {
      setError("請先輸入你想問的事。");
      return;
    }
    setError(null);
    const lines = generateHexagramLines();
    setReading(buildReading(q, lines));
    setInterpretation("");
    setStep("hexagram");
  }, [question]);

  const requestInterpretation = useCallback(async () => {
    if (!reading) return;
    setError(null);
    setStep("loading");
    try {
      const res = await fetch("/api/divination", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: reading.question,
          lines: reading.lines,
          model,
        }),
      });
      const payload = (await res.json()) as {
        text?: string;
        model?: string;
        error?: string;
      };
      if (!res.ok || !payload.text) {
        throw new Error(payload.error ?? "解卦失敗");
      }
      setInterpretation(payload.text);
      setInterpretModel(payload.model ?? model);
      setStep("report");
    } catch (e) {
      setError(e instanceof Error ? e.message : "解卦失敗");
      setStep("hexagram");
    }
  }, [reading, model]);

  const busy = step === "loading";
  const showInput = step === "input";
  const showHexagram = reading && step === "hexagram";
  const showGenerate = reading && (step === "hexagram" || step === "loading");

  return (
    <div className={styles.page}>
      <PageHeader
        title="AI 問卦"
        subtitle="輸入問題、起卦後，選擇模型生成解卦報告"
      />

      <main className={styles.main}>
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>問卦</h2>
          <label className={styles.label} htmlFor="question">
            想問什麼？
          </label>
          <textarea
            id="question"
            className={styles.textarea}
            placeholder="例如：今年應唔應該換工作？"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={!showInput || busy}
            maxLength={500}
          />
          <div className={styles.actions}>
            {showInput && (
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={castHexagram}
                disabled={!question.trim()}
              >
                起卦（擲六次）
              </button>
            )}
            {step !== "input" && (
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={reset}
                disabled={busy}
              >
                重新問卦
              </button>
            )}
          </div>
          <p className={styles.hint}>
            三錢：0=字（陰）、1=背（陽）。和 0→老陰（變）、1→少陽、2→少陰、3→老陽（變）。
          </p>
        </section>

        {showHexagram && reading && (
          <section className={styles.card}>
            <p className={styles.label}>所問</p>
            <p className={styles.questionEcho}>{reading.question}</p>

            <div
              className={`${styles.hexGrid} ${
                !reading.changed ? styles.hexGridSingle : ""
              }`}
              style={{ marginTop: "1rem" }}
            >
              <HexCard
                label="本卦"
                name={reading.base.name}
                alias={reading.base.alias}
                number={reading.base.kingWenNumber}
              />
              {reading.changed && (
                <HexCard
                  label="變卦"
                  name={reading.changed.name}
                  alias={reading.changed.alias}
                  number={reading.changed.kingWenNumber}
                />
              )}
            </div>

            {reading.changingPositions.length > 0 ? (
              <p className={styles.hint}>
                變爻：第 {reading.changingPositions.join("、")} 爻
              </p>
            ) : (
              <p className={styles.hint}>六爻皆靜，無變爻。</p>
            )}

            <div style={{ marginTop: "1rem" }}>
              <LineTable reading={reading} />
            </div>
          </section>
        )}

        {showGenerate && reading && (
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>生成解卦報告</h2>
            <div className={styles.generateRow}>
              <div className={styles.generateModel}>
                <label className={styles.label} htmlFor="model">
                  解卦模型
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
                {busy ? "解卦中…" : "生成解卦報告"}
              </button>
            </div>
          </section>
        )}

        {step === "report" && interpretation && (
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>解卦報告</h2>
            <div className={styles.report}>{interpretation}</div>
            <p className={styles.hint}>模型：{interpretModel}</p>
          </section>
        )}

        {error && <p className={styles.error}>{error}</p>}
      </main>
    </div>
  );
}
