import styles from "./loading.module.css";

export default function Loading() {
  return (
    <div className={styles.feedback} role="status" aria-live="polite">
      <span className={styles.bar} />
      <span className={styles.srOnly}>Opening page…</span>
    </div>
  );
}
