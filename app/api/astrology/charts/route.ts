import {
  listAstrologyCharts,
  loadAstrologyChart,
} from "@/lib/astrology/chart-store";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const chartId = url.searchParams.get("id")?.trim();
  const subjectId = url.searchParams.get("subjectId")?.trim();

  try {
    if (chartId) {
      const chart = await loadAstrologyChart(chartId);
      if (!chart) {
        return NextResponse.json({ error: "Chart not found" }, { status: 404 });
      }
      return NextResponse.json({ chart });
    }

    if (!subjectId) {
      return NextResponse.json(
        { error: "subjectId or id is required" },
        { status: 400 },
      );
    }

    const charts = await listAstrologyCharts(subjectId);
    return NextResponse.json({ charts, subjectId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load charts";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
