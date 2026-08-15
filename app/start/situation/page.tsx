'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { SITUATION_OPTIONS, type SituationCategory } from '@/lib/urgent/situations';
import { useStartWizard } from '../StartWizardContext';
import { StartWordmark } from '../StartWordmark';
import styles from '../Start.module.css';

export default function StartSituationPage() {
  const router = useRouter();
  const { draft, update } = useStartWizard();
  const [error, setError] = useState('');

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!draft.situationCategory) { setError('Choose the option closest to what is happening.'); return; }
    if (!draft.personName.trim()) { setError('Enter the name of the person this is about.'); return; }
    if (!draft.personLocation.trim()) { setError('Enter where they are right now.'); return; }
    setError('');
    router.push('/start/people');
  }

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <StartWordmark />
        <Link className={styles.exit} href="/start">Exit</Link>
      </header>
      <div className={styles.progress} aria-hidden="true">
        <span className={styles.progressStep} data-done="true" />
        <span className={styles.progressStep} />
        <span className={styles.progressStep} />
      </div>
      <main className={styles.main} id="main-content">
        <p className={styles.eyebrow}>STEP 1 OF 3</p>
        <h1 className={styles.title}>Tell us what's happening.</h1>
        <p className={styles.lede}>Nothing is sent anywhere yet. This just helps us give you the right next step.</p>
        {error && <p className={styles.alert} role="alert">{error}</p>}
        <form onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label htmlFor="situationCategory">Which best describes it?</label>
            <select
              id="situationCategory"
              onChange={(event) => update({ situationCategory: event.target.value as SituationCategory })}
              value={draft.situationCategory}
            >
              <option disabled value="">Choose one</option>
              {SITUATION_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="personName">Their name</label>
            <input
              id="personName"
              onChange={(event) => update({ personName: event.target.value })}
              value={draft.personName}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="personLocation">Where they are right now</label>
            <small>A hospital name, home address, or facility name is fine.</small>
            <input
              id="personLocation"
              onChange={(event) => update({ personLocation: event.target.value })}
              value={draft.personLocation}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="personTiming">When did this happen? <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(optional)</span></label>
            <input
              id="personTiming"
              onChange={(event) => update({ personTiming: event.target.value })}
              placeholder="e.g. about an hour ago"
              value={draft.personTiming}
            />
          </div>

          <button className={styles.primaryButton} type="submit">Continue</button>
        </form>
      </main>
    </div>
  );
}
