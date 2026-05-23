"use client";

import JourneyShell from "@/components/models/bazi-v1/JourneyShell";
import JourneyVideo from "@/components/models/bazi-v1/JourneyVideo";
import SoundWatermark from "@/components/models/bazi-v1/SoundWatermark";
import { BAZI_JOURNEY_MEDIA } from "@/lib/bazi-journey/config";
import {
  CALENDAR_OPTIONS,
  GENDER_OPTIONS,
  INPUT_STEPS,
  JOB_OPTIONS,
  RELATIONSHIP_OPTIONS,
  SEXUALITY_LABELS,
  SEXUALITY_OPTIONS,
} from "@/lib/bazi-journey/config";
import {
  asVideoSource,
  videoSourceKey,
} from "@/lib/bazi-journey/video-sources";
import { modelIntroPath } from "@/lib/models/paths";
import type { ModelMediaConfig } from "@/lib/models/parse-config";
import type { UserFormInput } from "@/lib/user-input";
import {
  formatBirthDateInput,
  formatBirthTimeInput,
  isBirthDateComplete,
  isBirthTimeComplete,
} from "@/lib/user-input";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./model-journey.module.css";

interface InputWizardProps {
  modelSlug: string;
  input: UserFormInput;
  stepIndex: number;
  media: ModelMediaConfig;
  onChange: (patch: Partial<UserFormInput>) => void;
  onStepIndex: (index: number) => void;
  onComplete: () => void;
}

function isValidBirthDate(value: string): boolean {
  return isBirthDateComplete(value);
}

function isValidBirthTime(value: string): boolean {
  return isBirthTimeComplete(value);
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function InputWizard({
  modelSlug,
  input,
  stepIndex,
  media,
  onChange,
  onStepIndex,
  onComplete,
}: InputWizardProps) {
  const step = INPUT_STEPS[stepIndex];
  const advanceTimerRef = useRef<number | null>(null);
  const stepIndexRef = useRef(stepIndex);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [soundOn, setSoundOn] = useState(false);
  /** Only auto-advance after the user edits on birth/time steps (not when navigating back). */
  const allowAutoAdvanceRef = useRef(false);
  stepIndexRef.current = stepIndex;

  const videoSources =
    step.videoIndex === 2
      ? asVideoSource(media.inputVideo2, BAZI_JOURNEY_MEDIA.inputVideo2)
      : asVideoSource(media.inputVideo1, BAZI_JOURNEY_MEDIA.inputVideo1);
  const videoKey = videoSources ? videoSourceKey(videoSources) : "";

  const goNext = useCallback(() => {
    if (stepIndexRef.current < INPUT_STEPS.length - 1) {
      onStepIndex(stepIndexRef.current + 1);
      return;
    }
    onComplete();
  }, [onComplete, onStepIndex]);

  const goBack = () => {
    if (stepIndex > 0) {
      onStepIndex(stepIndex - 1);
    }
  };

  useEffect(() => {
    allowAutoAdvanceRef.current = false;
    if (advanceTimerRef.current) {
      window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
  }, [stepIndex]);

  useEffect(() => {
    setSoundOn(false);
  }, [videoKey]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !soundOn;
    v.volume = 1;
    if (soundOn) {
      void v.play().catch(() => {});
    }
  }, [soundOn, videoKey]);

  const enableSound = useCallback(() => {
    setSoundOn(true);
    const v = videoRef.current;
    if (v) {
      v.muted = false;
      v.volume = 1;
      void v.play().catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (step.id !== "birth" || !isValidBirthDate(input.birthDate)) return;
    if (!allowAutoAdvanceRef.current) return;
    advanceTimerRef.current = window.setTimeout(() => goNext(), 450);
    return () => {
      if (advanceTimerRef.current) {
        window.clearTimeout(advanceTimerRef.current);
      }
    };
  }, [step.id, input.birthDate, goNext]);

  useEffect(() => {
    if (step.id !== "time" || input.birthTimeUnknown) return;
    if (!isValidBirthTime(input.birthTime)) return;
    if (!allowAutoAdvanceRef.current) return;
    advanceTimerRef.current = window.setTimeout(() => goNext(), 450);
    return () => {
      if (advanceTimerRef.current) {
        window.clearTimeout(advanceTimerRef.current);
      }
    };
  }, [step.id, input.birthTime, input.birthTimeUnknown, goNext]);

  const pickGender = (gender: UserFormInput["gender"]) => {
    onChange({ gender });
    goNext();
  };

  const pickSexuality = (sexuality: UserFormInput["sexuality"]) => {
    onChange({ sexuality });
    goNext();
  };

  const pickRelationship = (relationship: UserFormInput["relationship"]) => {
    onChange({ relationship });
    goNext();
  };

  const pickJob = (job: UserFormInput["job"]) => {
    onChange({ job });
    goNext();
  };

  const pickUnknownTime = () => {
    onChange({ birthTimeUnknown: true, birthTime: "" });
    goNext();
  };

  return (
    <JourneyShell
      backHref={stepIndex === 0 ? modelIntroPath(modelSlug) : undefined}
      onBack={stepIndex > 0 ? goBack : undefined}
      backLabel={stepIndex > 0 ? "上一步" : "返回介紹"}
      immersive
    >
      <div className={styles.immersiveStage}>
        {videoSources ? (
          <JourneyVideo
            ref={videoRef}
            key={videoKey}
            className={styles.fullVideo}
            sources={videoSources}
            autoPlay
            muted
            loop
          />
        ) : null}
        <div className={styles.inputGradient} aria-hidden />

        {!soundOn ? (
          <SoundWatermark
            key={`sound-${videoKey}`}
            onEnable={enableSound}
            autoHideMs={1500}
          />
        ) : null}

        <div className={styles.inputOverlay}>
          <div className={styles.inputOverlayInner}>
            <div key={stepIndex} className={styles.inputStepEnter}>
              {step.subtitle ? (
                <p className={styles.inputLead}>{step.subtitle}</p>
              ) : null}
              <h2 className={styles.inputQuestion}>{step.title}</h2>

              {step.id === "birth" && (
              <div className={styles.inputRow}>
                <input
                  className={styles.inputFieldTransparent}
                  type="text"
                  inputMode="numeric"
                  placeholder="2000.01.01"
                  maxLength={10}
                  value={input.birthDate}
                  onChange={(e) => {
                    allowAutoAdvanceRef.current = true;
                    onChange({ birthDate: formatBirthDateInput(e.target.value) });
                  }}
                />
                <div className={styles.inputPillRow}>
                  {CALENDAR_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={
                        input.calendarType === opt.value
                          ? styles.inputPillActive
                          : styles.inputPill
                      }
                      onClick={() => onChange({ calendarType: opt.value })}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step.id === "time" && (
              <div className={styles.inputRow}>
                <input
                  className={styles.inputFieldTransparent}
                  type="text"
                  inputMode="numeric"
                  placeholder="13:30"
                  maxLength={5}
                  value={input.birthTime}
                  disabled={input.birthTimeUnknown}
                  onChange={(e) => {
                    allowAutoAdvanceRef.current = true;
                    onChange({
                      birthTime: formatBirthTimeInput(e.target.value),
                      birthTimeUnknown: false,
                    });
                  }}
                />
                <button
                  type="button"
                  className={styles.inputPillGhost}
                  onClick={pickUnknownTime}
                >
                  不知道時間
                </button>
              </div>
            )}

            {step.id === "gender" && (
              <div className={styles.inputPillRowWide}>
                {GENDER_OPTIONS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    className={
                      input.gender === g ? styles.inputPillActive : styles.inputPill
                    }
                    onClick={() => pickGender(g)}
                  >
                    {g}
                  </button>
                ))}
              </div>
            )}

            {step.id === "sexuality" && (
              <div className={styles.radioList}>
                {SEXUALITY_OPTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={styles.radioOption}
                    onClick={() => pickSexuality(s)}
                  >
                    <span
                      className={`${styles.radioCircle} ${
                        input.sexuality === s ? styles.radioCircleActive : ""
                      }`}
                    />
                    <span>{SEXUALITY_LABELS[s]}</span>
                  </button>
                ))}
              </div>
            )}

            {step.id === "relationship" && (
              <div className={styles.radioList}>
                {RELATIONSHIP_OPTIONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    className={styles.radioOption}
                    onClick={() => pickRelationship(r)}
                  >
                    <span
                      className={`${styles.radioCircle} ${
                        input.relationship === r ? styles.radioCircleActive : ""
                      }`}
                    />
                    <span>{r}</span>
                  </button>
                ))}
              </div>
            )}

            {step.id === "job" && (
              <div className={styles.radioList}>
                {JOB_OPTIONS.map((j) => (
                  <button
                    key={j}
                    type="button"
                    className={styles.radioOption}
                    onClick={() => pickJob(j)}
                  >
                    <span
                      className={`${styles.radioCircle} ${
                        input.job === j ? styles.radioCircleActive : ""
                      }`}
                    />
                    <span>{j}</span>
                  </button>
                ))}
              </div>
            )}

            {step.id === "name" && (
              <div className={styles.inputRow}>
                <input
                  className={styles.inputFieldTransparent}
                  type="text"
                  placeholder="王小明"
                  value={input.name}
                  onChange={(e) => onChange({ name: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && input.name.trim()) goNext();
                  }}
                />
                <button
                  type="button"
                  className={styles.confirmBtn}
                  disabled={!input.name.trim()}
                  onClick={goNext}
                >
                  確認
                </button>
              </div>
            )}

            {step.id === "email" && (
              <div className={styles.inputRow}>
                <input
                  className={styles.inputFieldTransparent}
                  type="email"
                  placeholder="name@example.com"
                  value={input.email}
                  onChange={(e) => onChange({ email: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && isValidEmail(input.email)) goNext();
                  }}
                />
                <button
                  type="button"
                  className={styles.confirmBtn}
                  disabled={!isValidEmail(input.email)}
                  onClick={goNext}
                >
                  確認
                </button>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    </JourneyShell>
  );
}
