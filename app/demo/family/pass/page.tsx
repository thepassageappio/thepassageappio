import type { Metadata } from 'next';
import ActivePass from '../../../../components/family/ActivePass';
import styles from '../../../../components/family/FamilyJourney.module.css';

export const metadata: Metadata = { title: 'Example handoff', description: 'Review an example family handoff in the Passage demo.' };

export default function DemoFamilyPassPage() {
  return (
    <div className={styles.familyPage}>
      <a className={styles.skipLink} href="#active-pass">Skip to example handoff</a>
      <header className={styles.familyHeader}>
        <a className={styles.wordmark} href="/demo" aria-label="Return to Passage demo"><span aria-hidden="true">P</span>Passage demo</a>
        <div className={styles.headerContext}><span>Example family</span><i aria-hidden="true" /><strong>Sofia&apos;s example</strong></div>
        <a className={styles.exitPass} href="/demo/family">Family demo</a>
      </header>
      <p className={styles.demoBoundary} role="status">Private browser demo · choices stay on this device. This handoff does not create a real family record or send a message.</p>
      <ActivePass />
    </div>
  );
}
