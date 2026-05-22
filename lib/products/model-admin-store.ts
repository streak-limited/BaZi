import { parseModelConfig } from "@/lib/models/parse-config";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";
import type { ModelConfig, ModelId, ProductTag } from "@/lib/products/types";
import type { ProductModel } from "@/lib/products/model-store";
import { getModelById } from "@/lib/products/model-store";

export interface ModelUpsertInput {
  id: string;
  slug: string;
  display_name: string;
  family?: string;
  is_active?: boolean;
  config?: Partial<ModelConfig>;
  tag_ids?: string[];
  /** Free-text labels — creates tags in DB if needed */
  tag_labels?: string[];
}

/** Stable tag id from label (supports CJK) */
export function tagIdFromLabel(label: string): string {
  const trimmed = label.trim();
  const base = trimmed
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u4e00-\u9fff-]/g, "")
    .replace(/^-+|-+$/g, "");
  if (base.length >= 2) return base;
  const hash = Buffer.from(trimmed, "utf8").toString("base64url").slice(0, 10);
  return `tag-${hash}`;
}

export async function upsertTagByLabel(
  label: string,
  sortOrder: number,
): Promise<string> {
  const db = getSupabaseAdmin();
  const trimmed = label.trim();
  if (!trimmed) throw new Error("Empty tag label");

  const { data: byLabel } = await db
    .from("tags")
    .select("id")
    .eq("label", trimmed)
    .maybeSingle();
  if (byLabel?.id) return String(byLabel.id);

  let id = tagIdFromLabel(trimmed);
  for (let attempt = 0; attempt < 3; attempt++) {
    const { error } = await db.from("tags").insert({
      id: attempt > 0 ? `${id}-${attempt}` : id,
      label: trimmed,
      sort_order: sortOrder,
      is_active: true,
    });
    if (!error) return attempt > 0 ? `${id}-${attempt}` : id;
    if (error.message.includes("duplicate key") && error.message.includes("label")) {
      const { data: again } = await db
        .from("tags")
        .select("id")
        .eq("label", trimmed)
        .maybeSingle();
      if (again?.id) return String(again.id);
    }
    id = `${tagIdFromLabel(trimmed)}-${attempt + 1}`;
  }
  throw new Error(`Failed to create tag: ${trimmed}`);
}

export async function syncModelTagsByLabels(
  modelId: string,
  labels: string[],
): Promise<void> {
  const unique = [
    ...new Set(labels.map((l) => l.trim()).filter(Boolean)),
  ];
  const tagIds: string[] = [];
  for (let i = 0; i < unique.length; i++) {
    tagIds.push(await upsertTagByLabel(unique[i], (i + 1) * 10));
  }
  await setModelTags(modelId, tagIds);
}

async function applyTags(
  modelId: string,
  input: Pick<ModelUpsertInput, "tag_ids" | "tag_labels">,
): Promise<void> {
  if (input.tag_labels !== undefined) {
    await syncModelTagsByLabels(modelId, input.tag_labels);
    return;
  }
  if (input.tag_ids !== undefined) {
    await setModelTags(modelId, input.tag_ids);
  }
}

export async function createModel(input: ModelUpsertInput): Promise<ProductModel> {
  if (!isSupabaseConfigured()) throw new Error("Supabase not configured");
  const db = getSupabaseAdmin();
  const config = parseModelConfig(
    (input.config ?? {}) as ModelConfig,
    input.id,
    input.slug,
  );

  const row = {
    id: input.id.trim(),
    slug: input.slug.trim(),
    display_name: input.display_name.trim(),
    family: input.family ?? "bazi",
    version: 1,
    config,
    template_entries_ref: null,
    is_active: input.is_active ?? true,
  };

  let res = await db.from("models").insert(row).select().single();
  if (res.error) {
    res = await db.from("modal_templates").insert(row).select().single();
  }
  if (res.error) throw new Error(res.error.message);

  if (input.tag_labels !== undefined || input.tag_ids !== undefined) {
    await applyTags(input.id, input);
  }
  const model = await getModelById(input.id);
  if (!model) throw new Error("Failed to load created model");
  return model;
}

export async function updateModel(
  id: string,
  input: Partial<ModelUpsertInput>,
): Promise<ProductModel> {
  if (!isSupabaseConfigured()) throw new Error("Supabase not configured");
  const existing = await getModelById(id);
  if (!existing) throw new Error("Model not found");

  const db = getSupabaseAdmin();
  const mergedConfig = {
    ...existing.config,
    ...input.config,
    listing: {
      ...existing.config.listing,
      ...input.config?.listing,
    },
    copy: {
      ...existing.config.copy,
      ...input.config?.copy,
    },
  };

  const body: Record<string, unknown> = {};
  if (input.slug !== undefined) body.slug = input.slug.trim();
  if (input.display_name !== undefined) body.display_name = input.display_name.trim();
  if (input.family !== undefined) body.family = input.family;
  if (input.is_active !== undefined) body.is_active = input.is_active;
  if (input.config !== undefined) {
    body.config = parseModelConfig(mergedConfig, id, input.slug ?? existing.slug);
  }

  let res = await db.from("models").update(body).eq("id", id).select().single();
  if (res.error) {
    res = await db.from("modal_templates").update(body).eq("id", id).select().single();
  }
  if (res.error) throw new Error(res.error.message);

  if (input.tag_labels !== undefined || input.tag_ids !== undefined) {
    await applyTags(id, input);
  }
  const model = await getModelById(id);
  if (!model) throw new Error("Failed to load updated model");
  return model;
}

export async function setModelTags(modelId: string, tagIds: string[]): Promise<void> {
  const db = getSupabaseAdmin();
  await db.from("model_tags").delete().eq("model_id", modelId);
  if (tagIds.length === 0) return;
  const rows = tagIds.map((tag_id) => ({ model_id: modelId, tag_id }));
  const { error } = await db.from("model_tags").insert(rows);
  if (error) throw new Error(error.message);
}

export async function listAllTags(): Promise<ProductTag[]> {
  if (!isSupabaseConfigured()) return [];
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("tags")
    .select("id, label, sort_order")
    .eq("is_active", true)
    .order("sort_order");
  if (error) {
    if (error.message.includes("tags")) return [];
    throw new Error(error.message);
  }
  return (data ?? []).map((r) => ({
    id: String(r.id),
    label: String(r.label),
    sort_order: Number(r.sort_order ?? 0),
  }));
}
