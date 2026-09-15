import { NY_SOLE_REFUSAL_SOFT_NOTICE } from "@/lib/authority/jurisdiction-pack";
import styles from "@/components/app/app-shell.module.css";

export function NySoleRefusalNotice({ show }: { show: boolean }) {
  if (!show) return null;
  return <p className={styles.notice} role="note">{NY_SOLE_REFUSAL_SOFT_NOTICE}</p>;
}
