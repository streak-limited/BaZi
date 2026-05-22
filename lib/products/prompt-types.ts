import type { ContentType } from "@/lib/report-types";

export type PromptPhase = "result" | "report";

export interface ModelPromptEntryRow {
  id: string;
  model_id: string;
  phase: PromptPhase;
  entry_key: string;
  page: number;
  display_order: number;
  entry_type: ContentType;
  description: string;
  section: string | null;
  static_content: string | null;
  prompt_template: string | null;
  image_url: string | null;
  image_url_proxy: string | null;
  length_min: number | null;
  length_max: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type ModelPromptEntryInput = {
  /** Auto-derived from model slug + phase + page + slot id (display_order column) if omitted */
  entry_key?: string;
  page?: number;
  display_order?: number;
  entry_type: ContentType;
  description?: string;
  section?: string | null;
  static_content?: string | null;
  prompt_template?: string | null;
  image_url?: string | null;
  image_url_proxy?: string | null;
  length_min?: number | null;
  length_max?: number | null;
  is_active?: boolean;
};
