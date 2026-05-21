import type { GuanyinLot } from "@/lib/guanyin/types";
import lotsJson from "@/refereence/guanyin_100_complete.json";

const LOTS = lotsJson as GuanyinLot[];

const BY_ID = new Map(LOTS.map((lot) => [lot.id, lot]));

/** 程式隨機 1–100，再從 JSON 撈籤（不用 AI 抽籤） */
export function drawGuanyinLot(): GuanyinLot {
  const id = Math.floor(Math.random() * 100) + 1;
  const lot = BY_ID.get(id);
  if (!lot) {
    throw new Error(`Missing lot id ${id}`);
  }
  return lot;
}

export function getLotById(id: number): GuanyinLot | undefined {
  return BY_ID.get(id);
}

export function getAllLots(): GuanyinLot[] {
  return LOTS;
}
