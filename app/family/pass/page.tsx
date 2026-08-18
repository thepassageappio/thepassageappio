import type { Metadata } from 'next';
import ActivePass from '../../../components/family/ActivePass';
import styles from '../../../components/family/FamilyJourney.module.css';

export const metadata: Metadata = {
  title: 'Preview: active family handoff | Passage',
  description: 'Preview demo — not connected to any real case or account. A temporary, family-controlled handoff for one receiving organization.',
  robots: { index: false, follow: false },
};

export default function FamilyPassPage() {
  return (
    <div className={styles.activePageRoot}>
      <a className={styles.skipLink} href="#active-pass">Skip to active pass</a>
      <p className={styles.demoBanner} role="status">Preview demo · not connected to any real case or account</p>
      <header className={styles.familyHeader}>
        <a className={styles.wordmark} href="/family" aria-label="Passage family home">
          <span aria-hidden="true">P</span>
          Passage
        </a>
        <div className={styles.headerContext}>
          <span>Rivera family</span>
          <i aria-hidden="true" />
          <strong>Active handoff</strong>
        </div>
        <a className={styles.exitPass} href="/family">Family space</a>
      </header>
      <div id="active-pass">
        <ActivePass />
      </div>
    </div>
  );
}
