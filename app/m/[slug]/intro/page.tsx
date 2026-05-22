import ModelIntroPage from "@/components/models/ModelIntroPage";
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
    title: model ? `${model.display_name} · 介紹` : "介紹",
    description: model?.config.copy?.introSubtitle ?? "命理產品介紹",
  };
}

export default function ModelIntroRoutePage() {
  return <ModelIntroPage />;
}
