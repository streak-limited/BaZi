import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";
import { parseModalConfig, type ParsedModalConfig } from "@/lib/modals/parse-config";
import { MODAL_REGISTRY } from "@/lib/products/modal-registry";
import type {
  ModalTemplateConfig,
  ModalTemplateId,
  ModalTemplateRow,
} from "@/lib/products/types";

export interface ModalTemplate extends Omit<ModalTemplateRow, "config"> {
  config: ParsedModalConfig;
}

function rowToModal(row: Record<string, unknown>): ModalTemplate {
  const id = String(row.id);
  const raw = (row.config ?? {}) as ModalTemplateConfig & {
    ui_key?: string;
    media?: Record<string, string>;
    copy?: Record<string, string>;
  };
  return {
    id: id as ModalTemplateId,
    slug: String(row.slug),
    display_name: String(row.display_name),
    family: String(row.family ?? "bazi"),
    version: Number(row.version ?? 1),
    template_entries_ref: row.template_entries_ref
      ? String(row.template_entries_ref)
      : null,
    is_active: Boolean(row.is_active ?? true),
    config: parseModalConfig(raw, id),
  };
}

function registryFallback(id: string): ModalTemplate | null {
  const def = MODAL_REGISTRY[id];
  if (!def) return null;
  return {
    id: def.id,
    slug: def.slug,
    display_name: def.displayName,
    family: def.family,
    version: 1,
    template_entries_ref: def.templateEntriesRef,
    is_active: true,
    config: parseModalConfig(
      { ...def.config, ui_key: def.id === "bazi_full" ? "bazi_v1" : def.id },
      def.id,
    ),
  };
}

export async function listActiveModals(): Promise<ModalTemplate[]> {
  if (!isSupabaseConfigured()) {
    return Object.keys(MODAL_REGISTRY).map(
      (id) => registryFallback(id)!,
    );
  }
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("modal_templates")
    .select("*")
    .eq("is_active", true)
    .order("display_name");
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) =>
    rowToModal(r as Record<string, unknown>),
  );
}

export async function getModalBySlug(
  slug: string,
): Promise<ModalTemplate | null> {
  const s = slug.trim();
  if (!s) return null;

  if (isSupabaseConfigured()) {
    const db = getSupabaseAdmin();
    const { data, error } = await db
      .from("modal_templates")
      .select("*")
      .eq("slug", s)
      .eq("is_active", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (data) return rowToModal(data as Record<string, unknown>);
  }

  const hit = Object.values(MODAL_REGISTRY).find((m) => m.slug === s);
  return hit ? registryFallback(hit.id) : null;
}

export async function getModalById(
  id: string,
): Promise<ModalTemplate | null> {
  if (isSupabaseConfigured()) {
    const db = getSupabaseAdmin();
    const { data, error } = await db
      .from("modal_templates")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (data) return rowToModal(data as Record<string, unknown>);
  }
  return registryFallback(id);
}
