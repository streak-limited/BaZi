"use client";

import { useState } from "react";
import type { SubjectSummary } from "@/lib/report-storage-types";
import styles from "./report.module.css";

interface Props {
  subjects: SubjectSummary[];
  activeId: string | null;
  storageMode?: string;
  disabled?: boolean;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function SubjectCards({
  subjects,
  activeId,
  storageMode,
  disabled,
  onSelect,
  onAdd,
  onEdit,
  onDelete,
}: Props) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  return (
    <section className={styles.subjectCardsSection}>
      <div className={styles.subjectCardsHeader}>
        <h2 className={styles.subjectCardsTitle}>命主</h2>
        <p className={styles.subjectCardsHint}>
          點卡片切換目前命主；新增或編輯請用表單視窗填寫 8 項資料。
          {storageMode === "turso" ? " · Turso" : " · 本機 DB"}
        </p>
      </div>

      <div className={styles.subjectCardsGrid}>
        <button
          type="button"
          className={styles.subjectCardAdd}
          disabled={disabled}
          onClick={onAdd}
        >
          <span className={styles.subjectCardAddIcon}>+</span>
          <span>新增命主</span>
        </button>

        {subjects.map((s) => {
          const isActive = s.id === activeId;
          const confirming = confirmDeleteId === s.id;
          return (
            <article
              key={s.id}
              className={
                isActive
                  ? `${styles.subjectCard} ${styles.subjectCardActive}`
                  : styles.subjectCard
              }
            >
              <button
                type="button"
                className={styles.subjectCardMain}
                disabled={disabled}
                onClick={() => onSelect(s.id)}
              >
                <h3 className={styles.subjectCardName}>{s.displayName}</h3>
                {s.birthDate && (
                  <p className={styles.subjectCardMeta}>{s.birthDate}</p>
                )}
                <p className={styles.subjectCardStats}>
                  {s.generatedCount > 0
                    ? `${s.generatedCount} 則 AI 已生成`
                    : "尚未生成 AI 內容"}
                </p>
                <p className={styles.subjectCardUpdated}>
                  更新 {new Date(s.updatedAt).toLocaleDateString("zh-TW")}
                </p>
                {isActive && (
                  <span className={styles.subjectCardBadge}>使用中</span>
                )}
              </button>

              <div className={styles.subjectCardActions}>
                <button
                  type="button"
                  className={styles.subjectCardAction}
                  disabled={disabled}
                  onClick={() => onEdit(s.id)}
                >
                  編輯
                </button>
                {confirming ? (
                  <>
                    <button
                      type="button"
                      className={`${styles.subjectCardAction} ${styles.subjectCardActionDanger}`}
                      disabled={disabled || subjects.length <= 1}
                      onClick={() => {
                        onDelete(s.id);
                        setConfirmDeleteId(null);
                      }}
                    >
                      確認刪除
                    </button>
                    <button
                      type="button"
                      className={styles.subjectCardAction}
                      onClick={() => setConfirmDeleteId(null)}
                    >
                      取消
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className={styles.subjectCardAction}
                    disabled={disabled || subjects.length <= 1}
                    onClick={() => setConfirmDeleteId(s.id)}
                  >
                    刪除
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
