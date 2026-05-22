# Product flow architecture (Supabase)

Customer-facing flows (八字、財運、合盤…) share one scalable data model. **Modal** = product template; **Trial** = one paid (or demo) run for a user; **Deliverable** = saved AI/output per phase.

Turso/SQLite remains for **dev tools** (`report_sessions`, 命主 playground at `/bazi/report`). **Supabase** is the source of truth for **production trials**, payments, and shareable report links.

## Concepts

| Term | Meaning |
|------|---------|
| **Modal template** | Product SKU: `bazi_full`, `wealth_v1`, `synastry_love`, … Defines phases (pre_report, full_report), page count, Stripe price, prompt bundle. |
| **Trial** | One end-user journey: input → pre-report → pay → full report. Immutable `user_input` snapshot. |
| **Deliverable** | JSON blob per phase (`pre_report`, `full_report`). AI already run; link replays DB, not LLM. |
| **Public token** | Opaque id in URL `/r/{token}` — email + bookmark. |
| **Payment** | Stripe Checkout row linked to `trial_id`. |

## Status machine (trial)

```
started
  → pre_report_generating → pre_report_ready
  → checkout_pending (optional)
  → paid
  → full_generating → completed
  → failed (any phase)
```

## Database (Supabase)

See `supabase/migrations/001_product_flow.sql`.

- `modal_templates` — catalog of modals (seed `bazi_full`)
- `trials` — user run + `public_token` + status + `user_input` jsonb
- `trial_deliverables` — unique `(trial_id, phase, deliverable_key)` → `content` jsonb
- `payments` — Stripe session / amount / status
- `email_log` — report-ready emails (audit)

## URLs

| Path | Purpose |
|------|---------|
| `/bazi/flow` | Onboarding → pre-report → pay (creates trial) |
| `/r/[token]` | Hub: status, links to pre-report / full report |
| `/r/[token]/report` | **Single page** 20 sections, in-app page nav (scroll) |
| `/api/trials` | Create trial |
| `/api/trials/[token]` | Get trial + deliverables (public, token is secret) |
| `/api/stripe/webhook` | `checkout.session.completed` → mark paid |

## Stripe metadata

```json
{ "trial_id": "uuid", "modal_template_id": "bazi_full", "public_token": "..." }
```

Success URL: `/r/{public_token}?paid=1`

## Email (phase 2)

After `full_generating` → `completed`, queue email with link `https://app/r/{token}`.

Env: `RESEND_API_KEY` or stub log in dev.

## Adding a new modal

1. Insert row in `modal_templates` (or add to `lib/products/modal-registry.ts` seed).
2. Add prompt/static bundle under `refereence/` or `lib/report-prompts` keyed by `template_entries_ref`.
3. New flow route e.g. `/wealth/flow` — same APIs, different `modal_template_id`.
4. Optional custom pre-report UI; deliverables schema stays the same.

## Full report UI (20 pages)

One `page.tsx` at `/r/[token]/report`:

- Load `trial_deliverables` where `phase = 'full_report'`.
- `content.entries[]` merged with template static/computed (same shape as `ReportData`).
- Left/right or bottom **page navigator** 1–20 (reference `refereence/report_page_breakdown.json`).
- No 20 route files — section components keyed by `page` number.

## What is not in scope yet

- Background job queue for full 20-page generation (trigger stub after payment).
- Resend integration (logged only).
- RLS policies for anon read by token (service role server-side for v1).
