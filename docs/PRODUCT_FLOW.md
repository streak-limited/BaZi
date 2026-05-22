# Product flow architecture (Supabase)

Customer-facing flows share one scalable data model. **Model** = product template; **Trial** = one paid (or demo) run; **Deliverable** = saved AI/output per phase.

See [NAMING.md](./NAMING.md) for model vs UI-modal vs AI-model.

Turso/SQLite remains for **dev tools** (`report_sessions`, `/bazi/report`). **Supabase** is production source of truth for trials, payments, and shareable links.

## Concepts

| Term | Meaning |
|------|---------|
| **Model** | Product SKU in `models` table: `bazi_full`, future SKUs… |
| **Tag** | Home filter pill (`tags` + `model_tags` junction) |
| **Trial** | One user journey: input → result → pay → report |
| **Deliverable** | JSON per phase (`result`, `report`) |
| **Public token** | URL `/r/{token}` |

## Database (Supabase)

Migrations in `supabase/migrations/`.

| Table | Purpose |
|-------|---------|
| `models` | Product catalog (`slug`, `config` jsonb) |
| `tags` | Filter labels (戀愛, 財運, …) |
| `model_tags` | Many-to-many model ↔ tag |
| `trials` | User run + `model_id` + `public_token` |
| `trial_deliverables` | Output per phase |
| `payments` | Stripe |
| `email_log` | Report-ready emails |

Apply renames + tags: `007_rename_models_and_tags.sql` (after 001–006).

## URLs

| Path | Purpose |
|------|---------|
| `/` | Model listing + tag filter |
| `/m/{slug}/intro` | Immersion video |
| `/m/{slug}/input` | Input wizard |
| `/r/[token]/result` | Pre-pay teaser |
| `/r/[token]/report` | Full report |
| `/r/[token]?paid=1` | Payment success hub |

## Stripe metadata

```json
{ "trial_id": "uuid", "model_id": "bazi_full", "public_token": "..." }
```

## Adding a new model

1. Insert `models` row + `model_tags` links in Supabase.
2. Optional: register in `lib/products/model-registry.ts` for offline fallback.
3. If new UI: add bundle in `lib/models/ui-registry.tsx`.
