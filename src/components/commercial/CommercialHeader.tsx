import Image from "next/image";
import Link from "next/link";
import styles from "@/app/commercial.module.css";

export function CommercialHeader({ active }: { active?: "templates" | "integrations" | "security" | "pricing" }) {
  return (
    <header className={styles.header}>
      <Link className={styles.brand} href="/" aria-label="Passage Authority home">
        <Image src="/brand/logo-primary.svg" width={208} height={40} alt="Passage Authority" priority />
      </Link>
      <nav aria-label="Main navigation">
        <Link data-active={active === "templates"} href="/templates">Templates</Link>
        <Link data-active={active === "integrations"} href="/integrations">Integrations</Link>
        <Link data-active={active === "security"} href="/security">Security</Link>
        <Link data-active={active === "pricing"} href="/pricing">Pricing</Link>
        <Link href="/start?intent=sign-in">Sign in</Link>
      </nav>
      <Link className={styles.headerCta} href="/start">Try free</Link>
    </header>
  );
}
