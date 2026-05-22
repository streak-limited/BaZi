import HomeCatalog from "@/components/home/HomeCatalog";
import {
  getTrialCountsByModel,
  listActiveModels,
} from "@/lib/products/model-store";
import Link from "next/link";
import styles from "./home.module.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "BaZi · 命理報告",
  description: "選擇產品，開始你的命理旅程",
};

export default async function HomePage() {
  const [models, trialCounts] = await Promise.all([
    listActiveModels(),
    getTrialCountsByModel(),
  ]);

  return (
    <div className={styles.shell}>
      <div className={styles.frame}>
        <header className={styles.header}>
          <div className={styles.headerInner}>
            <div className={styles.brand}>
              <h1 className={styles.brandMark}>BaZi</h1>
              <span className={styles.brandSub}>命理報告</span>
            </div>
          </div>
        </header>

        <main className={styles.main}>
          {models.length === 0 ? (
            <div className={styles.empty}>
              尚無可用產品。請在 Supabase 建立 models 與 tags，或檢查連線設定。
            </div>
          ) : (
            <HomeCatalog models={models} trialCounts={trialCounts} />
          )}

          <p className={styles.footer}>
            <Link href="/home_demo">開發工具選單</Link>
          </p>
        </main>
      </div>
    </div>
  );
}
