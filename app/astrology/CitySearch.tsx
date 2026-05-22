"use client";

import {
  BIRTH_PLACES,
  DEFAULT_BIRTH_PLACE_ID,
  getBirthPlace,
} from "@/lib/astrology/birth-places";
import type { BirthPlace } from "@/lib/astrology/types";
import type { GeocodeHit } from "@/lib/astrology/geocode";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./astrology.module.css";

interface CitySearchProps {
  label: string;
  value: BirthPlace;
  onChange: (place: BirthPlace) => void;
}

export default function CitySearch({ label, value, onChange }: CitySearchProps) {
  const [query, setQuery] = useState(value.label);
  const [results, setResults] = useState<GeocodeHit[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQuery(value.label);
  }, [value.label]);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/astrology/geocode?q=${encodeURIComponent(q.trim())}`,
      );
      const data = await res.json();
      setResults(data.results ?? []);
      setOpen(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const onInput = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(text), 320);
  };

  const pickGeocode = (hit: GeocodeHit) => {
    onChange({
      id: hit.id,
      label: hit.label,
      lat: hit.lat,
      lon: hit.lon,
      timezone: hit.timezone,
    });
    setQuery(hit.label);
    setOpen(false);
  };

  const pickPreset = (id: string) => {
    const p = getBirthPlace(id);
    onChange(p);
    setQuery(p.label);
    setOpen(false);
  };

  return (
    <div className={styles.citySearch}>
      <p className={styles.label}>{label}</p>
      <input
        className={styles.textInput}
        type="text"
        value={query}
        placeholder="搜尋城市，例如：香港、台北、London"
        onChange={(e) => onInput(e.target.value)}
        onFocus={() => {
          if (results.length) setOpen(true);
        }}
      />
      {loading && (
        <p className={styles.hint} style={{ marginTop: 4 }}>
          搜尋中…
        </p>
      )}
      <div className={styles.presetRow}>
        {BIRTH_PLACES.slice(0, 5).map((p) => (
          <button
            key={p.id}
            type="button"
            className={
              value.id === p.id ? styles.chipActive : styles.chip
            }
            onClick={() => pickPreset(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>
      {open && results.length > 0 && (
        <ul className={styles.geoList}>
          {results.map((hit) => (
            <li key={hit.id}>
              <button
                type="button"
                className={styles.geoItem}
                onClick={() => pickGeocode(hit)}
              >
                {hit.label}
                <span className={styles.hint}>
                  {hit.timezone} · {hit.lat.toFixed(2)}, {hit.lon.toFixed(2)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className={styles.hint}>
        已選：{value.label}（{value.timezone}）
      </p>
    </div>
  );
}

export function defaultBirthPlace(): BirthPlace {
  return getBirthPlace(DEFAULT_BIRTH_PLACE_ID);
}
