'use client';

import { useRouter } from 'next/navigation';
import { useStartWizard } from './StartWizardContext';
import styles from './Start.module.css';

export function StartNewRequestButton() {
  const router = useRouter();
  const { reset } = useStartWizard();

  function startNewRequest() {
    reset();
    router.push('/start/situation');
  }

  return (
    <button className={styles.primaryButton} onClick={startNewRequest} type="button">
      Start a new request
    </button>
  );
}
