export function formatViewCount(count: number): string {
  if (count <= 0) return "0";
  if (count >= 10_000) {
    const wan = count / 10_000;
    if (wan >= 10) return `${Math.floor(wan)}萬+`;
    const rounded = Math.round(wan * 10) / 10;
    const text =
      rounded % 1 === 0 ? String(rounded) : rounded.toFixed(1).replace(/\.0$/, "");
    return `${text}萬+`;
  }
  if (count >= 1000) return `${Math.floor(count / 1000)}千+`;
  return String(count);
}
