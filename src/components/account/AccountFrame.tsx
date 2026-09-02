import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./account.module.css";

export function AccountFrame({
  eyebrow,
  title,
  description,
  step,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  step?: string;
  children: ReactNode;
}) {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/">
          <span aria-hidden="true"><i /><i /></span>
          Passage Authority
        </Link>
        <Link className={styles.headerLink} href="/security">Security</Link>
      </header>
      <section className={styles.shell}>
        <div className={styles.introduction}>
          <div>
            <p className={styles.eyebrow}>{eyebrow}</p>
            <h1>{title}</h1>
            <p className={styles.description}>{description}</p>
          </div>
          {step ? <span className={styles.step}>{step}</span> : null}
        </div>
        <div className={styles.card}>{children}</div>
      </section>
    </main>
  );
}
