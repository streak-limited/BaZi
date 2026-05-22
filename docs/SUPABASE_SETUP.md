# Supabase setup (product flow)

## What the app needs

| Variable | Where |
|----------|--------|
| `SUPABASE_URL` | Project Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API → `service_role` (server only, never `NEXT_PUBLIC_`) |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` locally; production domain on Vercel |

Optional for CLI / automated migrations:

| Variable | Where |
|----------|--------|
| `DATABASE_URL` | Settings → Database → Connection string → URI |

## Run the migration (pick one)

### Option A — SQL Editor (fastest, one time)

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project → **SQL Editor**.
2. New query → paste entire file `supabase/migrations/001_product_flow.sql`.
3. **Run**.
4. Table Editor should show: `models`, `tags`, `model_tags`, `trials`, `trial_deliverables`, `payments`, `email_log`.

### Option B — npm script (repeatable)

1. Add database password URI to `.env.local`:

   ```bash
   DATABASE_URL=postgresql://postgres.[project-ref]:[PASSWORD]@....pooler.supabase.com:6543/postgres
   ```

2. Run:

   ```bash
   npm run db:migrate
   ```

### Option C — Supabase CLI (best for many migrations later)

See **[Supabase CLI guide](#supabase-cli-guide)** below.

## Verify

```bash
npm run db:migrate:check
```

Or complete `/bazi/flow` once — you should get a `/r/{token}` link and rows in `trials`.

## What I (the agent) can and cannot do

- **Can**: Read/write data via `SUPABASE_URL` + service role **after** tables exist (trials, deliverables, payments).
- **Cannot**: Open your Dashboard or run DDL without `DATABASE_URL` or `supabase login` on your machine.
- **Cannot**: Use the anon key alone for this app — all writes go through the Next.js server.

## Schema summary

See `docs/PRODUCT_FLOW.md`. Migration file: `supabase/migrations/001_product_flow.sql`.

---

## Supabase CLI guide

Install (macOS): `brew install supabase/tap/supabase` — you already have the CLI if `supabase --version` works.

### One-time setup (this repo)

From the project root:

```bash
cd /Users/sun/Documents/GitHub/BaZi

# 1) Log in (opens browser)
supabase login

# 2) Create config.toml + link to your cloud project
supabase init          # only if supabase/config.toml does not exist
supabase link --project-ref YOUR_PROJECT_REF
```

**Project ref** = subdomain in your API URL:

- `SUPABASE_URL=https://abcdefgh.supabase.co` → ref is `abcdefgh`
- Or Dashboard → Project Settings → General → **Reference ID**

`link` writes `supabase/.temp/project-ref` (gitignored). It does **not** put secrets in git.

### Apply migrations to cloud (what you want now)

```bash
supabase db push
```

This runs every `.sql` file in `supabase/migrations/` that is not yet applied on the remote database (including `001_product_flow.sql`).

Verify:

```bash
npm run db:migrate:check
```

### Common commands

| Command | Purpose |
|---------|---------|
| `supabase login` | Browser auth for CLI |
| `supabase link --project-ref REF` | Tie this folder to one cloud project |
| `supabase db push` | Apply local `migrations/*.sql` → **remote** DB |
| `supabase db pull` | Pull remote schema into a new migration (schema drift) |
| `supabase db diff -f name` | Generate migration from local vs remote diff |
| `supabase migration list` | See which migrations ran locally / remotely |
| `supabase projects list` | List projects in your account |
| `supabase status` | Local stack status (only if you use `supabase start`) |

### Local Supabase (optional — not required for this app)

```bash
supabase start    # Docker: local Postgres + Studio on http://localhost:54323
supabase stop
```

This project uses **hosted Supabase only** for the product flow. You do not need `supabase start` unless you want a full offline DB.

### Adding a new migration later

```bash
supabase migration new add_wealth_modal
# edit supabase/migrations/<timestamp>_add_wealth_modal.sql
supabase db push
```

### Troubleshooting

| Problem | Fix |
|---------|-----|
| `Access token not provided` | Run `supabase login` |
| `Project not linked` | Run `supabase link --project-ref ...` |
| `db push` says nothing to push | Migration already applied; check Table Editor |
| `config.toml` missing | Run `supabase init` in repo root |
| Push fails on pooler / SSL | Use Dashboard SQL Editor once, or `npm run db:migrate` with `DATABASE_URL` |
| `read: can't assign requested address` (CLI → `:5432`) | CLI often uses **direct** Postgres (port 5432). On VPN / corporate network / some ISPs this fails. **Workarounds:** (1) Disconnect VPN and retry `supabase db push`. (2) Paste migrations in **SQL Editor** (fastest), especially `007_rename_models_and_tags.sql`. (3) `npm run db:migrate:models` with pooler `DATABASE_URL`. (4) `supabase db push --db-url "$DATABASE_URL"`. |

After 001–006, run **`npm run db:migrate:models`** (or SQL Editor → `007_rename_models_and_tags.sql`) to rename `modal_templates` → `models` and create `tags` / `model_tags`.

**Note:** `supabase push` is not a valid command — use `supabase db push`.

### CLI vs service role key

| Tool | Uses |
|------|------|
| **CLI** (`db push`) | Your Supabase **account** + project link → changes **schema** |
| **App** (Next.js) | `SUPABASE_URL` + **service_role** → reads/writes **data** after schema exists |

They are complementary: CLI for migrations, service role for the running app.
