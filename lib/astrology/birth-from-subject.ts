import type { BirthPayload, BirthPlace } from "@/lib/astrology/types";
import { parseBirthDate, parseBirthTime, type UserFormInput } from "@/lib/user-input";
import { Lunar } from "lunar-javascript";

/** Convert 命主 birth fields + city → Swiss Ephemeris birth payload */
export function birthPayloadFromSubject(
  input: UserFormInput,
  place: BirthPlace,
  label?: string,
): { payload: BirthPayload | null; error: string | null } {
  const date = parseBirthDate(input.birthDate);
  if (!date) {
    return { payload: null, error: "出生日期格式請用 YYYY.MM.DD" };
  }

  const time = input.birthTimeUnknown
    ? { h: 12, min: 0 }
    : parseBirthTime(input.birthTime);
  if (!time) {
    return {
      payload: null,
      error: "出生時間請用 HH:mm，或勾選不知道時間",
    };
  }

  let y = date.y;
  let m = date.m;
  let d = date.d;

  if (input.calendarType === "lunar") {
    const lunar = Lunar.fromYmd(y, m, d);
    const solar = lunar.getSolar();
    y = solar.getYear();
    m = solar.getMonth();
    d = solar.getDay();
  }

  return {
    payload: {
      year: y,
      month: m,
      day: d,
      hour: time.h,
      minute: time.min,
      timezone: place.timezone,
      lat: place.lat,
      lon: place.lon,
      label: label?.trim() || input.name.trim() || place.label,
    },
    error: null,
  };
}
