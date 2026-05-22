"use client";

import { getModelUi } from "@/lib/models/ui-registry";
import { modelInputPath } from "@/lib/models/paths";
import { useModelJourney } from "@/lib/models/ModelJourneyContext";
import { useRouter } from "next/navigation";

export default function ModelIntroPage() {
  const model = useModelJourney();
  const router = useRouter();
  const { Intro } = getModelUi(model);

  return (
    <Intro
      model={model}
      onContinue={() => router.push(modelInputPath(model.slug))}
    />
  );
}
