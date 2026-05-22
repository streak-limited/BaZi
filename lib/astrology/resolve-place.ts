import { getBirthPlace } from "@/lib/astrology/birth-places";
import { geocodeHitToBirthPlace, type GeocodeHit } from "@/lib/astrology/geocode";
import type { BirthPlace } from "@/lib/astrology/types";

export function resolveBirthPlace(input: {
  placeId?: string;
  place?: Partial<BirthPlace> | GeocodeHit | null;
}): BirthPlace {
  const p = input.place;
  if (
    p &&
    typeof p.lat === "number" &&
    typeof p.lon === "number" &&
    p.timezone
  ) {
    const label =
      "label" in p && p.label
        ? String(p.label)
        : [p.lat, p.lon].join(",");
    const id =
      "id" in p && p.id
        ? String(p.id)
        : `geo:${p.lat},${p.lon}`;
    return {
      id,
      label,
      lat: p.lat,
      lon: p.lon,
      timezone: String(p.timezone),
    };
  }
  if (p && "lat" in p && "timezone" in p) {
    return geocodeHitToBirthPlace(p as GeocodeHit);
  }
  return getBirthPlace(input.placeId ?? "hk");
}
