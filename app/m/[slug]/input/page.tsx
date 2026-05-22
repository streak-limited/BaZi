import ModelInputPage from "@/components/models/ModelInputPage";
import { getModelBySlug } from "@/lib/products/model-store";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const model = await getModelBySlug(slug);
  return {
    title: model ? `輸入 · ${model.display_name}` : "輸入",
    description: model?.config.copy?.inputHeaderSubtitle ?? "輸入出生資料",
  };
}

export default function ModelInputRoutePage() {
  return <ModelInputPage />;
}
