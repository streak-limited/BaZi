import type { PromptVariableMap } from "@/lib/bazi/calculate";

export type PromptSegment =
  | { kind: "text"; text: string }
  | { kind: "variable"; key: string; value: string | null };

/** Replace all {{key}} placeholders; inject email if missing from template. */
export function fillPrompt(template: string, vars: PromptVariableMap): string {
  let out = template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const v = vars[key as keyof PromptVariableMap];
    return v !== undefined && v !== "" ? v : `{{${key}}}`;
  });

  if (vars.email && !out.includes(vars.email)) {
    out = out.replace(
      /(職業狀態：[^\n]+)/,
      `$1\n電子信箱：${vars.email}`,
    );
  }

  return out;
}

/** Segments for UI: highlight {{var}} and computed value separately. */
export function buildPromptSegments(
  template: string,
  vars: PromptVariableMap,
): PromptSegment[] {
  const segments: PromptSegment[] = [];
  const re = /\{\{(\w+)\}\}/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(template)) !== null) {
    if (match.index > last) {
      segments.push({ kind: "text", text: template.slice(last, match.index) });
    }
    const key = match[1];
    const raw = vars[key as keyof PromptVariableMap];
    const value =
      raw !== undefined && raw !== "" ? String(raw) : null;
    segments.push({ kind: "variable", key, value });
    last = match.index + match[0].length;
  }

  if (last < template.length) {
    segments.push({ kind: "text", text: template.slice(last) });
  }

  if (vars.email && !template.includes("{{email}}")) {
    const injected: PromptSegment[] = [];
    let added = false;
    for (const seg of segments) {
      injected.push(seg);
      if (
        !added &&
        seg.kind === "variable" &&
        seg.key === "job_status" &&
        vars.email
      ) {
        injected.push({ kind: "text", text: "\n電子信箱：" });
        injected.push({
          kind: "variable",
          key: "email",
          value: vars.email,
        });
        added = true;
      }
    }
    return injected;
  }

  return segments;
}
