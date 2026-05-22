import { saveAstrologyChart } from "@/lib/astrology/chart-store";
import { birthPayloadFromSubject } from "@/lib/astrology/birth-from-subject";
import { resolveBirthPlace } from "@/lib/astrology/resolve-place";
import { runAstrologyEngine } from "@/lib/astrology/run-python";
import type {
  BirthPlace,
  NatalChart,
  SynastryChart,
  TransitChart,
} from "@/lib/astrology/types";
import { DEFAULT_USER_INPUT, type UserFormInput } from "@/lib/user-input";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Mode = "natal" | "synastry" | "transits";

export async function POST(request: Request) {
  let body: {
    mode?: Mode;
    input?: Partial<UserFormInput>;
    inputB?: Partial<UserFormInput>;
    placeId?: string;
    place?: BirthPlace;
    placeIdB?: string;
    placeB?: BirthPlace;
    coupleType?: "Love" | "Work";
    transitDate?: string;
    subjectId?: string;
    partnerSubjectId?: string;
    saveToDb?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const mode = body.mode;
  if (!mode || !["natal", "synastry", "transits"].includes(mode)) {
    return NextResponse.json({ error: "mode is required" }, { status: 400 });
  }

  const input: UserFormInput = { ...DEFAULT_USER_INPUT, ...body.input };
  const place = resolveBirthPlace({ placeId: body.placeId, place: body.place });

  const { payload: birth, error: birthErr } = birthPayloadFromSubject(
    input,
    place,
    input.name,
  );
  if (birthErr || !birth) {
    return NextResponse.json({ error: birthErr ?? "Birth data invalid" }, { status: 400 });
  }

  const shouldSave = body.saveToDb !== false;
  const subjectId = body.subjectId?.trim();

  try {
    if (mode === "natal") {
      const chart = await runAstrologyEngine<NatalChart>({
        action: "natal",
        birth,
        user_id: subjectId ?? "natal",
      });

      let savedChartId: string | undefined;
      if (shouldSave && subjectId) {
        const saved = await saveAstrologyChart({
          subjectId,
          mode: "natal",
          birthPlace: place,
          chartJson: chart,
        });
        savedChartId = saved.id;
      }

      return NextResponse.json({ mode, chart, place, savedChartId });
    }

    if (mode === "transits") {
      const transits = await runAstrologyEngine<TransitChart>({
        action: "transits",
        birth,
        transit_date: body.transitDate,
      });

      let savedChartId: string | undefined;
      if (shouldSave && subjectId) {
        const saved = await saveAstrologyChart({
          subjectId,
          mode: "transits",
          birthPlace: place,
          chartJson: transits,
        });
        savedChartId = saved.id;
      }

      return NextResponse.json({ mode, transits, place, savedChartId });
    }

    const inputB: UserFormInput = {
      ...DEFAULT_USER_INPUT,
      ...body.inputB,
      birthDate: body.inputB?.birthDate ?? DEFAULT_USER_INPUT.birthDate,
    };
    const placeB = resolveBirthPlace({
      placeId: body.placeIdB ?? body.placeId,
      place: body.placeB,
    });
    const { payload: birthB, error: birthBErr } = birthPayloadFromSubject(
      inputB,
      placeB,
      inputB.name || "對方",
    );
    if (birthBErr || !birthB) {
      return NextResponse.json(
        { error: birthBErr ?? "對方出生資料無效" },
        { status: 400 },
      );
    }

    const synastry = await runAstrologyEngine<SynastryChart>({
      action: "synastry",
      birth_a: birth,
      birth_b: birthB,
      couple_type: body.coupleType ?? "Love",
    });

    let savedChartId: string | undefined;
    if (shouldSave && subjectId) {
      const saved = await saveAstrologyChart({
        subjectId,
        mode: "synastry",
        birthPlace: place,
        birthPlaceB: placeB,
        partnerSubjectId: body.partnerSubjectId?.trim(),
        coupleType: body.coupleType ?? "Love",
        chartJson: synastry,
      });
      savedChartId = saved.id;
    }

    return NextResponse.json({
      mode,
      synastry,
      place,
      placeB,
      savedChartId,
      partnerSubjectId: body.partnerSubjectId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Astrology compute failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
