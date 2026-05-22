"use client";

import { getModalUi } from "@/lib/modals/ui-registry";
import { modalInputPath } from "@/lib/modals/paths";
import { useModalJourney } from "@/lib/modals/ModalJourneyContext";
import { useRouter } from "next/navigation";

export default function ModalIntroPage() {
  const modal = useModalJourney();
  const router = useRouter();
  const { Intro } = getModalUi(modal);

  return (
    <Intro
      modal={modal}
      onContinue={() => router.push(modalInputPath(modal.slug))}
    />
  );
}
