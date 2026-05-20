"use client";

import {
  CHEAPEST_COMPARE_MODEL_ID,
  GEMINI_COMPARE_MODELS,
  MAX_COMPARE_COLUMNS,
  formatCompareModelPrice,
  getCompareModel,
  getCompareModelLabel,
  nextUnusedCompareModel,
} from "@/lib/gemini-models";
import styles from "./report.module.css";

interface Props {
  compareModels: string[];
  onChange: (models: string[]) => void;
}

export default function ModelCompareBar({ compareModels, onChange }: Props) {
  const setModelAt = (index: number, modelId: string) => {
    const next = [...compareModels];
    next[index] = modelId;
    onChange(next);
  };

  const removeColumn = (index: number) => {
    if (compareModels.length <= 1) return;
    onChange(compareModels.filter((_, i) => i !== index));
  };

  const addColumn = () => {
    const next = nextUnusedCompareModel(compareModels);
    if (!next || compareModels.length >= MAX_COMPARE_COLUMNS) return;
    onChange([...compareModels, next]);
  };

  const canAdd =
    compareModels.length < MAX_COMPARE_COLUMNS &&
    nextUnusedCompareModel(compareModels) !== null;

  return (
    <div className={styles.toolbarModelGroup}>
      <span className={styles.filterLabel}>Models</span>
      <div className={styles.toolbarModelSlots}>
        {compareModels.map((modelId, index) => {
          const meta = getCompareModel(modelId);
          const isCheapest = modelId === CHEAPEST_COMPARE_MODEL_ID;
          return (
            <div key={`${index}-${modelId}`} className={styles.toolbarModelSlot}>
              <div className={styles.toolbarModelSlotTop}>
                <span className={styles.toolbarModelSlotLabel}>{index + 1}</span>
                <select
                  className={styles.toolbarModelSelect}
                  value={modelId}
                  title={`${modelId}\n${meta?.note ?? ""}\n${formatCompareModelPrice(modelId)}`}
                  onChange={(e) => setModelAt(index, e.target.value)}
                >
                  {GEMINI_COMPARE_MODELS.map((m) => {
                    const usedElsewhere = compareModels.some(
                      (id, i) => i !== index && id === m.id,
                    );
                    return (
                      <option key={m.id} value={m.id} disabled={usedElsewhere}>
                        {m.label} — {m.note}
                      </option>
                    );
                  })}
                </select>
                {compareModels.length > 1 && (
                  <button
                    type="button"
                    className={styles.toolbarModelRemove}
                    onClick={() => removeColumn(index)}
                    aria-label={`移除欄 ${index + 1}`}
                  >
                    ×
                  </button>
                )}
              </div>
              {meta && (
                <p className={styles.toolbarModelSlotDesc}>
                  {isCheapest && (
                    <span className={styles.toolbarModelCheapest}>最便宜 </span>
                  )}
                  {meta.note}
                  <span className={styles.toolbarModelSlotPrice}>
                    {" "}
                    · {formatCompareModelPrice(modelId)}
                  </span>
                </p>
              )}
            </div>
          );
        })}
        {canAdd && (
          <button
            type="button"
            className={styles.toolbarModelAdd}
            onClick={addColumn}
          >
            + 欄
          </button>
        )}
      </div>
    </div>
  );
}
