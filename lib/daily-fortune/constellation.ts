/** 西洋星座（依公曆月日） */
const RANGES: { sign: string; start: [number, number]; end: [number, number] }[] = [
  { sign: "摩羯座", start: [12, 22], end: [1, 19] },
  { sign: "水瓶座", start: [1, 20], end: [2, 18] },
  { sign: "雙魚座", start: [2, 19], end: [3, 20] },
  { sign: "白羊座", start: [3, 21], end: [4, 19] },
  { sign: "金牛座", start: [4, 20], end: [5, 20] },
  { sign: "雙子座", start: [5, 21], end: [6, 21] },
  { sign: "巨蟹座", start: [6, 22], end: [7, 22] },
  { sign: "獅子座", start: [7, 23], end: [8, 22] },
  { sign: "處女座", start: [8, 23], end: [9, 22] },
  { sign: "天秤座", start: [9, 23], end: [10, 23] },
  { sign: "天蠍座", start: [10, 24], end: [11, 22] },
  { sign: "射手座", start: [11, 23], end: [12, 21] },
];

function inRange(m: number, d: number, start: [number, number], end: [number, number]): boolean {
  const [sm, sd] = start;
  const [em, ed] = end;
  if (sm > em) {
    return (m > sm || (m === sm && d >= sd)) || (m < em || (m === em && d <= ed));
  }
  if (m < sm || m > em) return false;
  if (m === sm && d < sd) return false;
  if (m === em && d > ed) return false;
  return true;
}

export function constellationFromSolar(month: number, day: number): string {
  for (const r of RANGES) {
    if (inRange(month, day, r.start, r.end)) return r.sign;
  }
  return "摩羯座";
}
