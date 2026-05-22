import { searchBirthCities } from "@/lib/astrology/geocode";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchBirthCities(q, 10);
    return NextResponse.json({ results, query: q });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Geocode failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
