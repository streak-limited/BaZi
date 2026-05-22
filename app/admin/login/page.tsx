"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import styles from "../admin.module.css";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/admin";
  const errorCode = searchParams.get("error");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    errorCode === "no_secret" ? "伺服器未設定 ADMIN_SECRET" : null,
  );
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "登入失敗");
        return;
      }
      router.replace(next);
      router.refresh();
    } catch {
      setError("網路錯誤");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginWrap}>
      <form className={styles.loginCard} onSubmit={submit}>
        <h1>Admin</h1>
        <p className={styles.muted}>輸入 ADMIN_SECRET 以檢視 trials / payments</p>
        <input
          className={styles.input}
          type="password"
          placeholder="ADMIN_SECRET"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        {error && <p className={styles.errorText}>{error}</p>}
        <button type="submit" className={styles.primaryBtn} disabled={loading}>
          {loading ? "…" : "登入"}
        </button>
      </form>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
