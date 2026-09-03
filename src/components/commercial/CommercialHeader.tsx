import Image from "next/image";
import Link from "next/link";
import styles from "@/app/commercial.module.css";

export function CommercialHeader({ active }: { active?: "integrations" | "security" | "pricing" | "about" }) {
  return (
    <header className={styles.header}>
      <Link className={styles.brand} href="/" aria-label="Passage Authority home">
        <Image src="/brand/logo-primary.svg" width={208} height={40} alt="Passage Authority" priority />
      </Link>
      <nav aria-label="Main navigation">
        <Link href="/#how-it-works">Product</Link>
        <Link data-active={active === "integrations"} href="/integrations">Integrations</Link>
        <Link data-active={active === "security"} href="/security">Security</Link>
        <Link data-active={active === "pricing"} href="/pricing">Pricing</Link>
        <Link data-active={active === "about"} href="/about">About</Link>
      </nav>
      <Link className={styles.headerCta} href="/start">Sign in / try free</Link>
    </header>
  );
}
