import { requireAdminApi } from "@/lib/admin/require-admin";
import { updateModel } from "@/lib/products/model-admin-store";
import { getModelById } from "@/lib/products/model-store";
import { listPromptEntries } from "@/lib/products/prompt-store";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdminApi();
  if (denied) return denied;
  const { id } = await context.params;
  const model = await getModelById(id);
  if (!model) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const [resultPrompts, reportPrompts] = await Promise.all([
    listPromptEntries(id, "result", { activeOnly: false }),
    listPromptEntries(id, "report", { activeOnly: false }),
  ]);
  return NextResponse.json({ model, resultPrompts, reportPrompts });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdminApi();
  if (denied) return denied;
  const { id } = await context.params;
  try {
    const body = await request.json();
    const model = await updateModel(id, {
      slug: body.slug,
      display_name: body.display_name,
      family: body.family,
      is_active: body.is_active,
      config: body.config,
      tag_ids: body.tag_ids,
    });
    return NextResponse.json({ model });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
