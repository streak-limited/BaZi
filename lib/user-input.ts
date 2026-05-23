/** Eight fields collected in the reference onboarding flow. */

export type CalendarType = "solar" | "lunar";

export type GenderChoice = "男生" | "女生";

export type SexualityChoice = "異性戀" | "同性戀";

export type RelationshipChoice =
  | "單身"
  | "有在意的人"
  | "有對象了"
  | "剛分手不久"
  | "已經結婚了";

export type JobChoice =
  | "我是學生"
  | "正在找工作"
  | "有在上班"
  | "自己做生意";

export interface UserFormInput {
  /** YYYY.MM.DD or YYYY-MM-DD */
  birthDate: string;
  calendarType: CalendarType;
  /** HH:mm or empty when unknown */
  birthTime: string;
  birthTimeUnknown: boolean;
  gender: GenderChoice;
  name: string;
  sexuality: SexualityChoice;
  relationship: RelationshipChoice;
  job: JobChoice;
  email: string;
}

export const DEFAULT_USER_INPUT: UserFormInput = {
  birthDate: "",
  calendarType: "solar",
  birthTime: "",
  birthTimeUnknown: false,
  gender: "男生",
  name: "",
  sexuality: "異性戀",
  relationship: "有對象了",
  job: "自己做生意",
  email: "",
};

export const RELATIONSHIP_OPTIONS: RelationshipChoice[] = [
  "單身",
  "有在意的人",
  "有對象了",
  "剛分手不久",
  "已經結婚了",
];

export const JOB_OPTIONS: JobChoice[] = [
  "我是學生",
  "正在找工作",
  "有在上班",
  "自己做生意",
];

/** Map UI labels → prompt variable values (English keys in templates). */
export function mapGender(g: GenderChoice): string {
  return g === "男生" ? "male" : "female";
}

export function mapSexuality(s: SexualityChoice): string {
  return s === "異性戀" ? "straight" : "gay";
}

export function mapJobStatus(j: JobChoice): string {
  switch (j) {
    case "我是學生":
      return "student";
    case "正在找工作":
      return "unemployed";
    case "有在上班":
      return "employed";
    case "自己做生意":
      return "self_employed";
  }
}

export function mapRelationship(r: RelationshipChoice): string {
  switch (r) {
    case "單身":
    case "有在意的人":
    case "剛分手不久":
      return "single";
    case "有對象了":
      return "partnered";
    case "已經結婚了":
      return "married";
  }
}

export function parseBirthDate(raw: string): { y: number; m: number; d: number } | null {
  const s = raw.trim().replace(/\./g, "-");
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return { y, m: mo, d };
}

/** Auto-insert dots while typing: 19921 → 1992.1, 1992111 → 1992.11.1 */
export function formatBirthDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  const year = digits.slice(0, 4);
  const month = digits.slice(4, 6);
  const day = digits.slice(6, 8);

  if (digits.length <= 4) return year;
  if (digits.length === 5) return `${year}.${month.charAt(0)}`;
  if (digits.length === 6) return `${year}.${month}`;
  return `${year}.${month}.${day}`;
}

export function isBirthDateComplete(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 8) return false;
  return parseBirthDate(value) !== null;
}

export function parseBirthTime(raw: string): { h: number; min: number } | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(raw.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return { h, min };
}

/** Auto-insert colon while typing: 093 → 09:3 */
export function formatBirthTimeInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  const hours = digits.slice(0, 2);
  const mins = digits.slice(2, 4);

  if (digits.length <= 2) return hours;
  if (digits.length === 3) return `${hours}:${mins.charAt(0)}`;
  return `${hours}:${mins}`;
}

export function isBirthTimeComplete(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 4) return false;
  return parseBirthTime(value) !== null;
}

export function formatBirthDateForPrompt(parsed: {
  y: number;
  m: number;
  d: number;
}): string {
  const mm = String(parsed.m).padStart(2, "0");
  const dd = String(parsed.d).padStart(2, "0");
  return `${parsed.y}-${mm}-${dd}`;
}
