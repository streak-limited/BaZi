"use client";

import ChartWheel, { formatPlanetLine } from "@/app/astrology/ChartWheel";
import CitySearch, { defaultBirthPlace } from "@/app/astrology/CitySearch";
import SubjectCards from "@/app/bazi/report/SubjectCards";
import PageHeader from "@/components/PageHeader";
import type { StoredChartSummary } from "@/lib/astrology/chart-types";
import type {
  BirthPlace,
  NatalChart,
  NatalFocusPlanet,
  SynastryAspect,
  SynastryChart,
  TransitChart,
} from "@/lib/astrology/types";
import { DEFAULT_COMPARE_MODELS } from "@/lib/gemini-models";
import type { PersistedReportState, SubjectSummary } from "@/lib/report-storage-types";
import { ACTIVE_SUBJECT_KEY } from "@/lib/subject-session";
import type { UserFormInput } from "@/lib/user-input";
import { useCallback, useEffect, useState } from "react";
import styles from "./astrology.module.css";

type Tab = "natal" | "synastry" | "transits";

const NATAL_FOCUS: NatalFocusPlanet[] = [
  "Sun",
  "Moon",
  "Ascendant",
  "Venus",
  "Mars",
];

const CORE_PLANETS = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"];

export default function AstrologyClient() {
  const [tab, setTab] = useState<Tab>("natal");
  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);
  const [partnerSubjectId, setPartnerSubjectId] = useState<string | null>(null);
  const [input, setInput] = useState<UserFormInput | null>(null);
  const [inputB, setInputB] = useState<UserFormInput | null>(null);
  const [place, setPlace] = useState<BirthPlace>(defaultBirthPlace);
  const [placeB, setPlaceB] = useState<BirthPlace>(defaultBirthPlace);
  const [coupleType, setCoupleType] = useState<"Love" | "Work">("Love");
  const [roleHint, setRoleHint] = useState("");
  const [chartHistory, setChartHistory] = useState<StoredChartSummary[]>([]);
  const [lastSavedId, setLastSavedId] = useState<string | null>(null);

  const [natalChart, setNatalChart] = useState<NatalChart | null>(null);
  const [synastry, setSynastry] = useState<SynastryChart | null>(null);
  const [transits, setTransits] = useState<TransitChart | null>(null);

  const [selectedPlanet, setSelectedPlanet] = useState<string | null>("Sun");
  const [selectedAspect, setSelectedAspect] = useState<SynastryAspect | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [computing, setComputing] = useState(false);
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [model] = useState(DEFAULT_COMPARE_MODELS[0]);

  const loadSubjects = useCallback(async () => {
    const res = await fetch("/api/subjects");
    const data = await res.json();
    if (data.subjects?.length) {
      setSubjects(data.subjects);
      const stored = localStorage.getItem(ACTIVE_SUBJECT_KEY);
      const id =
        stored && data.subjects.some((s: SubjectSummary) => s.id === stored)
          ? stored
          : data.subjects[0].id;
      setActiveSubjectId(id);
    }
  }, []);

  const loadSubject = useCallback(async (subjectId: string) => {
    setError(null);
    const res = await fetch(
      `/api/report-state?subjectId=${encodeURIComponent(subjectId)}`,
    );
    const data = await res.json();
    const state = data.state as PersistedReportState | null;
    if (!state?.userInput) {
      setError("找不到命主資料");
      return;
    }
    setInput(state.userInput);
    localStorage.setItem(ACTIVE_SUBJECT_KEY, subjectId);
  }, []);

  const loadPartner = useCallback(
    async (subjectId: string) => {
      const res = await fetch(
        `/api/report-state?subjectId=${encodeURIComponent(subjectId)}`,
      );
      const data = await res.json();
      const state = data.state as PersistedReportState | null;
      if (state?.userInput) setInputB(state.userInput);
    },
    [],
  );

  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  useEffect(() => {
    if (activeSubjectId) loadSubject(activeSubjectId);
  }, [activeSubjectId, loadSubject]);

  useEffect(() => {
    if (partnerSubjectId) loadPartner(partnerSubjectId);
  }, [partnerSubjectId, loadPartner]);

  const loadChartHistory = useCallback(async (subjectId: string) => {
    try {
      const res = await fetch(
        `/api/astrology/charts?subjectId=${encodeURIComponent(subjectId)}`,
      );
      const data = await res.json();
      setChartHistory(data.charts ?? []);
    } catch {
      setChartHistory([]);
    }
  }, []);

  useEffect(() => {
    if (activeSubjectId) void loadChartHistory(activeSubjectId);
  }, [activeSubjectId, loadChartHistory]);

  const loadSavedChart = async (chartId: string) => {
    setError(null);
    try {
      const res = await fetch(
        `/api/astrology/charts?id=${encodeURIComponent(chartId)}`,
      );
      const data = await res.json();
      const stored = data.chart as {
        mode: Tab;
        chartJson: NatalChart | SynastryChart | TransitChart;
        birthPlace: BirthPlace;
        birthPlaceB?: BirthPlace;
        coupleType?: string;
      };
      if (!stored) throw new Error("找不到紀錄");

      setTab(stored.mode);
      setPlace(stored.birthPlace);
      if (stored.birthPlaceB) setPlaceB(stored.birthPlaceB);
      if (stored.coupleType === "Work" || stored.coupleType === "Love") {
        setCoupleType(stored.coupleType);
      }

      if (stored.mode === "natal") {
        setNatalChart(stored.chartJson as NatalChart);
        setSynastry(null);
        setTransits(null);
      } else if (stored.mode === "synastry") {
        setSynastry(stored.chartJson as SynastryChart);
        setNatalChart(null);
        setTransits(null);
      } else {
        setTransits(stored.chartJson as TransitChart);
        setNatalChart(null);
        setSynastry(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "載入失敗");
    }
  };

  const modeLabel = (m: string) =>
    m === "natal" ? "本命" : m === "synastry" ? "合盤" : "行運";

  const runCompute = async () => {
    if (!input) return;
    setComputing(true);
    setError(null);
    setAiText("");
    setNatalChart(null);
    setSynastry(null);
    setTransits(null);
    try {
      const body: Record<string, unknown> = {
        mode: tab,
        input,
        place,
        subjectId: activeSubjectId ?? undefined,
        partnerSubjectId: partnerSubjectId ?? undefined,
        saveToDb: true,
      };
      if (tab === "synastry") {
        if (!inputB) throw new Error("請選擇合盤對象（命主 B）");
        body.inputB = inputB;
        body.placeB = placeB;
        body.coupleType = coupleType;
      }
      const res = await fetch("/api/astrology/compute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error ?? "星盤計算失敗");

      if (tab === "natal" && payload.chart) {
        setNatalChart(payload.chart as NatalChart);
      } else if (tab === "synastry" && payload.synastry) {
        setSynastry(payload.synastry as SynastryChart);
      } else if (tab === "transits" && payload.transits) {
        setTransits(payload.transits as TransitChart);
      }
      if (payload.savedChartId) {
        setLastSavedId(payload.savedChartId as string);
        if (activeSubjectId) void loadChartHistory(activeSubjectId);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "星盤計算失敗");
    } finally {
      setComputing(false);
    }
  };

  const runInterpret = async (opts?: {
    focus?: NatalFocusPlanet;
    aspect?: SynastryAspect;
  }) => {
    setAiLoading(true);
    setError(null);
    try {
      const body: Record<string, unknown> = { model };
      if (tab === "natal" && natalChart) {
        body.mode = "natal";
        body.chart = natalChart;
        const focus =
          opts?.focus ??
          (selectedPlanet === "Ascendant"
            ? "Ascendant"
            : (selectedPlanet as NatalFocusPlanet | null)) ??
          "Sun";
        body.focus = focus;
        body.name = input?.name;
      } else if (tab === "synastry" && synastry) {
        if (opts?.aspect) {
          body.mode = "aspect";
          body.aspect = opts.aspect;
          body.synastry = synastry;
        } else {
          body.mode = "synastry";
          body.synastry = synastry;
          body.roleHint = roleHint;
        }
      } else if (tab === "transits" && transits) {
        body.mode = "transits";
        body.transits = transits;
        body.name = input?.name;
      } else {
        throw new Error("請先計算星盤");
      }

      const res = await fetch("/api/astrology/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error ?? "AI 解讀失敗");
      setAiText(payload.text ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI 解讀失敗");
    } finally {
      setAiLoading(false);
    }
  };

  const partnerOptions = subjects.filter((s) => s.id !== activeSubjectId);

  return (
    <div className={styles.page}>
      <PageHeader
        title="西洋星盤"
        subtitle="pyswisseph 精算 · 廣東話 AI 解讀 · 沿用命主資料"
      />
      <main className={styles.main}>
        <SubjectCards
          subjects={subjects}
          activeId={activeSubjectId}
          onSelect={setActiveSubjectId}
          onAdd={() => {
            window.location.href = "/bazi/report";
          }}
          onEdit={() => {
            window.location.href = "/bazi/report";
          }}
          onDelete={async (id) => {
            await fetch(`/api/subjects?id=${encodeURIComponent(id)}`, {
              method: "DELETE",
            });
            await loadSubjects();
          }}
        />

        <div className={styles.tabs}>
          {(
            [
              ["natal", "個人解碼"],
              ["synastry", "雙人合盤"],
              ["transits", "流年行運"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={tab === id ? styles.tabActive : styles.tab}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className={styles.panel}>
          <CitySearch
            label="出生城市（Geocoding · 調整上升與宮位）"
            value={place}
            onChange={setPlace}
          />

          {chartHistory.length > 0 && (
            <>
              <p className={styles.label}>已儲存星盤（資料庫）</p>
              <div className={styles.historyList}>
                {chartHistory.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    className={styles.historyItem}
                    onClick={() => loadSavedChart(h.id)}
                  >
                    {modeLabel(h.mode)} · {h.birthPlaceLabel} ·{" "}
                    {new Date(h.createdAt).toLocaleString("zh-Hant")}
                    {h.id === lastSavedId && (
                      <span className={styles.savedBadge}>剛儲存</span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}

          {tab === "synastry" && (
            <>
              <p className={styles.label}>合盤對象（命主 B）</p>
              <select
                className={styles.select}
                value={partnerSubjectId ?? ""}
                onChange={(e) =>
                  setPartnerSubjectId(e.target.value || null)
                }
              >
                <option value="">— 請選擇 —</option>
                {partnerOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.displayName}
                  </option>
                ))}
              </select>
              <CitySearch
                label="出生城市 B"
                value={placeB}
                onChange={setPlaceB}
              />
              <p className={styles.label}>合盤模式</p>
              <div className={styles.row}>
                <button
                  type="button"
                  className={
                    coupleType === "Love" ? styles.chipActive : styles.chip
                  }
                  onClick={() => setCoupleType("Love")}
                >
                  戀愛
                </button>
                <button
                  type="button"
                  className={
                    coupleType === "Work" ? styles.chipActive : styles.chip
                  }
                  onClick={() => setCoupleType("Work")}
                >
                  職場
                </button>
              </div>
              <input
                className={styles.select}
                placeholder="情境補充（例：A 是下屬，B 是上司）"
                value={roleHint}
                onChange={(e) => setRoleHint(e.target.value)}
              />
            </>
          )}

          <button
            type="button"
            className={styles.btn}
            disabled={computing || !input || (tab === "synastry" && !inputB)}
            onClick={runCompute}
          >
            {computing ? "Swiss Ephemeris 計算中…" : "計算星盤"}
          </button>
          <p className={styles.hint}>
            引擎：
            <a
              href="https://github.com/astrorigin/pyswisseph"
              target="_blank"
              rel="noreferrer"
            >
              pyswisseph
            </a>
            （熱帶黃道 · Placidus 宮位）。            若出現 No module named swisseph，請執行：
            <code>npm run setup:astrology</code>
            後重啟 dev server
          </p>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {tab === "natal" && natalChart && (
          <div className={styles.panel}>
            <ChartWheel
              chart={natalChart}
              selected={selectedPlanet}
              onSelectPlanet={setSelectedPlanet}
            />
            <div className={styles.planetBar}>
              {CORE_PLANETS.map((name) => (
                <button
                  key={name}
                  type="button"
                  className={
                    selectedPlanet === name
                      ? styles.planetBtnActive
                      : styles.planetBtn
                  }
                  onClick={() => setSelectedPlanet(name)}
                >
                  {name}
                </button>
              ))}
              <button
                type="button"
                className={
                  selectedPlanet === "Ascendant"
                    ? styles.planetBtnActive
                    : styles.planetBtn
                }
                onClick={() => setSelectedPlanet("Ascendant")}
              >
                上升
              </button>
            </div>
            {selectedPlanet && selectedPlanet !== "Ascendant" && natalChart.planets[selectedPlanet] && (
              <p className={styles.hint}>
                {formatPlanetLine(
                  natalChart.planets[selectedPlanet],
                  selectedPlanet,
                )}
              </p>
            )}
            {selectedPlanet === "Ascendant" && (
              <p className={styles.hint}>
                上升 · {natalChart.ascendant.zodiac_zh}{" "}
                {natalChart.ascendant.deg.toFixed(1)}°
              </p>
            )}
            <button
              type="button"
              className={styles.btn}
              disabled={aiLoading}
              onClick={() => runInterpret()}
            >
              {aiLoading ? "AI 解碼中…" : "AI 三體人格解讀"}
            </button>
            <div className={styles.row}>
              {NATAL_FOCUS.map((f) => (
                <button
                  key={f}
                  type="button"
                  className={styles.chip}
                  disabled={aiLoading}
                  onClick={() => runInterpret({ focus: f })}
                >
                  解讀 {f === "Ascendant" ? "上升" : f}
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === "synastry" && synastry && (
          <div className={styles.panel}>
            <div className={styles.summaryGrid}>
              <div className={styles.stat}>
                <div>{synastry.summary.total}</div>
                <div className={styles.hint}>相位</div>
              </div>
              <div className={styles.stat}>
                <div>{synastry.summary.harmonious}</div>
                <div className={styles.hint}>順暢</div>
              </div>
              <div className={styles.stat}>
                <div>{synastry.summary.tense}</div>
                <div className={styles.hint}>雷區</div>
              </div>
            </div>
            <ChartWheel chart={synastry.chart_a} />
            <p className={styles.hint} style={{ textAlign: "center" }}>
              A · {synastry.chart_a.birth.label || "命主 A"}
            </p>
            <ChartWheel chart={synastry.chart_b} />
            <p className={styles.hint} style={{ textAlign: "center" }}>
              B · {synastry.chart_b.birth.label || "命主 B"}
            </p>
            <button
              type="button"
              className={styles.btn}
              disabled={aiLoading}
              onClick={() => runInterpret()}
            >
              {aiLoading ? "AI 分析中…" : "AI 合盤總分析"}
            </button>
            <p className={styles.label}>點擊相位線 · 生存攻略</p>
            <div className={styles.aspectList}>
              {synastry.aspects.slice(0, 24).map((a, i) => {
                const tense = a.type_zh === "刑克" || a.type_zh === "對分";
                return (
                  <button
                    key={`${a.from}-${a.to}-${i}`}
                    type="button"
                    className={tense ? styles.aspectItemTense : styles.aspectItem}
                    onClick={() => {
                      setSelectedAspect(a);
                      runInterpret({ aspect: a });
                    }}
                  >
                    <strong>{a.from_label}</strong> {a.type_zh}{" "}
                    <strong>{a.to_label}</strong>
                    <br />
                    <span className={styles.hint}>{a.meaning}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {tab === "transits" && transits && (
          <div className={styles.panel}>
            <p className={styles.label}>
              宇宙天氣 · {transits.current_date}
              {transits.highlights.mercury_retrograde && " · 水星逆行中"}
            </p>
            <div className={styles.aspectList}>
              {transits.active_transits.slice(0, 12).map((t, i) => (
                <div key={i} className={styles.aspectItem}>
                  {t.meaning}
                </div>
              ))}
            </div>
            <button
              type="button"
              className={styles.btn}
              disabled={aiLoading}
              onClick={() => runInterpret()}
            >
              {aiLoading ? "AI 撰寫中…" : "AI 宇宙天氣預報（廣東話）"}
            </button>
          </div>
        )}

        {(aiText || aiLoading) && (
          <div
            className={`${styles.aiBox} ${aiLoading ? styles.aiTyping : ""}`}
          >
            {aiLoading && !aiText ? "範山道令正在解讀星盤…" : aiText}
          </div>
        )}

        {(natalChart || synastry || transits) && (
          <button
            type="button"
            className={styles.jsonToggle}
            onClick={() => setShowJson((v) => !v)}
          >
            {showJson ? "隱藏" : "顯示"} 原始 JSON（給工程師）
          </button>
        )}
        {showJson && (
          <pre className={styles.jsonPre}>
            {JSON.stringify(
              natalChart ?? synastry ?? transits,
              null,
              2,
            )}
          </pre>
        )}
      </main>
    </div>
  );
}
