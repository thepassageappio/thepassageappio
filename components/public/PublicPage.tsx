import Link from 'next/link';
import type { ReactNode } from 'react';
import { PublicShell } from './PublicShell';
import styles from './PublicPage.module.css';

type Action = { href: string; label: string; secondary?: boolean };
type Card = { title: string; body: string; href?: string; linkLabel?: string };

export function PublicPage({
  eyebrow,
  title,
  lead,
  actions = [],
  children,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  actions?: Action[];
  children: ReactNode;
}) {
  return (
    <PublicShell>
      <main id="main-content">
        <section className={styles.hero}>
          <p className={styles.eyebrow}>{eyebrow}</p>
          <h1>{title}</h1>
          <p className={styles.lead}>{lead}</p>
          {actions.length > 0 && (
            <div className={styles.actions}>
              {actions.map((action) => (
                <Link className={action.secondary ? styles.secondary : styles.primary} href={action.href} key={action.href}>
                  {action.label}
                </Link>
              ))}
            </div>
          )}
        </section>
        {children}
      </main>
    </PublicShell>
  );
}

export function ContentSection({ eyebrow, title, intro, children, tone = 'plain' }: {
  eyebrow?: string;
  title: string;
  intro?: string;
  children: ReactNode;
  tone?: 'plain' | 'soft' | 'green';
}) {
  return (
    <section className={`${styles.section} ${styles[tone]}`}>
      <div className={styles.sectionHeading}>
        {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
        <h2>{title}</h2>
        {intro && <p>{intro}</p>}
      </div>
      {children}
    </section>
  );
}

export function CardGrid({ cards }: { cards: Card[] }) {
  return (
    <div className={styles.grid}>
      {cards.map((card) => (
        <article className={styles.card} key={card.title}>
          <h3>{card.title}</h3>
          <p>{card.body}</p>
          {card.href && <Link href={card.href}>{card.linkLabel ?? 'Read more'} <span aria-hidden="true">→</span></Link>}
        </article>
      ))}
    </div>
  );
}

export function Steps({ items }: { items: { title: string; body: string }[] }) {
  return (
    <ol className={styles.steps}>
      {items.map((item, index) => (
        <li key={item.title}>
          <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
          <div><h3>{item.title}</h3><p>{item.body}</p></div>
        </li>
      ))}
    </ol>
  );
}

export function Callout({ title, children, action }: { title: string; children: ReactNode; action?: Action }) {
  return (
    <aside className={styles.callout}>
      <div><h2>{title}</h2><div>{children}</div></div>
      {action && <Link className={styles.primary} href={action.href}>{action.label}</Link>}
    </aside>
  );
}
