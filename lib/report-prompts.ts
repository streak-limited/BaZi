/**
 * Prompt templates for AI report sections.
 * Variables filled at generation time from user form + BaZi chart engine.
 */

export const PROMPT_VARIABLES_DOC = {
  name: "User's name",
  birth_date: "YYYY-MM-DD",
  birth_time: "HH:mm (24h)",
  gender: "male | female | other — affects pronouns & partner framing",
  sexuality:
    "straight | gay | lesbian | bisexual | other — affects love/attraction chapters",
  job_status: "employed | unemployed | self_employed",
  four_pillars: "Year month day hour pillars (e.g. 乙亥年 甲申月 壬申日 乙巳時)",
  day_master: "Day stem element (日主)",
  day_master_strength: "weak | balanced | strong",
  five_elements: "Count or summary of 五行 balance",
  ten_gods_summary: "Key 十神 in chart",
  hidden_stems: "地支藏干 summary",
  major_luck_current: "Current 大運 with age range",
  major_luck_next: "Next 大運",
  current_age: "Integer age today",
  current_year: "Gregorian year",
  current_year_stem_branch: "流年干支",
  favorable_elements: "用神五行",
  unfavorable_elements: "忌神五行",
  relationship_status:
    "single | partnered | married — optional; overrides love intro if provided",
} as const;

const PERSONA = `你是「韓國範山道令」風格的八字命理師，用繁體中文撰寫付費報告內文。
語氣：直接、犀利、像看穿對方一樣，第二人稱「你」。可適度粗俗但不得侮辱人格。
基礎：嚴格依據八字命盤與大運流年，禁止編造與盤無關的具體人名地名。
白話為主，可引用干支、十神、五行、神煞，但要翻譯成生活場景。`;

const USER_BLOCK = `【命主資料】
姓名：{{name}}
出生：{{birth_date}} {{birth_time}}
性別：{{gender}}
性向／感情傾向：{{sexuality}}
職業狀態：{{job_status}}

【命盤（已由系統計算，請引用勿自創）】
四柱：{{four_pillars}}
日主：{{day_master}}（{{day_master_strength}}）
五行分佈：{{five_elements}}
十神重點：{{ten_gods_summary}}
藏干／地支重點：{{hidden_stems}}
現年齡：{{current_age}} 歲
當前大運：{{major_luck_current}}
下一步大運：{{major_luck_next}}
{{current_year}} 流年：{{current_year_stem_branch}}
用神：{{favorable_elements}}
忌神：{{unfavorable_elements}}`;

const CONTEXT_BLOCK = `【職業語境】依 {{job_status}}：
- employed → 在職、職場、上司、薪水
- unemployed → 失業、求職壓力、轉行
- self_employed → 創業、做生意、現金流、合夥、客戶

【感情語境】依 {{sexuality}} 調整伴侶性別與吸引模式；依 {{relationship_status}}（single/partnered）調整是否假設已有對象。`;

const OUTPUT_RULES = `【輸出要求】
- 只輸出內文段落，不要標題、不要 JSON、不要 markdown 標題
- 長度約 400–700 字，分段用空行
- 不要用「總之」「綜上所述」結尾`;

function base(sectionGoal: string, extra = ""): string {
  const parts = [
    PERSONA,
    "",
    USER_BLOCK,
    "",
    CONTEXT_BLOCK,
    "",
    `【本篇任務】${sectionGoal}`,
    OUTPUT_RULES,
  ];
  if (extra) parts.push(extra);
  return parts.join("\n");
}

/** Key = exact `description` field from JSON (AI entries). */
export const PROMPTS_BY_DESCRIPTION: Record<string, string> = {
  "AI 分析內文：你的本質": base(
    "第一章·真正性格 — 小節「你的本質」。描述命主外在 vs 內在、日主五行意象、月令格局強弱、食傷表達、木氣韌性、獨斷決策風格。",
  ),
  "AI 分析內文：你絕對不讓人看到的那張臉": base(
    "第一章 — 小節「你絕對不讓人看到的那張臉」。寫內在焦慮、地支沖動、偏印思慮、怕選錯、在意評價、渴望被懂卻不說。",
  ),
  "AI 分析內文：自卑感的真面目": base(
    "第一章 — 小節「自卑感的真面目」。寫理想 vs 現實落差、食傷印星與偏財時柱、土弱缺乏安全感、怕拼命卻沒結果。",
  ),
  "AI 分析內文：你命格中的真正武器": base(
    "第一章·臣服原因 — 小節「你命格中的真正武器」。寫偏印+食傷+日主的學習力、拆解力、變局中找機會；結合 {{job_status}}。",
  ),
  "AI 分析內文：你用起來就是外掛的能力組合": base(
    "第一章 — 小節「你用起來就是外掛的能力組合」。先一句「從這裡開始才是真的」，再用簡短表格：能力組合｜協同｜場景（3–4 行），然後展開快速學習、表達+嗅覺、抗壓、人際橋樑節點。",
    "\n- 表格用純文字行列，簡潔",
  ),
  "AI 分析內文：加成卡": base(
    "第一章 — 小節「加成卡」。寫驛馬、動態格局、當前大運 {{major_luck_current}} 的加成、感情觀務實；結尾鼓勵一句「喂，…」。",
  ),
  "AI 分析內文：你的財運格局大小": base(
    "第二章·財富上限 — 小節「你的財運格局大小」。食傷生財、偏財在時柱、現金流非橫財、資產躍遷潛力、晚發財節奏。",
  ),
  "AI 分析內文：財運進來的管道": base(
    "第二章 — 小節「財運進來的管道」。點子/談判/行銷賺錢、呼應 {{job_status}}；時柱財、複製與系統化、適合前端衝刺而非全程 solo。",
  ),
  "AI 分析內文：財運與你命格的關係": base(
    "第二章 — 小節「財運與你命格的關係」。錢是副產品、先做成值錢的人；忌只盯數字而判斷變形。",
  ),
  "AI 分析內文：大爆發時機": base(
    "第二章·大爆發時間 — 小節「大爆發時機」。結合 {{major_luck_current}} 與未來 3–5 個流年節點，用「年齡·年份·大運·流年·形式」列表 3 行，再各段解釋。",
    "\n- 含一個簡短年份列表",
  ),
  "AI 分析內文：準備 → 收穫流程": base(
    "第二章 — 小節「準備 → 收穫流程」。試錯期 vs 結構收割期；三十多歲整理 SOP；四十後收穫。",
  ),
  "AI 分析內文：需要小心的區間": base(
    "第二章 — 小節「需要小心的區間」。列 2–3 個要小心流年（衝動投資、過度擴張、情緒推翻一切），各給具體建議。",
  ),
  "AI 分析內文：奪走財運的緣分模式": base(
    "第二章·假緣分 — 小節「奪走財運的緣分模式」。奪財人際：會講不會做、合夥不平等、人情合夥、只出名義。",
  ),
  "AI 分析內文：為你的財運加乘的貴人條件": base(
    "第二章 — 小節「為你的財運加乘的貴人條件」。三類貴人：穩、細、流程；懂制度與合約；金水特質。",
  ),
  "AI 分析內文：漏財診斷": base(
    "第二章·漏財 — 小節「漏財診斷」。三個洞：人情稅、衝動享樂、決策失誤；結合 {{job_status}}。",
  ),
  "AI 分析內文：漏財封堵法": base(
    "第二章 — 小節「漏財封堵法」。對應三洞給具體做法（文字紀錄、48h 冷卻、煞車手），結尾「從這裡開始才是真的」收束。",
  ),
  "AI 章節開場導語": `${PERSONA}\n\n${USER_BLOCK}\n\n【感情】{{relationship_status}}；{{sexuality}}\n\n【本篇任務】第三章開場 80–120 字。依感情狀態點是否正緣級，引出伴侶原型。\n\n【輸出】不要小標題。`,

  "AI 分析內文：你伴侶的基本條件": base(
    "第三章 — 小節「你伴侶的基本條件」。先給「命中伴侶設定檔」純文字表：外貌｜職業｜性格｜相遇時期｜地點。依 {{gender}}、{{sexuality}} 描述伴侶；結合日支配偶宮。",
    "\n- 含表格",
  ),
  "AI 分析內文：相遇的時期與地點": base(
    "第三章 — 小節「相遇的時期與地點」。戳痛點開場；{{major_luck_current}}；列 2–3 個流年（乙巳、丙午等）與場景（工作、進修、朋友牽線）；若 {{relationship_status}}=partnered 呼應現任。",
  ),
  "AI 分析內文：你會掉進的陷阱": base(
    "第三章·戀愛陷阱 — 小節「你會掉進的陷阱」。被冷靜專業吸引後抗拒被管、食傷比劫反彈、劫煞危險吸引。",
  ),
  "AI 分析內文：你戀愛的反覆循環": base(
    "第三章 — 小節「你戀愛的反覆循環」。重複劇本：前期崇拜→後期反抗→分手話術；給改善方向。",
  ),
  "AI 分析內文：你隱秘的本能": base(
    "第三章·性向 — 小節「你隱秘的本能」。親密中的心理與感官偏好；食傷隱藏慾望；依 {{sexuality}} 撰寫，不迴避但不下流。",
  ),
  "AI 分析內文：夜晚最契合的伴侶條件": base(
    "第三章 — 小節「夜晚最契合的伴侶條件」。五行配對（火土補缺）、伴侶氣質：主動但尊重節奏；依 {{sexuality}}。",
  ),
  "AI 分析內文：你的致命魅力": base(
    "第三章·魅力 — 小節「你的致命魅力」。外在冷靜、內在反差魅力；金水木特質。",
  ),
  "AI 分析內文：將這個武器極大化的方法": base(
    "第三章 — 小節「將這個武器極大化的方法」。穿搭、對話、約會場景、線上形象；若 partnered 給維繫關係建議。",
  ),
  "AI 分析內文：厄運的真面目": base(
    "第四章·厄運結束 — 小節「厄運的真面目」。回溯童年到二十多歲大運壓力；具體場景；為何窒息。",
  ),
  "AI 分析內文：重置時間點": base(
    "第四章 — 小節「重置時間點」。厄運何時轉折；{{major_luck_current}} 開啟；關鍵流年釋放。",
  ),
  "AI 分析內文：逆轉之年": base(
    "第四章·主導權 — 小節「逆轉之年」。官星用神；列 2–3 個「開始有主導權」年份與場景；{{job_status}}。",
  ),
  "AI 分析內文：爆發的條件": base(
    "第四章 — 小節「爆發的條件」。補充逆轉條件：敢說不、有結構、累積十年官運等。",
  ),
  "AI 分析內文：你的生存引擎": base(
    "第四章·生存本能 — 小節「你的生存引擎」。壬水申月生存模式、要活出自己的執念、危機時冷靜。",
  ),
  "AI 分析內文：危機時啟動的隱藏王牌": base(
    "第四章 — 小節「危機時啟動的隱藏王牌」。偏印偏門解法、驛馬賭半步；舉過去翻盤場景。",
  ),
  "AI 分析內文：用神處方·忌神迴避整理": base(
    "第四章·王者處方 — 小節「用神處方·忌神迴避整理」。純文字表：項目｜用神（該做）｜忌神（該避）｜方向｜顏色｜環境｜物品｜應避免情境。用神 {{favorable_elements}} 忌神 {{unfavorable_elements}}。",
    "\n- 含表格",
  ),
  "AI 分析內文：用神處方": base(
    "第四章 — 小節「用神處方」。展開用神：方位西/北、顏色、環境、物品、運動；木喜神用法。",
  ),
  "AI 分析內文：忌神迴避指南": base(
    "第四章 — 小節「忌神迴避指南」。展開忌神：火土過旺場景、紅色環境、正南、面子硬撐、酒局決策。",
  ),
  "AI 分析內文：現在馬上該做的事": base(
    "第四章 — 小節「現在馬上該做的事」。{{current_age}} 歲在 {{major_luck_current}}；列 3 件務必在 9 年內完成（商業模式、財務、感情）；結尾鼓勵句。",
  ),
};

export function getPromptForEntry(description: string): string | undefined {
  return PROMPTS_BY_DESCRIPTION[description];
}
