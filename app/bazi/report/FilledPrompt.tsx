"use client";

import type { ReactNode } from "react";
import type { PromptVariableMap } from "@/lib/bazi/calculate";
import { buildPromptSegments } from "@/lib/fill-prompt";
import styles from "./report.module.css";

function highlightTemplateOnly(text: string): ReactNode[] {
  const parts = text.split(/(\{\{[^}]+\}\})/g);
  return parts.map((part, i) =>
    /^\{\{[^}]+\}\}$/.test(part) ? (
      <mark key={i} className={styles.varHighlight}>
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

function VarBlock({ varKey, value }: { varKey: string; value: string | null }) {
  return (
    <>
      <mark className={styles.varHighlight}>{`{{${varKey}}}`}</mark>
      {value !== null ? (
        <>
          {" "}
          <mark className={styles.valueHighlight}>{value}</mark>
        </>
      ) : null}
    </>
  );
}

export default function FilledPrompt({
  template,
  variables,
}: {
  template: string;
  variables: PromptVariableMap | null;
}) {
  if (!variables) {
    return (
      <pre className={styles.promptPre}>{highlightTemplateOnly(template)}</pre>
    );
  }

  const segments = buildPromptSegments(template, variables);

  return (
    <pre className={styles.promptPre}>
      {segments.map((seg, i) =>
        seg.kind === "text" ? (
          <span key={i}>{seg.text}</span>
        ) : (
          <span key={i}>
            <VarBlock varKey={seg.key} value={seg.value} />
          </span>
        ),
      )}
    </pre>
  );
}
