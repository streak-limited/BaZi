"use client";

import IntroVideoScene from "@/components/models/bazi-v1/IntroVideoScene";
import JourneyShell from "@/components/models/bazi-v1/JourneyShell";
import {
  BAZI_INTRO_SCENES,
  introVideosFromMedia,
  type IntroSceneDef,
} from "@/lib/bazi-journey/intro-steps";
import { modelWelcomePath } from "@/lib/models/paths";
import type { ModelIntroProps } from "@/lib/models/ui-registry";
import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./model-journey.module.css";

function buildScenes(media: ModelIntroProps["model"]["config"]["media"]): IntroSceneDef[] {
  const videos = introVideosFromMedia(media);
  return BAZI_INTRO_SCENES.map((scene, i) => ({
    ...scene,
    video: videos[i] ?? scene.video,
  }));
}

export default function BaziIntroStep({ model, onContinue }: ModelIntroProps) {
  const scenes = useMemo(() => buildScenes(model.config.media), [model.config.media]);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [soundOn, setSoundOn] = useState(false);

  const scene = scenes[sceneIndex] ?? scenes[0];

  useEffect(() => {
    setSoundOn(false);
  }, [sceneIndex]);

  const enableSound = useCallback(() => {
    setSoundOn(true);
  }, []);

  const advance = () => {
    if (sceneIndex < scenes.length - 1) {
      setSceneIndex((i) => i + 1);
      return;
    }
    onContinue();
  };

  return (
    <JourneyShell backHref={modelWelcomePath(model.slug)} immersive>
      <div className={styles.immersiveStage}>
        <IntroVideoScene
          sources={scene.video}
          buttons={scene.buttons}
          showButtonsInLastSec={scene.showButtonsInLastSec}
          soundOn={soundOn}
          onSoundEnable={enableSound}
          onButtonClick={advance}
        />
      </div>
    </JourneyShell>
  );
}
