"use client";

import { useCallback, useEffect, useState } from "react";
import type { PromptVariableMap } from "@/lib/bazi/calculate";
import { fillPrompt } from "@/lib/fill-prompt";
import {
  formatCompareModelPrice,
  getCompareModelLabel,
  getCompareModelNote,
} from "@/lib/gemini-models";
import type { ReportEntry } from "@/lib/report-types";
import type { SavedAiOutput } from "@/lib/report-storage-types";
import styles from "./report.module.css";

const PROGRESS_HINTS = [
  "送出 prompt…",
  "生成繁中長文…",
  "等待模型回覆…",
] as const;

interface Props {
  entry: ReportEntry;
  modelId: string;
  variables: PromptVariableMap | null;
  formError: string | null;
  savedOutput?: SavedAiOutput;
  onOutputSaved: (payload: { text: string; model?: string }) => void;
}

export default function ModelOutputColumn({
  entry,
  modelId,
  variables,
  formError,
  savedOutput,
  onOutputSaved,
}: Props) {
  const [output, setOutput] = useState<string | null>(savedOutput?.text ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progressHint, setProgressHint] = useState<string>(PROGRESS_HINTS[0]);
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    setOutput(savedOutput?.text ?? null);
  }, [savedOutput?.text, modelId]);

  const filledPrompt =
    entry.prompt && variables
      ? fillPrompt(entry.prompt, variables)
      : null;

  const canGenerate = Boolean(filledPrompt && !formError);

  useEffect(() => {
    if (!loading) {
      setElapsedSec(0);
      setProgressHint(PROGRESS_HINTS[0]);
      return;
    }
    const started = Date.now();
    const tick = window.setInterval(() => {
      const sec = Math.floor((Date.now() - started) / 1000);
      setElapsedSec(sec);
      setProgressHint(PROGRESS_HINTS[Math.min(Math.floor(sec / 10), 2)]);
    }, 500);
    return () => window.clearInterval(tick);
  }, [loading]);

  const generate = useCallback(async () => {
    if (!filledPrompt) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: filledPrompt, model: modelId }),
      });
      const data = (await res.json()) as {
        text?: string;
        error?: string;
        model?: string;
      };
      if (!res.ok) {
        setError(data.error ?? `Failed (${res.status})`);
        return;
      }
      const text = data.text ?? "";
      setOutput(text);
      onOutputSaved({ text, model: data.model ?? modelId });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }, [filledPrompt, modelId, onOutputSaved]);

  return (
    <section
      className={`${styles.panel} ${styles.panelCompare} ${loading ? styles.panelGenerating : ""}`}
    >
      <div className={styles.panelTitleRow}>
        <h3 className={styles.panelTitle}>{getCompareModelLabel(modelId)}</h3>
        <button
          type="button"
          className={styles.generateBtn}
          onClick={() => void generate()}
          disabled={loading || !canGenerate}
        >
          {loading ? "…" : output ? "重做" : "Generate"}
        </button>
      </div>
      <p className={styles.panelModelMeta}>
        {getCompareModelNote(modelId)}
        <span className={styles.panelModelPrice}>
          {" "}
          · {formatCompareModelPrice(modelId)}
        </span>
      </p>
      <p className={styles.panelModelId}>{modelId}</p>
      {error && <p className={styles.generateError}>{error}</p>}
      {loading ? (
        <div className={styles.generateProgress} role="status">
          <div className={styles.generateSpinner} aria-hidden />
          <p className={styles.generateProgressTitle}>{progressHint}</p>
          <p className={styles.generateProgressMeta}>{elapsedSec}s</p>
        </div>
      ) : output ? (
        <div className={styles.content}>{output}</div>
      ) : (
        <div className={styles.realOutputPlaceholder}>
          <p>{formError ? "請先修正表單" : "Generate 此模型"}</p>
        </div>
      )}
      {savedOutput && !loading && (
        <p className={styles.columnSavedAt}>
          已存 · {new Date(savedOutput.updatedAt).toLocaleString("zh-TW")}
        </p>
      )}
    </section>
  );
}
