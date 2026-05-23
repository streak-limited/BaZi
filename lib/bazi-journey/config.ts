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

import { BAZI_JOURNEY_VIDEOS, type JourneyVideoSource } from "@/lib/bazi-journey/video-sources";

export type { JourneyVideoSource };

export const BAZI_JOURNEY_MEDIA = {
  welcomeVideo: BAZI_JOURNEY_VIDEOS.welcome,
  introVideo: BAZI_JOURNEY_VIDEOS.intro1,
  introVideo1: BAZI_JOURNEY_VIDEOS.intro1,
  introVideo2: BAZI_JOURNEY_VIDEOS.intro2,
  introVideo3: BAZI_JOURNEY_VIDEOS.intro3,
  inputVideo1: BAZI_JOURNEY_VIDEOS.input1,
  inputVideo2: BAZI_JOURNEY_VIDEOS.input2,
} as const;

/** @deprecated Use BAZI_JOURNEY_MEDIA */
export const BAZI_FLOW_MEDIA = {
  ...BAZI_JOURNEY_MEDIA,
  immersionVideo: BAZI_JOURNEY_MEDIA.introVideo,
};

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
    videoIndex: 1,
  },
  {
    id: "time",
    field: "birthTime",
    title: "出生時間是？",
    videoIndex: 1,
  },
  {
    id: "gender",
    field: "gender",
    title: "你的性別？",
    videoIndex: 1,
  },
  {
    id: "sexuality",
    field: "sexuality",
    title: "你的取向是什麼？",
    subtitle: "話說回來...",
    videoIndex: 2,
  },
  {
    id: "relationship",
    field: "relationship",
    title: "有對象嗎？",
    subtitle: "原來如此，",
    videoIndex: 2,
  },
  {
    id: "job",
    field: "job",
    title: "工作還順利嗎？",
    subtitle: "嗯嗯，",
    videoIndex: 2,
  },
  {
    id: "name",
    field: "name",
    title: "你叫什麼名字？",
    videoIndex: 2,
  },
  {
    id: "email",
    field: "email",
    title: "最後告訴我你的電子信箱",
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

export const SEXUALITY_LABELS: Record<SexualityChoice, string> = {
  異性戀: "異性戀 (Hetero)",
  同性戀: "同性戀 (LGBT+)",
};
