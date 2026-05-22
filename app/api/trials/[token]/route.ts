import { loadTrialBundle, isSupabaseConfigured } from "@/lib/products/trial-store";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const { token } = await context.params;
  try {
    const bundle = await loadTrialBundle(token);
    if (!bundle) {
      return NextResponse.json({ error: "Trial not found" }, { status: 404 });
    }

    return NextResponse.json({
      trial: bundle.trial,
      deliverables: bundle.deliverables,
      payment: bundle.payment,
      urls: {
        hub: bundle.hubUrl,
        result: bundle.resultUrl,
        report: bundle.reportUrl,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Load failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
