import type { DrawnLot, GuanyinLot, JiaziLot, LotSystem } from "@/lib/fortune-lots/types";
import guanyinJson from "@/refereence/guanyin_100_complete.json";
import jiaziJson from "@/refereence/jiazi_60_complete.json";

const GUANYIN = guanyinJson as GuanyinLot[];
const JIAZI = jiaziJson as JiaziLot[];

const GUANYIN_BY_ID = new Map(GUANYIN.map((l) => [l.id, l]));
const JIAZI_BY_ID = new Map(JIAZI.map((l) => [l.id, l]));

export function drawLot(system: LotSystem): DrawnLot {
  if (system === "guanyin") {
    const id = Math.floor(Math.random() * 100) + 1;
    const lot = GUANYIN_BY_ID.get(id);
    if (!lot) throw new Error(`Missing guanyin lot ${id}`);
    return { ...lot, system: "guanyin" };
  }
  const id = Math.floor(Math.random() * 60) + 1;
  const lot = JIAZI_BY_ID.get(id);
  if (!lot) throw new Error(`Missing jiazi lot ${id}`);
  return { ...lot, system: "jiazi" };
}

export function getLotBySystemAndId(
  system: LotSystem,
  id: number,
): GuanyinLot | JiaziLot | undefined {
  if (system === "guanyin") return GUANYIN_BY_ID.get(id);
  return JIAZI_BY_ID.get(id);
}

export function isJiaziLot(lot: DrawnLot): lot is JiaziLot & { system: "jiazi" } {
  return lot.system === "jiazi";
}
