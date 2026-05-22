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

  if (input.tag_ids?.length) {
    await setModelTags(input.id, input.tag_ids);
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

  if (input.tag_ids !== undefined) {
    await setModelTags(id, input.tag_ids);
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
