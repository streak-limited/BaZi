import type { ProductModel } from "@/lib/products/model-store";
import type { ProductTag } from "@/lib/products/types";

export const ALL_TAG = "全部";

/** Pills from catalog tags table (preferred) or tags linked on models. */
export function buildHomeFilterTags(
  catalogTags: ProductTag[],
  models: ProductModel[],
): string[] {
  if (catalogTags.length > 0) {
    const labels = catalogTags
      .map((t) => t.label.trim())
      .filter(Boolean);
    const unique = [...new Set(labels)];
    if (unique.length === 0) return [ALL_TAG];
    return [ALL_TAG, ...unique];
  }
  return collectHomeFilterTagsFromModels(models);
}

/** Fallback when `tags` table is empty — only labels used on at least one model. */
export function collectHomeFilterTagsFromModels(
  models: ProductModel[],
): string[] {
  const set = new Set<string>();
  for (const m of models) {
    for (const t of m.tags) {
      if (t.label.trim()) set.add(t.label.trim());
    }
  }
  if (set.size === 0) return [ALL_TAG];

  const ordered = models
    .flatMap((m) => m.tags)
    .filter((t, i, arr) => arr.findIndex((x) => x.id === t.id) === i)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((t) => t.label.trim())
    .filter((label) => set.has(label));

  const seen = new Set(ordered);
  const rest = [...set]
    .filter((l) => !seen.has(l))
    .sort((a, b) => a.localeCompare(b, "zh-Hant"));

  return [ALL_TAG, ...ordered, ...rest];
}

/** @deprecated use buildHomeFilterTags */
export function collectHomeFilterTags(models: ProductModel[]): string[] {
  return collectHomeFilterTagsFromModels(models);
}

export function shouldShowHomeTagFilter(tags: string[]): boolean {
  return tags.length > 1;
}

export function filterModelsByTag(
  models: ProductModel[],
  activeTag: string,
): ProductModel[] {
  if (activeTag === ALL_TAG) return models;
  return models.filter((m) =>
    m.tags.some((t) => t.label.trim() === activeTag),
  );
}
