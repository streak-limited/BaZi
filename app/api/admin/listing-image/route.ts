import { uploadListingImage } from "@/lib/admin/listing-image-storage";
import { requireAdminApi } from "@/lib/admin/require-admin";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Upload listing image before model exists (uses slug as storage key). */
export async function POST(request: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const slug = String(form.get("slug") ?? "").trim();
  if (!slug) {
    return NextResponse.json({ error: "slug required" }, { status: 400 });
  }

  const file = form.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const contentType = file.type || "image/jpeg";
  const bytes = Buffer.from(await file.arrayBuffer());

  try {
    const { url, path } = await uploadListingImage({
      modelKey: slug,
      bytes,
      contentType,
    });
    return NextResponse.json({ ok: true, url, path });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
