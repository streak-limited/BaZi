import { buildPreReport } from "@/lib/bazi-flow/build-pre-report";
import type { PreReportDeliverable } from "@/lib/products/types";
import {
  getTrialByToken,
  isSupabaseConfigured,
  savePreReportDeliverable,
  updateTrialStatus,
} from "@/lib/products/trial-store";
import { DEFAULT_USER_INPUT, type UserFormInput } from "@/lib/user-input";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const preferredRegion = ["iad1"];
export const maxDuration = 120;

export async function POST(request: Request) {
  let body: {
    userInput?: Partial<UserFormInput>;
    publicToken?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const userInput: UserFormInput = {
    ...DEFAULT_USER_INPUT,
    ...body.userInput,
  };

  try {
    const publicToken = body.publicToken?.trim();
    if (publicToken && isSupabaseConfigured()) {
      const trial = await getTrialByToken(publicToken);
      if (trial) {
        await updateTrialStatus(trial.id, "pre_report_generating");
      }
    }

    const payload = await buildPreReport(userInput);

    if (publicToken && isSupabaseConfigured()) {
      const trial = await getTrialByToken(publicToken);
      if (trial) {
        const deliverable: PreReportDeliverable = {
          entries: payload.entries,
          chart: payload.chart,
          variables: payload.variables,
          generatedAt: payload.generatedAt,
        };
        await savePreReportDeliverable(trial.id, deliverable, {
          provider: process.env.AI_PROVIDER ?? "gemini",
        });
      }
    }

    return NextResponse.json(payload);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Pre-report generation failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
