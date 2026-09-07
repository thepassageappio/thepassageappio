import Image from "next/image";
import Link from "next/link";
import styles from "@/app/commercial.module.css";
import polish from "./commercial-header-polish.module.css";

export function CommercialHeader({ active }: { active?: "integrations" | "security" | "pricing" | "about" | "blog" }) {
  return (
    <header className={styles.header}>
      <Link className={`${styles.brand} ${polish.brand}`} href="/" aria-label="Passage Authority home">
        <Image src="/brand/logo-primary.svg" width={208} height={40} alt="Passage Authority" priority />
      </Link>
      <nav className={polish.navigation} aria-label="Main navigation">
        <Link href="/#how-it-works">Product</Link>
        <Link data-active={active === "integrations"} href="/integrations">Integrations</Link>
        <Link data-active={active === "security"} href="/security">Security</Link>
        <Link data-active={active === "pricing"} href="/pricing">Pricing</Link>
        <Link data-active={active === "blog"} href="/blog">Blog</Link>
        <Link data-active={active === "about"} href="/about">About</Link>
      </nav>
      <div className={polish.headerActions}>
        <Link className={polish.signInLink} href="/start?intent=sign-in">Sign in</Link>
        <Link className={`${styles.headerCta} ${polish.headerCta}`} href="/contact">Book a demo</Link>
      </div>
    </header>
  );
}
