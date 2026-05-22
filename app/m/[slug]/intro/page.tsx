import ModalIntroPage from "@/components/modals/ModalIntroPage";
import { getModalBySlug } from "@/lib/products/modal-store";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const modal = await getModalBySlug(slug);
  return {
    title: modal ? `${modal.display_name} · 介紹` : "介紹",
    description: modal?.config.copy?.introSubtitle ?? "命理產品介紹",
  };
}

export default function ModalIntroRoutePage() {
  return <ModalIntroPage />;
}
