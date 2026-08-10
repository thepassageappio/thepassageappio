'use client';

import { useRef, useState } from 'react';
import { usePassageZero } from '@/components/PassageZeroProvider';
import styles from './DemoReset.module.css';

const FAMILY_INTENT_KEY = 'passage.family.intent.v1';
const FAMILY_HANDOFF_KEY = 'passage.family.transfer.v1';

export default function DemoReset() {
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
      setMessage('The family example in this browser was reset. Shared director, staff, and vendor example activity was not reset.');
    } else {
      setMessage('A fresh family example is ready for this visit, but this browser could not save the full reset. Shared director, staff, and vendor example activity was not reset.');
    }
    window.requestAnimationFrame(() => resultRef.current?.focus());
  }

  return (
    <section className={styles.reset} aria-labelledby="family-reset-title">
      <div>
        <h2 id="family-reset-title">Start the family example again</h2>
        <p>This resets only the family example saved in this browser. It does not reset the shared director, staff, or vendor examples.</p>
      </div>
      <button onClick={resetFamilyDemo} type="button">Reset the family demo</button>
      <p aria-live="polite" className={styles.result} ref={resultRef} tabIndex={-1}>{message}</p>
    </section>
  );
}
