import type { ResultPayload, ResolvedResultEntry } from "@/lib/bazi-journey/types";
import { generateResultPayload } from "@/lib/products/generate-deliverable";
import { DEFAULT_BAZI_MODEL } from "@/lib/products/model-registry";
import type { UserFormInput } from "@/lib/user-input";

/** Generate result: static layout in code + AI prompts from model_prompt_entries */
export async function buildResult(
  input: UserFormInput,
  modelId: string = DEFAULT_BAZI_MODEL,
): Promise<ResultPayload> {
  return generateResultPayload(modelId, input);
}

/** Group entries by section for the teaser UI */
export function groupEntriesBySection(
  entries: ResolvedResultEntry[],
): Map<string, ResolvedResultEntry[]> {
  const map = new Map<string, ResolvedResultEntry[]>();
  for (const e of [...entries].sort((a, b) => a.display_order - b.display_order)) {
    const section = e.section ?? "other";
    const list = map.get(section) ?? [];
    list.push(e);
    map.set(section, list);
  }
  return map;
}

export function contentByDescription(
  entries: ResolvedResultEntry[],
  description: string,
): string {
  return entries.find((e) => e.description === description)?.content ?? "";
}

export function imageByDescription(
  entries: ResolvedResultEntry[],
  description: string,
): string | null {
  const e = entries.find((x) => x.description === description);
  return e?.image_url ?? null;
}

/** @deprecated Use buildResult */
export const buildPreReport = buildResult;
