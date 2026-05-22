import { parseModelConfig, type ParsedModelConfig } from "@/lib/models/parse-config";
import { MODEL_REGISTRY } from "@/lib/products/model-registry";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";
import type {
  ModelConfig,
  ModelId,
  ModelRow,
  ProductTag,
} from "@/lib/products/types";

export interface ProductModel extends Omit<ModelRow, "config"> {
  config: ParsedModelConfig;
  tags: ProductTag[];
}

function parseTagRow(row: Record<string, unknown>): ProductTag {
  return {
    id: String(row.id),
    label: String(row.label),
    sort_order: Number(row.sort_order ?? 0),
  };
}

/** Legacy tags in config JSON before migration 007 */
function tagsFromConfig(raw: ModelConfig & { tags?: string[] }): ProductTag[] {
  const labels = raw.tags?.map((t) => t.trim()).filter(Boolean) ?? [];
  return labels.map((label, i) => ({
    id: label,
    label,
    sort_order: (i + 1) * 10,
  }));
}

async function loadTagsForModels(
  modelIds: string[],
): Promise<Record<string, ProductTag[]>> {
  const out: Record<string, ProductTag[]> = {};
  if (!isSupabaseConfigured() || modelIds.length === 0) return out;

  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("model_tags")
    .select("model_id, tags(id, label, sort_order)")
    .in("model_id", modelIds);

  if (!error && data?.length) {
    for (const row of data) {
      const modelId = String(row.model_id);
      const tagRaw = row.tags as
        | Record<string, unknown>
        | Record<string, unknown>[]
        | null;
      const tagObj = Array.isArray(tagRaw) ? tagRaw[0] : tagRaw;
      if (!tagObj) continue;
      if (!out[modelId]) out[modelId] = [];
      out[modelId].push(parseTagRow(tagObj));
    }
  } else if (error) {
    console.warn("[loadTagsForModels] embed query failed:", error.message);
    const { data: links, error: linkErr } = await db
      .from("model_tags")
      .select("model_id, tag_id")
      .in("model_id", modelIds);
    if (!linkErr && links?.length) {
      const tagIds = [...new Set(links.map((r) => String(r.tag_id)))];
      const { data: tagRows } = await db
        .from("tags")
        .select("id, label, sort_order")
        .in("id", tagIds);
      const tagById = new Map(
        (tagRows ?? []).map((t) => [String(t.id), parseTagRow(t as Record<string, unknown>)]),
      );
      for (const link of links) {
        const modelId = String(link.model_id);
        const tag = tagById.get(String(link.tag_id));
        if (!tag) continue;
        if (!out[modelId]) out[modelId] = [];
        out[modelId].push(tag);
      }
    }
  }

  for (const id of Object.keys(out)) {
    out[id].sort((a, b) => a.sort_order - b.sort_order);
  }
  return out;
}

export async function listCatalogTags(): Promise<ProductTag[]> {
  if (!isSupabaseConfigured()) return [];
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("tags")
    .select("id, label, sort_order")
    .eq("is_active", true)
    .order("sort_order");
  if (error) {
    if (error.message.includes("tags")) return [];
    console.warn("[listCatalogTags]", error.message);
    return [];
  }
  return (data ?? []).map((r) => parseTagRow(r as Record<string, unknown>));
}

function rowToModel(
  row: Record<string, unknown>,
  tags: ProductTag[] = [],
): ProductModel {
  const id = String(row.id);
  const raw = (row.config ?? {}) as ModelConfig & {
    ui_key?: string;
    media?: Record<string, string>;
    copy?: Record<string, string>;
    listing?: Record<string, unknown>;
    tags?: string[];
  };
  const resolvedTags =
    tags.length > 0 ? tags : tagsFromConfig(raw);
  return {
    id: id as ModelId,
    slug: String(row.slug),
    display_name: String(row.display_name),
    family: String(row.family ?? "bazi"),
    version: Number(row.version ?? 1),
    template_entries_ref: row.template_entries_ref
      ? String(row.template_entries_ref)
      : null,
    is_active: Boolean(row.is_active ?? true),
    config: parseModelConfig(raw, id, String(row.slug)),
    tags: resolvedTags,
  };
}

function registryModels(): ProductModel[] {
  return Object.keys(MODEL_REGISTRY).map((id) => registryFallback(id)!);
}

function registryFallback(id: string): ProductModel | null {
  const def = MODEL_REGISTRY[id];
  if (!def) return null;
  return {
    id: def.id,
    slug: def.slug,
    display_name: def.displayName,
    family: def.family,
    version: 1,
    template_entries_ref: def.templateEntriesRef,
    is_active: true,
    tags: def.tags ?? [],
    config: parseModelConfig(
      { ...def.config, ui_key: def.id === "bazi_full" ? "bazi_v1" : def.id },
      def.id,
      def.slug,
    ),
  };
}

export async function getTrialCountsByModel(): Promise<Record<string, number>> {
  if (!isSupabaseConfigured()) return {};
  try {
    const db = getSupabaseAdmin();
    let rows: { model_id: string }[] = [];
    const modern = await db.from("trials").select("model_id");
    if (modern.error) {
      const legacy = await db.from("trials").select("modal_template_id");
      if (legacy.error) {
        console.warn("[getTrialCountsByModel]", legacy.error.message);
        return {};
      }
      rows = (legacy.data ?? []).map((r) => ({
        model_id: String(r.modal_template_id),
      }));
    } else {
      rows = (modern.data ?? []).map((r) => ({ model_id: String(r.model_id) }));
    }
    const counts: Record<string, number> = {};
    for (const row of rows) {
      const id = String(row.model_id);
      counts[id] = (counts[id] ?? 0) + 1;
    }
    return counts;
  } catch (e) {
    console.warn("[getTrialCountsByModel]", e);
    return {};
  }
}

async function selectActiveCatalogRows(db: ReturnType<typeof getSupabaseAdmin>) {
  let res = await db
    .from("models")
    .select("*")
    .eq("is_active", true)
    .order("display_name");
  if (res.error) {
    res = await db
      .from("modal_templates")
      .select("*")
      .eq("is_active", true)
      .order("display_name");
  }
  if (res.error) {
    console.warn("[selectActiveCatalogRows]", res.error.message);
    return [];
  }
  return res.data ?? [];
}

async function selectCatalogRowBySlug(
  db: ReturnType<typeof getSupabaseAdmin>,
  slug: string,
) {
  let res = await db
    .from("models")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (res.error) {
    res = await db
      .from("modal_templates")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();
  }
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

async function selectCatalogRowById(db: ReturnType<typeof getSupabaseAdmin>, id: string) {
  let res = await db.from("models").select("*").eq("id", id).maybeSingle();
  if (res.error) {
    res = await db.from("modal_templates").select("*").eq("id", id).maybeSingle();
  }
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

export async function listActiveModels(): Promise<ProductModel[]> {
  if (!isSupabaseConfigured()) {
    return registryModels();
  }
  try {
    const db = getSupabaseAdmin();
    const data = await selectActiveCatalogRows(db);
    if (data.length === 0) {
      return registryModels();
    }
    const rows = data as Record<string, unknown>[];
    const tagMap = await loadTagsForModels(rows.map((r) => String(r.id)));
    return rows.map((r) => rowToModel(r, tagMap[String(r.id)] ?? []));
  } catch (e) {
    console.warn("[listActiveModels]", e);
    return registryModels();
  }
}

export async function getModelBySlug(slug: string): Promise<ProductModel | null> {
  const s = slug.trim();
  if (!s) return null;

  if (isSupabaseConfigured()) {
    const db = getSupabaseAdmin();
    const data = await selectCatalogRowBySlug(db, s);
    if (data) {
      const id = String(data.id);
      const tagMap = await loadTagsForModels([id]);
      return rowToModel(data as Record<string, unknown>, tagMap[id] ?? []);
    }
  }

  const hit = Object.values(MODEL_REGISTRY).find((m) => m.slug === s);
  return hit ? registryFallback(hit.id) : null;
}

export async function getModelById(id: string): Promise<ProductModel | null> {
  if (isSupabaseConfigured()) {
    const db = getSupabaseAdmin();
    const data = await selectCatalogRowById(db, id);
    if (data) {
      const tagMap = await loadTagsForModels([id]);
      return rowToModel(data as Record<string, unknown>, tagMap[id] ?? []);
    }
  }
  return registryFallback(id);
}
