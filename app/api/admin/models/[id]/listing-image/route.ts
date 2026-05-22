import { uploadListingImage } from "@/lib/admin/listing-image-storage";
import { requireAdminApi } from "@/lib/admin/require-admin";
import { getModelById } from "@/lib/products/model-store";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const { id: modelId } = await context.params;
  const model = await getModelById(modelId);
  if (!model) {
    return NextResponse.json({ error: "Model not found" }, { status: 404 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const contentType = file.type || "image/jpeg";
  const bytes = Buffer.from(await file.arrayBuffer());

  try {
    const { url, path } = await uploadListingImage({
      modelKey: model.id,
      bytes,
      contentType,
    });
    return NextResponse.json({ ok: true, url, path });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
