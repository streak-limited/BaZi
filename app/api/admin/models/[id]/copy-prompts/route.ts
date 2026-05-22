import { requireAdminApi } from "@/lib/admin/require-admin";
import { getModelById } from "@/lib/products/model-store";
import {
  listPromptEntries,
  upsertPromptEntriesBulk,
} from "@/lib/products/prompt-store";
import type { PromptPhase } from "@/lib/products/prompt-types";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Copy AI prompts from one phase to another (e.g. result → report) */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdminApi();
  if (denied) return denied;
  const { id: modelId } = await context.params;

  let body: { from?: PromptPhase; to?: PromptPhase };
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const from = (body.from ?? "result") as PromptPhase;
  const to = (body.to ?? "report") as PromptPhase;

  const model = await getModelById(modelId);
  if (!model) {
    return NextResponse.json({ error: "Model not found" }, { status: 404 });
  }

  const source = await listPromptEntries(modelId, from, {
    activeOnly: false,
    aiOnly: true,
  });
  if (source.length === 0) {
    return NextResponse.json(
      { error: `No AI prompts in ${from} phase to copy` },
      { status: 400 },
    );
  }

  const entries = source.map((row) => ({
    page: row.page,
    display_order: row.display_order,
    entry_type: "ai" as const,
    description: row.description,
    section: row.section,
    static_content: null,
    prompt_template: row.prompt_template,
    length_min: row.length_min,
    length_max: row.length_max,
    is_active: row.is_active,
  }));

  const count = await upsertPromptEntriesBulk(
    modelId,
    to,
    entries,
    model.slug,
  );
  return NextResponse.json({ ok: true, count, from, to });
}
