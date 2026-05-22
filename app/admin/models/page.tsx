import { listActiveModels } from "@/lib/products/model-store";
import Link from "next/link";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

export default async function AdminModelsPage() {
  const models = await listActiveModels();

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <div>
          <h1>Models</h1>
          <p className={styles.muted}>
            <Link href="/admin">← Dashboard</Link>
          </p>
        </div>
        <Link href="/admin/models/new" className={styles.primaryBtn}>
          + New model
        </Link>
      </header>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>id</th>
              <th>slug</th>
              <th>title</th>
              <th>tags</th>
              <th>price</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {models.map((m) => (
              <tr key={m.id}>
                <td>
                  <code>{m.id}</code>
                </td>
                <td>{m.slug}</td>
                <td>{m.display_name}</td>
                <td>
                  {m.tags.length > 0
                    ? m.tags.map((t) => t.label).join(", ")
                    : "—"}
                </td>
                <td>
                  {m.config.price_hkd != null
                    ? `HK$${m.config.price_hkd}`
                    : "—"}
                </td>
                <td>
                  <Link href={`/admin/models/${m.id}`}>Edit prompts →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
