import type { Metadata } from 'next';
import FamilyIntentJourney from '../../../components/family/FamilyIntentJourney';
import styles from '../../../components/family/FamilyJourney.module.css';

export const metadata: Metadata = {
  title: 'Family handoff demo',
  description: 'Try choosing who can receive an example handoff and what they can open.',
};

export default function DemoFamilyPage() {
  return (
    <main className={styles.familyPage}>
      <a className={styles.skipLink} href="#family-journey">Skip to handoff</a>
      <header className={styles.familyHeader}>
        <a className={styles.wordmark} href="/demo" aria-label="Return to Passage demo"><span aria-hidden="true">P</span>Passage demo</a>
        <div className={styles.headerContext}><span>Example family</span><i aria-hidden="true" /><strong>Sofia&apos;s example</strong></div>
        <span className={styles.familyProfile} aria-label="Example family identity">SR</span>
      </header>
      <p className={styles.demoBoundary} role="status">Private browser demo · choices stay on this device. Nothing here creates a real family record, sends a message, makes a purchase, or processes a payment.</p>
      <FamilyIntentJourney />
    </main>
  );
}
