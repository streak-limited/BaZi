import WelcomeStep from "@/components/models/bazi-v1/WelcomeStep";
import { getModelBySlug } from "@/lib/products/model-store";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const model = await getModelBySlug(slug);
  return {
    title: model ? `${model.display_name} · 開始` : "開始",
    description: model?.config.copy?.introSubtitle ?? "命理產品",
  };
}

export default async function ModelWelcomePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const model = await getModelBySlug(slug);
  if (!model) notFound();

  return <WelcomeStep model={model} />;
}
