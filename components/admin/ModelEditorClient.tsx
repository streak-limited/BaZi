"use client";

import type { ProductModel } from "@/lib/products/model-store";
import type { ModelPromptEntryRow, PromptPhase } from "@/lib/products/prompt-types";
import type { ProductTag } from "@/lib/products/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import styles from "@/app/admin/admin.module.css";

type Props = {
  mode: "create" | "edit";
  model?: ProductModel;
  resultPrompts?: ModelPromptEntryRow[];
  reportPrompts?: ModelPromptEntryRow[];
  allTags: ProductTag[];
};

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
  allTags,
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
  const [tagIds, setTagIds] = useState<string[]>(
    model?.tags.map((t) => t.id) ?? [],
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
              tag_ids: tagIds,
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
              tag_ids: tagIds,
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
    tagIds,
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
      alert(`Imported ${data.count} result entries`);
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
    entry_key: string;
    entry_type: string;
    description: string;
  }) => {
    if (!model) return;
    setSaving(true);
    setError(null);
    try {
      const maxOrder = prompts.reduce(
        (m, p) => Math.max(m, p.display_order),
        0,
      );
      const { entry } = await readJson(
        await fetch("/api/admin/prompts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            modelId: model.id,
            phase,
            entry_key: form.entry_key.trim(),
            entry_type: form.entry_type,
            description: form.description,
            display_order: maxOrder + 10,
            page: 1,
            is_active: true,
          }),
        }),
      );
      setPrompts((list) => [...list, entry].sort((a, b) => a.display_order - b.display_order));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Add failed");
    } finally {
      setSaving(false);
    }
  };

  const toggleTag = (tagId: string) => {
    setTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((t) => t !== tagId)
        : [...prev, tagId],
    );
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
          <label className={styles.field}>
            <span>Listing image URL</span>
            <input
              className={styles.input}
              value={listingImage}
              onChange={(e) => setListingImage(e.target.value)}
            />
          </label>
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

        <h3 className={styles.subHeading}>Tags</h3>
        <div className={styles.tagRow}>
          {allTags.length === 0 ? (
            <span className={styles.muted}>No tags in DB — run migration 007</span>
          ) : (
            allTags.map((t) => (
              <label key={t.id} className={styles.tagChip}>
                <input
                  type="checkbox"
                  checked={tagIds.includes(t.id)}
                  onChange={() => toggleTag(t.id)}
                />
                {t.label}
              </label>
            ))
          )}
        </div>
      </section>

      {mode === "edit" && model && (
        <section className={styles.section}>
          <div className={styles.tabRow}>
            <h2>Prompt entries</h2>
            <div className={styles.tabs}>
              <button
                type="button"
                className={phase === "result" ? styles.tabActive : styles.tab}
                onClick={() => setPhase("result")}
              >
                Result ({resultPrompts.length})
              </button>
              <button
                type="button"
                className={phase === "report" ? styles.tabActive : styles.tab}
                onClick={() => setPhase("report")}
              >
                Report ({reportPrompts.length})
              </button>
            </div>
          </div>
          <p className={styles.muted}>
            Each row has a stable <code>entry_key</code> — use{" "}
            <code>entryByKey(entries, &quot;pre-ai-narrative-1&quot;)</code> in
            components. AI rows store the prompt template; generation writes
            content into deliverables keyed by <code>entry_key</code>.
          </p>
          {phase === "result" && (
            <button
              type="button"
              className={styles.secondaryBtn}
              disabled={saving}
              onClick={() => void importDefaultResult()}
            >
              Import default result layout (from code)
            </button>
          )}

          <PromptAddForm onAdd={(f) => void addPrompt(f)} />

          <div className={styles.promptList}>
            {prompts.length === 0 ? (
              <p className={styles.muted}>
                No {phase} prompts yet. Import default (result) or add entries.
              </p>
            ) : (
              prompts.map((row) => (
                <PromptEntryCard
                  key={row.id}
                  row={row}
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
  onAdd,
}: {
  onAdd: (f: {
    entry_key: string;
    entry_type: string;
    description: string;
  }) => void;
}) {
  const [entryKey, setEntryKey] = useState("");
  const [entryType, setEntryType] = useState("ai");
  const [description, setDescription] = useState("");

  return (
    <div className={styles.addPromptBar}>
      <input
        className={styles.input}
        placeholder="entry_key e.g. pre-ai-narrative-1"
        value={entryKey}
        onChange={(e) => setEntryKey(e.target.value)}
      />
      <select
        className={styles.input}
        value={entryType}
        onChange={(e) => setEntryType(e.target.value)}
      >
        <option value="static">static</option>
        <option value="computed">computed</option>
        <option value="ai">ai</option>
      </select>
      <input
        className={styles.input}
        placeholder="description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <button
        type="button"
        className={styles.primaryBtn}
        onClick={() => {
          if (!entryKey.trim()) return;
          onAdd({ entry_key: entryKey, entry_type: entryType, description });
          setEntryKey("");
          setDescription("");
        }}
      >
        Add entry
      </button>
    </div>
  );
}

function PromptEntryCard({
  row,
  disabled,
  onSave,
  onDelete,
}: {
  row: ModelPromptEntryRow;
  disabled: boolean;
  onSave: (patch: Partial<ModelPromptEntryRow>) => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState(row);
  const dirty =
    draft.entry_key !== row.entry_key ||
    draft.description !== row.description ||
    draft.section !== row.section ||
    draft.page !== row.page ||
    draft.display_order !== row.display_order ||
    draft.entry_type !== row.entry_type ||
    draft.static_content !== row.static_content ||
    draft.prompt_template !== row.prompt_template ||
    draft.is_active !== row.is_active ||
    draft.length_min !== row.length_min ||
    draft.length_max !== row.length_max;

  return (
    <details className={styles.promptCard} open={row.entry_type === "ai"}>
      <summary>
        <code>{row.entry_key}</code>
        <span className={styles.badge}>{row.entry_type}</span>
        <span className={styles.muted}>p{row.page} · #{row.display_order}</span>
        {!row.is_active && <span className={styles.badge}>inactive</span>}
      </summary>
      <div className={styles.formGrid}>
        <label className={styles.field}>
          <span>entry_key</span>
          <input
            className={styles.input}
            value={draft.entry_key}
            onChange={(e) =>
              setDraft((d) => ({ ...d, entry_key: e.target.value }))
            }
          />
        </label>
        <label className={styles.field}>
          <span>type</span>
          <select
            className={styles.input}
            value={draft.entry_type}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                entry_type: e.target.value as ModelPromptEntryRow["entry_type"],
              }))
            }
          >
            <option value="static">static</option>
            <option value="computed">computed</option>
            <option value="ai">ai</option>
          </select>
        </label>
        <label className={styles.field}>
          <span>page</span>
          <input
            className={styles.input}
            type="number"
            value={draft.page}
            onChange={(e) =>
              setDraft((d) => ({ ...d, page: Number(e.target.value) }))
            }
          />
        </label>
        <label className={styles.field}>
          <span>display_order</span>
          <input
            className={styles.input}
            type="number"
            value={draft.display_order}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                display_order: Number(e.target.value),
              }))
            }
          />
        </label>
        <label className={styles.field}>
          <span>section</span>
          <input
            className={styles.input}
            value={draft.section ?? ""}
            onChange={(e) =>
              setDraft((d) => ({ ...d, section: e.target.value || null }))
            }
          />
        </label>
        <label className={styles.fieldWide}>
          <span>description</span>
          <input
            className={styles.input}
            value={draft.description}
            onChange={(e) =>
              setDraft((d) => ({ ...d, description: e.target.value }))
            }
          />
        </label>
        {draft.entry_type !== "ai" && (
          <label className={styles.fieldWide}>
            <span>static_content</span>
            <textarea
              className={styles.textarea}
              rows={3}
              value={draft.static_content ?? ""}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  static_content: e.target.value || null,
                }))
              }
            />
          </label>
        )}
        {draft.entry_type === "ai" && (
          <>
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
                rows={8}
                value={draft.prompt_template ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    prompt_template: e.target.value || null,
                  }))
                }
              />
            </label>
          </>
        )}
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
              entry_key: draft.entry_key,
              entry_type: draft.entry_type,
              description: draft.description,
              section: draft.section,
              page: draft.page,
              display_order: draft.display_order,
              static_content: draft.static_content,
              prompt_template: draft.prompt_template,
              length_min: draft.length_min,
              length_max: draft.length_max,
              is_active: draft.is_active,
            })
          }
        >
          Save entry
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
