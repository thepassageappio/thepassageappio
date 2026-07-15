import type { Metadata } from 'next';
import TransferComposer from '../../components/family/TransferComposer';
import styles from '../../components/family/FamilyJourney.module.css';

export const metadata: Metadata = {
  title: 'Create a family handoff | Passage',
  description: 'Choose who can receive a temporary handoff and exactly what they can open.',
};

export default function FamilyPage() {
  return (
    <main className={styles.familyPage}>
      <a className={styles.skipLink} href="#family-journey">Skip to handoff</a>
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
        <button className={styles.familyProfile} type="button" aria-label="Open family profile">ST</button>
      </header>
      <section className={styles.familyIntro} id="family-journey">
        <div>
          <p>FAMILY HANDOFF</p>
          <h1>Send less.<br /><span>Mean more.</span></h1>
        </div>
        <p>Give one trusted organization temporary access to only what they need. Nothing else leaves your family space.</p>
      </section>
      <TransferComposer />
    </main>
  );
}
