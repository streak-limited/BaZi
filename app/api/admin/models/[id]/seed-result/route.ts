import { requireAdminApi } from "@/lib/admin/require-admin";
import { getPreReportData } from "@/lib/pre-report-data";
import { PRE_REPORT_PROMPTS_BY_DESCRIPTION } from "@/lib/pre-report-prompts";
import { upsertPromptEntriesBulk } from "@/lib/products/prompt-store";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Import default result layout + AI prompts from code (pre-report-analysis.json) */
export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdminApi();
  if (denied) return denied;
  const { id: modelId } = await context.params;

  const report = getPreReportData();
  const entries = report.entries.map((e) => {
    const entry_key = e.id || `p${e.page}-o${e.display_order}`;
    return {
      entry_key,
      page: e.page,
      display_order: e.display_order,
      entry_type: e.type,
      description: e.description ?? "",
      section: e.section ?? null,
      static_content: e.type !== "ai" ? (e.content ?? null) : null,
      prompt_template:
        e.type === "ai"
          ? (e.prompt ??
            PRE_REPORT_PROMPTS_BY_DESCRIPTION[e.description] ??
            null)
          : null,
      image_url: e.image_url ?? null,
      image_url_proxy: e.image_url_proxy ?? null,
      is_active: true,
    };
  });

  const count = await upsertPromptEntriesBulk(modelId, "result", entries);
  return NextResponse.json({ ok: true, count });
}
