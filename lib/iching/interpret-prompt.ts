import type { HexagramReading } from "@/lib/iching/hexagrams";
import { formatLinesTopDown } from "@/lib/iching/hexagrams";

function hexLabel(h: { name: string; kingWenNumber: number; alias?: string }) {
  const extra = h.alias ? `（${h.alias}）` : "";
  return `第${h.kingWenNumber}卦 · ${h.name}${extra}`;
}

export function buildDivinationPrompt(reading: HexagramReading): string {
  const linesDesc = formatLinesTopDown(reading.lines)
    .map((l) => {
      const changeMark = l.changing ? "【變爻】" : "";
      return `第${l.position}爻 ${l.term} ${l.symbol} ${changeMark}（三錢：${l.coin1}+${l.coin2}+${l.coin3}=${l.sum}，機率${l.probability}）→ 本卦為${l.base === "yang" ? "陽" : "陰"}`;
    })
    .join("\n");

  const changedBlock = reading.changed
    ? `變卦：${hexLabel(reading.changed)}
變爻位置：第 ${reading.changingPositions.join("、")} 爻（老陰變陽、老陽變陰）`
    : "變卦：無（六爻皆靜，無老陰老陽）";

  return `Role: 你是一位精通《易經》、文王六爻，同時充滿同理心與現代心理學智慧的解卦大師。

任務: 根據用戶問題、本卦、變卦與變爻，用繁體中文撰寫解卦。語氣溫暖、睿智，帶一點玄學神秘感，切忌宿命論與迷信恐嚇；禁止出現任何真人姓名、品牌。

【用戶所問】
${reading.question.trim()}

【卦象資料（程式依三錢機率擲出，由下而上）】
本卦：${hexLabel(reading.base)}

${changedBlock}

【六爻明細（由上到下顯示）】
${linesDesc}

【解卦架構 — 請用以下四個小標題，每段 2–4 句白話】
1. 現狀分析（本卦）：目前局勢與心理狀態，對應所問之事。
2. 關鍵變數（變爻）：若有變爻，指出轉折點在哪、為何「物極必反」；若無變爻，說明局面相對穩定需注意什麼。
3. 未來走向（變卦）：若有變卦，順應變化後的局面；若無，依本卦延伸。
4. 大師建議：具體、現代化的行動指南，非絕對預言。

【輸出要求】
- 全文字數約 450–750 字
- 只輸出解卦正文，不要 JSON
- 小標題用「一、」「二、」這類即可
- 可適度引用卦名與爻位，但勿堆術語，每個詞都要讓一般人聽得懂`;
}

export const DIVINATION_SECTION_DESCRIPTION = "AI 問卦解卦";
