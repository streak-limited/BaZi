import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export const MAX_LISTING_IMAGE_BYTES = 5 * 1024 * 1024;

export function listingImageBucket(): string {
  return (
    process.env.SUPABASE_LISTING_BUCKET?.trim() || "products-media"
  );
}

function normalizeSegment(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "draft"
  );
}

export function listingImageObjectPath(modelKey: string, contentType: string): string {
  const ext = EXT_BY_TYPE[contentType] ?? "jpg";
  return `listings/${normalizeSegment(modelKey)}/cover.${ext}`;
}

export function getListingImagePublicUrl(storagePath: string): string {
  const db = getSupabaseAdmin();
  const { data } = db.storage.from(listingImageBucket()).getPublicUrl(storagePath);
  return data.publicUrl;
}

export async function uploadListingImage(params: {
  modelKey: string;
  bytes: Buffer;
  contentType: string;
}): Promise<{ url: string; path: string }> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase not configured");
  }
  if (!ALLOWED_TYPES.has(params.contentType)) {
    throw new Error("Only JPEG, PNG, WebP, or GIF allowed");
  }
  if (params.bytes.length > MAX_LISTING_IMAGE_BYTES) {
    throw new Error("Image must be 5 MB or smaller");
  }

  const path = listingImageObjectPath(params.modelKey, params.contentType);
  const db = getSupabaseAdmin();
  const { error } = await db.storage.from(listingImageBucket()).upload(path, params.bytes, {
    contentType: params.contentType,
    upsert: true,
    cacheControl: "3600",
  });
  if (error) throw new Error(error.message);

  return { url: getListingImagePublicUrl(path), path };
}
