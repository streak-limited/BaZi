/**
 * 六十甲子籤圖片路徑（與 tutorial0/chouqian 相同命名：{id:02d}_{code}.jpg）
 * 來源：https://github.com/tutorial0/chouqian （台北新莊地藏庵籤詩圖）
 */
const JIAZI_CODES: readonly string[] = [
  "甲子", "甲寅", "甲辰", "甲午", "甲申", "甲戌",
  "乙丑", "乙卯", "乙巳", "乙未", "乙酉", "乙亥",
  "丙子", "丙寅", "丙辰", "丙午", "丙申", "丙戌",
  "丁丑", "丁卯", "丁巳", "丁未", "丁酉", "丁亥",
  "戊子", "戊寅", "戊辰", "戊午", "戊申", "戊戌",
  "己丑", "己卯", "己巳", "己未", "己酉", "己亥",
  "庚子", "庚寅", "庚辰", "庚午", "庚申", "庚戌",
  "辛丑", "辛卯", "辛巳", "辛未", "辛酉", "辛亥",
  "壬子", "壬寅", "壬辰", "壬午", "壬申", "壬戌",
  "癸丑", "癸卯", "癸巳", "癸未", "癸酉", "癸亥",
] as const;

export function jiaziLotImagePath(id: number, code?: string): string | null {
  if (id < 1 || id > 60) return null;
  const resolvedCode = code ?? JIAZI_CODES[id - 1];
  if (!resolvedCode) return null;
  return `/jiazi-lots/${String(id).padStart(2, "0")}_${resolvedCode}.jpg`;
}
