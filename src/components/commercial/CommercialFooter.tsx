import Link from "next/link";
import styles from "@/app/commercial.module.css";

export function CommercialFooter() {
  return (
    <footer className={styles.footer}>
      <span>Passage Authority · Controlled evaluation</span>
      <nav aria-label="Legal information">
        <Link href="/legal/privacy">Privacy</Link>
        <Link href="/legal/terms">Terms</Link>
        <Link href="/legal/authorized-use">Authorized use</Link>
      </nav>
    </footer>
  );
}
