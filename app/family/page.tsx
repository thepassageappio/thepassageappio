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
          <p>YOUR FAMILY SPACE</p>
          <h1>Start gently.<br /><span>Stay in control.</span></h1>
        </div>
        <div className={styles.familyEntry}>
          <p>Whether you are planning ahead or coordinating care today, share only what one trusted organization needs. Everything else stays with your family.</p>
          <nav className={styles.entryPaths} aria-label="Choose how to begin">
            <a href="#family-journey"><span>Planning ahead</span><small>Prepare a calm, private handoff</small></a>
            <a href="#family-journey"><span>I need help today</span><small>Share essential details now</small></a>
          </nav>
        </div>
      </section>
      <TransferComposer />
    </main>
  );
}
