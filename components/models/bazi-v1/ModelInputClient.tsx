"use client";

import GeneratingStep from "@/components/models/bazi-v1/GeneratingStep";
import InputWizard from "@/components/models/bazi-v1/InputWizard";
import JourneyShell from "@/components/models/bazi-v1/JourneyShell";
import PaidSuccessStep from "@/app/bazi/intro/PaidSuccessStep";
import { INPUT_STEPS } from "@/lib/bazi-journey/config";
import { journeyDraftKey } from "@/lib/models/paths";
import type { ModelInputProps } from "@/lib/models/ui-registry";
import {
  type BaziJourneyDraft,
  type BaziJourneyStep,
  type ResultPayload,
} from "@/lib/bazi-journey/types";
import { aiOutputKey } from "@/lib/report-storage-types";
import { ACTIVE_SUBJECT_KEY } from "@/lib/subject-session";
import { DEFAULT_USER_INPUT, type UserFormInput } from "@/lib/user-input";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import styles from "./model-journey.module.css";

function loadDraft(key: string): BaziJourneyDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw =
      sessionStorage.getItem(key) ??
      sessionStorage.getItem("bazi-flow-draft") ??
      sessionStorage.getItem("journey-draft-bazi-full-report");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BaziJourneyDraft & {
      preReport?: ResultPayload | null;
      step?: string;
    };
    if (parsed.preReport && !parsed.result) {
      parsed.result = parsed.preReport;
    }
    const legacyStep = parsed.step as string | undefined;
    if (legacyStep === "pre-report" || legacyStep === "immersion") {
      parsed.step = legacyStep === "immersion" ? "intro" : "input";
    }
    return parsed as BaziJourneyDraft;
  } catch {
    return null;
  }
}

function saveDraft(key: string, draft: BaziJourneyDraft) {
  sessionStorage.setItem(key, JSON.stringify(draft));
}

export default function ModelInputClient({ model }: ModelInputProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paidFromUrl = searchParams.get("paid") === "1";
  const demoPaid = searchParams.get("demo") === "1";
  const draftKey = journeyDraftKey(model.slug);

  const [step, setStep] = useState<BaziJourneyStep>("input");
  const [input, setInput] = useState<UserFormInput>({
    ...DEFAULT_USER_INPUT,
    birthDate: "",
    birthTime: "",
    birthTimeUnknown: false,
    name: "",
    email: "",
  });
  const [inputStepIndex, setInputStepIndex] = useState(0);
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [publicToken, setPublicToken] = useState<string | null>(null);
  const [reportHubUrl, setReportHubUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [genStatus, setGenStatus] = useState("");

  useEffect(() => {
    const draft = loadDraft(draftKey);
    if (draft) {
      setInput(draft.input);
      setInputStepIndex(draft.inputStepIndex);
      setSubjectId(draft.subjectId);
      setPublicToken(draft.publicToken ?? null);
      setReportHubUrl(draft.reportHubUrl ?? null);
      if (!paidFromUrl && draft.step !== "paid") {
        setStep(draft.step === "intro" ? "input" : draft.step);
      }
    }
    if (paidFromUrl) setStep("paid");
  }, [paidFromUrl, draftKey]);

  const persistDraft = useCallback(
    (patch: Partial<BaziJourneyDraft>) => {
      saveDraft(draftKey, {
        step,
        input,
        inputStepIndex,
        subjectId,
        result: null,
        publicToken,
        reportHubUrl,
        ...patch,
      });
    },
    [step, input, inputStepIndex, subjectId, publicToken, reportHubUrl, draftKey],
  );

  useEffect(() => {
    persistDraft({ step, input, inputStepIndex, subjectId, publicToken, reportHubUrl });
  }, [step, input, inputStepIndex, subjectId, publicToken, reportHubUrl, persistDraft]);

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

      setGenStatus("建立 trial…");
      let trialToken: string | null = null;
      const trialRes = await fetch("/api/trials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelSlug: model.slug,
          modelId: model.id,
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

      setGenStatus("載入 Result 預覽（demo 資料）…");

      const genRes = await fetch("/api/bazi/generate-result", {
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
        for (const e of payload.entries as ResultPayload["entries"]) {
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

      persistDraft({
        step: "input",
        result: payload as ResultPayload,
        publicToken: trialToken,
        reportHubUrl: trialToken
          ? `${typeof window !== "undefined" ? window.location.origin : ""}/r/${trialToken}`
          : null,
      });
      setGenStatus("");
      if (trialToken) {
        router.replace(`/r/${trialToken}/result`);
        return;
      }
      setError("需要 Supabase trial 才能顯示 result 頁");
      setStep("input");
    } catch (e) {
      setError(e instanceof Error ? e.message : "流程失敗");
      setStep("input");
      setInputStepIndex(INPUT_STEPS.length - 1);
    }
  };

  const { media } = model.config;

  if (step === "generating") {
    return <GeneratingStep userInput={input} status={genStatus} />;
  }

  if (step === "input") {
    return (
      <>
        {error && <div className={styles.errorBannerLight}>{error}</div>}
        <InputWizard
          modelSlug={model.slug}
          input={input}
          stepIndex={inputStepIndex}
          media={media}
          onChange={patchInput}
          onStepIndex={setInputStepIndex}
          onComplete={runGenerate}
        />
      </>
    );
  }

  return (
    <JourneyShell backHref={`/m/${model.slug}/intro`}>
      {error && <div className={styles.errorBannerLight}>{error}</div>}

      {step === "paid" && (
        <PaidSuccessStep
          demoPaid={demoPaid}
          publicToken={publicToken}
          reportHubUrl={reportHubUrl}
        />
      )}
    </JourneyShell>
  );
}
