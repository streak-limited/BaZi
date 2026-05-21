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
        href: "/bazi/report",
        label: "完整報告",
        description: "20 頁 AI 報告 · 命主 · Gemini 生成",
      },
      {
        href: "/bazi/pre-report",
        label: "Pre-report 拆解",
        description: "範山道令導流單頁 · 內容拆解",
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
