import { getModelById } from "@/lib/products/model-store";
import { buildPromptSlotId } from "@/lib/products/prompt-slot-id";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";
import type {
  ModelPromptEntryInput,
  ModelPromptEntryRow,
  PromptPhase,
} from "@/lib/products/prompt-types";

function rowFromDb(r: Record<string, unknown>): ModelPromptEntryRow {
  return {
    id: String(r.id),
    model_id: String(r.model_id),
    phase: String(r.phase) as PromptPhase,
    entry_key: String(r.entry_key),
    page: Number(r.page ?? 1),
    display_order: Number(r.display_order ?? 0),
    entry_type: String(r.entry_type) as ModelPromptEntryRow["entry_type"],
    description: String(r.description ?? ""),
    section: r.section ? String(r.section) : null,
    static_content: r.static_content ? String(r.static_content) : null,
    prompt_template: r.prompt_template ? String(r.prompt_template) : null,
    image_url: r.image_url ? String(r.image_url) : null,
    image_url_proxy: r.image_url_proxy ? String(r.image_url_proxy) : null,
    length_min: r.length_min != null ? Number(r.length_min) : null,
    length_max: r.length_max != null ? Number(r.length_max) : null,
    is_active: Boolean(r.is_active ?? true),
    created_at: String(r.created_at),
    updated_at: String(r.updated_at),
  };
}

async function resolveModelSlug(modelId: string): Promise<string> {
  const model = await getModelById(modelId);
  if (!model?.slug) throw new Error(`Model not found: ${modelId}`);
  return model.slug;
}

export async function derivePromptSlotId(
  modelId: string,
  phase: PromptPhase,
  page: number,
  displayOrder: number,
): Promise<string> {
  const slug = await resolveModelSlug(modelId);
  return buildPromptSlotId(slug, phase, page, displayOrder);
}

export async function listPromptEntries(
  modelId: string,
  phase: PromptPhase,
  opts?: { activeOnly?: boolean; aiOnly?: boolean },
): Promise<ModelPromptEntryRow[]> {
  if (!isSupabaseConfigured()) return [];
  const db = getSupabaseAdmin();
  let q = db
    .from("model_prompt_entries")
    .select("*")
    .eq("model_id", modelId)
    .eq("phase", phase)
    .order("page")
    .order("display_order");
  if (opts?.aiOnly) {
    q = q.eq("entry_type", "ai");
  }
  if (opts?.activeOnly !== false) {
    q = q.eq("is_active", true);
  }
  const { data, error } = await q;
  if (error) {
    if (error.message.includes("model_prompt_entries")) return [];
    throw new Error(error.message);
  }
  return (data ?? []).map((r) => rowFromDb(r as Record<string, unknown>));
}

export async function listAiPromptEntries(
  modelId: string,
  phase: PromptPhase,
  opts?: { activeOnly?: boolean },
): Promise<ModelPromptEntryRow[]> {
  return listPromptEntries(modelId, phase, { ...opts, aiOnly: true });
}

export async function deleteNonAiPromptEntries(
  modelId: string,
  phase?: PromptPhase,
): Promise<number> {
  const db = getSupabaseAdmin();
  let q = db
    .from("model_prompt_entries")
    .delete()
    .eq("model_id", modelId)
    .neq("entry_type", "ai")
    .select("id");
  if (phase) q = q.eq("phase", phase);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data?.length ?? 0;
}

export async function createPromptEntry(
  modelId: string,
  phase: PromptPhase,
  input: ModelPromptEntryInput,
): Promise<ModelPromptEntryRow> {
  const page = input.page ?? 1;
  const display_order = input.display_order ?? 0;
  const entry_key =
    input.entry_key?.trim() ||
    (await derivePromptSlotId(modelId, phase, page, display_order));

  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("model_prompt_entries")
    .insert({
      model_id: modelId,
      phase,
      entry_key,
      page,
      display_order,
      entry_type: input.entry_type ?? "ai",
      description: input.description ?? "",
      section: input.section ?? null,
      static_content: input.static_content ?? null,
      prompt_template: input.prompt_template ?? null,
      image_url: input.image_url ?? null,
      image_url_proxy: input.image_url_proxy ?? null,
      length_min: input.length_min ?? null,
      length_max: input.length_max ?? null,
      is_active: input.is_active ?? true,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return rowFromDb(data as Record<string, unknown>);
}

export async function updatePromptEntry(
  id: string,
  patch: Partial<ModelPromptEntryInput>,
): Promise<ModelPromptEntryRow> {
  const db = getSupabaseAdmin();
  const { data: existing, error: loadErr } = await db
    .from("model_prompt_entries")
    .select("*")
    .eq("id", id)
    .single();
  if (loadErr || !existing) throw new Error(loadErr?.message ?? "Not found");

  const row = rowFromDb(existing as Record<string, unknown>);
  const page = patch.page ?? row.page;
  const display_order = patch.display_order ?? row.display_order;
  const entry_key = await derivePromptSlotId(
    row.model_id,
    row.phase,
    page,
    display_order,
  );

  const body: Record<string, unknown> = { entry_key, page, display_order };
  if (patch.entry_type !== undefined) body.entry_type = patch.entry_type;
  if (patch.description !== undefined) body.description = patch.description;
  if (patch.section !== undefined) body.section = patch.section;
  if (patch.static_content !== undefined) body.static_content = patch.static_content;
  if (patch.prompt_template !== undefined) body.prompt_template = patch.prompt_template;
  if (patch.image_url !== undefined) body.image_url = patch.image_url;
  if (patch.image_url_proxy !== undefined) body.image_url_proxy = patch.image_url_proxy;
  if (patch.length_min !== undefined) body.length_min = patch.length_min;
  if (patch.length_max !== undefined) body.length_max = patch.length_max;
  if (patch.is_active !== undefined) body.is_active = patch.is_active;

  const { data, error } = await db
    .from("model_prompt_entries")
    .update(body)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return rowFromDb(data as Record<string, unknown>);
}

export async function deletePromptEntry(id: string): Promise<void> {
  const db = getSupabaseAdmin();
  const { error } = await db.from("model_prompt_entries").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function upsertPromptEntriesBulk(
  modelId: string,
  phase: PromptPhase,
  entries: ModelPromptEntryInput[],
  modelSlug?: string,
): Promise<number> {
  if (entries.length === 0) return 0;
  const slug = modelSlug ?? (await resolveModelSlug(modelId));
  const db = getSupabaseAdmin();
  const rows = entries.map((input) => {
    const page = input.page ?? 1;
    const display_order = input.display_order ?? 0;
    const entry_key =
      input.entry_key?.trim() ||
      buildPromptSlotId(slug, phase, page, display_order);
    return {
      model_id: modelId,
      phase,
      entry_key,
      page,
      display_order,
      entry_type: input.entry_type ?? "ai",
      description: input.description ?? "",
      section: input.section ?? null,
      static_content: input.static_content ?? null,
      prompt_template: input.prompt_template ?? null,
      image_url: input.image_url ?? null,
      image_url_proxy: input.image_url_proxy ?? null,
      length_min: input.length_min ?? null,
      length_max: input.length_max ?? null,
      is_active: input.is_active ?? true,
    };
  });
  const { error } = await db.from("model_prompt_entries").upsert(rows, {
    onConflict: "model_id,phase,page,display_order",
  });
  if (error) throw new Error(error.message);
  return rows.length;
}
