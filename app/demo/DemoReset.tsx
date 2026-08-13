'use client';

import { useRef, useState } from 'react';
import { usePassageZero } from '@/components/PassageZeroProvider';
import styles from './DemoReset.module.css';

const FAMILY_INTENT_KEY = 'passage.family.intent.v1';
const FAMILY_HANDOFF_KEY = 'passage.family.transfer.v1';

export default function DemoReset({ operatorSessionsConfigured }: { operatorSessionsConfigured: boolean }) {
  const { reset } = usePassageZero();
  const [message, setMessage] = useState('');
  const resultRef = useRef<HTMLParagraphElement>(null);

  function resetFamilyDemo() {
    const sandboxResult = reset();
    let intentCleared = true;
    let handoffCleared = true;

    try {
      window.localStorage.removeItem(FAMILY_INTENT_KEY);
    } catch {
      intentCleared = false;
    }
    try {
      window.sessionStorage.removeItem(FAMILY_HANDOFF_KEY);
    } catch {
      handoffCleared = false;
    }

    if (sandboxResult.persisted && intentCleared && handoffCleared) {
      setMessage(operatorSessionsConfigured
        ? 'The family example in this browser was reset. Isolated operator workspaces were not changed.'
        : 'The family example in this browser was reset. Guided operator changes exist only on their current page and reset on refresh.');
    } else {
      setMessage(operatorSessionsConfigured
        ? 'A fresh family example is ready for this visit, but this browser could not save the full reset. Isolated operator workspaces were not changed.'
        : 'A fresh family example is ready for this visit, but this browser could not save the full reset. Guided operator changes exist only on their current page and reset on refresh.');
    }
    window.requestAnimationFrame(() => resultRef.current?.focus());
  }

  return (
    <section className={styles.reset} aria-labelledby="family-reset-title">
      <div>
        <h2 id="family-reset-title">Start the family example again</h2>
        <p>{operatorSessionsConfigured
          ? 'This resets only the family example saved in this browser. It does not change isolated operator workspaces.'
          : 'This resets only the family example saved in this browser. Guided operator changes stay only on their current page and reset on refresh.'}</p>
      </div>
      <button onClick={resetFamilyDemo} type="button">Reset the family demo</button>
      <p aria-live="polite" className={styles.result} ref={resultRef} tabIndex={-1}>{message}</p>
    </section>
  );
}
