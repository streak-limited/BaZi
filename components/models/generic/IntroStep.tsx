"use client";

import type { ModelIntroProps } from "@/lib/models/ui-registry";
import styles from "@/components/models/bazi-v1/model-journey.module.css";

export default function GenericIntroStep({ model, onContinue }: ModelIntroProps) {
  const { media, copy } = model.config;
  return (
    <div className={styles.narrow}>
      {media.introVideo ? (
        <div className={styles.mediaWrap}>
          <video
            className={styles.video}
            src={media.introVideo}
            autoPlay
            muted
            playsInline
            loop
            preload="auto"
          />
        </div>
      ) : null}
      <div className={styles.stepPanel}>
        <p className={styles.stepTitle}>{copy.introTitle}</p>
        <p className={styles.stepSubtitle}>{copy.introSubtitle}</p>
        <button type="button" className={styles.primaryBtn} onClick={onContinue}>
          繼續
        </button>
      </div>
    </div>
  );
}
