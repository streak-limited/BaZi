import type { DrawnLot } from "@/lib/fortune-lots/types";
import { isJiaziLot } from "@/lib/fortune-lots/draw";
import { LOT_SYSTEM_META } from "@/lib/fortune-lots/types";

export function sectionDescriptionForLot(lot: DrawnLot): string {
  return lot.system === "guanyin" ? "觀音靈籤 AI 解籤" : "六十甲子籤 AI 解籤";
}

export function buildFortuneLotPrompt(
  userQuestion: string,
  lot: DrawnLot,
): string {
  const meta = LOT_SYSTEM_META[lot.system];
  const jiazi = isJiaziLot(lot);

  const lotBlock = jiazi
    ? `- 籤號：第 ${lot.id} 支（${lot.code}）
   - 吉凶：${lot.level}
   - 籤詩原文：${lot.poem}
   - 卦頭典故：${lot.allusion}`
    : `- 籤號：第 ${lot.id} 首
   - 吉凶：${lot.level}
   - 籤詩原文：${lot.poem}
   - 歷史典故：${lot.allusion}`;

  const tone =
    lot.system === "guanyin"
      ? "語氣慈悲、溫柔，像觀音娘娘開示"
      : "語氣慈祥、包容，像媽祖娘娘（天上聖母）庇護海上善信，帶母性光輝與務實指引";

  return `你現在是【${meta.deity}】的 AI 替身，精通東方玄學、充滿智慧且富有同理心的虛擬解籤大師。

【當前上下文數據】
1. 用戶問的問題：${userQuestion.trim()}
2. 用戶抽到的${meta.label}：
${lotBlock}

【你的回覆指令】
1. 必須全程使用【地道廣東話／繁體中文】回覆（可夾雜口語「呢」「嘅」「唔使」）。
2. ${tone}，不可威嚇或詛咒。
3. 深度解籤：研讀典故，將故事寓意精準應用在用戶問題上；${jiazi ? "可點出天干地支「" + lot.code + "」的象意（不必深堆術語）。" : ""}
4. 現代化建議：不要宿命論；結合心理學，給可在現代生活實踐的具體行動指南。
5. 格式：分段輸出——①神明專屬問候 ②解讀籤詩與典故 ③具體建議。
6. 禁止虛構籤文、禁止更改籤號／吉凶／籤詩原文；禁止任何真人姓名、品牌。

【輸出要求】
- 全文字數約 400–700 字
- 只輸出解籤正文，不要 JSON、不要 markdown 標題符號（#）
- 勿輸出英文欄位或機器用語`;
}
