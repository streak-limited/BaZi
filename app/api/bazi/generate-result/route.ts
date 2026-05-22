import { buildResult } from "@/lib/bazi-journey/build-result";
import { DEFAULT_BAZI_MODEL } from "@/lib/products/model-registry";
import { buildDemoResultPayload } from "@/lib/result-demo";
import type { ResultDeliverable } from "@/lib/products/types";
import {
  getTrialByToken,
  isSupabaseConfigured,
  saveResultDeliverable,
  updateTrialStatus,
} from "@/lib/products/trial-store";
import { DEFAULT_USER_INPUT, type UserFormInput } from "@/lib/user-input";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

function useLiveAi(): boolean {
  return process.env.USE_LIVE_AI_RESULT === "1";
}

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
        await updateTrialStatus(trial.id, "result_generating");
      }
    }

    const modelId =
      (publicToken && isSupabaseConfigured()
        ? (await getTrialByToken(publicToken))?.model_id
        : null) ?? DEFAULT_BAZI_MODEL;

    const payload = useLiveAi()
      ? await buildResult(userInput, modelId)
      : buildDemoResultPayload(userInput);

    if (publicToken && isSupabaseConfigured()) {
      const trial = await getTrialByToken(publicToken);
      if (trial) {
        const deliverable: ResultDeliverable = {
          entries: payload.entries,
          chart: payload.chart,
          variables: payload.variables,
          generatedAt: payload.generatedAt,
        };
        await saveResultDeliverable(trial.id, deliverable, {
          demo: !useLiveAi(),
          provider: useLiveAi() ? process.env.AI_PROVIDER ?? "gemini" : "demo_json",
        });
      }
    }

    return NextResponse.json({
      ...payload,
      demo: !useLiveAi(),
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Result generation failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
