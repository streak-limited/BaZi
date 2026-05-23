"use client";

import type { JourneyVideoSource } from "@/lib/bazi-journey/video-sources";
import { forwardRef } from "react";

type Props = {
  sources: JourneyVideoSource;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  playsInline?: boolean;
  preload?: "auto" | "metadata" | "none";
};

const JourneyVideo = forwardRef<HTMLVideoElement, Props>(function JourneyVideo(
  {
    sources,
    className,
    autoPlay,
    muted,
    loop,
    playsInline = true,
    preload = "auto",
  },
  ref,
) {
  return (
    <video
      ref={ref}
      className={className}
      autoPlay={autoPlay}
      muted={muted}
      loop={loop}
      playsInline={playsInline}
      preload={preload}
    >
      {sources.webm ? (
        <source src={sources.webm} type="video/webm" />
      ) : null}
      <source src={sources.mp4} type="video/mp4" />
    </video>
  );
});

export default JourneyVideo;
