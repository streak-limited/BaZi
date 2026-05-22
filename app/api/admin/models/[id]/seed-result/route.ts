import { requireAdminApi } from "@/lib/admin/require-admin";
import {
  buildReportDefaultSlots,
  buildResultDefaultSlots,
  slotsToPromptEntries,
} from "@/lib/products/prompt-defaults";
import { getModelById } from "@/lib/products/model-store";
import { upsertPromptEntriesBulk } from "@/lib/products/prompt-store";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Import default AI prompts: result (pre-report JSON) + report (full report JSON). */
export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdminApi();
  if (denied) return denied;
  const { id: modelId } = await context.params;

  const model = await getModelById(modelId);
  if (!model) {
    return NextResponse.json({ error: "Model not found" }, { status: 404 });
  }

  const db = getSupabaseAdmin();
  await db
    .from("model_prompt_entries")
    .delete()
    .eq("model_id", modelId)
    .in("phase", ["result", "report"]);

  const resultSlots = buildResultDefaultSlots();
  const reportSlots = buildReportDefaultSlots();

  const resultCount = await upsertPromptEntriesBulk(
    modelId,
    "result",
    slotsToPromptEntries(resultSlots),
    model.slug,
  );

  const reportCount = await upsertPromptEntriesBulk(
    modelId,
    "report",
    slotsToPromptEntries(reportSlots),
    model.slug,
  );

  return NextResponse.json({
    ok: true,
    count: resultCount,
    reportCount,
    sources: {
      result: "refereence/pre-report-analysis.json",
      report: "refereence/ai_generated_content.json",
    },
  });
}
