import type { DailyFortuneComputed } from "@/lib/daily-fortune/types";

const GUIDE_KEY = "daily-fortune-guide-v2";

export interface CachedDailyGuide {
  subjectId: string;
  dateKey: string;
  text: string;
  model: string;
  computed: DailyFortuneComputed;
}

export function loadCachedGuide(
  subjectId: string,
  dateKey: string,
): CachedDailyGuide | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(GUIDE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as CachedDailyGuide;
    if (data.subjectId === subjectId && data.dateKey === dateKey) return data;
    return null;
  } catch {
    return null;
  }
}

export function saveCachedGuide(guide: CachedDailyGuide): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(GUIDE_KEY, JSON.stringify(guide));
}
