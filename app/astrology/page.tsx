import AstrologyClient from "@/app/astrology/AstrologyClient";

export const metadata = {
  title: "西洋星盤 · Swiss Ephemeris",
  description: "個人解碼、雙人合盤、流年行運 — pyswisseph + AI",
};

export default function AstrologyPage() {
  return <AstrologyClient />;
}
