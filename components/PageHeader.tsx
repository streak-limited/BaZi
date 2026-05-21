import Link from "next/link";
import { HOME_HREF } from "@/lib/site-nav";
import styles from "./page-header.module.css";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}

export default function PageHeader({
  title,
  subtitle,
  backHref = HOME_HREF,
  backLabel = "← 返回首頁",
  secondaryHref,
  secondaryLabel,
}: PageHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        <nav className={styles.nav} aria-label="頁面導覽">
          <Link href={backHref} className={styles.backLink}>
            {backLabel}
          </Link>
          {secondaryHref && secondaryLabel && (
            <Link href={secondaryHref} className={styles.secondaryLink}>
              {secondaryLabel}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
