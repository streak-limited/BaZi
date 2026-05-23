"use client";

import { ONBOARDING_ASSETS } from "@/lib/bazi-journey/onboarding-assets";
import styles from "./model-journey.module.css";

export default function AltarCtaButton({
  children = "立即進入神壇",
  onClick,
}: {
  children?: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      className={styles.altarCtaBtn}
      onClick={onClick}
      style={{
        backgroundImage: `url(${ONBOARDING_ASSETS.ctaButtonBg})`,
      }}
    >
      <span className={styles.altarCtaLabel}>{children}</span>
    </button>
  );
}
