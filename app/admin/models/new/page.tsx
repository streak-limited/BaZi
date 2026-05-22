import { ModelEditorClient } from "@/components/admin/ModelEditorClient";
import { listAllTags } from "@/lib/products/model-admin-store";

export const dynamic = "force-dynamic";

export default async function AdminNewModelPage() {
  const tags = await listAllTags();
  return <ModelEditorClient mode="create" allTags={tags} />;
}
