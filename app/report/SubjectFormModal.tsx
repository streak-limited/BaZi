"use client";

import { useEffect, useState } from "react";
import UserInputFormFields from "./UserInputFormFields";
import type { UserInputState } from "@/lib/user-input-state";
import styles from "./report.module.css";

interface Props {
  open: boolean;
  mode: "create" | "edit";
  title: string;
  initialState: UserInputState;
  saving?: boolean;
  onClose: () => void;
  onSave: (state: UserInputState) => void;
}

export default function SubjectFormModal({
  open,
  mode,
  title,
  initialState,
  saving,
  onClose,
  onSave,
}: Props) {
  const [draft, setDraft] = useState<UserInputState>(initialState);

  useEffect(() => {
    if (open) setDraft(initialState);
  }, [open, initialState]);

  if (!open) return null;

  const handleSave = () => {
    if (draft.error) return;
    if (!draft.input.name.trim()) return;
    onSave(draft);
  };

  return (
    <div
      className={styles.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="subject-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div className={styles.modalPanel}>
        <header className={styles.modalHeader}>
          <div>
            <h2 id="subject-modal-title" className={styles.modalTitle}>
              {title}
            </h2>
            <p className={styles.modalSubtitle}>
              {mode === "create"
                ? "填寫 8 項資料後儲存，會新增一張命主卡片。"
                : "修改後儲存，會更新命盤與下方 Prompt 變數。"}
            </p>
          </div>
          <button
            type="button"
            className={styles.modalClose}
            onClick={onClose}
            disabled={saving}
            aria-label="關閉"
          >
            ×
          </button>
        </header>

        <div className={styles.modalBody}>
          <UserInputFormFields state={draft} onChange={setDraft} />
          {!draft.input.name.trim() && (
            <p className={styles.modalHint}>請填寫姓名後才能儲存。</p>
          )}
        </div>

        <footer className={styles.modalFooter}>
          <button
            type="button"
            className={styles.modalBtnSecondary}
            onClick={onClose}
            disabled={saving}
          >
            取消
          </button>
          <button
            type="button"
            className={styles.modalBtnPrimary}
            onClick={handleSave}
            disabled={saving || Boolean(draft.error) || !draft.input.name.trim()}
          >
            {saving ? "儲存中…" : mode === "create" ? "新增命主" : "儲存變更"}
          </button>
        </footer>
      </div>
    </div>
  );
}
