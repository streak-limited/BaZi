import { Solar } from "lunar-javascript";
import { calculateBazi } from "@/lib/bazi/calculate";
import type { UserFormInput } from "@/lib/user-input";
import { parseBirthDate } from "@/lib/user-input";
import {
  COLOR_HEX,
  SHENGXIAO_TO_TRAD,
  WUXING_COLORS,
  ZODIAC_WUXING,
} from "@/lib/daily-fortune/constants";
import { constellationFromSolar } from "@/lib/daily-fortune/constellation";
import {
  calculateLifePath,
  calculatePersonalDay,
  getNumerologyEntry,
} from "@/lib/daily-fortune/numerology";
import type { ColorSwatch, DailyFortuneComputed } from "@/lib/daily-fortune/types";
import { computeWuxingRelation } from "@/lib/daily-fortune/wuxing-relation";

const ZHI_ELEMENT_LOCAL: Record<string, string> = {
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

const ELEMENT_HOURS: Record<string, string> = {
  木: "05:00–09:00（卯、辰時，木氣漸旺）",
  火: "09:00–13:00（巳、午時，陽火最盛）",
  土: "13:00–17:00（未、申時，土氣承轉）",
  金: "15:00–19:00（申、酉時，金氣當令）",
  水: "21:00–01:00（亥、子時，水氣潛藏）",
};

function parseDateKey(dateKey: string): { y: number; m: number; d: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!m) return null;
  return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
}

function todayDateKey(ref?: Date): string {
  const d = ref ?? new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toSwatches(names: string[]): ColorSwatch[] {
  return names.map((name) => ({
    name,
    hex: COLOR_HEX[name] ?? "#888888",
  }));
}

function mergeColorNames(...groups: string[][]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const g of groups) {
    for (const c of g) {
      if (!seen.has(c)) {
        seen.add(c);
        out.push(c);
      }
    }
  }
  return out.slice(0, 8);
}

export function computeDailyFortune(
  input: UserFormInput,
  options?: { date?: string; referenceDate?: Date },
): { result: DailyFortuneComputed | null; error: string | null } {
  const birth = parseBirthDate(input.birthDate);
  if (!birth) {
    return { result: null, error: "出生日期格式請用 YYYY.MM.DD 或 YYYY-MM-DD" };
  }

  const bazi = calculateBazi(input);
  if (!bazi.chart || bazi.error) {
    return { result: null, error: bazi.error ?? "八字計算失敗" };
  }

  const dateKey = options?.date ?? todayDateKey(options?.referenceDate);
  const target = parseDateKey(dateKey);
  if (!target) {
    return { result: null, error: "日期格式請用 YYYY-MM-DD" };
  }

  const todaySolar = Solar.fromYmdHms(target.y, target.m, target.d, 12, 0, 0);
  const todayLunar = todaySolar.getLunar();
  const todayPillar = todayLunar.getDayInGanZhi();
  const todayStem = todayPillar[0] ?? "";
  const todayBranch = todayPillar[1] ?? "";
  const todayBranchElement = ZHI_ELEMENT_LOCAL[todayBranch] ?? "";

  const birthSolar = Solar.fromYmdHms(birth.y, birth.m, birth.d, 12, 0, 0);
  const rawZodiac = birthSolar.getLunar().getYearShengXiao();
  const zodiac = SHENGXIAO_TO_TRAD[rawZodiac] ?? rawZodiac;
  const zodiacElement = ZODIAC_WUXING[zodiac] ?? "";

  const constellation = constellationFromSolar(birth.m, birth.d);

  const wuxing = computeWuxingRelation(todayBranchElement, zodiacElement);

  const personalDay = calculatePersonalDay(
    birth.m,
    birth.d,
    target.y,
    target.m,
    target.d,
  );
  const lifePath = calculateLifePath(birth.y, birth.m, birth.d);
  const numEntry = getNumerologyEntry(personalDay);

  const favorableList = bazi.chart.favorableElements
    .split("、")
    .map((s) => s.replace(/（.*?）/g, "").trim())
    .filter(Boolean);
  const baziColors = favorableList.flatMap((el) => WUXING_COLORS[el] ?? []).slice(0, 3);

  const mergedColors = mergeColorNames(
    wuxing.colors,
    numEntry.colors,
    baziColors,
  );

  const luckyHours = [
    ELEMENT_HOURS[todayBranchElement],
    favorableList[0] ? ELEMENT_HOURS[favorableList[0]] : null,
  ].filter(Boolean) as string[];

  const cautions: string[] = [];
  if (wuxing.kind === "clash") {
    cautions.push("今日五行相剋，避免衝動簽約、大额投资或硬碰硬爭拗。");
  }
  if (bazi.chart.unfavorableElements) {
    cautions.push(`八字宜避：${bazi.chart.unfavorableElements}過旺之氣。`);
  }
  cautions.push(`生命靈數個人日 ${personalDay}：${numEntry.hint}`);

  const energyLine =
    wuxing.kind === "great"
      ? "整體能量偏旺，適合主動出擊。"
      : wuxing.kind === "good"
        ? "能量平穩，適合按部就班。"
        : wuxing.kind === "clash"
          ? "能量有阻力，宜以通關色與耐心化解。"
          : "能量中性，重在自律與節奏。";

  const dateLabel = `${target.y}年${target.m}月${target.d}日（${todayPillar}日 · ${todayBranch}支屬${todayBranchElement}）`;

  return {
    result: {
      dateKey,
      dateLabel,
      todayPillar,
      todayStem,
      todayBranch,
      todayBranchElement,
      zodiac,
      zodiacElement,
      constellation,
      wuxing: {
        kind: wuxing.kind,
        label: wuxing.label,
        detail: wuxing.detail,
        todayElement: wuxing.todayElement,
        userElement: wuxing.userElement,
        bridgeElement: wuxing.bridgeElement,
        colors: wuxing.colors,
      },
      numerology: {
        lifePath,
        personalDay,
        meaning: numEntry.meaning,
        colors: numEntry.colors,
        hint: numEntry.hint,
      },
      bazi: {
        fourPillars: bazi.chart.fourPillars,
        dayMaster: bazi.chart.dayMaster,
        dayMasterElement: bazi.chart.dayMasterElement,
        fiveElements: bazi.chart.fiveElements,
        favorableElements: bazi.chart.favorableElements,
        unfavorableElements: bazi.chart.unfavorableElements,
        currentYearStemBranch: bazi.chart.currentYearStemBranch,
        currentAge: bazi.chart.currentAge,
      },
      summary: {
        mergedColors,
        swatches: toSwatches(mergedColors),
        luckyHours,
        cautions,
        energyLine,
      },
    },
    error: null,
  };
}
