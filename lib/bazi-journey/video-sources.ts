/** Dual-format journey video (webm preferred, mp4 fallback). */
export type JourneyVideoSource = {
  webm?: string;
  mp4: string;
};

const MEDIA =
  "https://wvgwlwaqlhewhobzauda.supabase.co/storage/v1/object/public/products-media/products/mzmudang-tw";

function immersion(n: 1 | 2 | 3): JourneyVideoSource {
  return {
    webm: `${MEDIA}/immersion/mzmudang_immersion_${n}.webm`,
    mp4: `${MEDIA}/immersion/mzmudang_immersion_${n}.mp4`,
  };
}

export const BAZI_JOURNEY_VIDEOS = {
  welcome: {
    webm: `${MEDIA}/onboarding/mzmudang_onboarding_video.webm`,
    mp4: `${MEDIA}/onboarding/mzmudang_onboarding_video.mp4`,
  },
  intro1: immersion(1),
  intro2: immersion(2),
  intro3: immersion(3),
  input1: {
    mp4: `${MEDIA}/input/mzmudang_input_video_1.mp4`,
  },
  input2: {
    mp4: `${MEDIA}/input/mzmudang_input_video_2.mp4`,
  },
  loading: {
    webm: `${MEDIA}/loading/mzmudang_loading_video.webm`,
    mp4: `${MEDIA}/loading/mzmudang_loading_video.mp4`,
  },
} as const;

export function videoSourceKey(source: JourneyVideoSource): string {
  return source.mp4;
}

/** Legacy config may store a single mp4 URL string. */
export function asVideoSource(
  value?: string | JourneyVideoSource,
  fallback?: JourneyVideoSource,
): JourneyVideoSource | undefined {
  if (!value) return fallback;
  if (typeof value === "string") return { mp4: value };
  return value;
}
