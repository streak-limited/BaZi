"use client";

import { useRef, useState } from "react";
import styles from "@/app/admin/admin.module.css";

type Props = {
  value: string;
  onChange: (url: string) => void;
  modelId?: string;
  slug: string;
  disabled?: boolean;
};

async function readJson(res: Response) {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? res.statusText);
  return data as { url: string };
}

export function ListingImageUpload({
  value,
  onChange,
  modelId,
  slug,
  disabled,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const canUpload = Boolean(modelId || slug.trim());

  const handleFile = async (file: File | null) => {
    if (!file || !canUpload) return;
    setUploading(true);
    setUploadError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const endpoint = modelId
        ? `/api/admin/models/${encodeURIComponent(modelId)}/listing-image`
        : "/api/admin/listing-image";
      if (!modelId) form.append("slug", slug.trim());

      const { url } = await readJson(
        await fetch(endpoint, { method: "POST", body: form }),
      );
      onChange(url);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className={styles.listingUpload}>
      <span className={styles.listingUploadLabel}>Listing image</span>

      {value ? (
        <div className={styles.listingPreviewWrap}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className={styles.listingPreview} />
          <div className={styles.listingPreviewActions}>
            <button
              type="button"
              className={styles.secondaryBtn}
              disabled={disabled || uploading || !canUpload}
              onClick={() => inputRef.current?.click()}
            >
              Replace
            </button>
            <button
              type="button"
              className={styles.secondaryBtn}
              disabled={disabled || uploading}
              onClick={() => onChange("")}
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className={styles.listingDropzone}
          disabled={disabled || uploading || !canUpload}
          onClick={() => inputRef.current?.click()}
        >
          {uploading
            ? "Uploading…"
            : canUpload
              ? "Click to upload (JPEG, PNG, WebP, GIF · max 5 MB)"
              : "Enter model ID and slug first"}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className={styles.hiddenFile}
        disabled={disabled || uploading || !canUpload}
        onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
      />

      {uploadError && <p className={styles.uploadError}>{uploadError}</p>}

      {value && (
        <p className={styles.muted}>
          Stored in Supabase · saved when you click Save model
        </p>
      )}
    </div>
  );
}
