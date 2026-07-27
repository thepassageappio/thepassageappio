import Link from 'next/link';
import type { ReactNode } from 'react';
import styles from './PublicShell.module.css';

const navigation = [
  ['Family help', '/start'],
  ['Funeral homes', '/funeral-home'],
  ['Pricing', '/pricing'],
  ['Guides', '/guides'],
  ['Our Story', '/story'],
  ['Trust', '/trust'],
  ['Sign in', '/login'],
] as const;

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className={styles.site}>
      <a className={styles.skipLink} href="#main-content">Skip to main content</a>
      <header className={styles.header}>
        <Link className={styles.brand} href="/" aria-label="Passage home">
          <span aria-hidden="true">P</span>
          Passage
        </Link>
        <nav aria-label="Main navigation">
          {navigation.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
        </nav>
        <Link className={styles.primaryAction} href="/start">Get help now</Link>
      </header>
      {children}
      <footer className={styles.footer}>
        <div>
          <Link className={styles.footerBrand} href="/">Passage</Link>
          <p>Clear next steps for families and the people helping them.</p>
        </div>
        <nav aria-label="Footer navigation">
          <Link href="/care-providers">Care providers</Link>
          <Link href="/demo">View the demo</Link>
          <Link href="/trust">Privacy and trust</Link>
        </nav>
        <p className={styles.boundary}>Reading these pages does not create an account or family record. Passage explains any save or share before it happens.</p>
      </footer>
    </div>
  );
}
