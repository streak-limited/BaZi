export type LotSystem = "guanyin" | "jiazi";

/** 觀音靈籤（100 首） */
export interface GuanyinLot {
  id: number;
  level: string;
  poem: string;
  allusion: string;
}

/** 六十甲子籤（60 首） */
export interface JiaziLot {
  id: number;
  code: string;
  level: string;
  poem: string;
  allusion: string;
}

export type DrawnLot =
  | (GuanyinLot & { system: "guanyin" })
  | (JiaziLot & { system: "jiazi" });

export const LOT_SYSTEM_META: Record<
  LotSystem,
  { label: string; deity: string; count: number; lotLabel: string }
> = {
  guanyin: {
    label: "觀音靈籤",
    deity: "觀音娘娘",
    count: 100,
    lotLabel: "觀音靈籤",
  },
  jiazi: {
    label: "六十甲子籤",
    deity: "媽祖娘娘（天上聖母）",
    count: 60,
    lotLabel: "六十甲子籤",
  },
};
