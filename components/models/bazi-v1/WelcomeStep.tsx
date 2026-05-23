"use client";

import AltarCtaButton from "@/components/models/bazi-v1/AltarCtaButton";
import JourneyShell from "@/components/models/bazi-v1/JourneyShell";
import JourneyVideo from "@/components/models/bazi-v1/JourneyVideo";
import SoundWatermark from "@/components/models/bazi-v1/SoundWatermark";
import WelcomeTeaserPill from "@/components/models/bazi-v1/WelcomeTeaserPill";
import { BAZI_JOURNEY_MEDIA } from "@/lib/bazi-journey/config";
import { asVideoSource } from "@/lib/bazi-journey/video-sources";
import {
  journeySoundKey,
  modelIntroPath,
} from "@/lib/models/paths";
import type { ProductModel } from "@/lib/products/model-store";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./model-journey.module.css";

export default function WelcomeStep({ model }: { model: ProductModel }) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [soundOn, setSoundOn] = useState(false);
  const [showSoundPrompt, setShowSoundPrompt] = useState(true);

  const welcomeVideo =
    asVideoSource(model.config.media.welcomeVideo, BAZI_JOURNEY_MEDIA.welcomeVideo) ??
    BAZI_JOURNEY_MEDIA.welcomeVideo;

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !soundOn;
    if (soundOn) {
      void v.play().catch(() => {});
    }
  }, [soundOn]);

  const enableSound = useCallback(() => {
    setSoundOn(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(journeySoundKey(model.slug), "1");
    }
    const v = videoRef.current;
    if (v) {
      v.muted = false;
      void v.play().catch(() => {});
    }
  }, [model.slug]);

  const goIntro = () => {
    if (soundOn && typeof window !== "undefined") {
      sessionStorage.setItem(journeySoundKey(model.slug), "1");
    }
    router.push(modelIntroPath(model.slug));
  };

  return (
    <JourneyShell backHref="/" immersive showBrandLogo>
      <div className={styles.immersiveStage}>
        <JourneyVideo
          ref={videoRef}
          className={styles.fullVideo}
          sources={welcomeVideo}
          autoPlay
          muted={!soundOn}
        />
        <div className={styles.immersiveScrim} aria-hidden />
        {showSoundPrompt ? (
          <SoundWatermark
            onEnable={enableSound}
            onHide={() => setShowSoundPrompt(false)}
            autoHideMs={1500}
          />
        ) : null}
        <div
          className={`${styles.welcomeFooter} ${showSoundPrompt ? styles.welcomeFooterHidden : styles.welcomeFooterVisible}`}
        >
          <WelcomeTeaserPill />
          <AltarCtaButton onClick={goIntro} />
        </div>
      </div>
    </JourneyShell>
  );
}
