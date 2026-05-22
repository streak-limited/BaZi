"use client";

import { getModelUi } from "@/lib/models/ui-registry";
import { useModelJourney } from "@/lib/models/ModelJourneyContext";
import { Suspense } from "react";

function ModelInputInner() {
  const model = useModelJourney();
  const { Input } = getModelUi(model);
  return <Input model={model} />;
}

export default function ModelInputPage() {
  return (
    <Suspense fallback={<p style={{ padding: 24, color: "#fff" }}>載入中…</p>}>
      <ModelInputInner />
    </Suspense>
  );
}
