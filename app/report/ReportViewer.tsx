"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_COMPARE_MODELS, sanitizeCompareModels } from "@/lib/gemini-models";
import type { ContentType, ReportData, ReportEntry } from "@/lib/report-types";
import { CONTENT_TYPES, TYPE_LABELS } from "@/lib/report-types";
import type { AiOutputsMap, SubjectSummary } from "@/lib/report-storage-types";
import { aiOutputKey, countSavedOutputs } from "@/lib/report-storage-types";
import {
  createEmptyUserState,
  userStateFromPersistedInput,
  type UserInputState,
} from "@/lib/user-input-state";
import AiEntryCard from "./AiEntryCard";
import ModelCompareBar from "./ModelCompareBar";
import SubjectCards from "./SubjectCards";
import SubjectFormModal from "./SubjectFormModal";
import styles from "./report.module.css";

const ACTIVE_SUBJECT_KEY = "bazi-active-subject";

type PersistStatus = "loading" | "ready" | "saving" | "saved" | "error";
type SubjectModalState =
  | { mode: "create" }
  | { mode: "edit"; subjectId: string }
  | null;

function cardClass(type: ContentType): string {
  if (type === "static") return `${styles.card} ${styles.cardStatic}`;
  if (type === "computed") return `${styles.card} ${styles.cardComputed}`;
  return `${styles.card} ${styles.cardAi}`;
}

function badgeClass(type: ContentType): string {
  if (type === "static") return `${styles.badge} ${styles.badgeStatic}`;
  if (type === "computed") return `${styles.badge} ${styles.badgeComputed}`;
  return `${styles.badge} ${styles.badgeAi}`;
}

function pillClass(type: ContentType, active: boolean): string {
  const base = `${styles.pill} ${
    type === "static"
      ? styles.pillStatic
      : type === "computed"
        ? styles.pillComputed
        : styles.pillAi
  }`;
  return active ? `${base} ${styles.pillActive}` : base;
}

function StaticEntryCard({ entry }: { entry: ReportEntry }) {
  return (
    <article className={cardClass(entry.type)}>
      <div className={styles.cardHeader}>
        <span className={badgeClass(entry.type)}>{TYPE_LABELS[entry.type]}</span>
        <span className={styles.cardMeta}>
          Page {entry.page} · Order {entry.display_order}
        </span>
      </div>
      <p className={styles.description}>{entry.description}</p>
      <div className={styles.singleBody}>
        <section className={styles.panelFull}>
          <div className={styles.content}>{entry.content}</div>
          {entry.image_url && (
            <div className={styles.imageBlock}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={entry.image_url}
                alt={entry.content}
                className={styles.imagePreview}
              />
              <a
                href={entry.image_url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.imageUrl}
              >
                {entry.image_url}
              </a>
            </div>
          )}
        </section>
      </div>
    </article>
  );
}

function applyLoadedState(
  state: {
    userInput: UserInputState["input"];
    compareModels?: string[];
    aiOutputs: AiOutputsMap;
    displayName?: string;
    updatedAt: string;
  },
  setters: {
    setUserState: (s: UserInputState) => void;
    setCompareModels: (m: string[]) => void;
    setAiOutputs: (o: AiOutputsMap) => void;
    setPersistMessage: (m: string) => void;
  },
) {
  setters.setUserState(userStateFromPersistedInput(state.userInput));
  setters.setCompareModels(sanitizeCompareModels(state.compareModels));
  setters.setAiOutputs(state.aiOutputs ?? {});
  const name = state.displayName || state.userInput.name || "命主";
  setters.setPersistMessage(
    `已載入「${name}」· ${new Date(state.updatedAt).toLocaleString("zh-TW")}`,
  );
}

export interface ReportViewerProps {
  data: ReportData;
  title?: string;
  subtitle?: string;
  showPageFilter?: boolean;
  secondaryNavHref?: string;
  secondaryNavLabel?: string;
}

export default function ReportViewer({
  data,
  title = "Report content breakdown",
  subtitle,
  showPageFilter = true,
  secondaryNavHref,
  secondaryNavLabel,
}: ReportViewerProps) {
  const pageNumbers = useMemo(() => {
    const pages = new Set(data.entries.map((e) => e.page));
    return Array.from(pages).sort((a, b) => a - b);
  }, [data.entries]);

  const [pageFilter, setPageFilter] = useState<number | "all">("all");
  const [activeTypes, setActiveTypes] = useState<Set<ContentType>>(
    () => new Set<ContentType>(["ai"]),
  );
  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);
  const [storageMode, setStorageMode] = useState<string>("");
  const [userState, setUserState] = useState<UserInputState>(createEmptyUserState());
  const [compareModels, setCompareModels] = useState<string[]>([
    ...DEFAULT_COMPARE_MODELS,
  ]);
  const [aiOutputs, setAiOutputs] = useState<AiOutputsMap>({});
  const [persistStatus, setPersistStatus] = useState<PersistStatus>("loading");
  const [persistMessage, setPersistMessage] = useState<string>("");
  const [subjectModal, setSubjectModal] = useState<SubjectModalState>(null);
  const [modalDraft, setModalDraft] = useState<UserInputState>(createEmptyUserState());
  const [modalSaving, setModalSaving] = useState(false);
  const skipNextSave = useRef(true);

  const toggleType = (type: ContentType) => {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        if (next.size === 1) return prev;
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const filtered = useMemo(() => {
    return data.entries
      .filter((e) => activeTypes.has(e.type))
      .filter((e) => pageFilter === "all" || e.page === pageFilter)
      .sort((a, b) => a.page - b.page || a.display_order - b.display_order);
  }, [data.entries, activeTypes, pageFilter]);

  const byType = data.metadata.by_type ?? {
    static: data.entries.filter((e) => e.type === "static").length,
    computed: data.entries.filter((e) => e.type === "computed").length,
    ai: data.entries.filter((e) => e.type === "ai").length,
  };

  const generatedCount = countSavedOutputs(aiOutputs);
  const activeSubject = subjects.find((s) => s.id === activeSubjectId);

  const loadSubjectState = useCallback(async (subjectId: string) => {
    skipNextSave.current = true;
    setPersistStatus("loading");
    const res = await fetch(`/api/report-state?subjectId=${encodeURIComponent(subjectId)}`);
    const payload = (await res.json()) as {
      state?: {
        userInput: UserInputState["input"];
        compareModels?: string[];
        aiOutputs: AiOutputsMap;
        displayName?: string;
        updatedAt: string;
      };
      error?: string;
    };
    if (!res.ok || !payload.state) {
      setPersistStatus("error");
      setPersistMessage(payload.error ?? "無法載入命主資料");
      skipNextSave.current = false;
      return;
    }
    applyLoadedState(payload.state, {
      setUserState,
      setCompareModels,
      setAiOutputs,
      setPersistMessage,
    });
    setPersistStatus("ready");
    skipNextSave.current = false;
  }, []);

  const refreshSubjects = useCallback(async () => {
    const res = await fetch("/api/subjects");
    const payload = (await res.json()) as {
      subjects?: SubjectSummary[];
      storageMode?: string;
      error?: string;
    };
    if (!res.ok) throw new Error(payload.error ?? "無法載入命主列表");
    if (payload.storageMode) setStorageMode(payload.storageMode);
    return payload.subjects ?? [];
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await refreshSubjects();
        if (cancelled) return;
        setSubjects(list);

        const stored =
          typeof window !== "undefined"
            ? localStorage.getItem(ACTIVE_SUBJECT_KEY)
            : null;
        const initialId =
          stored && list.some((s) => s.id === stored) ? stored : list[0]?.id;

        if (!initialId) {
          setPersistStatus("error");
          setPersistMessage("沒有命主資料");
          return;
        }

        setActiveSubjectId(initialId);
        await loadSubjectState(initialId);
      } catch (e) {
        if (!cancelled) {
          setPersistStatus("error");
          setPersistMessage(e instanceof Error ? e.message : "載入失敗");
          skipNextSave.current = false;
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadSubjectState, refreshSubjects]);

  useEffect(() => {
    if (!activeSubjectId || persistStatus === "loading" || skipNextSave.current) {
      return;
    }

    setPersistStatus("saving");
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/report-state?subjectId=${encodeURIComponent(activeSubjectId)}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              compareModels: sanitizeCompareModels(compareModels),
              aiOutputs,
            }),
          },
        );
        const payload = (await res.json()) as {
          error?: string;
          state?: { updatedAt: string; displayName?: string };
        };
        if (!res.ok) {
          setPersistStatus("error");
          setPersistMessage(payload.error ?? "儲存失敗");
          return;
        }
        setPersistStatus("saved");
        const label = payload.state?.displayName ?? activeSubject?.displayName ?? "命主";
        setPersistMessage(
          payload.state?.updatedAt
            ? `「${label}」已儲存 · ${new Date(payload.state.updatedAt).toLocaleTimeString("zh-TW")}`
            : "已儲存",
        );
        const list = await refreshSubjects();
        setSubjects(list);
      } catch (e) {
        setPersistStatus("error");
        setPersistMessage(e instanceof Error ? e.message : "儲存失敗");
      }
    }, 700);

    return () => window.clearTimeout(timer);
  }, [activeSubjectId, activeSubject?.displayName, aiOutputs, compareModels, refreshSubjects]);

  const handleSelectSubject = useCallback(
    async (id: string) => {
      if (id === activeSubjectId) return;
      setActiveSubjectId(id);
      if (typeof window !== "undefined") {
        localStorage.setItem(ACTIVE_SUBJECT_KEY, id);
      }
      await loadSubjectState(id);
    },
    [activeSubjectId, loadSubjectState],
  );

  const openCreateModal = () => {
    setModalDraft(createEmptyUserState());
    setSubjectModal({ mode: "create" });
  };

  const openEditModal = useCallback(
    async (id: string) => {
      setModalSaving(true);
      try {
        const res = await fetch(`/api/report-state?subjectId=${encodeURIComponent(id)}`);
        const payload = (await res.json()) as {
          state?: { userInput: UserInputState["input"] };
          error?: string;
        };
        if (!res.ok || !payload.state) {
          setPersistMessage(payload.error ?? "無法載入命主");
          return;
        }
        setModalDraft(userStateFromPersistedInput(payload.state.userInput));
        setSubjectModal({ mode: "edit", subjectId: id });
      } finally {
        setModalSaving(false);
      }
    },
    [],
  );

  const handleModalSave = useCallback(
    async (draft: UserInputState) => {
      if (!subjectModal || draft.error || !draft.input.name.trim()) return;

      setModalSaving(true);
      skipNextSave.current = true;

      try {
        if (subjectModal.mode === "create") {
          const res = await fetch("/api/subjects", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              displayName: draft.input.name.trim(),
              userInput: draft.input,
            }),
          });
          const payload = (await res.json()) as {
            state?: {
              sessionId: string;
              userInput: UserInputState["input"];
              compareModels?: string[];
              aiOutputs: AiOutputsMap;
              displayName?: string;
              updatedAt: string;
            };
            subjects?: SubjectSummary[];
            error?: string;
          };
          if (!res.ok || !payload.state) {
            setPersistMessage(payload.error ?? "新增失敗");
            return;
          }
          setSubjects(payload.subjects ?? []);
          setActiveSubjectId(payload.state.sessionId);
          if (typeof window !== "undefined") {
            localStorage.setItem(ACTIVE_SUBJECT_KEY, payload.state.sessionId);
          }
          applyLoadedState(payload.state, {
            setUserState,
            setCompareModels,
            setAiOutputs,
            setPersistMessage,
          });
        } else {
          const res = await fetch(
            `/api/report-state?subjectId=${encodeURIComponent(subjectModal.subjectId)}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                displayName: draft.input.name.trim(),
                userInput: draft.input,
              }),
            },
          );
          const payload = (await res.json()) as {
            state?: {
              sessionId: string;
              userInput: UserInputState["input"];
              compareModels?: string[];
              aiOutputs: AiOutputsMap;
              displayName?: string;
              updatedAt: string;
            };
            error?: string;
          };
          if (!res.ok || !payload.state) {
            setPersistMessage(payload.error ?? "儲存失敗");
            return;
          }
          const list = await refreshSubjects();
          setSubjects(list);
          if (subjectModal.subjectId === activeSubjectId) {
            applyLoadedState(payload.state, {
              setUserState,
              setCompareModels,
              setAiOutputs,
              setPersistMessage,
            });
          } else {
            setPersistMessage(`已更新「${payload.state.displayName}」`);
            setPersistStatus("saved");
          }
        }
        setSubjectModal(null);
        setPersistStatus("saved");
      } catch (e) {
        setPersistMessage(e instanceof Error ? e.message : "儲存失敗");
        setPersistStatus("error");
      } finally {
        setModalSaving(false);
        skipNextSave.current = false;
      }
    },
    [subjectModal, activeSubjectId, refreshSubjects],
  );

  const handleDeleteSubject = useCallback(
    async (id: string) => {
      skipNextSave.current = true;
      setPersistStatus("loading");
      const res = await fetch(`/api/subjects?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const payload = (await res.json()) as {
        subjects?: SubjectSummary[];
        state?: {
          sessionId: string;
          userInput: UserInputState["input"];
          compareModels?: string[];
          aiOutputs: AiOutputsMap;
          displayName?: string;
          updatedAt: string;
        };
        error?: string;
      };
      if (!res.ok || !payload.state) {
        setPersistStatus("error");
        setPersistMessage(payload.error ?? "刪除失敗");
        skipNextSave.current = false;
        return;
      }
      setSubjects(payload.subjects ?? []);
      setActiveSubjectId(payload.state.sessionId);
      if (typeof window !== "undefined") {
        localStorage.setItem(ACTIVE_SUBJECT_KEY, payload.state.sessionId);
      }
      applyLoadedState(payload.state, {
        setUserState,
        setCompareModels,
        setAiOutputs,
        setPersistMessage,
      });
      setPersistStatus("ready");
      skipNextSave.current = false;
    },
    [],
  );

  const handleCompareModelsChange = (models: string[]) => {
    setCompareModels(sanitizeCompareModels(models));
  };

  const handleOutputSaved = useCallback(
    (
      entryKey: string,
      modelId: string,
      payload: { text: string; model?: string },
    ) => {
      setAiOutputs((prev) => ({
        ...prev,
        [entryKey]: {
          ...(prev[entryKey] ?? {}),
          [modelId]: {
            text: payload.text,
            model: payload.model ?? modelId,
            updatedAt: new Date().toISOString(),
          },
        },
      }));
    },
    [],
  );

  const persistChipClass =
    persistStatus === "error"
      ? `${styles.metaChip} ${styles.metaChipError}`
      : persistStatus === "saving"
        ? `${styles.metaChip} ${styles.metaChipSaving}`
        : styles.metaChip;

  const subjectBusy = persistStatus === "loading";
  const editingSubject = subjects.find(
    (s) => subjectModal?.mode === "edit" && s.id === subjectModal.subjectId,
  );

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.subtitle}>
              {subtitle ?? data.metadata.source}
            </p>
          </div>
          <div className={styles.headerNav}>
            <a href="/" className={styles.homeLink}>
              ← Home
            </a>
            {secondaryNavHref && secondaryNavLabel && (
              <a href={secondaryNavHref} className={styles.homeLink}>
                {secondaryNavLabel}
              </a>
            )}
          </div>
        </div>
        <div className={styles.metaRow}>
          <span className={styles.metaChip}>{data.metadata.total_entries} entries</span>
          {activeSubject && (
            <span className={styles.metaChip}>使用中：{activeSubject.displayName}</span>
          )}
          <span className={styles.metaChip}>
            Static {byType.static} · Computed {byType.computed} · AI {byType.ai}
          </span>
          <span className={persistChipClass} title={persistMessage}>
            {persistStatus === "loading" && "載入資料庫…"}
            {persistStatus === "saving" && "儲存中…"}
            {persistStatus === "saved" && persistMessage}
            {persistStatus === "ready" && persistMessage}
            {persistStatus === "error" && persistMessage}
            {generatedCount > 0 && ` · ${generatedCount} 則生成已存`}
          </span>
        </div>
      </header>

      <SubjectCards
        subjects={subjects}
        activeId={activeSubjectId}
        storageMode={storageMode}
        disabled={subjectBusy || modalSaving}
        onSelect={(id) => void handleSelectSubject(id)}
        onAdd={openCreateModal}
        onEdit={(id) => void openEditModal(id)}
        onDelete={(id) => void handleDeleteSubject(id)}
      />

      {activeSubject && userState.chart && (
        <div className={styles.activeSubjectSummary}>
          <p>
            <strong>{activeSubject.displayName}</strong>
            {" · "}
            {userState.chart.fourPillars}
            {" · "}
            日主 {userState.chart.dayMaster}
          </p>
          <button
            type="button"
            className={styles.activeSubjectEditLink}
            onClick={() => void openEditModal(activeSubject.id)}
          >
            編輯命主資料
          </button>
        </div>
      )}

      <SubjectFormModal
        open={subjectModal !== null}
        mode={subjectModal?.mode ?? "create"}
        title={
          subjectModal?.mode === "create"
            ? "新增命主"
            : `編輯 · ${editingSubject?.displayName ?? "命主"}`
        }
        initialState={modalDraft}
        saving={modalSaving}
        onClose={() => !modalSaving && setSubjectModal(null)}
        onSave={(draft) => void handleModalSave(draft)}
      />

      <div className={styles.toolbar}>
        {showPageFilter && (
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Page</span>
            <select
              className={styles.pageSelect}
              value={pageFilter === "all" ? "all" : String(pageFilter)}
              onChange={(e) => {
                const v = e.target.value;
                setPageFilter(v === "all" ? "all" : Number(v));
              }}
            >
              <option value="all">All pages (1–20)</option>
              {pageNumbers.map((p) => (
                <option key={p} value={p}>
                  Page {p}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Type</span>
          <div className={styles.typePills}>
            {CONTENT_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                className={pillClass(type, activeTypes.has(type))}
                onClick={() => toggleType(type)}
              >
                {TYPE_LABELS[type]} ({byType[type]})
              </button>
            ))}
          </div>
        </div>

        <ModelCompareBar
          compareModels={compareModels}
          onChange={handleCompareModelsChange}
        />

        <p className={styles.resultCount}>
          Showing {filtered.length} of {data.entries.length}
        </p>
      </div>

      <div className={styles.listWide}>
        {filtered.length === 0 ? (
          <p className={styles.empty}>No entries match the current filters.</p>
        ) : subjectBusy ? (
          <p className={styles.empty}>載入命主資料中…</p>
        ) : !activeSubjectId ? (
          <p className={styles.empty}>請選擇或新增一位命主。</p>
        ) : (
          filtered.map((entry) =>
            entry.type === "ai" && entry.prompt ? (
              <AiEntryCard
                key={`${activeSubjectId}-${entry.page}-${entry.display_order}-ai`}
                entry={entry}
                variables={userState.variables}
                formError={userState.error}
                cardClass={cardClass(entry.type)}
                badgeClass={badgeClass(entry.type)}
                compareModels={compareModels}
                entryOutputs={aiOutputs[aiOutputKey(entry.page, entry.display_order)]}
                onOutputSaved={handleOutputSaved}
              />
            ) : (
              <StaticEntryCard
                key={`${entry.page}-${entry.display_order}-${entry.type}`}
                entry={entry}
              />
            ),
          )
        )}
      </div>
    </div>
  );
}
