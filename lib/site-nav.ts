export interface SiteNavItem {
  href: string;
  label: string;
  description?: string;
}

export interface SiteNavGroup {
  title: string;
  items: SiteNavItem[];
}

/** Central menu — keep in sync with app routes */
export const SITE_NAV_GROUPS: SiteNavGroup[] = [
  {
    title: "八字",
    items: [
      {
        href: "/bazi/intro",
        label: "開始八字",
        description: "Intro → Input → Result → Report",
      },
      {
        href: "/bazi/input",
        label: "輸入命盤",
        description: "8 項資料 → AI result",
      },
      {
        href: "/bazi/report",
        label: "Report 開發台",
        description: "20 頁 · 命主 · Gemini（Turso 開發用）",
      },
      {
        href: "/bazi/result",
        label: "Result 模板拆解",
        description: "導流 + 付款頁靜態模板（開發用）",
      },
    ],
  },
  {
    title: "占卜",
    items: [
      {
        href: "/ask-gua",
        label: "AI 問卦",
        description: "易經三枚銅錢 · 解卦報告",
      },
      {
        href: "/fortune-lots",
        label: "靈籤求籤",
        description: "觀音靈籤 · 六十甲子籤",
      },
    ],
  },
  {
    title: "星盤",
    items: [
      {
        href: "/astrology",
        label: "西洋星盤",
        description: "個人解碼 · 合盤 · 行運 · pyswisseph",
      },
    ],
  },
  {
    title: "每日",
    items: [
      {
        href: "/daily-fortune",
        label: "每日開運",
        description: "五行 · 靈數 · 八字 · 穿搭指引",
      },
    ],
  },
];

export const HOME_HREF = "/";
