import { fetchAdminDashboard } from "@/lib/admin/queries";
import { isAdminConfigured } from "@/lib/admin/auth";
import Link from "next/link";
import styles from "./admin.module.css";

export const dynamic = "force-dynamic";

function fmtTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("zh-Hant", { hour12: false });
  } catch {
    return iso;
  }
}

export default async function AdminPage() {
  const data = await fetchAdminDashboard();
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <div>
          <h1>BaZi Admin</h1>
          <p className={styles.muted}>
            Modals · Trials · Payments · Email log
          </p>
        </div>
        <Link href="/m/bazi-full-report/intro" className={styles.muted}>
          前往產品 intro →
        </Link>
      </header>

      {!isAdminConfigured() && (
        <div className={styles.warn}>
          請在 .env.local 設定 <code>ADMIN_SECRET</code>，並重新啟動 dev server。
        </div>
      )}

      {!data.configured && (
        <div className={styles.warn}>
          Supabase 未設定 — trials / payments 列表為空。請設定 SUPABASE_URL 與
          SUPABASE_SERVICE_ROLE_KEY。
        </div>
      )}

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <strong>{data.modals.length}</strong>
          <span className={styles.muted}>Active modals</span>
        </div>
        <div className={styles.statCard}>
          <strong>{data.stats.trialCount}</strong>
          <span className={styles.muted}>Recent trials</span>
        </div>
        <div className={styles.statCard}>
          <strong>{data.stats.paidCount}</strong>
          <span className={styles.muted}>Paid / generating</span>
        </div>
        <div className={styles.statCard}>
          <strong>{data.stats.paymentCount}</strong>
          <span className={styles.muted}>Recent payments</span>
        </div>
      </div>

      <section className={styles.section}>
        <h2>Modal templates</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>id</th>
                <th>slug</th>
                <th>name</th>
                <th>ui_key</th>
                <th>price</th>
                <th>intro</th>
              </tr>
            </thead>
            <tbody>
              {data.modals.map((m) => (
                <tr key={m.id}>
                  <td>
                    <code>{m.id}</code>
                  </td>
                  <td>{m.slug}</td>
                  <td>{m.display_name}</td>
                  <td>
                    <span className={styles.badge}>{m.config.ui_key}</span>
                  </td>
                  <td>
                    {m.config.price_hkd != null
                      ? `HK$${m.config.price_hkd}`
                      : "—"}
                  </td>
                  <td>
                    <Link href={`/m/${m.slug}/intro`}>intro</Link>
                    {" · "}
                    <Link href={`/m/${m.slug}/input`}>input</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Trials (latest 80)</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>token</th>
                <th>modal</th>
                <th>email</th>
                <th>status</th>
                <th>created</th>
                <th>links</th>
              </tr>
            </thead>
            <tbody>
              {data.trials.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.muted}>
                    尚無資料
                  </td>
                </tr>
              ) : (
                data.trials.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <code>{t.public_token.slice(0, 12)}…</code>
                    </td>
                    <td>{t.modal_display_name}</td>
                    <td>{t.email || "—"}</td>
                    <td>
                      <span className={styles.badge}>{t.status}</span>
                    </td>
                    <td>{fmtTime(t.created_at)}</td>
                    <td>
                      <Link href={`/r/${t.public_token}/result`}>result</Link>
                      {" · "}
                      <Link href={`/r/${t.public_token}?paid=1`}>hub</Link>
                      {base ? (
                        <>
                          {" · "}
                          <a
                            href={`${base}/r/${t.public_token}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            full url
                          </a>
                        </>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Payments (latest 80)</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>status</th>
                <th>amount</th>
                <th>session</th>
                <th>trial</th>
                <th>created</th>
              </tr>
            </thead>
            <tbody>
              {data.payments.length === 0 ? (
                <tr>
                  <td colSpan={5} className={styles.muted}>
                    尚無資料
                  </td>
                </tr>
              ) : (
                data.payments.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span className={styles.badge}>{p.status}</span>
                    </td>
                    <td>
                      {p.amount_cents != null
                        ? `${(p.amount_cents / 100).toFixed(0)} ${p.currency.toUpperCase()}`
                        : "—"}
                    </td>
                    <td>
                      <code>
                        {p.stripe_session_id
                          ? `${p.stripe_session_id.slice(0, 14)}…`
                          : "—"}
                      </code>
                    </td>
                    <td>
                      {p.public_token ? (
                        <Link href={`/r/${p.public_token}`}>
                          {p.public_token.slice(0, 10)}…
                        </Link>
                      ) : (
                        <code>{p.trial_id.slice(0, 8)}…</code>
                      )}
                    </td>
                    <td>{fmtTime(p.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Email log (latest 40)</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>to</th>
                <th>template</th>
                <th>status</th>
                <th>created</th>
              </tr>
            </thead>
            <tbody>
              {data.emails.length === 0 ? (
                <tr>
                  <td colSpan={4} className={styles.muted}>
                    尚無資料
                  </td>
                </tr>
              ) : (
                data.emails.map((e) => (
                  <tr key={e.id}>
                    <td>{e.to_email}</td>
                    <td>{e.template}</td>
                    <td>
                      <span className={styles.badge}>{e.status}</span>
                    </td>
                    <td>{fmtTime(e.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
