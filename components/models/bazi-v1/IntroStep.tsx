"use client";

import type { ProductModel } from "@/lib/products/model-store";
import type { ModelIntroProps } from "@/lib/models/ui-registry";
import styles from "./model-journey.module.css";

export default function BaziIntroStep({ model, onContinue }: ModelIntroProps) {
  const { media, copy } = model.config;
  return (
    <div className={styles.narrow}>
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
      <div className={styles.stepPanel}>
        <p className={styles.stepTitle}>{copy.introTitle}</p>
        <p className={styles.stepSubtitle}>{copy.introSubtitle}</p>
        <button type="button" className={styles.primaryBtn} onClick={onContinue}>
          我準備好了
        </button>
        <button type="button" className={styles.ghostBtn} onClick={onContinue}>
          跳過影片
        </button>
      </div>
    </div>
  );
}
