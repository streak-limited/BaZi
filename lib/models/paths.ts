import { getAppBaseUrl } from "@/lib/supabase/server";

export function modelWelcomePath(slug: string): string {
  return `/m/${slug}`;
}

export function modelIntroPath(slug: string): string {
  return `/m/${slug}/intro`;
}

export function journeySoundKey(slug: string): string {
  return `journey-sound-${slug}`;
}

export function modelInputPath(slug: string): string {
  return `/m/${slug}/input`;
}

export function trialHubPath(token: string, query?: Record<string, string>): string {
  const base = `/r/${token}`;
  if (!query || Object.keys(query).length === 0) return base;
  const q = new URLSearchParams(query).toString();
  return `${base}?${q}`;
}

export function trialResultPath(token: string): string {
  return `/r/${token}/result`;
}

export function trialReportPath(token: string): string {
  return `/r/${token}/report`;
}

export function trialUrls(publicToken: string) {
  const base = getAppBaseUrl();
  return {
    hub: `${base}/r/${publicToken}`,
    result: `${base}/r/${publicToken}/result`,
    report: `${base}/r/${publicToken}/report`,
  };
}

export function journeyDraftKey(slug: string): string {
  return `journey-draft-${slug}`;
}
