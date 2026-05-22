#!/usr/bin/env node
/**
 * Apply supabase/migrations/001_product_flow.sql via direct Postgres.
 *
 * Requires DATABASE_URL in .env.local (Supabase Dashboard → Settings → Database
 * → Connection string → URI, mode Session or Transaction).
 *
 *   npm run db:migrate
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnvLocal() {
  try {
    const raw = readFileSync(resolve(root, ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i < 0) continue;
      const key = t.slice(0, i).trim();
      let val = t.slice(i + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    /* optional */
  }
}

loadEnvLocal();

const databaseUrl =
  process.env.DATABASE_URL?.trim() ||
  process.env.SUPABASE_DB_URL?.trim();

if (!databaseUrl) {
  console.error(`
Missing DATABASE_URL in .env.local.

Get it from Supabase Dashboard:
  Project → Settings → Database → Connection string → URI
  (use the password you set when creating the project)

Example:
  DATABASE_URL=postgresql://postgres.[ref]:[YOUR-PASSWORD]@aws-0-....pooler.supabase.com:6543/postgres

Or run the SQL manually in Dashboard → SQL Editor:
  supabase/migrations/001_product_flow.sql
`);
  process.exit(1);
}

const sqlPath = resolve(root, "supabase/migrations/001_product_flow.sql");
const sql = readFileSync(sqlPath, "utf8");

const { default: pg } = await import("pg");

const client = new pg.Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  console.log("Applying", sqlPath);
  await client.query(sql);
  const { rows } = await client.query(
    "select id, display_name from public.modal_templates order by id",
  );
  console.log("OK — modal_templates:", rows);
} catch (err) {
  console.error("Migration failed:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
