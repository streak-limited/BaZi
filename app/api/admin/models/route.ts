import { requireAdminApi } from "@/lib/admin/require-admin";
import { createModel } from "@/lib/products/model-admin-store";
import { listActiveModels } from "@/lib/products/model-store";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const denied = await requireAdminApi();
  if (denied) return denied;
  const models = await listActiveModels();
  return NextResponse.json({ models });
}

export async function POST(request: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;
  try {
    const body = await request.json();
    const model = await createModel({
      id: String(body.id ?? "").trim(),
      slug: String(body.slug ?? "").trim(),
      display_name: String(body.display_name ?? "").trim(),
      family: body.family ?? "bazi",
      is_active: body.is_active ?? true,
      config: body.config,
      tag_ids: body.tag_ids,
    });
    return NextResponse.json({ model });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Create failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
