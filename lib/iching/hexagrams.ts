/**
 * 六十四卦 lookup（由下而上：初爻 = 字串第 1 位，上爻 = 第 6 位；1=陽 0=陰）
 */

import type { LineToss, YinYang } from "@/lib/iching/coins";

export interface HexagramInfo {
  binary: string;
  name: string;
  kingWenNumber: number;
  alias?: string;
}

/** binary (bottom→top) → 卦名 */
const BY_BINARY: Record<string, Omit<HexagramInfo, "binary">> = {
  "111111": { name: "乾", kingWenNumber: 1, alias: "乾為天" },
  "000000": { name: "坤", kingWenNumber: 2, alias: "坤為地" },
  "100010": { name: "屯", kingWenNumber: 3 },
  "010001": { name: "蒙", kingWenNumber: 4 },
  "111010": { name: "需", kingWenNumber: 5 },
  "010111": { name: "訟", kingWenNumber: 6 },
  "010000": { name: "師", kingWenNumber: 7 },
  "000010": { name: "比", kingWenNumber: 8 },
  "111011": { name: "小畜", kingWenNumber: 9 },
  "110111": { name: "履", kingWenNumber: 10 },
  "111000": { name: "泰", kingWenNumber: 11 },
  "000111": { name: "否", kingWenNumber: 12 },
  "101111": { name: "同人", kingWenNumber: 13 },
  "111101": { name: "大有", kingWenNumber: 14 },
  "001000": { name: "謙", kingWenNumber: 15 },
  "000100": { name: "豫", kingWenNumber: 16 },
  "100110": { name: "隨", kingWenNumber: 17 },
  "011001": { name: "蠱", kingWenNumber: 18 },
  "110000": { name: "臨", kingWenNumber: 19 },
  "000011": { name: "觀", kingWenNumber: 20 },
  "100101": { name: "噬嗑", kingWenNumber: 21 },
  "101001": { name: "賁", kingWenNumber: 22 },
  "000001": { name: "剝", kingWenNumber: 23 },
  "100000": { name: "復", kingWenNumber: 24 },
  "100111": { name: "無妄", kingWenNumber: 25 },
  "111001": { name: "大畜", kingWenNumber: 26 },
  "100001": { name: "頤", kingWenNumber: 27 },
  "011110": { name: "大過", kingWenNumber: 28 },
  "010010": { name: "坎", kingWenNumber: 29, alias: "坎為水" },
  "101101": { name: "離", kingWenNumber: 30, alias: "離為火" },
  "001110": { name: "咸", kingWenNumber: 31 },
  "011100": { name: "恆", kingWenNumber: 32 },
  "001111": { name: "遯", kingWenNumber: 33 },
  "111100": { name: "大壯", kingWenNumber: 34 },
  "000101": { name: "晉", kingWenNumber: 35, alias: "火地晉" },
  "101000": { name: "明夷", kingWenNumber: 36 },
  "101011": { name: "家人", kingWenNumber: 37 },
  "110101": { name: "睽", kingWenNumber: 38 },
  "001010": { name: "蹇", kingWenNumber: 39 },
  "010100": { name: "解", kingWenNumber: 40 },
  "110001": { name: "損", kingWenNumber: 41 },
  "100011": { name: "益", kingWenNumber: 42 },
  "111110": { name: "夬", kingWenNumber: 43 },
  "011111": { name: "姤", kingWenNumber: 44 },
  "000110": { name: "萃", kingWenNumber: 45 },
  "011000": { name: "升", kingWenNumber: 46 },
  "010110": { name: "困", kingWenNumber: 47 },
  "011010": { name: "井", kingWenNumber: 48 },
  "101110": { name: "革", kingWenNumber: 49 },
  "011101": { name: "鼎", kingWenNumber: 50 },
  "100100": { name: "震", kingWenNumber: 51, alias: "震為雷" },
  "001001": { name: "艮", kingWenNumber: 52, alias: "艮為山" },
  "001011": { name: "漸", kingWenNumber: 53 },
  "110100": { name: "歸妹", kingWenNumber: 54 },
  "101100": { name: "豐", kingWenNumber: 55 },
  "001101": { name: "旅", kingWenNumber: 56, alias: "火山旅" },
  "011011": { name: "巽", kingWenNumber: 57, alias: "巽為風" },
  "110110": { name: "兌", kingWenNumber: 58, alias: "兌為澤" },
  "010011": { name: "渙", kingWenNumber: 59 },
  "110010": { name: "節", kingWenNumber: 60 },
  "110011": { name: "中孚", kingWenNumber: 61 },
  "001100": { name: "小過", kingWenNumber: 62 },
  "101010": { name: "既濟", kingWenNumber: 63 },
  "010101": { name: "未濟", kingWenNumber: 64 },
};

function lineToBit(base: YinYang): "0" | "1" {
  return base === "yang" ? "1" : "0";
}

function flippedYinYang(base: YinYang): YinYang {
  return base === "yang" ? "yin" : "yang";
}

export function linesToBinary(
  lines: LineToss[],
  useChanged: boolean,
): string {
  return lines
    .map((l) => {
      const yinYang = useChanged && l.changing ? flippedYinYang(l.base) : l.base;
      return lineToBit(yinYang);
    })
    .join("");
}

export function lookupHexagram(binary: string): HexagramInfo {
  const hit = BY_BINARY[binary];
  if (!hit) {
    return { binary, name: "未知", kingWenNumber: 0 };
  }
  return { binary, ...hit };
}

export interface HexagramReading {
  question: string;
  lines: LineToss[];
  base: HexagramInfo;
  changed: HexagramInfo | null;
  changingPositions: number[];
}

export function buildReading(question: string, lines: LineToss[]): HexagramReading {
  const changingPositions = lines
    .filter((l) => l.changing)
    .map((l) => l.position);

  const baseBinary = linesToBinary(lines, false);
  const base = lookupHexagram(baseBinary);

  const changed =
    changingPositions.length > 0
      ? lookupHexagram(linesToBinary(lines, true))
      : null;

  return {
    question,
    lines,
    base,
    changed,
    changingPositions,
  };
}

/** 顯示用：上爻在上 */
export function formatLinesTopDown(lines: LineToss[]): LineToss[] {
  return [...lines].reverse();
}
