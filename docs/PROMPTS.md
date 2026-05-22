# AI prompt management

Only **AI** prompt templates are stored in Supabase and edited in admin. Static copy, images, and layout are **hardcoded** in the app.

## Where content lives

| Layer | Purpose |
|-------|---------|
| `model_prompt_entries` (Supabase, `entry_type = ai`) | AI `prompt_template` per `entry_key` |
| `lib/bazi-journey/result-page-static.ts` | Result page static + computed slot layout (from JSON, not CMS) |
| `app/bazi/intro/ResultView.tsx` | Renders static from `RESULT_PAGE_STATIC`; AI text from deliverable by `entry_key` |
| `lib/pre-report-prompts.ts` | Fallback AI prompts when DB row missing |

Generation merges code layout + DB AI prompts (`lib/products/generate-deliverable.ts`).

## Slot identifiers (auto-generated)

Admins set **`page`** + **`display_order`** only. The system derives:

`{model-slug}-{result|report}-{page}-{order}` → e.g. `bazi-full-report-result-1-40`

Unique in DB: `(model_id, phase, page, display_order)`.

**ResultView** renders AI blocks by sorting `type === "ai"` entries on page/order — no manual ids in components.

## Admin

1. Set `ADMIN_SECRET` in `.env.local`
2. Open `/admin/models`
3. Edit a model: slug, title, listing image, tags, price
4. **Result / Report** tabs: edit, add, remove **AI** prompt rows only
5. **Import default AI prompts** — 5 result slots + full prompt text from code

API routes (cookie auth): `/api/admin/models`, `/api/admin/prompts`, seed: `POST /api/admin/models/{id}/seed-result`

## Migrations & seed

```bash
npm run db:migrate:prompts    # 008_model_prompt_entries.sql
npx tsx scripts/import-result-prompts.ts   # AI prompts only; removes non-AI rows
```

Or paste `supabase/migrations/008_model_prompt_entries.sql` in Supabase SQL Editor.

## Live AI flags

| Env | Effect |
|-----|--------|
| `USE_LIVE_AI_RESULT=1` | Result API uses DB prompts + Gemini/OpenAI |
| `USE_LIVE_AI_REPORT=1` | Post-payment report uses DB prompts (report phase rows) |

Without these, demo JSON is used for faster local dev.

## Adding a new product model

1. Admin → **New model** (id, slug, title, tags, listing image)
2. Import or add `model_prompt_entries` for `result` and `report`
3. Point UI components at `entry_key` values from your prompt list
4. Optionally clone prompts from an existing model in SQL or admin

This lets you ship new models without redeploying prompt strings.
