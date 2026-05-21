/**
 * 文王卦 · 三錢六爻 — 機率模型（每次 3 枚 0/1，和 0–3）
 */

export type YinYang = "yin" | "yang";

export interface LineToss {
  /** 第幾爻（1 = 初爻/最底，6 = 上爻） */
  position: number;
  coin1: 0 | 1;
  coin2: 0 | 1;
  coin3: 0 | 1;
  sum: 0 | 1 | 2 | 3;
  base: YinYang;
  changing: boolean;
  term: "老陰" | "少陽" | "少陰" | "老陽";
  symbol: string;
  probability: string;
}

function tossCoins(): Pick<
  LineToss,
  "coin1" | "coin2" | "coin3" | "sum" | "base" | "changing" | "term" | "symbol" | "probability"
> {
  const coin1 = Math.random() < 0.5 ? 0 : 1;
  const coin2 = Math.random() < 0.5 ? 0 : 1;
  const coin3 = Math.random() < 0.5 ? 0 : 1;
  const sum = (coin1 + coin2 + coin3) as 0 | 1 | 2 | 3;

  switch (sum) {
    case 0:
      return {
        coin1,
        coin2,
        coin3,
        sum,
        base: "yin",
        changing: true,
        term: "老陰",
        symbol: "❌",
        probability: "12.5%",
      };
    case 1:
      return {
        coin1,
        coin2,
        coin3,
        sum,
        base: "yang",
        changing: false,
        term: "少陽",
        symbol: "—",
        probability: "37.5%",
      };
    case 2:
      return {
        coin1,
        coin2,
        coin3,
        sum,
        base: "yin",
        changing: false,
        term: "少陰",
        symbol: "--",
        probability: "37.5%",
      };
    case 3:
      return {
        coin1,
        coin2,
        coin3,
        sum,
        base: "yang",
        changing: true,
        term: "老陽",
        symbol: "⭕",
        probability: "12.5%",
      };
  }
}

/** 擲一次 = 一爻；共 6 次，由下而上（初爻 → 上爻） */
export function tossOneLine(position: number): LineToss {
  return { position, ...tossCoins() };
}

export function generateHexagramLines(): LineToss[] {
  const lines: LineToss[] = [];
  for (let i = 1; i <= 6; i++) {
    lines.push(tossOneLine(i));
  }
  return lines;
}
