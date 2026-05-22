#!/usr/bin/env npx tsx
/**
 * Import CMS AI prompts:
 *   Result (5) ← pre-report-analysis.json
 *   Report (35) ← ai_generated_content.json + lib/report-prompts.ts
 *   npx tsx scripts/import-result-prompts.ts [modelId]
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import {
  buildReportDefaultSlots,
  buildResultDefaultSlots,
} from "../lib/products/prompt-defaults";
import { buildPromptSlotId } from "../lib/products/prompt-slot-id";

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

  const { data: modelRow, error: modelErr } = await db
    .from("models")
    .select("id, slug")
    .eq("id", MODEL_ID)
    .single();
  if (modelErr || !modelRow) {
    console.error("Model not found:", MODEL_ID);
    process.exit(1);
  }
  const slug = String(modelRow.slug);

  await db
    .from("model_prompt_entries")
    .delete()
    .eq("model_id", MODEL_ID)
    .in("phase", ["result", "report"]);

  const buildRows = (
    phase: "result" | "report",
    slots: ReturnType<typeof buildResultDefaultSlots>,
  ) =>
    slots.map((slot) => ({
      model_id: MODEL_ID,
      phase,
      entry_key: buildPromptSlotId(slug, phase, slot.page, slot.slotId),
      page: slot.page,
      display_order: slot.slotId,
      entry_type: "ai",
      description: slot.description,
      section: slot.section ?? null,
      static_content: null,
      prompt_template: slot.prompt,
      is_active: true,
    }));

  const resultSlots = buildResultDefaultSlots();
  const reportSlots = buildReportDefaultSlots();
  const rows = [
    ...buildRows("result", resultSlots),
    ...buildRows("report", reportSlots),
  ];

  const { error } = await db.from("model_prompt_entries").upsert(rows, {
    onConflict: "model_id,phase,page,display_order",
  });

  if (error) {
    console.error(error.message);
    process.exit(1);
  }
  console.log(
    `Imported ${resultSlots.length} result (pre-report-analysis.json) + ${reportSlots.length} report (ai_generated_content.json) for ${MODEL_ID} (${slug})`,
  );
  rows.forEach((r) => console.log(`  ${r.entry_key}`));
}

main();
