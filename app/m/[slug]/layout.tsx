import { ModelJourneyProvider } from "@/lib/models/ModelJourneyContext";
import { getModelBySlug } from "@/lib/products/model-store";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export default async function ModelJourneyLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const model = await getModelBySlug(slug);
  if (!model) notFound();

  return (
    <ModelJourneyProvider model={model}>{children}</ModelJourneyProvider>
  );
}
