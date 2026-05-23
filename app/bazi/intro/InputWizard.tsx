"use client";

import {
  BAZI_JOURNEY_MEDIA,
  CALENDAR_OPTIONS,
  GENDER_OPTIONS,
  INPUT_STEPS,
  JOB_OPTIONS,
  RELATIONSHIP_OPTIONS,
  SEXUALITY_OPTIONS,
} from "@/lib/bazi-journey/config";
import { videoSourceKey } from "@/lib/bazi-journey/video-sources";
import type { UserFormInput } from "@/lib/user-input";
import styles from "./bazi-intro.module.css";

interface InputWizardProps {
  input: UserFormInput;
  stepIndex: number;
  onChange: (patch: Partial<UserFormInput>) => void;
  onStepIndex: (index: number) => void;
  onComplete: () => void;
}

function canAdvance(stepId: string, input: UserFormInput): boolean {
  switch (stepId) {
    case "birth":
      return /^\d{4}[.-]\d{1,2}[.-]\d{1,2}$/.test(input.birthDate.trim());
    case "time":
      return input.birthTimeUnknown || /^\d{1,2}:\d{2}$/.test(input.birthTime.trim());
    default:
      return true;
  }
}

export default function InputWizard({
  input,
  stepIndex,
  onChange,
  onStepIndex,
  onComplete,
}: InputWizardProps) {
  const step = INPUT_STEPS[stepIndex];
  const video =
    step.videoIndex === 2
      ? BAZI_JOURNEY_MEDIA.inputVideo2
      : BAZI_JOURNEY_MEDIA.inputVideo1;

  const goNext = () => {
    if (stepIndex < INPUT_STEPS.length - 1) {
      onStepIndex(stepIndex + 1);
    } else {
      onComplete();
    }
  };

  const goBack = () => {
    if (stepIndex > 0) onStepIndex(stepIndex - 1);
  };

  return (
    <div className={styles.narrow}>
      <div className={styles.mediaWrap}>
        <video
          key={videoSourceKey(video)}
          className={styles.video}
          src={video.mp4}
          autoPlay
          muted
          playsInline
          loop
          preload="auto"
        />
      </div>
      <div className={styles.stepPanel}>
        <div className={styles.progressDots}>
          {INPUT_STEPS.map((s, i) => (
            <span
              key={s.id}
              className={i === stepIndex ? styles.dotActive : styles.dot}
            />
          ))}
        </div>
        <h2 className={styles.stepTitle}>{step.title}</h2>
        {step.subtitle && (
          <p className={styles.stepSubtitle}>{step.subtitle}</p>
        )}

        {step.id === "birth" && (
          <>
            <div className={styles.toggleRow}>
              {CALENDAR_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={
                    input.calendarType === opt.value
                      ? styles.optionBtnActive
                      : styles.optionBtn
                  }
                  onClick={() => onChange({ calendarType: opt.value })}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <input
              className={styles.textInput}
              type="text"
              placeholder="2000.01.01"
              value={input.birthDate}
              onChange={(e) => onChange({ birthDate: e.target.value })}
            />
          </>
        )}

        {step.id === "time" && (
          <>
            <input
              className={styles.textInput}
              type="text"
              placeholder="13:30"
              value={input.birthTime}
              disabled={input.birthTimeUnknown}
              onChange={(e) => onChange({ birthTime: e.target.value })}
            />
            <label className={styles.checkRow}>
              <input
                type="checkbox"
                checked={input.birthTimeUnknown}
                onChange={(e) =>
                  onChange({ birthTimeUnknown: e.target.checked })
                }
              />
              不知道出生時間
            </label>
          </>
        )}

        {step.id === "gender" && (
          <div className={styles.optionGrid}>
            {GENDER_OPTIONS.map((g) => (
              <button
                key={g}
                type="button"
                className={
                  input.gender === g ? styles.optionBtnActive : styles.optionBtn
                }
                onClick={() => onChange({ gender: g })}
              >
                {g}
              </button>
            ))}
          </div>
        )}

        {step.id === "sexuality" && (
          <div className={styles.optionGrid}>
            {SEXUALITY_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                className={
                  input.sexuality === s
                    ? styles.optionBtnActive
                    : styles.optionBtn
                }
                onClick={() => onChange({ sexuality: s })}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {step.id === "relationship" && (
          <div className={styles.optionGrid}>
            {RELATIONSHIP_OPTIONS.map((r) => (
              <button
                key={r}
                type="button"
                className={
                  input.relationship === r
                    ? styles.optionBtnActive
                    : styles.optionBtn
                }
                onClick={() => onChange({ relationship: r })}
              >
                {r}
              </button>
            ))}
          </div>
        )}

        {step.id === "job" && (
          <div className={styles.optionGrid}>
            {JOB_OPTIONS.map((j) => (
              <button
                key={j}
                type="button"
                className={
                  input.job === j ? styles.optionBtnActive : styles.optionBtn
                }
                onClick={() => onChange({ job: j })}
              >
                {j}
              </button>
            ))}
          </div>
        )}

        {step.id === "name" && (
          <input
            className={styles.textInput}
            type="text"
            placeholder="你的名字"
            value={input.name}
            onChange={(e) => onChange({ name: e.target.value })}
          />
        )}

        {step.id === "email" && (
          <input
            className={styles.textInput}
            type="email"
            placeholder="name@example.com"
            value={input.email}
            onChange={(e) => onChange({ email: e.target.value })}
          />
        )}

        <button
          type="button"
          className={styles.primaryBtn}
          disabled={!canAdvance(step.id, input)}
          onClick={goNext}
        >
          {stepIndex < INPUT_STEPS.length - 1 ? "下一步" : "開始解命"}
        </button>
        {stepIndex > 0 && (
          <button type="button" className={styles.ghostBtn} onClick={goBack}>
            上一步
          </button>
        )}
        {step.id === "email" && (
          <button type="button" className={styles.ghostBtn} onClick={goNext}>
            略過 Email
          </button>
        )}
      </div>
    </div>
  );
}
