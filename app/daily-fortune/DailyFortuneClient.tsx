"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import SubjectCards from "@/app/bazi/report/SubjectCards";
import PageHeader from "@/components/PageHeader";
import {
  DEFAULT_COMPARE_MODELS,
  GEMINI_COMPARE_MODELS,
} from "@/lib/gemini-models";
import {
  loadCachedGuide,
  saveCachedGuide,
} from "@/lib/daily-fortune/client-cache";
import type { DailyFortuneComputed } from "@/lib/daily-fortune/types";
import type { PersistedReportState, SubjectSummary } from "@/lib/report-storage-types";
import { ACTIVE_SUBJECT_KEY } from "@/lib/subject-session";
import type { UserFormInput } from "@/lib/user-input";
import styles from "./daily-fortune.module.css";

function badgeClass(kind: DailyFortuneComputed["wuxing"]["kind"]): string {
  switch (kind) {
    case "great":
      return `${styles.badge} ${styles.badgeGreat}`;
    case "good":
      return `${styles.badge} ${styles.badgeGood}`;
    case "clash":
      return `${styles.badge} ${styles.badgeClash}`;
    default:
      return `${styles.badge} ${styles.badgeNeutral}`;
  }
}

type LoadStatus = "loading" | "ready" | "error";

export default function DailyFortuneClient() {
  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [input, setInput] = useState<UserFormInput | null>(null);
  const [storageMode, setStorageMode] = useState("");
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("loading");
  const [loadMessage, setLoadMessage] = useState("");

  const [computed, setComputed] = useState<DailyFortuneComputed | null>(null);
  const [aiText, setAiText] = useState("");
  const [aiModel, setAiModel] = useState("");
  const [model, setModel] = useState(DEFAULT_COMPARE_MODELS[0]);
  const [error, setError] = useState<string | null>(null);
  const [computing, setComputing] = useState(false);
  const [guiding, setGuiding] = useState(false);
  const [fromCache, setFromCache] = useState(false);

  const activeSubject = subjects.find((s) => s.id === activeSubjectId);

  const runCompute = useCallback(
    async (userInput: UserFormInput, subjectId: string) => {
      setError(null);
      setComputing(true);
      setAiText("");
      setFromCache(false);
      try {
        const res = await fetch("/api/daily-fortune/compute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: userInput }),
        });
        const payload = (await res.json()) as {
          computed?: DailyFortuneComputed;
          error?: string;
        };
        if (!res.ok || !payload.computed) {
          throw new Error(payload.error ?? "運程計算失敗");
        }
        setComputed(payload.computed);
        const cached = loadCachedGuide(subjectId, payload.computed.dateKey);
        if (cached) {
          setAiText(cached.text);
          setAiModel(cached.model);
          setFromCache(true);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "運程計算失敗");
        setComputed(null);
      } finally {
        setComputing(false);
      }
    },
    [],
  );

  const loadSubject = useCallback(
    async (subjectId: string) => {
      setLoadStatus("loading");
      setError(null);
      setComputed(null);
      setAiText("");
      try {
        const res = await fetch(
          `/api/report-state?subjectId=${encodeURIComponent(subjectId)}`,
        );
        const payload = (await res.json()) as {
          state?: PersistedReportState;
          error?: string;
        };
        if (!res.ok || !payload.state) {
          throw new Error(payload.error ?? "無法載入命主資料");
        }
        const { state } = payload;
        if (!state.userInput.birthDate?.trim()) {
          throw new Error("此命主尚未填寫出生日期，請先到報告頁編輯。");
        }
        setActiveSubjectId(subjectId);
        setDisplayName(state.displayName || state.userInput.name || "命主");
        setInput(state.userInput);
        localStorage.setItem(ACTIVE_SUBJECT_KEY, subjectId);
        setLoadStatus("ready");
        await runCompute(state.userInput, subjectId);
      } catch (e) {
        setLoadStatus("error");
        setLoadMessage(e instanceof Error ? e.message : "載入失敗");
      }
    },
    [runCompute],
  );

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
        const stored = localStorage.getItem(ACTIVE_SUBJECT_KEY);
        const initialId =
          stored && list.some((s) => s.id === stored) ? stored : list[0]?.id;
        if (!initialId) {
          setLoadStatus("error");
          setLoadMessage("沒有命主資料，請先到報告頁新增命主。");
          return;
        }
        await loadSubject(initialId);
      } catch (e) {
        if (!cancelled) {
          setLoadStatus("error");
          setLoadMessage(e instanceof Error ? e.message : "載入失敗");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadSubject, refreshSubjects]);

  const runGuide = useCallback(
    async (force = false) => {
      if (!computed || !input || !activeSubjectId) return;
      if (!force) {
        const cached = loadCachedGuide(activeSubjectId, computed.dateKey);
        if (cached) {
          setAiText(cached.text);
          setAiModel(cached.model);
          setFromCache(true);
          return;
        }
      }
      setError(null);
      setGuiding(true);
      setFromCache(false);
      try {
        const res = await fetch("/api/daily-fortune/guide", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            input,
            computed,
            subjectId: activeSubjectId,
            model,
            skipCache: force,
          }),
        });
        const payload = (await res.json()) as {
          text?: string;
          model?: string;
          cached?: boolean;
          error?: string;
        };
        if (!res.ok || !payload.text) {
          throw new Error(payload.error ?? "AI 生成失敗");
        }
        setAiText(payload.text);
        setAiModel(payload.model ?? model);
        setFromCache(Boolean(payload.cached));
        saveCachedGuide({
          subjectId: activeSubjectId,
          dateKey: computed.dateKey,
          text: payload.text,
          model: payload.model ?? model,
          computed,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "AI 生成失敗");
      } finally {
        setGuiding(false);
      }
    },
    [computed, input, activeSubjectId, model],
  );

  const busy = computing || guiding || loadStatus === "loading";

  return (
    <div className={styles.page}>
      <PageHeader
        title="每日開運運程"
        subtitle="沿用八字報告命主資料，結合五行、生肖、星座與生命靈數"
        secondaryHref="/bazi/report"
        secondaryLabel="編輯命主 →"
      />

      <main className={styles.main}>
        <SubjectCards
          subjects={subjects}
          activeId={activeSubjectId}
          storageMode={storageMode}
          disabled={busy}
          onSelect={(id) => void loadSubject(id)}
          onAdd={() => {
            window.location.href = "/bazi/report";
          }}
          onEdit={() => {
            window.location.href = "/bazi/report";
          }}
          onDelete={async (id) => {
            const res = await fetch(`/api/subjects?id=${encodeURIComponent(id)}`, {
              method: "DELETE",
            });
            const payload = (await res.json()) as {
              subjects?: SubjectSummary[];
              state?: PersistedReportState;
              error?: string;
            };
            if (!res.ok) {
              setError(payload.error ?? "刪除失敗");
              return;
            }
            setSubjects(payload.subjects ?? []);
            if (payload.state?.sessionId) {
              await loadSubject(payload.state.sessionId);
            } else if (payload.subjects?.[0]) {
              await loadSubject(payload.subjects[0].id);
            }
          }}
        />

        {loadStatus === "error" && (
          <section className={styles.card}>
            <p className={styles.error}>{loadMessage}</p>
            <p className={styles.hint}>
              請到 <Link href="/bazi/report">八字完整報告</Link> 新增或編輯命主（8 項資料）。
            </p>
          </section>
        )}

        {loadStatus === "loading" && (
          <section className={styles.card}>
            <p className={styles.hint}>載入命主資料並計算今日運程…</p>
          </section>
        )}

        {loadStatus === "ready" && activeSubject && input && (
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>目前命主</h2>
            <p className={styles.subjectLine}>
              <strong>{displayName}</strong>
              {activeSubject.birthDate && (
                <span> · 出生 {activeSubject.birthDate}</span>
              )}
              {input.calendarType === "lunar" ? "（農曆）" : "（國曆）"}
              {!input.birthTimeUnknown && input.birthTime && (
                <span> · {input.birthTime}</span>
              )}
            </p>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => input && activeSubjectId && void runCompute(input, activeSubjectId)}
                disabled={busy}
              >
                {computing ? "計算中…" : "重新計算今日運程"}
              </button>
            </div>
          </section>
        )}

        {computed && loadStatus === "ready" && (
          <>
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>今日總覽</h2>
              <p className={styles.dateLine}>{computed.dateLabel}</p>
              <div className={styles.statGrid}>
                <div className={styles.stat}>
                  <div className={styles.statLabel}>生肖</div>
                  <div className={styles.statValue}>
                    屬{computed.zodiac}（{computed.zodiacElement}）
                  </div>
                </div>
                <div className={styles.stat}>
                  <div className={styles.statLabel}>星座</div>
                  <div className={styles.statValue}>{computed.constellation}</div>
                </div>
                <div className={styles.stat}>
                  <div className={styles.statLabel}>個人日靈數</div>
                  <div className={styles.statValue}>
                    {computed.numerology.personalDay} · 生命道路{" "}
                    {computed.numerology.lifePath}
                  </div>
                </div>
                <div className={styles.stat}>
                  <div className={styles.statLabel}>八字日主</div>
                  <div className={styles.statValue}>
                    {computed.bazi.dayMaster}（{computed.bazi.dayMasterElement}）
                  </div>
                </div>
              </div>
              <p className={styles.detail} style={{ marginTop: "0.85rem" }}>
                {computed.summary.energyLine}
              </p>
            </section>

            <section className={styles.card}>
              <h2 className={styles.cardTitle}>五行 · 生肖 × 今日日支</h2>
              <span className={badgeClass(computed.wuxing.kind)}>
                {computed.wuxing.label}
              </span>
              <p className={styles.detail}>{computed.wuxing.detail}</p>
              <div className={styles.colorRow}>
                {computed.wuxing.colors.map((c) => (
                  <span key={c} className={styles.colorChip}>
                    <span
                      className={styles.swatch}
                      style={{
                        background:
                          computed.summary.swatches.find((s) => s.name === c)
                            ?.hex ?? "#888",
                      }}
                    />
                    {c}
                  </span>
                ))}
              </div>
            </section>

            <section className={styles.card}>
              <h2 className={styles.cardTitle}>生命靈數 · 個人日</h2>
              <p className={styles.detail}>
                今日數字 <strong>{computed.numerology.personalDay}</strong>：
                {computed.numerology.meaning}。{computed.numerology.hint}
              </p>
              <div className={styles.colorRow}>
                {computed.numerology.colors.map((c) => (
                  <span key={c} className={styles.colorChip}>
                    {c}
                  </span>
                ))}
              </div>
            </section>

            <section className={styles.card}>
              <h2 className={styles.cardTitle}>八字參考</h2>
              <p className={styles.detail}>
                {computed.bazi.fourPillars} · 五行 {computed.bazi.fiveElements}
              </p>
              <p className={styles.detail}>
                有利：{computed.bazi.favorableElements} · 宜避：
                {computed.bazi.unfavorableElements}
              </p>
              <p className={styles.detail}>流年 {computed.bazi.currentYearStemBranch}</p>
            </section>

            <section className={styles.card}>
              <h2 className={styles.cardTitle}>今日開運色 · 吉時 · 留意</h2>
              <div className={styles.colorRow}>
                {computed.summary.swatches.map((s) => (
                  <span key={s.name} className={styles.colorChip}>
                    <span
                      className={styles.swatch}
                      style={{ background: s.hex }}
                    />
                    {s.name}
                  </span>
                ))}
              </div>
              <ul className={styles.list}>
                {computed.summary.luckyHours.map((h) => (
                  <li key={h}>吉時：{h}</li>
                ))}
                {computed.summary.cautions.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </section>

            <section className={styles.card}>
              <h2 className={styles.cardTitle}>AI 開運穿搭與行動暗示</h2>
              <div className={styles.generateRow}>
                <div>
                  <label className={styles.label} htmlFor="df-model">
                    模型
                  </label>
                  <select
                    id="df-model"
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
                  onClick={() => void runGuide(false)}
                  disabled={busy}
                >
                  {guiding ? "生成中…" : aiText ? "重新生成" : "生成 AI 指引"}
                </button>
                {aiText && (
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={() => void runGuide(true)}
                    disabled={busy}
                  >
                    強制更新
                  </button>
                )}
              </div>
              {aiText && (
                <>
                  <div className={styles.report} style={{ marginTop: "1rem" }}>
                    {aiText}
                  </div>
                  <p className={styles.hint}>
                    模型：{aiModel}
                    {fromCache ? " · 本機或伺服器快取" : ""}
                  </p>
                </>
              )}
            </section>
          </>
        )}

        {error && <p className={styles.error}>{error}</p>}
      </main>
    </div>
  );
}
