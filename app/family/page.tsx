import type { Metadata } from 'next';
import FamilyIntentJourney from '../../components/family/FamilyIntentJourney';
import styles from '../../components/family/FamilyJourney.module.css';

export const metadata: Metadata = {
  title: 'Preview: create a family handoff | Passage',
  description: 'Preview demo — not connected to any real case or account. Choose who can receive a temporary handoff and exactly what they can open.',
  robots: { index: false, follow: false },
};

export default function FamilyPage() {
  return (
    <main className={styles.familyPage}>
      <a className={styles.skipLink} href="#family-journey">Skip to handoff</a>
      <p className={styles.demoBanner} role="status">Preview demo · not connected to any real case or account</p>
      <header className={styles.familyHeader}>
        <a className={styles.wordmark} href="/family" aria-label="Passage family home">
          <span aria-hidden="true">P</span>
          Passage
        </a>
        <div className={styles.headerContext}>
          <span>Rivera family</span>
          <i aria-hidden="true" />
          <strong>Sofia's record</strong>
        </div>
        <span className={styles.familyProfile} aria-label="Signed in as Sofia Torres">ST</span>
      </header>
      <FamilyIntentJourney />
    </main>
  );
}
