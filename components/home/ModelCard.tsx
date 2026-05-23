import { formatViewCount } from "@/lib/models/format-views";
import { modelWelcomePath } from "@/lib/models/paths";
import type { ProductModel } from "@/lib/products/model-store";
import Image from "next/image";
import Link from "next/link";
import styles from "./model-card.module.css";

function EyeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function ModelCard({
  model,
  trialCount = 0,
}: {
  model: ProductModel;
  trialCount?: number;
}) {
  const { listing } = model.config;
  const image = listing.image;
  const description =
    listing.description ?? model.config.copy.introSubtitle ?? "";
  const views =
    listing.view_count != null ? listing.view_count : trialCount;
  const viewsLabel = formatViewCount(views);

  return (
    <Link href={modelWelcomePath(model.slug)} className={styles.card}>
      <div className={styles.media}>
        {image ? (
          <Image
            src={image}
            alt={model.display_name}
            fill
            className={styles.image}
            sizes="(max-width: 440px) 100vw, 440px"
          />
        ) : (
          <div className={styles.placeholder} />
        )}
        <div className={styles.gradient} aria-hidden />
        <div className={styles.overlay}>
          <p className={styles.title}>{model.display_name}</p>
          {description ? (
            <p className={styles.description}>{description}</p>
          ) : null}
          <div className={styles.meta}>
            {model.tags.length > 0 ? (
              <span className={styles.tagRow}>
                {model.tags.map((t) => (
                  <span key={t.id} className={styles.tagChip}>
                    {t.label}
                  </span>
                ))}
              </span>
            ) : null}
            {listing.badge ? (
              <span className={styles.badge}>≡ {listing.badge}</span>
            ) : null}
            <span className={styles.views}>
              <EyeIcon />
              {viewsLabel}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
