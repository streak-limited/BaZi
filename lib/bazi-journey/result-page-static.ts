/**
 * Result page layout — static copy & assets (not in CMS).
 * AI narratives: render order in result-ai-slots.ts (hardcoded UI).
 */
import { RESULT_AI_UI_SLOTS } from "@/lib/bazi-journey/result-ai-slots";
import type { ReportEntry } from "@/lib/report-types";
import preReportJson from "@/refereence/pre-report-analysis.json";

const TEASER_BASE =
  "https://wvgwlwaqlhewhobzauda.supabase.co/storage/v1/object/public/products-media/products/mzmudang-tw/teaser";

const layoutEntries = (preReportJson as { entries: ReportEntry[] }).entries.filter(
  (e) => e.type === "static" || e.type === "computed",
);

function bySection(section: string): ReportEntry[] {
  return layoutEntries
    .filter((e) => e.section === section)
    .sort((a, b) => a.display_order - b.display_order);
}

function content(section: string): string[] {
  return bySection(section).map((e) => e.content).filter(Boolean);
}

/** Default CMS slots when seeding (page + slot id 1…n — not UI order) */
export { RESULT_AI_UI_SLOTS as RESULT_AI_DEFAULT_SLOTS } from "@/lib/bazi-journey/result-ai-slots";

/** Hardcoded result page content (edit here, not in admin CMS) */
export const RESULT_PAGE_STATIC = {
  teaserBase: TEASER_BASE,
  heroVideo:
    bySection("hero_video")[0]?.content ??
    `${TEASER_BASE}/mzmudang_teaser_sales_video.mp4`,
  intro: bySection("intro"),
  personalityTags: content("personality_tags"),
  worry: bySection("worry_dialogue"),
  worryBg:
    bySection("worry_dialogue").find((e) => e.image_url)?.image_url ??
    `${TEASER_BASE}/04_worry_bg.png`,
  palzaBg: `${TEASER_BASE}/05_palza_bg.png`,
  flower: bySection("flower_mirror"),
  money: bySection("money_teaser"),
  expert: bySection("expert_card"),
  expertBg:
    bySection("expert_card").find((e) => e.description === "大師區背景")?.image_url ??
    `${TEASER_BASE}/20_price_character.png`,
  cta: bySection("cta")[0]?.content ?? "向韓國範山道令算命",
  introBg: `${TEASER_BASE}/03_intro_bg.png`,
  speechBubble: `${TEASER_BASE}/speech_bubble_2.svg`,
  unionDecoration: `${TEASER_BASE}/union_decoration.svg`,
  chapterDivider: `${TEASER_BASE}/chapter_divider.svg`,
  chapterPreviewBg: `${TEASER_BASE}/26_date_preview_3.png`,
  finalSajuBg: `${TEASER_BASE}/28_final_saju_bg.png`,
  chapterBorders: [
    `${TEASER_BASE}/chapter_border_2.svg`,
    `${TEASER_BASE}/chapter_border_2.svg`,
    `${TEASER_BASE}/chapter_border_3.svg`,
    `${TEASER_BASE}/chapter_border_4.svg`,
  ] as const,
  /** Report chapter teasers (static marketing copy on result page) */
  chapters: [
    {
      title: "第一章",
      lead: "你的內心我全都看穿了",
      bullets: [
        { muted: "就算死也不想被別人發現的\n", bold: "真正性格與隱藏的自卑感 👹" },
        {
          muted: "別人一邊罵你卻最終\n",
          bold: "只能臣服在你腳下的原因",
          tail: "\n（你命格中隱藏的真正武器 ✂️）",
        },
      ],
    },
    {
      title: "第二章",
      lead: "你內心真正的慾望\n其實更加赤裸且龐大吧。",
      bullets: [
        { muted: "[VIP 機密🚫] 刻在我命格裡\n", bold: "一輩子能摸到的「真正金錢」最大值" },
        {
          muted: "一輩子財運大爆發一次的命格？\n",
          bold: "「人生大翻身時間點圖表」📈",
        },
        { muted: "想吃掉我的蛇一般的假緣分\nvs 必須留在身邊的貴人辨別法", bold: "" },
        { muted: "現在正在不斷流失的\n", bold: "你錢包裡的3個漏財洞堵住法 🚨" },
      ],
    },
    {
      title: "第三章",
      lead: "噓...你的命格裡\n偏偏那些承受不住的東西都纏上來。",
      bullets: [
        { muted: "[命運卡📮]\n", bold: "即將出現在我面前的真正緣分檔案 🧑🏻‍🦰\n" },
        { muted: "我命格中的戀愛模式 💔\n", bold: "每次掉入同樣陷阱的原因" },
        {
          muted: "噓🤫 端莊外表下隱藏的\n",
          bold: "夜晚特別合拍的伴侶條件",
        },
      ],
    },
  ] as const,
} as const;

/** Layout entries for generation (static + computed slots, no AI) */
export function getResultLayoutEntries(): ReportEntry[] {
  return layoutEntries.map((e) => ({
    ...e,
    entry_key: e.entry_key ?? e.id,
    id: e.id ?? e.entry_key,
  }));
}

/** AI slot placeholders for generation fallback (page + slot id from result-ai-slots) */
export function getResultAiSlotEntries(): ReportEntry[] {
  const descriptions = (preReportJson as { entries: ReportEntry[] }).entries
    .filter((e) => e.type === "ai")
    .sort((a, b) => a.display_order - b.display_order);
  return RESULT_AI_UI_SLOTS.map((slot, i) => ({
    id: `ai-${slot.page}-${slot.slotId}`,
    entry_key: `ai-${slot.page}-${slot.slotId}`,
    page: slot.page,
    display_order: slot.slotId,
    type: "ai" as const,
    description: descriptions[i]?.description ?? `AI slot ${slot.slotId}`,
    content: "",
    section: "fortune_narrative",
  }));
}
