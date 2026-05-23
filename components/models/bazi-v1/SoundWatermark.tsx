"use client";

import { ONBOARDING_ASSETS } from "@/lib/bazi-journey/onboarding-assets";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import styles from "./model-journey.module.css";

type Props = {
  onEnable: () => void;
  /** Auto-hide after this many ms (default 1.5s). Set 0 to keep visible until tap. */
  autoHideMs?: number;
  onHide?: () => void;
};

export default function SoundWatermark({
  onEnable,
  autoHideMs = 1500,
  onHide,
}: Props) {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);
  const onHideRef = useRef(onHide);
  onHideRef.current = onHide;

  useEffect(() => {
    if (!autoHideMs || autoHideMs <= 0) return;
    const timer = window.setTimeout(() => {
      setFading(true);
      window.setTimeout(() => {
        setVisible(false);
        onHideRef.current?.();
      }, 350);
    }, autoHideMs);
    return () => window.clearTimeout(timer);
  }, [autoHideMs]);

  const dismiss = () => {
    setFading(true);
    window.setTimeout(() => {
      setVisible(false);
      onHideRef.current?.();
    }, 350);
  };

  const handleTap = () => {
    onEnable();
    dismiss();
  };

  if (!visible) return null;

  return (
    <button
      type="button"
      className={`${styles.soundWatermark} ${fading ? styles.soundWatermarkFade : ""}`}
      onClick={handleTap}
      aria-label="開啟聲音"
    >
      <div className={styles.soundIconWrap}>
        <Image
          src={ONBOARDING_ASSETS.soundSubtract}
          alt=""
          width={37}
          height={37}
          className={styles.soundSubtract}
          unoptimized
        />
        <Image
          src={ONBOARDING_ASSETS.soundUnion}
          alt=""
          width={49}
          height={58}
          className={styles.soundUnion}
          unoptimized
        />
        <Image
          src={ONBOARDING_ASSETS.soundSubtractInner}
          alt=""
          width={21}
          height={21}
          className={styles.soundSubtractInner}
          unoptimized
        />
      </div>
      <p className={styles.soundLine}>
        想聽聲音的話
        <br />
        請觸碰螢幕
      </p>
    </button>
  );
}
