import type { ProductModel } from "@/lib/products/model-store";

export const ALL_TAG = "全部";

export function collectHomeFilterTags(models: ProductModel[]): string[] {
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
    .map((t) => t.label)
    .filter((label) => set.has(label));

  const seen = new Set(ordered);
  const rest = [...set]
    .filter((l) => !seen.has(l))
    .sort((a, b) => a.localeCompare(b, "zh-Hant"));

  return [ALL_TAG, ...ordered, ...rest];
}

export function shouldShowHomeTagFilter(tags: string[]): boolean {
  return tags.length > 1;
}

export function filterModelsByTag(
  models: ProductModel[],
  activeTag: string,
): ProductModel[] {
  if (activeTag === ALL_TAG) return models;
  return models.filter((m) => m.tags.some((t) => t.label === activeTag));
}
