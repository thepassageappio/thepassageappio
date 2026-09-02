import Link from "next/link";
import { resetSandboxAction } from "@/app/actions";
import styles from "./portal.module.css";

export function PortalHeader({ active }: { active: "home" | "institution" | "templates" | "developer" }) {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.brand}>
        <span className={styles.brandMark} aria-hidden="true"><i /><i /></span>
        <span>Passage <b>Authority</b></span>
      </Link>
      <nav className={styles.nav} aria-label="Product areas">
        <Link className={active === "templates" ? styles.active : ""} href="/templates">Templates</Link>
        <Link className={active === "institution" ? styles.active : ""} href="/institution">Review queue</Link>
        <Link className={active === "developer" ? styles.active : ""} href="/developer">Developer</Link>
      </nav>
      <form action={resetSandboxAction}>
        <button className={styles.reset} type="submit">Reset sample environment</button>
      </form>
    </header>
  );
}
