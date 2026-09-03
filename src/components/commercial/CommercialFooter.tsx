import Link from "next/link";
import styles from "@/app/commercial.module.css";

export function CommercialFooter() {
  return (
    <footer className={styles.footer}>
      <span>Passage Authority · Controlled evaluation</span>
      <nav aria-label="Site information">
        <Link href="/resources">Resources</Link>
        <Link href="/contact">Contact</Link>
        <Link href="/templates">Templates</Link>
        <Link href="/legal/privacy">Privacy</Link>
        <Link href="/legal/terms">Terms</Link>
      </nav>
    </footer>
  );
}
