import { requireAdminApi } from "@/lib/admin/require-admin";
import { createPromptEntry } from "@/lib/products/prompt-store";
import type { PromptPhase } from "@/lib/products/prompt-types";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;
  try {
    const body = await request.json();
    const modelId = String(body.modelId ?? "").trim();
    const phase = String(body.phase ?? "result") as PromptPhase;
    const row = await createPromptEntry(modelId, phase, {
      page: body.page ?? 1,
      display_order: body.display_order,
      entry_type: "ai",
      description: body.description,
      section: body.section,
      static_content: body.static_content,
      prompt_template: body.prompt_template,
      image_url: body.image_url,
      length_min: body.length_min,
      length_max: body.length_max,
      is_active: body.is_active,
    });
    return NextResponse.json({ entry: row });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Create failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
