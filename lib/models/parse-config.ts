import { resolveListingImage } from "@/lib/models/listing-image";
import type { ModelConfig } from "@/lib/products/types";

const DEFAULT_MEDIA_BASE =
  "https://wvgwlwaqlhewhobzauda.supabase.co/storage/v1/object/public/products-media/products/mzmudang-tw";

export interface ModelMediaConfig {
  introVideo?: string;
  inputVideo1?: string;
  inputVideo2?: string;
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
    introVideo:
      raw.media?.introVideo ??
      `${DEFAULT_MEDIA_BASE}/immersion/mzmudang_immersion_1.mp4`,
    inputVideo1:
      raw.media?.inputVideo1 ??
      `${DEFAULT_MEDIA_BASE}/input/mzmudang_input_video_1.mp4`,
    inputVideo2:
      raw.media?.inputVideo2 ??
      `${DEFAULT_MEDIA_BASE}/input/mzmudang_input_video_2.mp4`,
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
