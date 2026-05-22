"""Swiss Ephemeris natal / synastry / transit calculations (pyswisseph)."""

from __future__ import annotations

import json
import math
from dataclasses import dataclass
from datetime import datetime
from typing import Any
from zoneinfo import ZoneInfo

import swisseph as swe

# Moshier ephemeris — no external .se1 files required (good for dev).
# For production precision, set SE_EPHE_PATH to Astro.com ephemeris files.
swe.set_ephe_path("")
FLAGS = swe.FLG_MOSEPH | swe.FLG_SPEED

SIGNS_EN = [
    "Aries",
    "Taurus",
    "Gemini",
    "Cancer",
    "Leo",
    "Virgo",
    "Libra",
    "Scorpio",
    "Sagittarius",
    "Capricorn",
    "Aquarius",
    "Pisces",
]
SIGNS_ZH = [
    "白羊",
    "金牛",
    "雙子",
    "巨蟹",
    "獅子",
    "處女",
    "天秤",
    "天蠍",
    "射手",
    "摩羯",
    "水瓶",
    "雙魚",
]

PLANETS = [
    ("Sun", swe.SUN),
    ("Moon", swe.MOON),
    ("Mercury", swe.MERCURY),
    ("Venus", swe.VENUS),
    ("Mars", swe.MARS),
    ("Jupiter", swe.JUPITER),
    ("Saturn", swe.SATURN),
    ("Uranus", swe.URANUS),
    ("Neptune", swe.NEPTUNE),
    ("Pluto", swe.PLUTO),
    ("North Node", swe.TRUE_NODE),
]

ASPECT_DEFS = [
    ("Conjunction", 0, 8),
    ("Opposition", 180, 8),
    ("Trine", 120, 6),
    ("Square", 90, 6),
    ("Sextile", 60, 4),
]

ASPECT_ZH = {
    "Conjunction": "合相",
    "Opposition": "對分",
    "Trine": "拱相",
    "Square": "刑克",
    "Sextile": "六合",
}


@dataclass
class BirthInput:
    year: int
    month: int
    day: int
    hour: int
    minute: int
    timezone: str
    lat: float
    lon: float
    label: str = ""

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "BirthInput":
        return cls(
            year=int(d["year"]),
            month=int(d["month"]),
            day=int(d["day"]),
            hour=int(d.get("hour", 12)),
            minute=int(d.get("minute", 0)),
            timezone=str(d.get("timezone", "Asia/Hong_Kong")),
            lat=float(d["lat"]),
            lon=float(d["lon"]),
            label=str(d.get("label", "")),
        )


def lon_to_sign(lon: float) -> dict[str, Any]:
    lon = lon % 360
    idx = int(lon / 30) % 12
    return {
        "zodiac": SIGNS_EN[idx],
        "zodiac_zh": SIGNS_ZH[idx],
        "deg_in_sign": round(lon % 30, 2),
        "longitude": round(lon, 4),
    }


def local_to_jd_ut(birth: BirthInput) -> float:
    tz = ZoneInfo(birth.timezone)
    local = datetime(
        birth.year,
        birth.month,
        birth.day,
        birth.hour,
        birth.minute,
        tzinfo=tz,
    )
    utc = local.astimezone(ZoneInfo("UTC"))
    return swe.julday(
        utc.year,
        utc.month,
        utc.day,
        utc.hour + utc.minute / 60.0 + utc.second / 3600.0,
    )


def planet_house(lon: float, cusps: list[float]) -> int:
    lon = lon % 360
    for h in range(12):
        c1 = cusps[h] % 360
        c2 = cusps[(h + 1) % 12] % 360
        if c1 <= c2:
            if c1 <= lon < c2:
                return h + 1
        else:
            if lon >= c1 or lon < c2:
                return h + 1
    return 1


def calc_planets(jd: float) -> dict[str, dict[str, Any]]:
    out: dict[str, dict[str, Any]] = {}
    for name, pid in PLANETS:
        xx, _ = swe.calc_ut(jd, pid, FLAGS)
        lon = xx[0]
        sign = lon_to_sign(lon)
        retro = bool(xx[3] < 0) if pid not in (swe.SUN, swe.MOON) else False
        out[name] = {
            "id": name,
            "longitude": sign["longitude"],
            "zodiac": sign["zodiac"],
            "zodiac_zh": sign["zodiac_zh"],
            "deg": sign["deg_in_sign"],
            "retrograde": retro,
        }
    return out


def calc_houses(jd: float, birth: BirthInput) -> tuple[dict[str, Any], list[float]]:
    cusps, ascmc = swe.houses(jd, birth.lat, birth.lon, b"P")
    cusp_lons = [float(cusps[i]) for i in range(12)]
    asc = lon_to_sign(float(ascmc[0]))
    asc["house"] = 1
    houses = {}
    for i in range(12):
        sign = lon_to_sign(cusp_lons[i])
        houses[str(i + 1)] = {
            "house": i + 1,
            "zodiac": sign["zodiac"],
            "zodiac_zh": sign["zodiac_zh"],
            "cusp_deg": sign["deg_in_sign"],
        }
    return asc, cusp_lons


def build_natal_chart(birth: BirthInput, user_id: str = "natal") -> dict[str, Any]:
    jd = local_to_jd_ut(birth)
    planets_raw = calc_planets(jd)
    ascendant, cusps = calc_houses(jd, birth)
    houses_detail = {}
    for i in range(12):
        sign = lon_to_sign(cusps[i])
        houses_detail[str(i + 1)] = {
            "house": i + 1,
            "zodiac": sign["zodiac"],
            "zodiac_zh": sign["zodiac_zh"],
            "cusp_deg": sign["deg_in_sign"],
        }
    planets: dict[str, Any] = {}
    for name, p in planets_raw.items():
        planets[name] = {**p, "house": planet_house(p["longitude"], cusps)}
    return {
        "user_id": user_id,
        "birth": {
            "label": birth.label,
            "local": (
                f"{birth.year}-{birth.month:02d}-{birth.day:02d} "
                f"{birth.hour:02d}:{birth.minute:02d}"
            ),
            "timezone": birth.timezone,
            "lat": birth.lat,
            "lon": birth.lon,
        },
        "julian_day": round(jd, 6),
        "planets": planets,
        "ascendant": ascendant,
        "houses": houses_detail,
    }


def angle_diff(a: float, b: float) -> float:
    d = abs((a - b) % 360)
    return d if d <= 180 else 360 - d


def find_aspect(lon1: float, lon2: float) -> dict[str, Any] | None:
    for name, angle, orb in ASPECT_DEFS:
        delta = angle_diff(lon1, lon2)
        if abs(delta - angle) <= orb:
            return {
                "type": name,
                "type_zh": ASPECT_ZH[name],
                "angle_deg": round(delta, 2),
                "orb": round(abs(delta - angle), 2),
            }
    return None


def cross_aspects(
    chart_a: dict[str, Any],
    chart_b: dict[str, Any],
    prefix_a: str = "A",
    prefix_b: str = "B",
) -> list[dict[str, Any]]:
    aspects: list[dict[str, Any]] = []
    for name_a, pa in chart_a["planets"].items():
        for name_b, pb in chart_b["planets"].items():
            asp = find_aspect(pa["longitude"], pb["longitude"])
            if not asp:
                continue
            aspects.append(
                {
                    "from": f"User_{prefix_a}_{name_a.replace(' ', '_')}",
                    "to": f"User_{prefix_b}_{name_b.replace(' ', '_')}",
                    "from_label": f"{prefix_a} · {name_a}",
                    "to_label": f"{prefix_b} · {name_b}",
                    "type": f"{asp['type']} ({asp['angle_deg']}°)",
                    "type_zh": asp["type_zh"],
                    "meaning": _default_aspect_meaning(asp["type_zh"], name_a, name_b),
                }
            )
    return aspects


def _default_aspect_meaning(asp_zh: str, p1: str, p2: str) -> str:
    return f"{p1} 與 {p2} 形成{asp_zh}"


def build_synastry(
    birth_a: BirthInput,
    birth_b: BirthInput,
    couple_type: str = "Love",
) -> dict[str, Any]:
    chart_a = build_natal_chart(birth_a, "user_a")
    chart_b = build_natal_chart(birth_b, "user_b")
    aspects = cross_aspects(chart_a, chart_b, "A", "B")
    harmonious = sum(
        1 for a in aspects if a["type_zh"] in ("拱相", "六合", "合相")
    )
    tense = sum(1 for a in aspects if a["type_zh"] in ("刑克", "對分"))
    return {
        "couple_type": couple_type,
        "chart_a": chart_a,
        "chart_b": chart_b,
        "aspects": aspects,
        "summary": {
            "total": len(aspects),
            "harmonious": harmonious,
            "tense": tense,
        },
    }


def transit_hits_natal(
    natal: dict[str, Any],
    transit_planets: dict[str, dict[str, Any]],
    transit_date: str,
) -> list[dict[str, Any]]:
    hits: list[dict[str, Any]] = []
    for t_name, tp in transit_planets.items():
        status = "Retrograde (逆行)" if tp.get("retrograde") else "Direct (順行)"
        for n_name, np in natal["planets"].items():
            asp = find_aspect(tp["longitude"], np["longitude"])
            if asp and asp["type_zh"] in ("合相", "對分", "刑克", "拱相"):
                hits.append(
                    {
                        "transit_planet": t_name,
                        "natal_planet": n_name,
                        "status": status,
                        "aspect": asp["type"],
                        "aspect_zh": asp["type_zh"],
                        "hit_natal_house": np.get("house"),
                        "type": f"{asp['type']} ({asp['angle_deg']}°)",
                        "meaning": (
                            f"行運{t_name}{status}，{asp['type_zh']}本命{n_name}"
                            f"（第{np.get('house')}宮）"
                        ),
                    }
                )
        asc_lon = natal["ascendant"]["longitude"]
        asp_asc = find_aspect(tp["longitude"], asc_lon)
        if asp_asc:
            hits.append(
                {
                    "transit_planet": t_name,
                    "natal_planet": "Ascendant",
                    "status": status,
                    "aspect": asp_asc["type"],
                    "aspect_zh": asp_asc["type_zh"],
                    "hit_natal_house": 1,
                    "type": f"{asp_asc['type']} ({asp_asc['angle_deg']}°)",
                    "meaning": f"行運{t_name} {asp_asc['type_zh']} 本命上升點",
                }
            )
    return hits


def build_transits(
    birth: BirthInput,
    transit_date: str | None = None,
) -> dict[str, Any]:
    natal = build_natal_chart(birth, "natal")
    if transit_date:
        parts = [int(x) for x in transit_date.split("-")]
        y, m, d = parts[0], parts[1], parts[2]
        now_birth = BirthInput(y, m, d, 12, 0, birth.timezone, birth.lat, birth.lon)
    else:
        tz = ZoneInfo(birth.timezone)
        now = datetime.now(tz)
        now_birth = BirthInput(
            now.year,
            now.month,
            now.day,
            now.hour,
            now.minute,
            birth.timezone,
            birth.lat,
            birth.lon,
        )
        transit_date = now.strftime("%Y-%m-%d")

    jd = local_to_jd_ut(now_birth)
    transit_planets = calc_planets(jd)
    for name, p in transit_planets.items():
        p["house"] = planet_house(
            p["longitude"],
            calc_houses(jd, birth)[1],
        )

    active = transit_hits_natal(natal, transit_planets, transit_date)
    mercury = transit_planets.get("Mercury", {})
    mercury_rx = mercury.get("retrograde", False)

    return {
        "current_date": transit_date,
        "natal_user_id": natal["user_id"],
        "natal_summary": {
            "sun": natal["planets"]["Sun"],
            "moon": natal["planets"]["Moon"],
            "ascendant": natal["ascendant"],
        },
        "transit_planets": transit_planets,
        "active_transits": active,
        "highlights": {
            "mercury_retrograde": mercury_rx,
            "mercury_house": mercury.get("house"),
            "major_count": len(active),
        },
    }


def dispatch(payload: dict[str, Any]) -> dict[str, Any]:
    action = payload.get("action")
    if action == "natal":
        birth = BirthInput.from_dict(payload["birth"])
        uid = str(payload.get("user_id", "natal"))
        return {"ok": True, "data": build_natal_chart(birth, uid)}
    if action == "synastry":
        birth_a = BirthInput.from_dict(payload["birth_a"])
        birth_b = BirthInput.from_dict(payload["birth_b"])
        couple = str(payload.get("couple_type", "Love"))
        return {
            "ok": True,
            "data": build_synastry(birth_a, birth_b, couple),
        }
    if action == "transits":
        birth = BirthInput.from_dict(payload["birth"])
        td = payload.get("transit_date")
        return {"ok": True, "data": build_transits(birth, td)}
    return {"ok": False, "error": f"Unknown action: {action}"}


def main() -> None:
    import sys

    raw = sys.stdin.read()
    payload = json.loads(raw) if raw.strip() else {}
    try:
        result = dispatch(payload)
        print(json.dumps(result, ensure_ascii=False))
    except Exception as e:
        print(json.dumps({"ok": False, "error": str(e)}, ensure_ascii=False))
        sys.exit(1)


if __name__ == "__main__":
    main()
