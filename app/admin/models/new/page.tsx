import { ModelEditorClient } from "@/components/admin/ModelEditorClient";

export const dynamic = "force-dynamic";

export default function AdminNewModelPage() {
  return <ModelEditorClient mode="create" />;
}
