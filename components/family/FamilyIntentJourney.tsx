'use client';

import { useEffect, useState } from 'react';
import TransferComposer from './TransferComposer';
import styles from './FamilyJourney.module.css';

type FamilyIntent = 'planning' | 'urgent';

const STORAGE_KEY = 'passage.family.intent.v1';
const intentCopy: Record<FamilyIntent, { eyebrow: string; title: string; emphasis: string; body: string }> = {
  planning: {
    eyebrow: 'PLANNING AHEAD',
    title: 'Prepare at your pace.',
    emphasis: 'Keep control.',
    body: 'Build an example handoff at your pace. Reviewing and activating it changes only this device; nothing is sent or shared.',
  },
  urgent: {
    eyebrow: 'HELP NEEDED TODAY',
    title: 'Choose what they need.',
    emphasis: 'Keep the rest private.',
    body: 'Practice choosing what a funeral home could receive. This browser demo does not contact anyone, create a case, or send a handoff—even after you finish.',
  },
};

export default function FamilyIntentJourney() {
  const [intent, setIntent] = useState<FamilyIntent | null>(null);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'planning' || saved === 'urgent') setIntent(saved);
    setRestored(true);
  }, []);

  function chooseIntent(next: FamilyIntent) {
    setIntent(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  const copy = intent ? intentCopy[intent] : null;

  return (
    <>
      <section className={styles.familyIntro} id="family-journey">
        <div>
          <p>{copy?.eyebrow ?? 'PRIVATE BROWSER DEMO'}</p>
          <h1>{copy?.title ?? 'What brings you here?'}<br /><span>{copy?.emphasis ?? 'Choose the path that fits.'}</span></h1>
        </div>
        <div className={styles.familyEntry}>
          <p>{copy?.body ?? 'Choose planning ahead or immediate help. You will review an example before anything changes on this device; nothing is sent or shared.'}</p>
          <div className={styles.entryPaths} aria-label="Choose how to begin">
            <button aria-pressed={intent === 'planning'} onClick={() => chooseIntent('planning')} type="button"><span>Planning ahead</span><small>Build an example private handoff</small></button>
            <button aria-pressed={intent === 'urgent'} onClick={() => chooseIntent('urgent')} type="button"><span>I need help today</span><small>Choose example details</small></button>
          </div>
          {restored && <small className={styles.intentBoundary}>{intent ? 'Change paths anytime. ' : ''}Private browser demo: this choice stays on this device. It does not create an account, contact anyone, or change a real family record.</small>}
        </div>
      </section>
      <TransferComposer />
    </>
  );
}
