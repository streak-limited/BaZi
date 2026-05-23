"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./bazi-intro.module.css";

interface StripeUiConfig {
  enabled: boolean;
  testMode: boolean;
  priceLabel: string;
  amountHkd: number;
  allowSkip: boolean;
}

type Props = {
  open: boolean;
  onClose: () => void;
  publicToken?: string | null;
  subjectId?: string | null;
  onCheckout: () => void;
  onDemoUnlock: () => void;
  payLoading: boolean;
  payError: string | null;
};

const ORIGINAL_HKD = 680;
const BUNDLE_HKD = 540;

export default function PaymentDrawer({
  open,
  onClose,
  publicToken,
  subjectId: _subjectId,
  onCheckout,
  onDemoUnlock,
  payLoading,
  payError,
}: Props) {
  const [stripe, setStripe] = useState<StripeUiConfig | null>(null);
  const [plan, setPlan] = useState<"base" | "bundle">("base");

  useEffect(() => {
    fetch("/api/stripe/status")
      .then((r) => r.json())
      .then((data: StripeUiConfig) => setStripe(data))
      .catch(() =>
        setStripe({
          enabled: false,
          testMode: false,
          priceLabel: "HK$388",
          amountHkd: 388,
          allowSkip: true,
        }),
      );
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const priceHkd = plan === "base" ? (stripe?.amountHkd ?? 388) : BUNDLE_HKD;
  const priceLabel = `HK$${priceHkd}`;
  const discount = ORIGINAL_HKD - (plan === "base" ? priceHkd : BUNDLE_HKD);
  const discountPct = Math.round((discount / ORIGINAL_HKD) * 100);

  return (
    <div className={styles.drawerRoot} role="presentation">
      <button
        type="button"
        className={styles.drawerBackdrop}
        aria-label="關閉"
        onClick={onClose}
      />
      <div className={styles.drawerSheet} role="dialog" aria-modal="true">
        <div className={styles.drawerHandle} aria-hidden />
        <div className={styles.drawerHeader}>
          <div>
            <p className={styles.drawerDiscount}>{discountPct}%</p>
            <p className={styles.drawerPrice}>{priceLabel}</p>
            <p className={styles.drawerSaveBadge}>共省下 HK${discount} !</p>
          </div>
          <button type="button" className={styles.drawerClose} onClick={onClose}>
            ×
          </button>
        </div>

        <p className={styles.drawerSectionLabel}>套餐優惠</p>

        <button
          type="button"
          className={
            plan === "base" ? styles.drawerPlanActive : styles.drawerPlan
          }
          onClick={() => setPlan("base")}
        >
          <span className={styles.drawerRadio} data-active={plan === "base"} />
          <span className={styles.drawerPlanText}>
            <span>韓國範山道令 命理</span>
            <span className={styles.drawerPlanPrice}>HK$388</span>
          </span>
        </button>

        <button
          type="button"
          className={
            plan === "bundle" ? styles.drawerPlanActive : styles.drawerPlan
          }
          onClick={() => setPlan("bundle")}
        >
          <span
            className={styles.drawerRadio}
            data-active={plan === "bundle"}
          />
          <span className={styles.drawerPlanText}>
            <span>
              職掌人生
              <span className={styles.drawerPlanSub}>
                推薦 韓國範山道令 命理 + 職業命盤
              </span>
            </span>
            <span className={styles.drawerPlanPriceCol}>
              <span className={styles.drawerPlanStrike}>HK$979</span>
              <span className={styles.drawerPlanPct}>45%</span>
              <span>HK$540</span>
            </span>
          </span>
        </button>

        <div className={styles.drawerBreakdown}>
          <div className={styles.drawerRow}>
            <span>韓國範山道令 命理 原價</span>
            <span>HK${ORIGINAL_HKD}</span>
          </div>
          <div className={styles.drawerRowDiscount}>
            <span>立即付款折扣</span>
            <span>-HK${discount}</span>
          </div>
          <div className={styles.drawerRow}>
            <span className={styles.drawerCoupon}>套用優惠券</span>
            <span className={styles.drawerMuted}>無</span>
          </div>
        </div>

        {stripe?.testMode && (
          <p className={styles.testModeBadge}>Stripe 測試模式 · 4242 4242 4242 4242</p>
        )}
        {payError && <p className={styles.errorBanner}>{payError}</p>}

        <button
          type="button"
          className={styles.drawerContinue}
          disabled={payLoading || !(stripe?.enabled ?? false)}
          onClick={onCheckout}
        >
          {payLoading ? "處理中…" : `${priceLabel} 繼續`}
        </button>

        {stripe?.allowSkip && (
          <button
            type="button"
            className={styles.drawerDemoBtn}
            disabled={payLoading}
            onClick={onDemoUnlock}
          >
            測試解鎖（略過付款）
          </button>
        )}

        <p className={styles.drawerLegal}>
          已確認付款資訊，並同意 隱私權政策、付款條款。
        </p>

        <label className={styles.drawerMarketing}>
          <input type="checkbox" defaultChecked />
          <span>同意接收行銷資訊 (選填)</span>
          <Link href="/info" className={styles.drawerInfoLink}>
            詳細資訊
          </Link>
        </label>

      </div>
    </div>
  );
}
