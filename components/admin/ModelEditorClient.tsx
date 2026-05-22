"use client";

import type { ProductModel } from "@/lib/products/model-store";
import { buildPromptSlotId } from "@/lib/products/prompt-slot-id";
import type { ModelPromptEntryRow, PromptPhase } from "@/lib/products/prompt-types";
import { ListingImageUpload } from "@/components/admin/ListingImageUpload";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import styles from "@/app/admin/admin.module.css";

type Props = {
  mode: "create" | "edit";
  model?: ProductModel;
  resultPrompts?: ModelPromptEntryRow[];
  reportPrompts?: ModelPromptEntryRow[];
};

function parseTagLabels(text: string): string[] {
  return [
    ...new Set(
      text
        .split(/[,，、]/)
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  ];
}

type PhaseTab = PromptPhase;

async function readJson(res: Response) {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? res.statusText);
  return data;
}

export function ModelEditorClient({
  mode,
  model,
  resultPrompts: initialResult = [],
  reportPrompts: initialReport = [],
}: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<PhaseTab>("result");

  const [id, setId] = useState(model?.id ?? "");
  const [slug, setSlug] = useState(model?.slug ?? "");
  const [displayName, setDisplayName] = useState(model?.display_name ?? "");
  const [family, setFamily] = useState(model?.family ?? "bazi");
  const [isActive, setIsActive] = useState(model?.is_active ?? true);
  const [listingImage, setListingImage] = useState(
    model?.config.listing?.image ?? "",
  );
  const [listingDesc, setListingDesc] = useState(
    model?.config.listing?.description ?? "",
  );
  const [priceHkd, setPriceHkd] = useState(
    model?.config.price_hkd != null ? String(model.config.price_hkd) : "",
  );
  const [uiKey, setUiKey] = useState(model?.config.ui_key ?? "bazi_full");
  const [tagLabelsText, setTagLabelsText] = useState(
    model?.tags.map((t) => t.label).join(", ") ?? "",
  );

  const [resultPrompts, setResultPrompts] =
    useState<ModelPromptEntryRow[]>(initialResult);
  const [reportPrompts, setReportPrompts] =
    useState<ModelPromptEntryRow[]>(initialReport);

  const prompts = phase === "result" ? resultPrompts : reportPrompts;
  const setPrompts =
    phase === "result" ? setResultPrompts : setReportPrompts;

  const saveModel = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const config = {
        ui_key: uiKey.trim() || "bazi_full",
        price_hkd: priceHkd ? Number(priceHkd) : undefined,
        listing: {
          image: listingImage.trim() || undefined,
          description: listingDesc.trim() || undefined,
        },
        phases: ["result", "report"] as const,
      };
      if (mode === "create") {
        const data = await readJson(
          await fetch("/api/admin/models", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: id.trim(),
              slug: slug.trim(),
              display_name: displayName.trim(),
              family,
              is_active: isActive,
              config,
              tag_labels: parseTagLabels(tagLabelsText),
            }),
          }),
        );
        router.push(`/admin/models/${data.model.id}`);
        router.refresh();
      } else if (model) {
        await readJson(
          await fetch(`/api/admin/models/${model.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              slug: slug.trim(),
              display_name: displayName.trim(),
              family,
              is_active: isActive,
              config,
              tag_labels: parseTagLabels(tagLabelsText),
            }),
          }),
        );
        router.refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }, [
    mode,
    model,
    id,
    slug,
    displayName,
    family,
    isActive,
    listingImage,
    listingDesc,
    priceHkd,
    uiKey,
    tagLabelsText,
    router,
  ]);

  const importDefaultResult = async () => {
    if (!model) return;
    setSaving(true);
    setError(null);
    try {
      const data = await readJson(
        await fetch(`/api/admin/models/${model.id}/seed-result`, {
          method: "POST",
        }),
      );
      const refreshed = await readJson(
        await fetch(`/api/admin/models/${model.id}`),
      );
      setResultPrompts(refreshed.resultPrompts ?? []);
      setReportPrompts(refreshed.reportPrompts ?? []);
      if ((data.reportCount ?? 0) > 0) setPhase("report");
      alert(
        `Imported ${data.count} result + ${data.reportCount ?? 0} report AI prompts`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setSaving(false);
    }
  };

  const updatePrompt = async (
    entryId: string,
    patch: Partial<ModelPromptEntryRow>,
  ) => {
    setSaving(true);
    setError(null);
    try {
      const { entry } = await readJson(
        await fetch(`/api/admin/prompts/${entryId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        }),
      );
      setPrompts((list) =>
        list.map((r) => (r.id === entryId ? entry : r)),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const deletePrompt = async (entryId: string) => {
    if (!confirm("Delete this prompt entry?")) return;
    setSaving(true);
    setError(null);
    try {
      await readJson(
        await fetch(`/api/admin/prompts/${entryId}`, { method: "DELETE" }),
      );
      setPrompts((list) => list.filter((r) => r.id !== entryId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setSaving(false);
    }
  };

  const addPrompt = async (form: {
    page: number;
    slotId: number;
    description: string;
  }) => {
    if (!model) return;
    setSaving(true);
    setError(null);
    try {
      const { entry } = await readJson(
        await fetch("/api/admin/prompts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            modelId: model.id,
            phase,
            entry_type: "ai",
            description: form.description,
            page: form.page,
            display_order: form.slotId,
            is_active: true,
          }),
        }),
      );
      setPrompts((list) =>
        [...list, entry].sort((a, b) => a.display_order - b.display_order),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Add failed");
    } finally {
      setSaving(false);
    }
  };

  const copyResultToReport = async () => {
    if (!model) return;
    setSaving(true);
    setError(null);
    try {
      const data = await readJson(
        await fetch(`/api/admin/models/${model.id}/copy-prompts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ from: "result", to: "report" }),
        }),
      );
      const refreshed = await readJson(
        await fetch(`/api/admin/models/${model.id}`),
      );
      setReportPrompts(refreshed.reportPrompts ?? []);
      setPhase("report");
      alert(`Copied ${data.count} prompts to Report phase`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Copy failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <div>
          <h1>{mode === "create" ? "New model" : `Edit: ${model?.display_name}`}</h1>
          <p className={styles.muted}>
            <Link href="/admin/models">← Models</Link>
            {" · "}
            <Link href="/admin">Dashboard</Link>
          </p>
        </div>
        <button
          type="button"
          className={styles.primaryBtn}
          disabled={saving}
          onClick={() => void saveModel()}
        >
          {saving ? "Saving…" : "Save model"}
        </button>
      </header>

      {error && <div className={styles.warn}>{error}</div>}

      <section className={styles.section}>
        <h2>Model metadata</h2>
        <div className={styles.formGrid}>
          {mode === "create" && (
            <label className={styles.field}>
              <span>ID (unique, e.g. bazi_full)</span>
              <input
                className={styles.input}
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="bazi_full"
              />
            </label>
          )}
          <label className={styles.field}>
            <span>Slug (URL /m/{slug}/intro)</span>
            <input
              className={styles.input}
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
          </label>
          <label className={styles.field}>
            <span>Title</span>
            <input
              className={styles.input}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </label>
          <label className={styles.field}>
            <span>Family</span>
            <input
              className={styles.input}
              value={family}
              onChange={(e) => setFamily(e.target.value)}
            />
          </label>
          <label className={styles.field}>
            <span>UI key</span>
            <input
              className={styles.input}
              value={uiKey}
              onChange={(e) => setUiKey(e.target.value)}
            />
          </label>
          <label className={styles.field}>
            <span>Price (HKD)</span>
            <input
              className={styles.input}
              type="number"
              value={priceHkd}
              onChange={(e) => setPriceHkd(e.target.value)}
            />
          </label>
          <div className={styles.fieldWide}>
            <ListingImageUpload
              value={listingImage}
              onChange={setListingImage}
              modelId={mode === "edit" ? model?.id : undefined}
              slug={slug || id}
              disabled={saving}
            />
          </div>
          <label className={styles.fieldWide}>
            <span>Listing description</span>
            <textarea
              className={styles.textarea}
              rows={2}
              value={listingDesc}
              onChange={(e) => setListingDesc(e.target.value)}
            />
          </label>
          <label className={styles.checkRow}>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Active on home page
          </label>
        </div>

        <label className={styles.fieldWide}>
          <span>Tags (home page filters)</span>
          <input
            className={styles.input}
            value={tagLabelsText}
            onChange={(e) => setTagLabelsText(e.target.value)}
            placeholder="戀愛, 財運, 合婚 — comma separated"
          />
          <span className={styles.muted}>
            Type any labels; new tags are created when you save the model.
          </span>
        </label>
      </section>

      {mode === "edit" && model && (
        <section className={styles.section}>
          <div className={styles.tabRow}>
            <h2>AI prompts</h2>
            <div className={styles.tabs}>
              <button
                type="button"
                className={phase === "result" ? styles.tabActive : styles.tab}
                onClick={() => setPhase("result")}
              >
                Result phase ({resultPrompts.length})
              </button>
              <button
                type="button"
                className={phase === "report" ? styles.tabActive : styles.tab}
                onClick={() => setPhase("report")}
              >
                Report phase ({reportPrompts.length})
              </button>
            </div>
          </div>
          <p className={styles.muted}>
            <strong>Result</strong> = 5 AI slots from{" "}
            <code>pre-report-analysis.json</code> (payment teaser).{" "}
            <strong>Report</strong> = 35 AI slots from{" "}
            <code>ai_generated_content.json</code> (20-page report; demo still
            uses sample JSON until live AI). Import defaults loads both. Each
            slot uses{" "}
            <code>page</code> + <code>slot id</code> →{" "}
            <code>{slug}-{phase}-1-1</code>. Render order is hardcoded in the
            app UI, not in CMS.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            <button
              type="button"
              className={styles.secondaryBtn}
              disabled={saving}
              onClick={() => void importDefaultResult()}
            >
              Import defaults (5 result + 35 report)
            </button>
            {resultPrompts.length > 0 && reportPrompts.length === 0 && (
              <button
                type="button"
                className={styles.secondaryBtn}
                disabled={saving}
                onClick={() => void copyResultToReport()}
              >
                Copy result → report ({resultPrompts.length})
              </button>
            )}
          </div>

          <PromptAddForm
            modelSlug={slug}
            phase={phase}
            nextSlotId={
              prompts.reduce((m, p) => Math.max(m, p.display_order), 0) + 1
            }
            onAdd={(f) => void addPrompt(f)}
          />

          <div className={styles.promptList}>
            {prompts.length === 0 ? (
              <p className={styles.muted}>
                No {phase} AI prompts yet. Import defaults or add a slot.
              </p>
            ) : (
              prompts.map((row) => (
                <PromptEntryCard
                  key={row.id}
                  row={row}
                  modelSlug={slug}
                  disabled={saving}
                  onSave={(patch) => void updatePrompt(row.id, patch)}
                  onDelete={() => void deletePrompt(row.id)}
                />
              ))
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function PromptAddForm({
  modelSlug,
  phase,
  nextSlotId,
  onAdd,
}: {
  modelSlug: string;
  phase: PromptPhase;
  nextSlotId: number;
  onAdd: (f: { page: number; slotId: number; description: string }) => void;
}) {
  const [page, setPage] = useState(1);
  const [slotId, setSlotId] = useState(nextSlotId);
  const [description, setDescription] = useState("");
  const previewId = buildPromptSlotId(modelSlug, phase, page, slotId);

  return (
    <div className={styles.addPromptBar}>
      <input
        className={styles.input}
        type="number"
        min={1}
        placeholder="page"
        value={page}
        onChange={(e) => setPage(Number(e.target.value) || 1)}
        title="Page"
      />
      <input
        className={styles.input}
        type="number"
        min={1}
        placeholder="id"
        value={slotId}
        onChange={(e) => setSlotId(Number(e.target.value) || 1)}
        title="Slot id"
      />
      <input
        className={styles.input}
        placeholder="label / description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <span className={styles.muted} style={{ fontSize: "0.75rem" }}>
        → <code>{previewId}</code>
      </span>
      <button
        type="button"
        className={styles.primaryBtn}
        onClick={() => {
          onAdd({ page, slotId, description });
          setDescription("");
          setSlotId(slotId + 1);
        }}
      >
        Add AI prompt
      </button>
    </div>
  );
}

function PromptEntryCard({
  row,
  modelSlug,
  disabled,
  onSave,
  onDelete,
}: {
  row: ModelPromptEntryRow;
  modelSlug: string;
  disabled: boolean;
  onSave: (patch: Partial<ModelPromptEntryRow>) => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState(row);
  const cmsSlotId = draft.display_order;
  const entryKey = buildPromptSlotId(
    modelSlug,
    row.phase,
    draft.page,
    cmsSlotId,
  );
  const dirty =
    draft.description !== row.description ||
    draft.page !== row.page ||
    cmsSlotId !== row.display_order ||
    draft.prompt_template !== row.prompt_template ||
    draft.is_active !== row.is_active ||
    draft.length_min !== row.length_min ||
    draft.length_max !== row.length_max;

  return (
    <details className={styles.promptCard} open>
      <summary>
        <span className={styles.badge}>
          p{row.page} · id {row.display_order}
        </span>
        <span className={styles.muted}>{row.description || "AI slot"}</span>
        {!row.is_active && <span className={styles.badge}>inactive</span>}
      </summary>
      <p className={styles.muted} style={{ margin: "0 0 12px", fontSize: "0.8rem" }}>
        Key: <code>{entryKey}</code>
      </p>
      <div className={styles.formGrid}>
        <label className={styles.field}>
          <span>page</span>
          <input
            className={styles.input}
            type="number"
            min={1}
            value={draft.page}
            onChange={(e) =>
              setDraft((d) => ({ ...d, page: Number(e.target.value) || 1 }))
            }
          />
        </label>
        <label className={styles.field}>
          <span>Slot id</span>
          <input
            className={styles.input}
            type="number"
            min={1}
            value={draft.display_order}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                display_order: Number(e.target.value) || 1,
              }))
            }
          />
        </label>
        <label className={styles.fieldWide}>
          <span>label</span>
          <input
            className={styles.input}
            value={draft.description}
            onChange={(e) =>
              setDraft((d) => ({ ...d, description: e.target.value }))
            }
          />
        </label>
        <label className={styles.field}>
          <span>length_min</span>
          <input
            className={styles.input}
            type="number"
            value={draft.length_min ?? ""}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                length_min: e.target.value ? Number(e.target.value) : null,
              }))
            }
          />
        </label>
        <label className={styles.field}>
          <span>length_max</span>
          <input
            className={styles.input}
            type="number"
            value={draft.length_max ?? ""}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                length_max: e.target.value ? Number(e.target.value) : null,
              }))
            }
          />
        </label>
        <label className={styles.fieldWide}>
          <span>prompt_template</span>
          <textarea
            className={styles.textarea}
            rows={10}
            value={draft.prompt_template ?? ""}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                prompt_template: e.target.value || null,
              }))
            }
          />
        </label>
        <label className={styles.checkRow}>
          <input
            type="checkbox"
            checked={draft.is_active}
            onChange={(e) =>
              setDraft((d) => ({ ...d, is_active: e.target.checked }))
            }
          />
          Active
        </label>
      </div>
      <div className={styles.cardActions}>
        <button
          type="button"
          className={styles.primaryBtn}
          disabled={disabled || !dirty}
          onClick={() =>
            onSave({
              entry_type: "ai",
              description: draft.description,
              page: draft.page,
              display_order: draft.display_order,
              prompt_template: draft.prompt_template,
              length_min: draft.length_min,
              length_max: draft.length_max,
              is_active: draft.is_active,
            })
          }
        >
          Save prompt
        </button>
        <button
          type="button"
          className={styles.dangerBtn}
          disabled={disabled}
          onClick={onDelete}
        >
          Delete
        </button>
      </div>
    </details>
  );
}
