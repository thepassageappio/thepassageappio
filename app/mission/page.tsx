import Link from 'next/link';
import { TopShell } from '@/components/core';
import styles from '@/components/marketing/MarketingPage.module.css';

const paths = [
  { label: 'Urgent help', href: '/start', title: 'Someone just passed', body: 'Start with the few actions that matter tonight: who calls, who is notified, what is waiting, and what is already handled.' },
  { label: 'Plan ahead', href: '/contact?category=planning', title: 'Plan before it is needed', body: 'Gather people, wishes, documents, and confirmation contacts so your family is not starting from zero later.' },
  { label: 'Funeral homes', href: '/contact?category=funeral-home', title: 'For funeral homes', body: 'Apply to join, book a pilot walkthrough, or tell us how your team wants to receive family handoffs.' },
];

const proof: [string, string][] = [
  ['First', 'What matters right now'],
  ['Owned', 'Who is responsible'],
  ['Proven', 'How we know it happened'],
];

export const metadata = { title: 'Our mission' };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function MissionPage() {
  return (
    <TopShell mode="gateway" context="Our mission">
      <main id="main-content" className={styles.page}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Our mission</p>
          <h1>Make the practical parts survivable.</h1>
          <p className={styles.lede}>Passage turns scattered calls, documents, roles, service details, and family updates into one calm place to act. Not a checklist. One calm place that carries the next step.</p>
        </section>

        <section className={styles.section}>
          <div className={styles.card} style={{ maxWidth: 640 }}>
            <p className={styles.badge}>The promise</p>
            <h2 className={styles.h2Small}>Less hunting. Fewer decisions. Visible progress.</h2>
            <p className={styles.note}>We do not pretend grief is manageable. We make the calls, documents, ownership, and next steps easier to carry.</p>
            <p className={styles.note} style={{ marginTop: 12 }}><strong>The Passage family pledge:</strong> Passage directs 10% of proceeds to grief and family-support work. For each paid urgent family record, we also fund a remembrance tree dedication in the person&apos;s name.</p>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeading}><h2>How Passage helps</h2></div>
          <div className={`${styles.grid} ${styles.grid3}`}>
            {proof.map(([k, v]) => (
              <div className={styles.readinessCard} key={k}>
                <p className={styles.badge}>{k}</p>
                <p style={{ margin: 0, fontSize: 14 }}>{v}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeading}><h2>Choose your path</h2></div>
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

        <footer className={styles.footer}>
          <p>Questions about the mission? <Link href="/contact">Contact Passage</Link>.</p>
        </footer>
      </main>
    </TopShell>
  );
}
