import { requireAdminApi } from "@/lib/admin/require-admin";
import { listAllTags } from "@/lib/products/model-admin-store";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const denied = await requireAdminApi();
  if (denied) return denied;
  const tags = await listAllTags();
  return NextResponse.json({ tags });
}
