import { PRE_REPORT_LENGTH_BOUNDS } from "@/lib/pre-report-prompts";

/** Per-section length targets — sync with scripts/prompt_templates.py LENGTH_BY_DESCRIPTION */

import {
  ASTRO_NATAL_SECTION,
  ASTRO_SYNASTRY_SECTION,
  ASTRO_TRANSIT_SECTION,
} from "@/lib/astrology/prompts";

export const PROMPT_LENGTH_BOUNDS: Record<string, [number, number]> = {
  ...PRE_REPORT_LENGTH_BOUNDS,
  [ASTRO_NATAL_SECTION]: [280, 520],
  [ASTRO_SYNASTRY_SECTION]: [320, 580],
  [ASTRO_TRANSIT_SECTION]: [260, 480],
  "占星：合盤單相位": [70, 160],
  "AI 章節開場導語": [95, 120],
  "AI 分析內文：用神處方·忌神迴避整理": [180, 235],
  "AI 分析內文：財運與你命格的關係": [310, 395],
  "AI 分析內文：準備 → 收穫流程": [370, 475],
  "AI 分析內文：你的致命魅力": [415, 535],
  "AI 分析內文：你命格中的真正武器": [425, 545],
  "AI 分析內文：夜晚最契合的伴侶條件": [435, 560],
  "AI 分析內文：為你的財運加乘的貴人條件": [435, 560],
  "AI 分析內文：你隱秘的本能": [440, 570],
  "AI 分析內文：危機時啟動的隱藏王牌": [465, 600],
  "AI 分析內文：財運進來的管道": [470, 605],
  "AI 分析內文：忌神迴避指南": [475, 615],
  "AI 分析內文：爆發的條件": [475, 615],
  "AI 分析內文：你的生存引擎": [480, 620],
  "AI 分析內文：漏財診斷": [480, 620],
  "AI 分析內文：你伴侶的基本條件": [490, 635],
  "AI 分析內文：奪走財運的緣分模式": [505, 655],
  "AI 分析內文：需要小心的區間": [510, 660],
  "AI 分析內文：你的財運格局大小": [525, 675],
  "AI 分析內文：加成卡": [545, 700],
  "AI 分析內文：逆轉之年": [560, 725],
  "AI 分析內文：你絕對不讓人看到的那張臉": [580, 745],
  "AI 分析內文：將這個武器極大化的方法": [585, 755],
  "AI 分析內文：你用起來就是外掛的能力組合": [590, 760],
  "AI 分析內文：你會掉進的陷阱": [600, 770],
  "AI 分析內文：自卑感的真面目": [605, 775],
  "AI 分析內文：相遇的時期與地點": [610, 785],
  "AI 分析內文：你的本質": [615, 795],
  "AI 分析內文：重置時間點": [625, 805],
  "AI 分析內文：用神處方": [680, 865],
  "AI 分析內文：你戀愛的反覆循環": [705, 905],
  "AI 分析內文：大爆發時機": [735, 945],
  "AI 分析內文：漏財封堵法": [755, 970],
  "AI 分析內文：現在馬上該做的事": [800, 1025],
  "AI 分析內文：厄運的真面目": [1040, 1230],
  "AI 問卦解卦": [450, 750],
  "觀音靈籤 AI 解籤": [400, 700],
  "六十甲子籤 AI 解籤": [400, 700],
  "每日開運運程 AI": [180, 320],
};

/** Count Chinese body length (ignore spaces/newlines), matching editorial 字數. */
export function countReportChars(text: string): number {
  return text.replace(/\s/g, "").length;
}

export function getLengthBounds(
  sectionDescription?: string,
): [number, number] | undefined {
  if (!sectionDescription) return undefined;
  return PROMPT_LENGTH_BOUNDS[sectionDescription];
}

/** Rough token cap so model cannot ramble far beyond 字數上限. */
export function maxOutputTokensForSection(sectionDescription?: string): number {
  const bounds = getLengthBounds(sectionDescription);
  const hi = bounds?.[1] ?? 700;
  return Math.min(2048, Math.max(384, Math.ceil(hi * 2.2) + 128));
}

const OVER_RATIO = 1.12;

export function isOverLengthLimit(
  text: string,
  sectionDescription?: string,
): boolean {
  const bounds = getLengthBounds(sectionDescription);
  if (!bounds) return false;
  return countReportChars(text) > Math.ceil(bounds[1] * OVER_RATIO);
}

export function buildShortenFollowUp(
  text: string,
  sectionDescription: string,
): string {
  const bounds = getLengthBounds(sectionDescription);
  const hi = bounds?.[1] ?? 700;
  const lo = bounds?.[0] ?? 400;
  const current = countReportChars(text);
  return `【修訂】你剛寫了 ${current} 字，超出上限。請把以下內文壓縮到 ${lo}–${hi} 字，保留核心意思，刪掉重複與離題（尤其其他章節的內容）。只輸出修訂後內文：

${text}`;
}
