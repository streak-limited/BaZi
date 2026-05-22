#!/usr/bin/env node
/**
 * Apply all supabase/migrations/*.sql in order via DATABASE_URL (pooler OK).
 *
 *   npm run db:migrate:all
 */
import { readFileSync, readdirSync } from "node:fs";
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

Supabase Dashboard → Settings → Database → Connection string → URI
(use pooler host, port 6543)

Then: npm run db:migrate:all
`);
  process.exit(1);
}

const migrationsDir = resolve(root, "supabase/migrations");
const onlyFile = process.argv[2]?.trim();
const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .filter((f) => !onlyFile || f === onlyFile || f.includes(onlyFile))
  .sort();

if (files.length === 0) {
  console.error("No migration files matched.", onlyFile ?? "");
  process.exit(1);
}

const { default: pg } = await import("pg");
const client = new pg.Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  for (const file of files) {
    const path = resolve(migrationsDir, file);
    const sql = readFileSync(path, "utf8");
    console.log("Applying", file, "…");
    await client.query(sql);
    console.log("  OK");
  }
  const { rows } = await client.query(
    "select id, slug, display_name from public.models order by id",
  );
  console.log("\nmodels:", rows);
} catch (err) {
  console.error("Migration failed:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
