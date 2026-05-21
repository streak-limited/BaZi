import { NUMEROLOGY_MAP } from "@/lib/daily-fortune/constants";

export function reduceToDigit(n: number): number {
  let total = n;
  while (total > 9) {
    total = String(total)
      .split("")
      .reduce((s, d) => s + Number(d), 0);
  }
  return total;
}

export function calculatePersonalDay(
  birthMonth: number,
  birthDay: number,
  year: number,
  month: number,
  day: number,
): number {
  const allDigits =
    String(birthMonth) +
    String(birthDay) +
    String(year) +
    String(month) +
    String(day);
  return reduceToDigit(
    allDigits.split("").reduce((s, d) => s + Number(d), 0),
  );
}

export function calculateLifePath(
  year: number,
  month: number,
  day: number,
): number {
  const raw = String(year) + String(month) + String(day);
  return reduceToDigit(raw.split("").reduce((s, d) => s + Number(d), 0));
}

export function getNumerologyEntry(n: number) {
  return NUMEROLOGY_MAP[n] ?? NUMEROLOGY_MAP[1];
}
