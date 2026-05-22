#!/usr/bin/env npx tsx
/**
 * Seed result prompts with full AI text (same as Admin → Import default)
 *   npx tsx scripts/import-result-prompts.ts [modelId]
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { getPreReportData } from "../lib/pre-report-data";
import { PRE_REPORT_PROMPTS_BY_DESCRIPTION } from "../lib/pre-report-prompts";

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
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
        val = val.slice(1, -1);
      if (!process.env[key]) process.env[key] = val;
    }
  } catch { /* */ }
}

loadEnvLocal();

const MODEL_ID = process.argv[2]?.trim() || "bazi_full";

async function main() {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    console.error("Need SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const db = createClient(url, key, { auth: { persistSession: false } });
  const report = getPreReportData();
  const rows = report.entries.map((e) => {
    const entry_key = e.id || `p${e.page}-o${e.display_order}`;
    return {
      model_id: MODEL_ID,
      phase: "result",
      entry_key,
      page: e.page,
      display_order: e.display_order,
      entry_type: e.type,
      description: e.description ?? "",
      section: e.section ?? null,
      static_content: e.type !== "ai" ? (e.content ?? null) : null,
      prompt_template:
        e.type === "ai"
          ? (e.prompt ?? PRE_REPORT_PROMPTS_BY_DESCRIPTION[e.description] ?? null)
          : null,
      image_url: e.image_url ?? null,
      image_url_proxy: e.image_url_proxy ?? null,
      is_active: true,
    };
  });

  const { error } = await db
    .from("model_prompt_entries")
    .upsert(rows, { onConflict: "model_id,phase,entry_key" });

  if (error) {
    console.error(error.message);
    process.exit(1);
  }
  console.log(`Imported ${rows.length} result prompt entries for ${MODEL_ID}`);
}

main();
