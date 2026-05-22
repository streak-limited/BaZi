import { ModelEditorClient } from "@/components/admin/ModelEditorClient";
import { getModelById } from "@/lib/products/model-store";
import { listPromptEntries } from "@/lib/products/prompt-store";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminModelEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [model, resultPrompts, reportPrompts] = await Promise.all([
    getModelById(id),
    listPromptEntries(id, "result", { activeOnly: false, aiOnly: true }),
    listPromptEntries(id, "report", { activeOnly: false, aiOnly: true }),
  ]);

  if (!model) notFound();

  return (
    <ModelEditorClient
      mode="edit"
      model={model}
      resultPrompts={resultPrompts}
      reportPrompts={reportPrompts}
    />
  );
}
