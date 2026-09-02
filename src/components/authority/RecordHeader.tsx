import Link from "next/link";
import { resetSandboxAction } from "@/app/actions";
import type { Party } from "@/lib/authority/types";
import styles from "./authority.module.css";

export function RecordHeader({ actor }: { actor: Party }) {
  return <header className={styles.appHeader}>
    <Link href="/" className={styles.brand}><span className={styles.brandMark} aria-hidden="true"><i /><i /></span><span>Passage <b>Authority</b></span></Link>
    <nav className={styles.headerNav} aria-label="Product areas"><Link href="/institution">Review queue</Link><Link href="/templates">Templates</Link><Link href="/developer">Developer</Link></nav>
    <div className={styles.headerContext}><span className={styles.sandboxPill}>Sandbox</span><span className={styles.headerDivider} aria-hidden="true" /><span>Viewing as <strong>{actor.name}</strong></span><form action={resetSandboxAction}><button className={styles.resetButton} type="submit">Reset sample environment</button></form></div>
  </header>;
}
