import { BAZI_JOURNEY_VIDEOS } from "@/lib/bazi-journey/video-sources";
import type { JourneyVideoSource } from "@/lib/bazi-journey/video-sources";
import { resolveListingImage } from "@/lib/models/listing-image";
import type { ModelConfig } from "@/lib/products/types";

export interface ModelMediaConfig {
  welcomeVideo?: string | JourneyVideoSource;
  introVideo?: string | JourneyVideoSource;
  introVideo1?: string | JourneyVideoSource;
  introVideo2?: string | JourneyVideoSource;
  introVideo3?: string | JourneyVideoSource;
  inputVideo1?: string | JourneyVideoSource;
  inputVideo2?: string | JourneyVideoSource;
}

export interface ModelCopyConfig {
  introTitle?: string;
  introSubtitle?: string;
  inputHeaderTitle?: string;
  inputHeaderSubtitle?: string;
}

export interface ModelListingConfig {
  image?: string;
  description?: string;
  view_count?: number;
  badge?: string;
}

export interface ParsedModelConfig extends ModelConfig {
  ui_key: string;
  media: ModelMediaConfig;
  copy: ModelCopyConfig;
  listing: ModelListingConfig;
}

export function parseModelConfig(
  raw: ModelConfig & {
    ui_key?: string;
    media?: ModelMediaConfig;
    copy?: ModelCopyConfig;
    listing?: ModelListingConfig;
  },
  modelId: string,
  slug?: string,
): ParsedModelConfig {
  const ui_key = raw.ui_key ?? modelId;
  const media: ModelMediaConfig = {
    welcomeVideo: raw.media?.welcomeVideo ?? BAZI_JOURNEY_VIDEOS.welcome,
    introVideo:
      raw.media?.introVideo ??
      raw.media?.introVideo1 ??
      BAZI_JOURNEY_VIDEOS.intro1,
    /** Scene 1 only — do not inherit legacy `introVideo` (often old Supabase URL in DB). */
    introVideo1: raw.media?.introVideo1 ?? BAZI_JOURNEY_VIDEOS.intro1,
    introVideo2: raw.media?.introVideo2 ?? BAZI_JOURNEY_VIDEOS.intro2,
    introVideo3: raw.media?.introVideo3 ?? BAZI_JOURNEY_VIDEOS.intro3,
    inputVideo1: raw.media?.inputVideo1 ?? BAZI_JOURNEY_VIDEOS.input1,
    inputVideo2: raw.media?.inputVideo2 ?? BAZI_JOURNEY_VIDEOS.input2,
  };

  const copy: ModelCopyConfig =
    raw.copy ??
    (ui_key === "bazi_v1"
      ? {
          introTitle: "韓國範山道令在此",
          introSubtitle: "先聽他說完這段故事，再開始為你排命",
          inputHeaderTitle: "八字命理",
          inputHeaderSubtitle: "輸入 → Result → 付款解鎖 Report",
        }
      : {
          introTitle: "開始你的命理旅程",
          introSubtitle: "請依步驟輸入資料",
          inputHeaderTitle: "輸入資料",
          inputHeaderSubtitle: "完成後即可查看結果",
        });

  const listing: ModelListingConfig = {
    image: resolveListingImage(modelId, slug ?? modelId, raw.listing?.image),
    description:
      raw.listing?.description ??
      raw.copy?.introSubtitle ??
      (ui_key === "bazi_v1"
        ? "完整八字命盤解讀，從性格、感情到事業與流年運勢"
        : undefined),
    view_count: raw.listing?.view_count,
    badge: raw.listing?.badge,
  };

  return {
    phases: raw.phases ?? ["result", "report"],
    page_count: raw.page_count,
    price_hkd: raw.price_hkd,
    result_entries_ref:
      raw.result_entries_ref ?? raw.pre_report_entries_ref,
    report_entries_ref: raw.report_entries_ref ?? raw.full_report_entries_ref,
    ui_key,
    media,
    copy,
    listing,
  };
}
