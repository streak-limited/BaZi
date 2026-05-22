# AI prompt management

Prompts for the **result** (payment teaser) and **report** (full deliverable) phases live in Supabase, not only in TypeScript files.

## Where prompts live

| Layer | Purpose |
|-------|---------|
| `model_prompt_entries` (Supabase) | Source of truth: layout slots, `entry_key`, AI `prompt_template`, static copy |
| `lib/pre-report-prompts.ts` | Legacy fallback when DB has no rows |
| `refereence/pre-report-analysis.json` | Legacy layout fallback for result phase |

Generation reads DB first (`lib/products/generate-deliverable.ts`), then falls back to code.

## Stable identifiers

Each row has:

- **`entry_key`** — stable id used in deliverables and UI, e.g. `pre-ai-narrative-1`
- **`phase`** — `result` or `report`
- **`entry_type`** — `static` | `computed` | `ai`

After generation, each deliverable entry keeps `entry_key` (and `id` alias). Use helpers in `lib/report/entries.ts`:

```ts
import { entryByKey, entryContentByKey } from "@/lib/report/entries";

const text = entryContentByKey(entries, "pre-ai-narrative-1");
```

## Admin

1. Set `ADMIN_SECRET` in `.env.local`
2. Open `/admin/models`
3. Edit a model: slug, title, listing image, tags, price
4. **Result / Report** tabs: edit, add, remove prompt rows
5. **Import default result layout** — copies from `pre-report-analysis.json` + `pre-report-prompts.ts`

API routes (cookie auth): `/api/admin/models`, `/api/admin/prompts`, seed: `POST /api/admin/models/{id}/seed-result`

## Migrations & seed

```bash
npm run db:migrate:prompts    # 008_model_prompt_entries.sql
npm run db:seed:prompts       # optional CLI seed (structure only; use Admin import for full prompts)
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
