import ModalInputPage from "@/components/modals/ModalInputPage";
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
    title: modal ? `輸入 · ${modal.display_name}` : "輸入",
    description: modal?.config.copy?.inputHeaderSubtitle ?? "輸入出生資料",
  };
}

export default function ModalInputRoutePage() {
  return <ModalInputPage />;
}
