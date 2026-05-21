"use client";

import type { CSSProperties } from "react";
import type { PromptVariableMap } from "@/lib/bazi/calculate";
import type { ReportEntry } from "@/lib/report-types";
import type { SavedAiOutput } from "@/lib/report-storage-types";
import { aiOutputKey } from "@/lib/report-storage-types";
import { TYPE_LABELS } from "@/lib/report-types";
import FilledPrompt from "./FilledPrompt";
import ModelOutputColumn from "./ModelOutputColumn";
import styles from "./report.module.css";

interface Props {
  entry: ReportEntry;
  variables: PromptVariableMap | null;
  formError: string | null;
  cardClass: string;
  badgeClass: string;
  compareModels: string[];
  entryOutputs?: Record<string, SavedAiOutput>;
  onOutputSaved: (
    entryKey: string,
    modelId: string,
    payload: { text: string; model?: string },
  ) => void;
  anyColumnLoading?: boolean;
}

export default function AiEntryCard({
  entry,
  variables,
  formError,
  cardClass,
  badgeClass,
  compareModels,
  entryOutputs,
  onOutputSaved,
  anyColumnLoading,
}: Props) {
  const entryKey = aiOutputKey(entry.page, entry.display_order);
  const savedCount = compareModels.filter((m) => entryOutputs?.[m]?.text).length;

  if (!entry.prompt) return null;

  return (
    <article className={cardClass}>
      <div className={styles.cardHeader}>
        <span className={badgeClass}>{TYPE_LABELS.ai}</span>
        <span className={styles.cardMeta}>
          Page {entry.page} · Order {entry.display_order}
        </span>
        {savedCount > 0 && (
          <span className={styles.cardSavedBadge}>
            已存 {savedCount}/{compareModels.length} 模型
          </span>
        )}
        {anyColumnLoading && (
          <span className={styles.cardGeneratingBadge}>Generating</span>
        )}
      </div>
      <p className={styles.description}>{entry.description}</p>

      <div
        className={styles.compareBody}
        style={
          {
            "--compare-cols": compareModels.length,
          } as CSSProperties
        }
      >
        <section className={`${styles.panel} ${styles.panelFixed}`}>
          <h3 className={styles.panelTitle}>Filled prompt</h3>
          <FilledPrompt template={entry.prompt} variables={variables} />
        </section>

        <section className={`${styles.panel} ${styles.panelFixed}`}>
          <h3 className={styles.panelTitle}>Sample output (JSON)</h3>
          <div className={styles.content}>{entry.content}</div>
        </section>

        {compareModels.map((modelId) => (
          <ModelOutputColumn
            key={`${entryKey}-${modelId}`}
            entry={entry}
            modelId={modelId}
            variables={variables}
            formError={formError}
            savedOutput={entryOutputs?.[modelId]}
            onOutputSaved={(payload) =>
              onOutputSaved(entryKey, modelId, payload)
            }
          />
        ))}
      </div>
    </article>
  );
}
