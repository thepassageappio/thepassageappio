'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { LOCATION_OPTIONS, SITUATION_OPTIONS, TIMING_OPTIONS, type SituationCategory } from '@/lib/urgent/situations';
import { useStartWizard } from '../StartWizardContext';
import { StartWordmark } from '../StartWordmark';
import styles from '../Start.module.css';

// Where LOCATION_OPTIONS/TIMING_OPTIONS choices are pre-loaded from an
// existing draft.personLocation/personTiming value (e.g. navigating back to
// this step) -- otherwise defaults to "not chosen yet" for a fresh visit.
function matchOption(options: readonly string[], value: string): string {
  return options.includes(value) ? value : '';
}

export default function StartSituationPage() {
  const router = useRouter();
  const { draft, update } = useStartWizard();
  const [error, setError] = useState('');
  const [locationChoice, setLocationChoice] = useState(() => matchOption(LOCATION_OPTIONS, draft.personLocation) || (draft.personLocation ? 'Other' : ''));
  const [locationDetail, setLocationDetail] = useState(() => (LOCATION_OPTIONS.includes(draft.personLocation as (typeof LOCATION_OPTIONS)[number]) ? '' : draft.personLocation));
  const [timingChoice, setTimingChoice] = useState(() => matchOption(TIMING_OPTIONS, draft.personTiming));

  function applyLocation(choice: string, detail: string) {
    const value = choice === 'Other' ? detail.trim() : choice;
    update({ personLocation: value });
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!draft.situationCategory) { setError('Choose the option closest to what is happening.'); return; }
    if (!draft.personName.trim()) { setError('Enter the name of the person this is about.'); return; }
    if (!locationChoice) { setError('Choose where they are right now.'); return; }
    if (locationChoice === 'Other' && !locationDetail.trim()) { setError('Say where they are right now.'); return; }
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
            <select
              id="personLocation"
              onChange={(event) => { setLocationChoice(event.target.value); applyLocation(event.target.value, locationDetail); }}
              value={locationChoice}
            >
              <option disabled value="">Choose one</option>
              {LOCATION_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
            {locationChoice === 'Other' && (
              <input
                aria-label="Where they are right now"
                onChange={(event) => { setLocationDetail(event.target.value); applyLocation('Other', event.target.value); }}
                placeholder="A hospital name, home address, or facility name is fine."
                style={{ marginTop: 8 }}
                value={locationDetail}
              />
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="personTiming">When did this happen? <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(optional)</span></label>
            <select
              id="personTiming"
              onChange={(event) => { setTimingChoice(event.target.value); update({ personTiming: event.target.value }); }}
              value={timingChoice}
            >
              <option value="">Prefer not to say</option>
              {TIMING_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>

          <button className={styles.primaryButton} type="submit">Continue</button>
        </form>
      </main>
    </div>
  );
}
