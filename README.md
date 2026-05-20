# BaZi

Next.js app bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## AI generation on `/report` (Gemini — works in HK)

OpenAI often returns **403 Country not supported** in Hong Kong. This project defaults to **Google Gemini**.

1. Get an API key: [Google AI Studio](https://aistudio.google.com/app/apikey) (free tier available).
2. In `.env.local`:

```bash
AI_PROVIDER=gemini
GEMINI_API_KEY=your-key-here
GEMINI_MODEL=gemini-3.1-flash-lite
```

3. Restart: `npm run dev`

**404 on gemini-1.5-flash?** That model is retired — use `gemini-3.1-flash-lite` or `gemini-2.5-flash-lite` (see your [rate limits](https://ai.dev/rate-limit)). **429?** Wait ~1 minute between clicks; the server tries fallback models automatically.
4. Open [/report](http://localhost:3000/report) → filter **AI** → **Generate**

To use OpenAI when your region allows it: set `AI_PROVIDER=openai` and `OPENAI_API_KEY=sk-...`.

## Database (`/report`)

每位 **命主** 獨立一筆記錄：表單、模型比較欄設定、各段 AI 生成結果。頁頂 **命主管理** 可切換／新增／刪除。

| 環境變數 | 行為 |
|----------|------|
| `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` | **Turso 雲端**（Vercel 建議） |
| 未設定 Turso | 本機 **`data/bazi.db`** |

```bash
# .env.local
TURSO_DATABASE_URL=libsql://bazi-xxx.turso.io
TURSO_AUTH_TOKEN=eyJ...
```

切換命主會載入該人已儲存的 prompt 變數與各模型 **Real output**。

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
