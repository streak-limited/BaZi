export interface BirthPlace {
  id: string;
  label: string;
  lat: number;
  lon: number;
  timezone: string;
}

export interface BirthPayload {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  timezone: string;
  lat: number;
  lon: number;
  label?: string;
}

export interface PlanetPosition {
  id: string;
  longitude: number;
  zodiac: string;
  zodiac_zh: string;
  deg: number;
  house: number;
  retrograde?: boolean;
}

export interface NatalChart {
  user_id: string;
  birth: {
    label: string;
    local: string;
    timezone: string;
    lat: number;
    lon: number;
  };
  julian_day: number;
  planets: Record<string, PlanetPosition>;
  ascendant: PlanetPosition & { house?: number };
  houses: Record<
    string,
    { house: number; zodiac: string; zodiac_zh: string; cusp_deg: number }
  >;
}

export interface SynastryAspect {
  from: string;
  to: string;
  from_label: string;
  to_label: string;
  type: string;
  type_zh: string;
  meaning: string;
}

export interface SynastryChart {
  couple_type: string;
  chart_a: NatalChart;
  chart_b: NatalChart;
  aspects: SynastryAspect[];
  summary: { total: number; harmonious: number; tense: number };
}

export interface TransitHit {
  transit_planet: string;
  natal_planet: string;
  status: string;
  aspect: string;
  aspect_zh: string;
  hit_natal_house?: number;
  type: string;
  meaning: string;
}

export interface TransitChart {
  current_date: string;
  natal_user_id: string;
  natal_summary: {
    sun: PlanetPosition;
    moon: PlanetPosition;
    ascendant: PlanetPosition;
  };
  transit_planets: Record<string, PlanetPosition>;
  active_transits: TransitHit[];
  highlights: {
    mercury_retrograde: boolean;
    mercury_house?: number;
    major_count: number;
  };
}

export type AstrologyMode = "natal" | "synastry" | "transits";

export type NatalFocusPlanet =
  | "Sun"
  | "Moon"
  | "Mercury"
  | "Venus"
  | "Mars"
  | "Ascendant";
