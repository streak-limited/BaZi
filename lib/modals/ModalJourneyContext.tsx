"use client";

import type { ModalTemplate } from "@/lib/products/modal-store";
import { createContext, useContext, type ReactNode } from "react";

const ModalJourneyContext = createContext<ModalTemplate | null>(null);

export function ModalJourneyProvider({
  modal,
  children,
}: {
  modal: ModalTemplate;
  children: ReactNode;
}) {
  return (
    <ModalJourneyContext.Provider value={modal}>
      {children}
    </ModalJourneyContext.Provider>
  );
}

export function useModalJourney(): ModalTemplate {
  const ctx = useContext(ModalJourneyContext);
  if (!ctx) {
    throw new Error("useModalJourney requires ModalJourneyProvider");
  }
  return ctx;
}
