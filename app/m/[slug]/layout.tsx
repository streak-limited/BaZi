import { ModalJourneyProvider } from "@/lib/modals/ModalJourneyContext";
import { getModalBySlug } from "@/lib/products/modal-store";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export default async function ModalJourneyLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const modal = await getModalBySlug(slug);
  if (!modal) notFound();

  return (
    <ModalJourneyProvider modal={modal}>{children}</ModalJourneyProvider>
  );
}
