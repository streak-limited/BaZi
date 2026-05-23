"use client";

import styles from "./model-journey.module.css";

export default function GlassButton({
  children,
  onClick,
  disabled,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      className={styles.glassBtn}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
