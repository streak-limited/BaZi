"use client";

import PageHeader from "@/components/PageHeader";
import ImmersionStep from "@/app/bazi/flow/ImmersionStep";
import InputWizard from "@/app/bazi/flow/InputWizard";
import PaidSuccessStep from "@/app/bazi/flow/PaidSuccessStep";
import PreReportView from "@/app/bazi/flow/PreReportView";
import { INPUT_STEPS } from "@/lib/bazi-flow/config";
import {
  BAZI_FLOW_DRAFT_KEY,
  type BaziFlowDraft,
  type BaziFlowStep,
  type PreReportPayload,
} from "@/lib/bazi-flow/types";
import { aiOutputKey } from "@/lib/report-storage-types";
import { ACTIVE_SUBJECT_KEY } from "@/lib/subject-session";
import { DEFAULT_USER_INPUT, type UserFormInput } from "@/lib/user-input";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import styles from "./bazi-flow.module.css";

interface BaziFlowClientProps {
  stripeEnabled?: boolean;
}

function loadDraft(): BaziFlowDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(BAZI_FLOW_DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as BaziFlowDraft;
  } catch {
    return null;
  }
}

function saveDraft(draft: BaziFlowDraft) {
  sessionStorage.setItem(BAZI_FLOW_DRAFT_KEY, JSON.stringify(draft));
}

export default function BaziFlowClient({ stripeEnabled: _stripeEnabled }: BaziFlowClientProps) {
  const searchParams = useSearchParams();
  const paidFromUrl = searchParams.get("paid") === "1";
  const demoPaid = searchParams.get("demo") === "1";

  const [step, setStep] = useState<BaziFlowStep>("immersion");
  const [input, setInput] = useState<UserFormInput>(DEFAULT_USER_INPUT);
  const [inputStepIndex, setInputStepIndex] = useState(0);
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [preReport, setPreReport] = useState<PreReportPayload | null>(null);
  const [publicToken, setPublicToken] = useState<string | null>(null);
  const [reportHubUrl, setReportHubUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [genStatus, setGenStatus] = useState("");

  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      setInput(draft.input);
      setInputStepIndex(draft.inputStepIndex);
      setSubjectId(draft.subjectId);
      setPreReport(draft.preReport);
      setPublicToken(draft.publicToken ?? null);
      setReportHubUrl(draft.reportHubUrl ?? null);
      if (!paidFromUrl && draft.step !== "paid") {
        setStep(draft.step);
      }
    }
    if (paidFromUrl) setStep("paid");
    if (searchParams.get("step") === "pre-report" && draft?.preReport) {
      setStep("pre-report");
    }
  }, [paidFromUrl, searchParams]);

  const persistDraft = useCallback(
    (patch: Partial<BaziFlowDraft>) => {
      const next: BaziFlowDraft = {
        step,
        input,
        inputStepIndex,
        subjectId,
        preReport,
        ...patch,
      };
      saveDraft(next);
    },
    [step, input, inputStepIndex, subjectId, preReport],
  );

  useEffect(() => {
    persistDraft({
      step,
      input,
      inputStepIndex,
      subjectId,
      preReport,
      publicToken,
      reportHubUrl,
    });
  }, [
    step,
    input,
    inputStepIndex,
    subjectId,
    preReport,
    publicToken,
    reportHubUrl,
    persistDraft,
  ]);

  const patchInput = (patch: Partial<UserFormInput>) => {
    setInput((prev) => ({ ...prev, ...patch }));
  };

  const runGenerate = async () => {
    setStep("generating");
    setError(null);
    setGenStatus("建立命主資料…");

    try {
      const subRes = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: input.name.trim() || input.birthDate,
          userInput: input,
        }),
      });
      const subData = await subRes.json();
      if (!subRes.ok) throw new Error(subData.error ?? "無法建立命主");

      const sid = subData.state?.sessionId as string | undefined;
      if (sid) {
        setSubjectId(sid);
        localStorage.setItem(ACTIVE_SUBJECT_KEY, sid);
      }

      setGenStatus("建立 Supabase trial…");
      let trialToken: string | null = null;
      const trialRes = await fetch("/api/trials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userInput: input,
          email: input.email,
          legacySubjectId: sid,
        }),
      });
      const trialData = await trialRes.json();
      if (trialRes.ok && trialData.trial?.publicToken) {
        trialToken = trialData.trial.publicToken as string;
        setPublicToken(trialToken);
        setReportHubUrl(trialData.urls?.hub ?? null);
      } else if (!trialRes.ok && trialRes.status !== 503) {
        throw new Error(trialData.error ?? "無法建立 trial");
      }

      setGenStatus("範山道令正在為你撰寫 pre-report（約 1–2 分鐘）…");

      const genRes = await fetch("/api/bazi-flow/generate-pre-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userInput: input,
          publicToken: trialToken ?? undefined,
        }),
      });
      const payload = await genRes.json();
      if (!genRes.ok) throw new Error(payload.error ?? "生成失敗");

      if (sid) {
        const aiOutputs: Record<
          string,
          Record<string, { text: string; updatedAt: string }>
        > = {};
        const now = new Date().toISOString();
        for (const e of payload.entries as PreReportPayload["entries"]) {
          if (e.type === "ai") {
            const key = e.id ?? aiOutputKey(e.page, e.display_order);
            aiOutputs[key] = {
              default: { text: e.content, updatedAt: now },
            };
          }
        }
        await fetch(`/api/report-state?subjectId=${encodeURIComponent(sid)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            displayName: input.name.trim() || input.birthDate,
            userInput: input,
            aiOutputs,
          }),
        });
      }

      setPreReport(payload as PreReportPayload);
      setStep("pre-report");
      setGenStatus("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "流程失敗");
      setStep("input");
      setInputStepIndex(INPUT_STEPS.length - 1);
    }
  };

  return (
    <div className={styles.shell}>
      {step !== "pre-report" && step !== "generating" && (
        <PageHeader
          title="八字命理"
          subtitle="沉浸 → 輸入 → Pre-report → 付款解鎖完整報告"
        />
      )}

      {error && <div className={styles.errorBanner}>{error}</div>}

      {step === "immersion" && (
        <ImmersionStep onContinue={() => setStep("input")} />
      )}

      {step === "input" && (
        <InputWizard
          input={input}
          stepIndex={inputStepIndex}
          onChange={patchInput}
          onStepIndex={setInputStepIndex}
          onComplete={runGenerate}
        />
      )}

      {step === "generating" && (
        <div className={styles.generating}>
          <div className={styles.spinner} />
          <p>{genStatus || "生成中…"}</p>
          <p style={{ fontSize: "0.85rem", opacity: 0.65 }}>
            正在呼叫 AI 撰寫五段導流敘述，請勿關閉頁面
          </p>
        </div>
      )}

      {step === "pre-report" && preReport && (
        <PreReportView
          payload={preReport}
          subjectId={subjectId}
          publicToken={publicToken}
        />
      )}

      {step === "paid" && (
        <PaidSuccessStep
          demoPaid={demoPaid}
          publicToken={publicToken}
          reportHubUrl={reportHubUrl}
        />
      )}
    </div>
  );
}
