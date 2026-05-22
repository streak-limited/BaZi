#!/usr/bin/env node
/**
 * Seed model_prompt_entries for bazi_full from pre-report-analysis.json
 * Run after 008 migration: npm run db:seed:prompts
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
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
        val = val.slice(1, -1);
      if (!process.env[key]) process.env[key] = val;
    }
  } catch { /* optional */ }
}

loadEnvLocal();

const MODEL_ID = "bazi_full";

/** AI prompts keyed by description — sync from lib/pre-report-prompts.ts when editing */
const AI_PROMPTS_BY_DESCRIPTION = {
  "AI 敘述：外表正經內心易傷": null,
  "AI 敘述：命格與翻轉": null,
  "AI 敘述：人生劇透": null,
  "AI 敘述：順勢與花鏡": null,
  "AI 敘述：財運時機": null,
};

const jsonPath = resolve(root, "refereence/pre-report-analysis.json");
const report = JSON.parse(readFileSync(jsonPath, "utf8"));

async function main() {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    console.error("Need SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }

  const { createClient } = await import("@supabase/supabase-js");
  const db = createClient(url, key, { auth: { persistSession: false } });

  const rows = report.entries.map((e) => {
    const entry_key = e.id || `p${e.page}-o${e.display_order}`;
    const prompt_template =
      e.type === "ai"
        ? (e.prompt ?? AI_PROMPTS_BY_DESCRIPTION[e.description] ?? null)
        : null;
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
      prompt_template,
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
  console.log(`Seeded ${rows.length} result entries for ${MODEL_ID}`);
  console.log("Edit prompts in Admin → Models → bazi_full → Result prompts");
}

main();
