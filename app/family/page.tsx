import type { Metadata } from 'next';
import FamilyIntentJourney from '../../components/family/FamilyIntentJourney';
import styles from '../../components/family/FamilyJourney.module.css';
import { confirmProviderSelection } from './provider-discovery/actions';
import { PassageZeroProvider } from '@/components/PassageZeroProvider';

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
        <a className={styles.familyProfile} href="/family/people" aria-label="Manage people with family access">
          People
        </a>
      </header>
      <PassageZeroProvider>
        <FamilyIntentJourney
          confirmProviderSelection={confirmProviderSelection}
          providerMode="authenticated"
        />
      </PassageZeroProvider>
    </main>
  );
}
