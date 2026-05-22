import type {
  StoredAstrologyChart,
  StoredChartSummary,
} from "@/lib/astrology/chart-types";
import type { BirthPlace } from "@/lib/astrology/types";
import type { AstrologyMode } from "@/lib/astrology/types";
import { runWithDb } from "@/lib/report-store";

export type { StoredAstrologyChart, StoredChartSummary };

function newChartId(): string {
  return `astro_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export async function saveAstrologyChart(params: {
  subjectId: string;
  mode: AstrologyMode;
  birthPlace: BirthPlace;
  birthPlaceB?: BirthPlace;
  partnerSubjectId?: string;
  coupleType?: string;
  chartJson: unknown;
  chartId?: string;
}): Promise<StoredAstrologyChart> {
  const id = params.chartId?.trim() || newChartId();
  const createdAt = new Date().toISOString();

  await runWithDb(async (db) => {
    await db.execute({
      sql: `INSERT INTO astrology_charts
            (id, subject_id, mode, birth_place, birth_place_b, partner_subject_id, couple_type, chart_json, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              chart_json = excluded.chart_json,
              birth_place = excluded.birth_place,
              birth_place_b = excluded.birth_place_b,
              partner_subject_id = excluded.partner_subject_id,
              couple_type = excluded.couple_type,
              created_at = excluded.created_at`,
      args: [
        id,
        params.subjectId,
        params.mode,
        JSON.stringify(params.birthPlace),
        params.birthPlaceB ? JSON.stringify(params.birthPlaceB) : null,
        params.partnerSubjectId ?? null,
        params.coupleType ?? null,
        JSON.stringify(params.chartJson),
        createdAt,
      ],
    });
  });

  return {
    id,
    subjectId: params.subjectId,
    mode: params.mode,
    birthPlace: params.birthPlace,
    birthPlaceB: params.birthPlaceB,
    partnerSubjectId: params.partnerSubjectId,
    coupleType: params.coupleType,
    chartJson: params.chartJson,
    createdAt,
  };
}

export async function listAstrologyCharts(
  subjectId: string,
  limit = 20,
): Promise<StoredChartSummary[]> {
  return runWithDb(async (db) => {
    const result = await db.execute({
      sql: `SELECT id, subject_id, mode, birth_place, partner_subject_id, couple_type, created_at
            FROM astrology_charts
            WHERE subject_id = ?
            ORDER BY created_at DESC
            LIMIT ?`,
      args: [subjectId, limit],
    });
    return result.rows.map((row) => {
      const r = row as Record<string, unknown>;
      let birthPlaceLabel = "";
      try {
        const bp = JSON.parse(String(r.birth_place)) as BirthPlace;
        birthPlaceLabel = bp.label;
      } catch {
        birthPlaceLabel = "—";
      }
      return {
        id: String(r.id),
        subjectId: String(r.subject_id),
        mode: String(r.mode) as AstrologyMode,
        birthPlaceLabel,
        partnerSubjectId: r.partner_subject_id
          ? String(r.partner_subject_id)
          : undefined,
        coupleType: r.couple_type ? String(r.couple_type) : undefined,
        createdAt: String(r.created_at),
      };
    });
  });
}

export async function loadAstrologyChart(
  chartId: string,
): Promise<StoredAstrologyChart | null> {
  return runWithDb(async (db) => {
    const result = await db.execute({
      sql: `SELECT id, subject_id, mode, birth_place, birth_place_b, partner_subject_id, couple_type, chart_json, created_at
            FROM astrology_charts WHERE id = ?`,
      args: [chartId],
    });
    const row = result.rows[0] as Record<string, unknown> | undefined;
    if (!row) return null;

    const parsePlace = (raw: unknown): BirthPlace | undefined => {
      if (!raw) return undefined;
      try {
        return JSON.parse(String(raw)) as BirthPlace;
      } catch {
        return undefined;
      }
    };

    let chartJson: unknown = {};
    try {
      chartJson = JSON.parse(String(row.chart_json));
    } catch {
      chartJson = {};
    }

    return {
      id: String(row.id),
      subjectId: String(row.subject_id),
      mode: String(row.mode) as AstrologyMode,
      birthPlace: parsePlace(row.birth_place) ?? {
        id: "unknown",
        label: "—",
        lat: 0,
        lon: 0,
        timezone: "UTC",
      },
      birthPlaceB: parsePlace(row.birth_place_b),
      partnerSubjectId: row.partner_subject_id
        ? String(row.partner_subject_id)
        : undefined,
      coupleType: row.couple_type ? String(row.couple_type) : undefined,
      chartJson,
      createdAt: String(row.created_at),
    };
  });
}

export function verifyAstrologyWebhookSecret(request: Request): boolean {
  const expected = process.env.ASTROLOGY_WEBHOOK_SECRET?.trim();
  if (!expected) return false;
  const header =
    request.headers.get("x-astrology-webhook-secret") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return header === expected;
}
