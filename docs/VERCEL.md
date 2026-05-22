# Vercel production checklist

Home (`/`) and product routes need **Supabase** on the server. A missing table or env var used to cause **500**; the app now falls back to in-code `MODEL_REGISTRY` when the DB is unreachable.

## Required environment variables

In [Vercel Dashboard](https://vercel.com) → Project → **Settings** → **Environment Variables** (Production + Preview):

| Variable | Value |
|----------|--------|
| `SUPABASE_URL` | `https://YOUR_REF.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key (not anon) |
| `NEXT_PUBLIC_APP_URL` | `https://ba-zi-ashy.vercel.app` (your production URL) |

Redeploy after adding or changing variables.

## Database migrations

Production Supabase must have schema through **007**:

1. SQL Editor → run `supabase/migrations/007_rename_models_and_tags.sql`  
   (or `npm run db:migrate:models` locally with `DATABASE_URL`)

Without 007, tags fall back to `config.tags` JSON; catalog falls back to `modal_templates` or registry.

## Verify

```bash
npm run db:migrate:check
```

Open `https://your-app.vercel.app/` — should list at least 八字完整命理報告.

## View server logs

Vercel → Project → **Deployments** → latest → **Functions** / **Runtime Logs**  
Look for `[listActiveModels]` or `[loadTagsForModels]` warnings.
