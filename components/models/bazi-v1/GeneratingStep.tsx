"use client";

import JourneyVideo from "@/components/models/bazi-v1/JourneyVideo";
import { calculateBazi } from "@/lib/bazi/calculate";
import { BAZI_JOURNEY_VIDEOS } from "@/lib/bazi-journey/video-sources";
import type { UserFormInput } from "@/lib/user-input";
import { useMemo } from "react";
import styles from "./model-journey.module.css";

type Props = {
  userInput: UserFormInput;
  status?: string;
};

export default function GeneratingStep({ userInput, status }: Props) {
  const bubbleText = useMemo(() => {
    const bazi = calculateBazi(userInput);
    if (bazi.variables?.current_age) return bazi.variables.current_age;
    if (userInput.name.trim()) return userInput.name.trim().slice(0, 4);
    return "…";
  }, [userInput]);

  return (
    <div className={styles.loadingStage}>
      <JourneyVideo
        className={styles.loadingVideo}
        sources={BAZI_JOURNEY_VIDEOS.loading}
        autoPlay
        muted
        loop
        playsInline
      />
      <div className={styles.loadingOverlay} aria-hidden>
        <div className={styles.loadingBubble}>
          <svg
            className={styles.loadingBubbleSvg}
            viewBox="0 0 128 187"
            fill="none"
            preserveAspectRatio="none"
            aria-hidden
          >
            <ellipse
              cx="64"
              cy="93.5"
              rx="64"
              ry="93.5"
              fill="white"
              fillOpacity="0.7"
            />
            <ellipse
              cx="64"
              cy="93.5"
              rx="64"
              ry="93.5"
              stroke="black"
              strokeOpacity="0.5"
              strokeWidth="3"
            />
          </svg>
          <p className={styles.loadingBubbleText}>{bubbleText}</p>
        </div>
      </div>
      {status ? <p className={styles.loadingStatus}>{status}</p> : null}
    </div>
  );
}
