import { DEFAULT_BAZI_MODAL } from "@/lib/products/modal-registry";
import { getModalBySlug } from "@/lib/products/modal-store";
import {
  createTrial,
  isSupabaseConfigured,
} from "@/lib/products/trial-store";
import type { ModalTemplateId } from "@/lib/products/types";
import { getAppBaseUrl } from "@/lib/supabase/server";
import { DEFAULT_USER_INPUT, type UserFormInput } from "@/lib/user-input";
import type { BirthPlace } from "@/lib/astrology/types";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        error:
          "Supabase 未設定。請在 .env.local 加入 SUPABASE_URL 與 SUPABASE_SERVICE_ROLE_KEY，並執行 supabase/migrations/001_product_flow.sql",
      },
      { status: 503 },
    );
  }

  let body: {
    modalSlug?: string;
    modalTemplateId?: string;
    userInput?: Partial<UserFormInput>;
    email?: string;
    birthPlace?: BirthPlace | null;
    legacySubjectId?: string;
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

  let modalTemplateId = (body.modalTemplateId ?? DEFAULT_BAZI_MODAL) as ModalTemplateId;
  if (body.modalSlug?.trim()) {
    const modal = await getModalBySlug(body.modalSlug.trim());
    if (!modal) {
      return NextResponse.json(
        { error: `Unknown modal slug: ${body.modalSlug}` },
        { status: 404 },
      );
    }
    modalTemplateId = modal.id;
  }

  try {
    const trial = await createTrial({
      modalTemplateId,
      userInput,
      email: body.email ?? userInput.email,
      birthPlace: body.birthPlace ?? null,
      legacySubjectId: body.legacySubjectId,
    });

    const base = getAppBaseUrl();
    return NextResponse.json({
      trial: {
        id: trial.id,
        publicToken: trial.public_token,
        status: trial.status,
        modalTemplateId: trial.modal_template_id,
      },
      urls: {
        hub: `${base}/r/${trial.public_token}`,
        result: `${base}/r/${trial.public_token}/result`,
        report: `${base}/r/${trial.public_token}/report`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Create trial failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
