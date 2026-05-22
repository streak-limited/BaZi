import { ModelEditorClient } from "@/components/admin/ModelEditorClient";
import { listAllTags } from "@/lib/products/model-admin-store";
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
  const [model, tags, resultPrompts, reportPrompts] = await Promise.all([
    getModelById(id),
    listAllTags(),
    listPromptEntries(id, "result", { activeOnly: false }),
    listPromptEntries(id, "report", { activeOnly: false }),
  ]);

  if (!model) notFound();

  return (
    <ModelEditorClient
      mode="edit"
      model={model}
      resultPrompts={resultPrompts}
      reportPrompts={reportPrompts}
      allTags={tags}
    />
  );
}
