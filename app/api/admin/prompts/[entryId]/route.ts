import { requireAdminApi } from "@/lib/admin/require-admin";
import { deletePromptEntry, updatePromptEntry } from "@/lib/products/prompt-store";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ entryId: string }> },
) {
  const denied = await requireAdminApi();
  if (denied) return denied;
  const { entryId } = await context.params;
  try {
    const body = await request.json();
    const entry = await updatePromptEntry(entryId, body);
    return NextResponse.json({ entry });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ entryId: string }> },
) {
  const denied = await requireAdminApi();
  if (denied) return denied;
  const { entryId } = await context.params;
  try {
    await deletePromptEntry(entryId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Delete failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
