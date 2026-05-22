"use client";

import { getModalUi } from "@/lib/modals/ui-registry";
import { useModalJourney } from "@/lib/modals/ModalJourneyContext";
import { Suspense } from "react";

function ModalInputInner() {
  const modal = useModalJourney();
  const { Input } = getModalUi(modal);
  return <Input modal={modal} />;
}

export default function ModalInputPage() {
  return (
    <Suspense fallback={<p style={{ padding: 24, color: "#fff" }}>載入中…</p>}>
      <ModalInputInner />
    </Suspense>
  );
}
