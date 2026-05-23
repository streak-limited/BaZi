"use client";

import TightLogo from "@/components/models/bazi-v1/TightLogo";
import Link from "next/link";
import styles from "./model-journey.module.css";

function BackIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}

export default function JourneyShell({
  children,
  backHref,
  onBack,
  backLabel = "返回",
  immersive = false,
  showBrandLogo = false,
}: {
  children: React.ReactNode;
  backHref?: string;
  onBack?: () => void;
  backLabel?: string;
  immersive?: boolean;
  showBrandLogo?: boolean;
}) {
  const showBack = Boolean(backHref || onBack);
  const showHeader = showBack || showBrandLogo;

  return (
    <div className={styles.shell}>
      <div className={immersive ? styles.frameImmersive : styles.frame}>
        {showHeader ? (
          <header
            className={`${styles.journeyHeader} ${showBrandLogo ? styles.journeyHeaderBrand : ""}`}
          >
            <div className={styles.journeyHeaderRow}>
              <div className={styles.journeyHeaderSide}>
                {backHref ? (
                  <Link href={backHref} className={styles.backBtn} aria-label={backLabel}>
                    <BackIcon />
                  </Link>
                ) : onBack ? (
                  <button
                    type="button"
                    className={styles.backBtn}
                    onClick={onBack}
                    aria-label={backLabel}
                  >
                    <BackIcon />
                  </button>
                ) : null}
              </div>
              {showBrandLogo ? (
                <div className={styles.brandLogoWrap}>
                  <TightLogo />
                </div>
              ) : null}
              <div className={styles.journeyHeaderSide} aria-hidden />
            </div>
          </header>
        ) : null}
        {children}
      </div>
    </div>
  );
}
