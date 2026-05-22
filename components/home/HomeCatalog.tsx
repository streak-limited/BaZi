"use client";

import ModelCard from "@/components/home/ModelCard";
import {
  ALL_TAG,
  buildHomeFilterTags,
  filterModelsByTag,
  shouldShowHomeTagFilter,
} from "@/lib/models/home-tags";
import type { ProductModel } from "@/lib/products/model-store";
import type { ProductTag } from "@/lib/products/types";
import { useMemo, useState } from "react";
import styles from "./home-catalog.module.css";

export default function HomeCatalog({
  models,
  trialCounts,
  catalogTags = [],
}: {
  models: ProductModel[];
  trialCounts: Record<string, number>;
  catalogTags?: ProductTag[];
}) {
  const filterTags = useMemo(
    () => buildHomeFilterTags(catalogTags, models),
    [catalogTags, models],
  );
  const showFilter = shouldShowHomeTagFilter(filterTags);
  const [activeTag, setActiveTag] = useState(ALL_TAG);

  const visible = useMemo(
    () => filterModelsByTag(models, activeTag),
    [models, activeTag],
  );

  return (
    <>
      {showFilter ? (
        <div className={styles.filterBar}>
          <div className={styles.filterScroll} role="tablist" aria-label="產品分類">
            {filterTags.map((tag) => {
              const active = tag === activeTag;
              return (
                <button
                  key={tag}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={active ? styles.pillActive : styles.pill}
                  onClick={() => setActiveTag(tag)}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className={showFilter ? styles.mainWithFilter : styles.mainNoFilter}>
        {visible.length === 0 ? (
          <div className={styles.empty}>
            {activeTag === ALL_TAG
              ? "尚無產品"
              : `「${activeTag}」暫無產品 — 請在 Admin 為模型加上此標籤後儲存`}
          </div>
        ) : (
          <section className={styles.list} aria-label="產品列表">
            {visible.map((model) => (
              <ModelCard
                key={model.id}
                model={model}
                trialCount={trialCounts[model.id] ?? 0}
              />
            ))}
          </section>
        )}
      </div>
    </>
  );
}
