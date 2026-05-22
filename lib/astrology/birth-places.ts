import type { BirthPlace } from "@/lib/astrology/types";

/** Preset birth locations for ascendant / house calculation */
export const BIRTH_PLACES: BirthPlace[] = [
  {
    id: "hk",
    label: "香港",
    lat: 22.3193,
    lon: 114.1694,
    timezone: "Asia/Hong_Kong",
  },
  {
    id: "tpe",
    label: "台北",
    lat: 25.033,
    lon: 121.5654,
    timezone: "Asia/Taipei",
  },
  {
    id: "tyo",
    label: "東京",
    lat: 35.6762,
    lon: 139.6503,
    timezone: "Asia/Tokyo",
  },
  {
    id: "sel",
    label: "首爾",
    lat: 37.5665,
    lon: 126.978,
    timezone: "Asia/Seoul",
  },
  {
    id: "bj",
    label: "北京",
    lat: 39.9042,
    lon: 116.4074,
    timezone: "Asia/Shanghai",
  },
  {
    id: "sh",
    label: "上海",
    lat: 31.2304,
    lon: 121.4737,
    timezone: "Asia/Shanghai",
  },
  {
    id: "sg",
    label: "新加坡",
    lat: 1.3521,
    lon: 103.8198,
    timezone: "Asia/Singapore",
  },
  {
    id: "la",
    label: "洛杉磯",
    lat: 34.0522,
    lon: -118.2437,
    timezone: "America/Los_Angeles",
  },
  {
    id: "nyc",
    label: "紐約",
    lat: 40.7128,
    lon: -74.006,
    timezone: "America/New_York",
  },
  {
    id: "lon",
    label: "倫敦",
    lat: 51.5074,
    lon: -0.1278,
    timezone: "Europe/London",
  },
];

export const DEFAULT_BIRTH_PLACE_ID = "hk";

export function getBirthPlace(id: string): BirthPlace {
  return BIRTH_PLACES.find((p) => p.id === id) ?? BIRTH_PLACES[0];
}
