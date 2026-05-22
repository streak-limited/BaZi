"use client";

import { BAZI_JOURNEY_MEDIA } from "@/lib/bazi-journey/config";
import styles from "./bazi-intro.module.css";

export default function IntroStep({ onContinue }: { onContinue: () => void }) {
  return (
    <div className={styles.narrow}>
      <div className={styles.mediaWrap}>
        <video
          className={styles.video}
          src={BAZI_JOURNEY_MEDIA.introVideo}
          autoPlay
          muted
          playsInline
          loop
          preload="auto"
        />
      </div>
      <div className={styles.stepPanel}>
        <p className={styles.stepTitle}>韓國範山道令在此</p>
        <p className={styles.stepSubtitle}>
          先聽他說完這段故事，再開始為你排命
        </p>
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
