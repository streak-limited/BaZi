import styles from "./model-journey.module.css";

function SparkleIcon() {
  return (
    <svg
      className={styles.teaserSparkle}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M8 0L9.2 5.4L14.6 6.6L9.2 7.8L8 13.2L6.8 7.8L1.4 6.6L6.8 5.4L8 0Z"
        fill="#FF6B3D"
      />
      <path
        d="M12.5 2.5L13 4.5L15 5L13 5.5L12.5 7.5L12 5.5L10 5L12 4.5L12.5 2.5Z"
        fill="#FF8F66"
      />
    </svg>
  );
}

export default function WelcomeTeaserPill({
  text = "人生劇透到這種程度真的好嗎...",
}: {
  text?: string;
}) {
  return (
    <div className={styles.teaserPill}>
      <SparkleIcon />
      <span className={styles.teaserPillText}>{text}</span>
    </div>
  );
}
