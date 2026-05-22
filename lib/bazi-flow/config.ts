import type { UserFormInput } from "@/lib/user-input";
import {
  JOB_OPTIONS,
  RELATIONSHIP_OPTIONS,
  type CalendarType,
  type GenderChoice,
  type JobChoice,
  type RelationshipChoice,
  type SexualityChoice,
} from "@/lib/user-input";

const MEDIA =
  "https://wvgwlwaqlhewhobzauda.supabase.co/storage/v1/object/public/products-media/products/mzmudang-tw";

export const BAZI_FLOW_MEDIA = {
  immersionVideo: `${MEDIA}/immersion/mzmudang_immersion_1.mp4`,
  inputVideo1: `${MEDIA}/input/mzmudang_input_video_1.mp4`,
  inputVideo2: `${MEDIA}/input/mzmudang_input_video_2.mp4`,
} as const;

export type InputFieldKey = keyof Pick<
  UserFormInput,
  | "birthDate"
  | "calendarType"
  | "birthTime"
  | "birthTimeUnknown"
  | "gender"
  | "sexuality"
  | "relationship"
  | "job"
  | "name"
  | "email"
>;

export interface InputStepDef {
  id: string;
  field: InputFieldKey | "birthDateGroup";
  title: string;
  subtitle?: string;
  videoIndex?: 1 | 2;
}

/** One question per screen, aligned with 命主 onboarding fields */
export const INPUT_STEPS: InputStepDef[] = [
  {
    id: "birth",
    field: "birthDateGroup",
    title: "告訴我你的出生年月日",
    subtitle: "國曆或農曆都可以",
    videoIndex: 1,
  },
  {
    id: "time",
    field: "birthTime",
    title: "出生時間是幾點？",
    subtitle: "不知道可以勾選下方",
    videoIndex: 1,
  },
  {
    id: "gender",
    field: "gender",
    title: "你的性別是？",
    videoIndex: 1,
  },
  {
    id: "sexuality",
    field: "sexuality",
    title: "你的感情取向？",
    videoIndex: 2,
  },
  {
    id: "relationship",
    field: "relationship",
    title: "你現在的感情狀態？",
    videoIndex: 2,
  },
  {
    id: "job",
    field: "job",
    title: "你現在的狀態？",
    videoIndex: 2,
  },
  {
    id: "name",
    field: "name",
    title: "怎麼稱呼你？",
    subtitle: "可留空，之後再補",
    videoIndex: 2,
  },
  {
    id: "email",
    field: "email",
    title: "留下 Email（選填）",
    subtitle: "付款後寄完整報告連結",
    videoIndex: 2,
  },
];

export const GENDER_OPTIONS: GenderChoice[] = ["男生", "女生"];
export const SEXUALITY_OPTIONS: SexualityChoice[] = ["異性戀", "同性戀"];
export const CALENDAR_OPTIONS: { value: CalendarType; label: string }[] = [
  { value: "solar", label: "國曆" },
  { value: "lunar", label: "農曆" },
];

export { JOB_OPTIONS, RELATIONSHIP_OPTIONS };
