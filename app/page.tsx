import Link from 'next/link';
import { TopShell } from '@/components/core';
import styles from '@/components/marketing/MarketingPage.module.css';

const paths = [
  { label: 'Someone just passed', href: '/start', title: 'Get help right now', body: 'Start the urgent record: who to call, who to notify, and the first things that need a decision tonight.' },
  { label: 'Planning ahead', href: '/pricing', title: 'Set things up before they’re needed', body: 'Record wishes, name the people you trust, and store documents so your family isn’t starting from zero.' },
  { label: 'Funeral home', href: '/organization/start', title: 'Run your cases through Passage', body: 'Give your team one shared view of every family, every task owner, and every handoff, with proof attached.' },
  { label: 'Care provider or vendor', href: '/partner/start', title: 'Coordinate without the back-and-forth', body: 'Hospice teams, florists, cemeteries, and celebrants get exactly the request they need. Nothing more.' },
];

const whatItDoes: [string, string][] = [
  ['One shared record', 'The family, the funeral home, and anyone invited to help see the same up-to-date picture, not four separate phone trees.'],
  ['Real ownership', 'Every task has one person responsible for it and a visible status, so nothing quietly falls through.'],
  ['Proof, not promises', 'Passage keeps a record of what was actually done, by whom, and when, so "I thought someone else had it" stops happening.'],
  ['The right people, matched', 'Need a funeral home, florist, or cemetery who does this every day? Passage can help you find and loop them in.'],
];

export const metadata = { title: 'Passage' };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function HomePage() {
  return (
    <TopShell mode="gateway" context="Family & funeral coordination">
      <main id="main-content" className={styles.page}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Passage</p>
          <h1>When someone dies, someone has to hold it together. Let Passage carry the details.</h1>
          <p className={styles.lede}>
            Passage is a shared record for families, funeral homes, and everyone helping in between. It keeps track of what needs to happen, who owns it, and what&apos;s already been handled, so you can lean on the people around you instead of repeating yourself to each one.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 22 }}>
            <Link className={styles.button} href="/#what-you-need">Get started</Link>
            <Link className={styles.buttonSecondary} href="/demo">See how it works</Link>
          </div>
        </section>

        <section className={styles.section} id="what-you-need">
          <div className={styles.sectionHeading}>
            <h2>What do you need right now?</h2>
            <p>Passage works differently depending on your situation. Pick the one that matches yours.</p>
          </div>
          <div className={`${styles.grid} ${styles.grid3}`}>
            {paths.map((path) => (
              <Link className={`${styles.card} ${styles.pathCard}`} href={path.href} key={path.label}>
                <p className={styles.badge}>{path.label}</p>
                <h3 className={styles.pathTitle}>{path.title}</h3>
                <p className={styles.pathBody}>{path.body}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeading}><h2>What Passage actually does</h2></div>
          <div className={`${styles.grid} ${styles.grid3}`}>
            {whatItDoes.map(([title, body]) => (
              <div className={styles.card} key={title}>
                <h3 className={styles.pathTitle}>{title}</h3>
                <p className={styles.pathBody}>{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.card} style={{ maxWidth: 640 }}>
            <p className={styles.badge}>The Passage pledge</p>
            <p className={styles.note}>Passage directs 10% of proceeds to grief and family-support work. Each paid urgent family record also funds a remembrance tree dedication in the person&apos;s name. Read more about <Link href="/mission">our mission</Link>.</p>
          </div>
        </section>

        <footer className={styles.footer}>
          <p>Questions? <Link href="/contact">Contact Passage</Link> · <Link href="/privacy">Privacy</Link> · <Link href="/terms">Terms</Link></p>
        </footer>
      </main>
    </TopShell>
  );
}
