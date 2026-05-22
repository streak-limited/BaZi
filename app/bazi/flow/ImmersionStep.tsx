"use client";

import { BAZI_FLOW_MEDIA } from "@/lib/bazi-flow/config";
import styles from "./bazi-flow.module.css";

interface ImmersionStepProps {
  onContinue: () => void;
}

export default function ImmersionStep({ onContinue }: ImmersionStepProps) {
  return (
    <div className={styles.narrow}>
      <div className={styles.mediaWrap}>
        <video
          className={styles.video}
          src={BAZI_FLOW_MEDIA.immersionVideo}
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
