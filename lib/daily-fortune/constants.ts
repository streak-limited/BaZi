/** 生肖 → 五行（傳統） */
export const ZODIAC_WUXING: Record<string, string> = {
  鼠: "水",
  豬: "水",
  虎: "木",
  兔: "木",
  蛇: "火",
  馬: "火",
  猴: "金",
  雞: "金",
  牛: "土",
  龍: "土",
  羊: "土",
  狗: "土",
};

/** 簡體 → 繁體（lunar-javascript 回傳簡體生肖） */
export const SHENGXIAO_TO_TRAD: Record<string, string> = {
  鼠: "鼠",
  牛: "牛",
  虎: "虎",
  兔: "兔",
  龙: "龍",
  蛇: "蛇",
  马: "馬",
  羊: "羊",
  猴: "猴",
  鸡: "雞",
  狗: "狗",
  猪: "豬",
};

export const WUXING_COLORS: Record<string, string[]> = {
  金: ["白色", "金色", "銀色"],
  木: ["綠色", "青色", "翠綠"],
  水: ["黑色", "藍色", "灰色"],
  火: ["紅色", "紫色", "粉紅色"],
  土: ["黃色", "啡色", "卡其色"],
};

/** 五行相生：key 生 value */
export const XING_SHENG: Record<string, string> = {
  金: "水",
  水: "木",
  木: "火",
  火: "土",
  土: "金",
};

/** 五行相剋：key 剋 value */
export const XING_KE: Record<string, string> = {
  金: "木",
  木: "土",
  土: "水",
  水: "火",
  火: "金",
};

export const COLOR_HEX: Record<string, string> = {
  白色: "#f5f5f0",
  金色: "#d4af37",
  銀色: "#c0c0c0",
  綠色: "#2d6a4f",
  青色: "#3aafa9",
  翠綠: "#40916c",
  黑色: "#1a1a1a",
  藍色: "#3d5a80",
  灰色: "#6c757d",
  紅色: "#c1121f",
  紫色: "#7b2cbf",
  粉紅色: "#ff85a1",
  黃色: "#e9c46a",
  啡色: "#6f4e37",
  卡其色: "#b5a642",
  橙色: "#f77f00",
  橙黃色: "#fcbf49",
  鮮紅色: "#e63946",
  深紅色: "#9d0208",
  琥珀色: "#ff9f1c",
};

export const NUMEROLOGY_MAP: Record<
  number,
  { meaning: string; colors: string[]; hint: string }
> = {
  1: {
    meaning: "開創、新開始、領導力",
    colors: ["鮮紅色", "金色"],
    hint: "宜執行新計劃、主動出擊",
  },
  2: {
    meaning: "合作、和諧、敏感外交",
    colors: ["橙色", "橙黃色"],
    hint: "宜聆聽、團隊協作、約會",
  },
  3: {
    meaning: "表達、創意、社交活力",
    colors: ["黃色", "橙色"],
    hint: "宜分享想法、創作、輕鬆聚會",
  },
  4: {
    meaning: "穩健、紀律、打底建設",
    colors: ["啡色", "卡其色", "綠色"],
    hint: "宜整理、做計劃、處理細節",
  },
  5: {
    meaning: "變動、冒險、自由探索",
    colors: ["銀色", "灰色", "藍色"],
    hint: "宜短途出行、嘗試新事物",
  },
  6: {
    meaning: "照顧、責任、家庭和諧",
    colors: ["粉紅色", "藍色", "白色"],
    hint: "宜陪伴家人、美化空間",
  },
  7: {
    meaning: "內省、學習、直覺洞察",
    colors: ["紫色", "白色"],
    hint: "宜獨處思考、進修、早睡",
  },
  8: {
    meaning: "權力、財富、事業豐收",
    colors: ["深紅色", "啡色", "琥珀色"],
    hint: "宜談商務、理財、展現自信",
  },
  9: {
    meaning: "圓滿、回顧、釋放轉化",
    colors: ["紫色", "白色"],
    hint: "宜斷捨離、冥想、做總結",
  },
};
