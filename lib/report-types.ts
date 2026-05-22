export type ContentType = "static" | "computed" | "ai";

export interface ReportEntry {
  /** Stable key — matches model_prompt_entries.entry_key and deliverable JSON */
  entry_key?: string;
  id?: string;
  page: number;
  display_order: number;
  type: ContentType;
  description: string;
  content: string;
  image_url?: string;
  image_url_proxy?: string | null;
  section?: string;
  /** LLM prompt template (AI entries only). {{var}} filled at generation time. */
  prompt?: string;
}

export interface PageSummary {
  static: number;
  computed: number;
  ai: number;
  total: number;
  with_image_url?: number;
}

export interface ReportMetadata {
  source: string;
  type_legend: Record<ContentType, string>;
  user_inputs: string[];
  sample_subject: Record<string, string>;
  total_entries: number;
  page_summary?: Record<string, PageSummary>;
  section_summary?: Record<string, PageSummary>;
  by_type?: Record<ContentType, number>;
  notes?: string;
  demo_mode?: boolean;
}

export interface ReportData {
  metadata: ReportMetadata;
  entries: ReportEntry[];
}

export const CONTENT_TYPES: ContentType[] = ["static", "computed", "ai"];

export const TYPE_LABELS: Record<ContentType, string> = {
  static: "Static",
  computed: "Computed",
  ai: "AI",
};
