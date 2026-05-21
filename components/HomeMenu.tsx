import Link from "next/link";
import { SITE_NAV_GROUPS } from "@/lib/site-nav";
import styles from "./home-menu.module.css";

const LINK_CLASS: Record<string, string> = {
  "/bazi/report": styles.menuLinkBazi,
  "/bazi/pre-report": styles.menuLinkPre,
  "/ask-gua": styles.menuLinkGua,
  "/fortune-lots": styles.menuLinkLots,
  "/daily-fortune": styles.menuLinkDaily,
};

export default function HomeMenu() {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>BaZi</h1>
      <p className={styles.tagline}>
        八字報告、靈籤問卦、每日開運 — 選一項進入
      </p>
      <nav className={styles.menu} aria-label="主選單">
        {SITE_NAV_GROUPS.map((group) => (
          <section key={group.title}>
            <h2 className={styles.groupTitle}>{group.title}</h2>
            <ul className={styles.groupList}>
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`${styles.menuLink} ${LINK_CLASS[item.href] ?? ""}`}
                  >
                    <span className={styles.menuLinkLabel}>{item.label}</span>
                    {item.description && (
                      <span className={styles.menuLinkDesc}>{item.description}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </nav>
    </main>
  );
}
