import { Lunar, Solar } from "lunar-javascript";
import type { UserFormInput } from "@/lib/user-input";
import {
  formatBirthDateForPrompt,
  mapGender,
  mapJobStatus,
  mapRelationship,
  mapSexuality,
  parseBirthDate,
  parseBirthTime,
} from "@/lib/user-input";

const GAN_ELEMENT: Record<string, string> = {
  甲: "木",
  乙: "木",
  丙: "火",
  丁: "火",
  戊: "土",
  己: "土",
  庚: "金",
  辛: "金",
  壬: "水",
  癸: "水",
};

const ZHI_ELEMENT: Record<string, string> = {
  子: "水",
  丑: "土",
  寅: "木",
  卯: "木",
  辰: "土",
  巳: "火",
  午: "火",
  未: "土",
  申: "金",
  酉: "金",
  戌: "土",
  亥: "水",
};

/** 生我、我生、克我、我克 */
const GENERATES: Record<string, string> = {
  木: "火",
  火: "土",
  土: "金",
  金: "水",
  水: "木",
};

const CONTROLS: Record<string, string> = {
  木: "土",
  土: "水",
  水: "火",
  火: "金",
  金: "木",
};

export interface BaziChart {
  fourPillars: string;
  fourPillarsShort: string;
  yearPillar: string;
  monthPillar: string;
  dayPillar: string;
  hourPillar: string;
  dayMaster: string;
  dayMasterElement: string;
  dayMasterStrength: "weak" | "balanced" | "strong";
  fiveElements: string;
  tenGodsSummary: string;
  hiddenStems: string;
  majorLuckCurrent: string;
  majorLuckNext: string;
  currentAge: number;
  currentYear: number;
  currentYearStemBranch: string;
  favorableElements: string;
  unfavorableElements: string;
  /** Multi-line block for form UI */
  displayBlock: string;
}

export interface PromptVariableMap extends Record<string, string> {
  name: string;
  birth_date: string;
  birth_time: string;
  gender: string;
  sexuality: string;
  job_status: string;
  relationship_status: string;
  email: string;
  four_pillars: string;
  day_master: string;
  day_master_strength: string;
  five_elements: string;
  ten_gods_summary: string;
  hidden_stems: string;
  major_luck_current: string;
  major_luck_next: string;
  current_age: string;
  current_year: string;
  current_year_stem_branch: string;
  favorable_elements: string;
  unfavorable_elements: string;
}

export interface BaziResult {
  chart: BaziChart | null;
  variables: PromptVariableMap | null;
  error: string | null;
}

function elementOfGan(gan: string): string {
  return GAN_ELEMENT[gan[0]] ?? "";
}

function countElements(stems: string[], branches: string[]): Record<string, number> {
  const counts: Record<string, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  for (const g of stems) {
    const el = elementOfGan(g);
    if (el) counts[el]++;
  }
  for (const z of branches) {
    const el = ZHI_ELEMENT[z[0]];
    if (el) counts[el]++;
  }
  return counts;
}

function assessStrength(dayElement: string, counts: Record<string, number>): BaziChart["dayMasterStrength"] {
  const self = counts[dayElement] ?? 0;
  const resource = Object.entries(counts).find(([el]) => GENERATES[el] === dayElement)?.[1] ?? 0;
  const drain =
    (counts[GENERATES[dayElement]] ?? 0) +
    (counts[CONTROLS[dayElement]] ?? 0) +
    (Object.entries(counts).find(([el]) => CONTROLS[el] === dayElement)?.[1] ?? 0);
  const support = self + resource;
  if (support >= drain + 2) return "strong";
  if (support + 1 < drain) return "weak";
  return "balanced";
}

function favorableUnfavorable(
  dayElement: string,
  strength: BaziChart["dayMasterStrength"],
): { favorable: string; unfavorable: string } {
  const resource = Object.entries(GENERATES).find(([, v]) => v === dayElement)?.[0] ?? "";
  const output = GENERATES[dayElement];
  const wealth = CONTROLS[dayElement];
  const officer = Object.entries(CONTROLS).find(([, v]) => v === dayElement)?.[0] ?? "";

  if (strength === "weak") {
    return {
      favorable: [resource, dayElement].filter(Boolean).join("、"),
      unfavorable: [output, wealth, officer].filter(Boolean).join("、"),
    };
  }
  if (strength === "strong") {
    return {
      favorable: [output, wealth, officer].filter(Boolean).join("、"),
      unfavorable: [resource, dayElement].filter(Boolean).join("、"),
    };
  }
  return {
    favorable: `${dayElement}（調候為主，需結合月令細論）`,
    unfavorable: "過旺之五行（依大運流年再論）",
  };
}

function formatFiveElements(counts: Record<string, number>): string {
  return ["木", "火", "土", "金", "水"]
    .map((el) => `${el}${counts[el] ?? 0}`)
    .join("、");
}

function buildSolar(
  input: UserFormInput,
  date: { y: number; m: number; d: number },
  time: { h: number; min: number },
): Solar {
  if (input.calendarType === "lunar") {
    const lunar = Lunar.fromYmd(date.y, date.m, date.d);
    const solar = lunar.getSolar();
    return Solar.fromYmdHms(
      solar.getYear(),
      solar.getMonth(),
      solar.getDay(),
      time.h,
      time.min,
      0,
    );
  }
  return Solar.fromYmdHms(date.y, date.m, date.d, time.h, time.min, 0);
}

export function calculateBazi(input: UserFormInput): BaziResult {
  const date = parseBirthDate(input.birthDate);
  if (!date) {
    return { chart: null, variables: null, error: "出生日期格式請用 YYYY.MM.DD" };
  }

  const time = input.birthTimeUnknown
    ? { h: 12, min: 0 }
    : parseBirthTime(input.birthTime);
  if (!time) {
    return { chart: null, variables: null, error: "出生時間請用 HH:mm，或勾選不知道時間" };
  }

  const solar = buildSolar(input, date, time);
  const lunar = solar.getLunar();
  const ec = lunar.getEightChar();

  const yearGz = ec.getYear();
  const monthGz = ec.getMonth();
  const dayGz = ec.getDay();
  const timeGz = ec.getTime();

  const fourPillarsShort = ec.toString();
  const fourPillars = `${yearGz}年 ${monthGz}月 ${dayGz}日 ${timeGz}時`;

  const dayStem = dayGz[0];
  const dayElement = elementOfGan(dayStem);
  const stems = [yearGz[0], monthGz[0], dayGz[0], timeGz[0]];
  const branches = [yearGz[1], monthGz[1], dayGz[1], timeGz[1]];
  const counts = countElements(stems, branches);
  const strength = assessStrength(dayElement, counts);
  const { favorable, unfavorable } = favorableUnfavorable(dayElement, strength);

  const tenGodsSummary = [
    `年干${ec.getYearShiShenGan()}、年支${(ec.getYearShiShenZhi() as string[]).join("/")}`,
    `月干${ec.getMonthShiShenGan()}、月支${(ec.getMonthShiShenZhi() as string[]).join("/")}`,
    `日干日主`,
    `時干${ec.getTimeShiShenGan()}、時支${(ec.getTimeShiShenZhi() as string[]).join("/")}`,
  ].join("；");

  const hiddenStems = [
    `年支${yearGz[1]}藏${(ec.getYearHideGan() as string[]).join("")}`,
    `月支${monthGz[1]}藏${(ec.getMonthHideGan() as string[]).join("")}`,
    `日支${dayGz[1]}藏${(ec.getDayHideGan() as string[]).join("")}`,
    `時支${timeGz[1]}藏${(ec.getTimeHideGan() as string[]).join("")}`,
  ].join("；");

  const sex = input.gender === "男生" ? 1 : 0;
  const yun = ec.getYun(sex);
  const daYun = yun.getDaYun().filter((d) => d.getGanZhi());

  const birthYear = solar.getYear();
  const now = new Date();
  const currentYear = now.getFullYear();
  let currentAge = currentYear - birthYear;
  const birthdayPassed =
    now.getMonth() + 1 > date.m ||
    (now.getMonth() + 1 === date.m && now.getDate() >= date.d);
  if (!birthdayPassed) currentAge -= 1;
  if (currentAge < 0) currentAge = 0;

  let currentLuck = daYun[0];
  let nextLuck = daYun[1];
  for (let i = 0; i < daYun.length; i++) {
    const d = daYun[i];
    if (currentAge >= d.getStartAge() && currentAge <= d.getEndAge()) {
      currentLuck = d;
      nextLuck = daYun[i + 1] ?? d;
      break;
    }
  }

  const majorLuckCurrent = currentLuck
    ? `${currentLuck.getGanZhi()}（${currentLuck.getStartAge()}–${currentLuck.getEndAge()} 歲）`
    : "—";
  const majorLuckNext = nextLuck
    ? `${nextLuck.getGanZhi()}（${nextLuck.getStartAge()}–${nextLuck.getEndAge()} 歲）`
    : "—";

  const todaySolar = Solar.fromDate(now);
  const currentYearStemBranch = todaySolar.getLunar().getYearInGanZhi();

  const chart: BaziChart = {
    fourPillars,
    fourPillarsShort,
    yearPillar: yearGz,
    monthPillar: monthGz,
    dayPillar: dayGz,
    hourPillar: timeGz,
    dayMaster: `${dayStem}${dayElement}（${dayGz}）`,
    dayMasterElement: dayElement,
    dayMasterStrength: strength,
    fiveElements: formatFiveElements(counts),
    tenGodsSummary,
    hiddenStems,
    majorLuckCurrent,
    majorLuckNext,
    currentAge,
    currentYear,
    currentYearStemBranch,
    favorableElements: favorable,
    unfavorableElements: unfavorable,
    displayBlock: [
      `四柱：${fourPillars}`,
      `日主：${dayStem}${dayElement}（${strength === "weak" ? "偏弱" : strength === "strong" ? "偏旺" : "中和"}）`,
      `五行：${formatFiveElements(counts)}`,
      `十神：${tenGodsSummary}`,
      `藏干：${hiddenStems}`,
      `現齡：${currentAge} 歲`,
      `當前大運：${majorLuckCurrent}`,
      `下一步大運：${majorLuckNext}`,
      `${currentYear} 流年：${currentYearStemBranch}`,
      `用神：${favorable}`,
      `忌神：${unfavorable}`,
    ].join("\n"),
  };

  const birthDateStr = formatBirthDateForPrompt(date);
  const birthTimeStr = input.birthTimeUnknown
    ? "未知（系統暫用 12:00 排時柱）"
    : input.birthTime;

  const variables: PromptVariableMap = {
    name: input.name.trim() || "（未填）",
    birth_date: birthDateStr,
    birth_time: birthTimeStr,
    gender: mapGender(input.gender),
    sexuality: mapSexuality(input.sexuality),
    job_status: mapJobStatus(input.job),
    relationship_status: mapRelationship(input.relationship),
    email: input.email.trim(),
    four_pillars: fourPillars,
    day_master: `${dayStem}（${dayElement}）`,
    day_master_strength: strength,
    five_elements: chart.fiveElements,
    ten_gods_summary: tenGodsSummary,
    hidden_stems: hiddenStems,
    major_luck_current: majorLuckCurrent,
    major_luck_next: majorLuckNext,
    current_age: String(currentAge),
    current_year: String(currentYear),
    current_year_stem_branch: currentYearStemBranch,
    favorable_elements: favorable,
    unfavorable_elements: unfavorable,
  };

  return { chart, variables, error: null };
}
