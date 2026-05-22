const LISTING_W = 688;
const LISTING_H = 568;

export function dummyListingImage(slugOrId: string): string {
  const seed = encodeURIComponent(slugOrId.replace(/[^a-zA-Z0-9-_]/g, "-"));
  return `https://picsum.photos/seed/${seed}/${LISTING_W}/${LISTING_H}`;
}

export function resolveListingImage(
  modelId: string,
  slug: string,
  configured?: string,
): string | undefined {
  const useReal = process.env.USE_REAL_LISTING_IMAGES === "1";
  if (useReal && configured?.trim()) return configured.trim();
  return dummyListingImage(slug || modelId);
}
