import type { UserFormInput } from "@/lib/user-input";

export type WuxingRelationKind = "great" | "good" | "clash" | "neutral";

export interface ColorSwatch {
  name: string;
  hex: string;
}

export interface DailyFortuneComputed {
  dateKey: string;
  dateLabel: string;
  todayPillar: string;
  todayStem: string;
  todayBranch: string;
  todayBranchElement: string;
  zodiac: string;
  zodiacElement: string;
  constellation: string;
  wuxing: {
    kind: WuxingRelationKind;
    label: string;
    detail: string;
    todayElement: string;
    userElement: string;
    bridgeElement?: string;
    colors: string[];
  };
  numerology: {
    lifePath: number;
    personalDay: number;
    meaning: string;
    colors: string[];
    hint: string;
  };
  bazi: {
    fourPillars: string;
    dayMaster: string;
    dayMasterElement: string;
    fiveElements: string;
    favorableElements: string;
    unfavorableElements: string;
    currentYearStemBranch: string;
    currentAge: number;
  };
  summary: {
    mergedColors: string[];
    swatches: ColorSwatch[];
    luckyHours: string[];
    cautions: string[];
    energyLine: string;
  };
}

export interface DailyFortuneComputeRequest {
  input: UserFormInput;
  /** YYYY-MM-DD; defaults to server local today */
  date?: string;
}

export const DAILY_FORTUNE_SECTION = "每日開運運程 AI";
