import { BAZI_JOURNEY_MEDIA } from "@/lib/bazi-journey/config";
import {
  asVideoSource,
  type JourneyVideoSource,
} from "@/lib/bazi-journey/video-sources";

export type IntroButtonDef = {
  label: string;
};

export type IntroSceneDef = {
  video: JourneyVideoSource;
  buttons: IntroButtonDef[];
  /** Buttons appear in the last N seconds; persist after video ends. Default 2. */
  showButtonsInLastSec?: number;
  /** Show sound watermark when this scene starts (after scene 0). */
  promptSoundOnStart?: boolean;
};

/** @deprecated Use showButtonsInLastSec */
export type IntroSceneDefLegacy = IntroSceneDef & {
  showButtonsInLastMs?: number;
};

export const DEFAULT_INTRO_BUTTON_LEAD_SEC = 2;

const MEDIA = BAZI_JOURNEY_MEDIA;

export const BAZI_INTRO_SCENES: IntroSceneDef[] = [
  {
    video: MEDIA.introVideo1,
    buttons: [{ label: "驚慌地環顧四周" }],
    showButtonsInLastSec: DEFAULT_INTRO_BUTTON_LEAD_SEC,
  },
  {
    video: MEDIA.introVideo2,
    buttons: [
      { label: "（怎麼說話這麼沒禮貌）" },
      { label: "啊 好的..（乖乖坐下）" },
    ],
    showButtonsInLastSec: DEFAULT_INTRO_BUTTON_LEAD_SEC,
  },
  {
    video: MEDIA.introVideo3,
    buttons: [{ label: "告訴他出生年月日" }],
    showButtonsInLastSec: DEFAULT_INTRO_BUTTON_LEAD_SEC,
    promptSoundOnStart: true,
  },
];

export function introVideosFromMedia(media: {
  introVideo?: string | JourneyVideoSource;
  introVideo1?: string | JourneyVideoSource;
  introVideo2?: string | JourneyVideoSource;
  introVideo3?: string | JourneyVideoSource;
}): JourneyVideoSource[] {
  return [
    asVideoSource(media.introVideo1, MEDIA.introVideo1)!,
    asVideoSource(media.introVideo2, MEDIA.introVideo2)!,
    asVideoSource(media.introVideo3, MEDIA.introVideo3)!,
  ];
}
