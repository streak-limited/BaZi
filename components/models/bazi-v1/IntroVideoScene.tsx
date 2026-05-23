"use client";

import GlassButton from "@/components/models/bazi-v1/GlassButton";
import JourneyVideo from "@/components/models/bazi-v1/JourneyVideo";
import SoundWatermark from "@/components/models/bazi-v1/SoundWatermark";
import type { JourneyVideoSource } from "@/lib/bazi-journey/video-sources";
import { videoSourceKey } from "@/lib/bazi-journey/video-sources";
import { useEffect, useRef, useState } from "react";
import styles from "./model-journey.module.css";

export type IntroVideoButton = {
  label: string;
};

type Props = {
  sources: JourneyVideoSource;
  buttons: IntroVideoButton[];
  onButtonClick: () => void;
  /** Show buttons in the last N seconds of playback; they stay after the video ends. Default 2. */
  showButtonsInLastSec?: number;
  soundOn: boolean;
  onSoundEnable: () => void;
};

function applySoundState(video: HTMLVideoElement, enabled: boolean) {
  video.muted = !enabled;
  video.volume = 1;
  if (enabled) {
    void video.play().catch(() => {});
  }
}

export default function IntroVideoScene({
  sources,
  buttons,
  onButtonClick,
  showButtonsInLastSec = 2,
  soundOn,
  onSoundEnable,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showActions, setShowActions] = useState(false);
  const showButtonsInLastMs = showButtonsInLastSec * 1000;

  useEffect(() => {
    setShowActions(false);
  }, [sources.mp4]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    applySoundState(v, soundOn);

    const onCanPlay = () => applySoundState(v, soundOn);
    v.addEventListener("canplay", onCanPlay);
    return () => v.removeEventListener("canplay", onCanPlay);
  }, [soundOn, sources.mp4]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const revealActions = () => {
      if (v.ended) {
        setShowActions(true);
        return;
      }
      if (!Number.isFinite(v.duration) || v.duration <= 0) return;
      const remainingMs = (v.duration - v.currentTime) * 1000;
      if (remainingMs <= showButtonsInLastMs) {
        setShowActions(true);
      }
    };

    const onEnded = () => setShowActions(true);

    v.addEventListener("timeupdate", revealActions);
    v.addEventListener("loadedmetadata", revealActions);
    v.addEventListener("durationchange", revealActions);
    v.addEventListener("ended", onEnded);
    revealActions();

    return () => {
      v.removeEventListener("timeupdate", revealActions);
      v.removeEventListener("loadedmetadata", revealActions);
      v.removeEventListener("durationchange", revealActions);
      v.removeEventListener("ended", onEnded);
    };
  }, [showButtonsInLastMs, sources.mp4]);

  const handleSoundEnable = () => {
    onSoundEnable();
    const v = videoRef.current;
    if (v) {
      applySoundState(v, true);
    }
  };

  const showSoundPrompt = !soundOn;
  const showFooter = showActions;

  return (
    <>
      <JourneyVideo
        ref={videoRef}
        key={videoSourceKey(sources)}
        className={styles.fullVideo}
        sources={sources}
        autoPlay
        muted
      />
      <div className={styles.immersiveScrim} aria-hidden />

      {showSoundPrompt ? (
        <SoundWatermark
          key={`sound-${videoSourceKey(sources)}`}
          onEnable={handleSoundEnable}
          autoHideMs={1500}
        />
      ) : null}

      {showFooter ? (
        <div className={styles.immersiveFooter}>
          <div className={styles.introChoiceStack}>
            {buttons.map((btn) => (
              <GlassButton key={btn.label} onClick={onButtonClick}>
                {btn.label}
              </GlassButton>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}
