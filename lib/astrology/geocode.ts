import type { BirthPlace } from "@/lib/astrology/types";

export interface GeocodeHit {
  id: string;
  label: string;
  lat: number;
  lon: number;
  timezone: string;
  country?: string;
  region?: string;
  population?: number;
}

interface OpenMeteoResult {
  results?: Array<{
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    timezone: string;
    country?: string;
    admin1?: string;
    country_code?: string;
    population?: number;
  }>;
}

const cache = new Map<string, { at: number; hits: GeocodeHit[] }>();
const CACHE_TTL_MS = 60 * 60 * 1000;

function placeIdFrom(lat: number, lon: number, name: string): string {
  return `geo:${lat.toFixed(4)},${lon.toFixed(4)}:${name.slice(0, 40)}`;
}

function toHit(r: NonNullable<OpenMeteoResult["results"]>[number]): GeocodeHit {
  const label = [r.name, r.admin1, r.country].filter(Boolean).join(", ");
  return {
    id: placeIdFrom(r.latitude, r.longitude, r.name),
    label,
    lat: r.latitude,
    lon: r.longitude,
    timezone: r.timezone || "UTC",
    country: r.country,
    region: r.admin1,
    population: r.population,
  };
}

/** Open-Meteo geocoding — free, no API key. https://open-meteo.com/en/docs/geocoding-api */
export async function searchBirthCities(
  query: string,
  limit = 8,
): Promise<GeocodeHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const cacheKey = `${q.toLowerCase()}:${limit}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.hits;

  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", q);
  url.searchParams.set("count", String(limit));
  url.searchParams.set("language", "zh");
  url.searchParams.set("format", "json");

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "BaZi-Astrology/1.0" },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Geocoding failed (${res.status})`);
  }

  const data = (await res.json()) as OpenMeteoResult;
  const hits = (data.results ?? []).map(toHit);
  cache.set(cacheKey, { at: Date.now(), hits });
  return hits;
}

export function geocodeHitToBirthPlace(hit: GeocodeHit): BirthPlace {
  return {
    id: hit.id,
    label: hit.label,
    lat: hit.lat,
    lon: hit.lon,
    timezone: hit.timezone,
  };
}
