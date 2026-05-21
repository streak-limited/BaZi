import {
  WUXING_COLORS,
  XING_KE,
  XING_SHENG,
} from "@/lib/daily-fortune/constants";
import type { WuxingRelationKind } from "@/lib/daily-fortune/types";

export interface WuxingRelationResult {
  kind: WuxingRelationKind;
  label: string;
  detail: string;
  todayElement: string;
  userElement: string;
  bridgeElement?: string;
  colors: string[];
}

function uniqueColors(...groups: string[][]): string[] {
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
  return out;
}

export function computeWuxingRelation(
  todayElement: string,
  userElement: string,
): WuxingRelationResult {
  const todayColors = WUXING_COLORS[todayElement] ?? [];
  const userColors = WUXING_COLORS[userElement] ?? [];

  if (XING_SHENG[todayElement] === userElement) {
    return {
      kind: "great",
      label: `${todayElement}生${userElement} · 大吉`,
      detail: `今日日支五行「${todayElement}」生你的生肖五行「${userElement}」，貴氣相扶。`,
      todayElement,
      userElement,
      colors: uniqueColors(todayColors, userColors),
    };
  }

  if (todayElement === userElement) {
    return {
      kind: "good",
      label: `${todayElement}比旺 · 次吉`,
      detail: `今日與你的本命五行同屬「${todayElement}」，同氣相求，穩中有進。`,
      todayElement,
      userElement,
      colors: uniqueColors(userColors, todayColors),
    };
  }

  const todayKeUser = XING_KE[todayElement] === userElement;
  const userKeToday = XING_KE[userElement] === todayElement;

  if (todayKeUser || userKeToday) {
    const bridgeElement = todayKeUser
      ? XING_SHENG[todayElement]
      : XING_SHENG[userElement];
    const bridgeColors = bridgeElement
      ? (WUXING_COLORS[bridgeElement] ?? [])
      : [];
    const clashDesc = todayKeUser
      ? `今日「${todayElement}」剋你的「${userElement}」`
      : `你的「${userElement}」剋今日「${todayElement}」`;
    return {
      kind: "clash",
      label: "相剋 · 宜通關",
      detail: `${clashDesc}，宜以「${bridgeElement ?? "土"}」五行色通關（生克連環化解）。`,
      todayElement,
      userElement,
      bridgeElement,
      colors: uniqueColors(bridgeColors, userColors.slice(0, 1)),
    };
  }

  return {
    kind: "neutral",
    label: "平和",
    detail: `今日「${todayElement}」與你的「${userElement}」無明顯生剋，以穩為主。`,
    todayElement,
    userElement,
    colors: uniqueColors(userColors, todayColors.slice(0, 2)),
  };
}
