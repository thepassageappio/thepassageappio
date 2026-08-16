import Link from 'next/link';
import { TopShell } from '@/components/core';
import styles from '@/components/marketing/MarketingPage.module.css';

const moments: [string, string][] = [
  ['The meeting', 'There was care in the room, and still too much for the family to carry home.'],
  ['The folder', 'Instructions, phone numbers, papers, and next steps depended on one person keeping it all straight.'],
  ['The gap', 'Every institution had a role, but the family record did not travel with the family.'],
  ['The product', 'Passage became the calm place for owners, updates, proof, and handoffs to stay together.'],
];

export const metadata = { title: 'Our story' };

export default function StoryPage() {
  return (
    <TopShell mode="gateway" context="Our story">
      <main id="main-content" className={styles.page}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Our story</p>
          <h1>Passage began with a folder.</h1>
          <p className={styles.lede}>
            Passage&apos;s founder helped plan his grandmother&apos;s funeral with her while the family was also navigating Medicaid and the practical realities that come with care. The people helping were kind. The system around everyone was not built for continuity.
          </p>
          <p className={styles.lede} style={{ marginTop: 10 }}>
            This was not a villain story. The care was real. The burden still moved back to the family: remember this, call that person, find this document, tell everyone what changed. Passage came from that gap — the family record didn&apos;t travel cleanly, so someone always had to carry it by hand.
          </p>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeading}><h2>How the idea took shape</h2></div>
          <div className={`${styles.grid} ${styles.grid3}`}>
            {moments.map(([title, body]) => (
              <div className={styles.card} key={title}>
                <h3 className={styles.pathTitle}>{title}</h3>
                <p className={styles.pathBody}>{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.card} style={{ maxWidth: 640 }}>
            <p className={styles.badge}>Why Passage exists</p>
            <p className={styles.note}>To make the practical parts survivable: what happens now, who is responsible, what can&apos;t move yet, and how everyone knows it happened.</p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16 }}>
              <Link className={styles.button} href="/start">Start urgent help</Link>
              <Link className={styles.buttonSecondary} href="/mission">Read the mission</Link>
            </div>
          </div>
        </section>

        <footer className={styles.footer}>
          <p>Questions? <Link href="/contact">Contact Passage</Link> · <Link href="/privacy">Privacy</Link> · <Link href="/terms">Terms</Link></p>
        </footer>
      </main>
    </TopShell>
  );
}
