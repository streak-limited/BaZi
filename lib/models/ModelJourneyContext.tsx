"use client";

import type { ProductModel } from "@/lib/products/model-store";
import { createContext, useContext, type ReactNode } from "react";

const ModelJourneyContext = createContext<ProductModel | null>(null);

export function ModelJourneyProvider({
  model,
  children,
}: {
  model: ProductModel;
  children: ReactNode;
}) {
  return (
    <ModelJourneyContext.Provider value={model}>
      {children}
    </ModelJourneyContext.Provider>
  );
}

export function useModelJourney(): ProductModel {
  const ctx = useContext(ModelJourneyContext);
  if (!ctx) {
    throw new Error("useModelJourney requires ModelJourneyProvider");
  }
  return ctx;
}
