'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { useStartWizard } from '../StartWizardContext';
import { StartWordmark } from '../StartWordmark';
import styles from '../Start.module.css';

export default function StartPeoplePage() {
  const router = useRouter();
  const { draft, hydrated, update } = useStartWizard();
  const [error, setError] = useState('');
  const [checkedDraft, setCheckedDraft] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!draft.situationCategory) router.replace('/start/situation');
    else setCheckedDraft(true);
  }, [draft.situationCategory, hydrated, router]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!draft.coordinatorName.trim()) { setError('Enter the name of the best person to contact.'); return; }
    if (!draft.coordinatorPhone.trim() && !draft.coordinatorEmail.trim()) { setError('Enter a phone number or an email address so we can reach this person.'); return; }
    setError('');
    router.push('/start/next');
  }

  if (!checkedDraft) return null;

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <StartWordmark />
        <Link className={styles.exit} href="/start">Exit</Link>
      </header>
      <div className={styles.progress} aria-hidden="true">
        <span className={styles.progressStep} data-done="true" />
        <span className={styles.progressStep} data-done="true" />
        <span className={styles.progressStep} />
      </div>
      <main className={styles.main} id="main-content">
        <p className={styles.eyebrow}>STEP 2 OF 3</p>
        <h1 className={styles.title}>Who should we reach?</h1>
        <p className={styles.lede}>This is the person best placed to make decisions and take a callback right now. It can be you.</p>
        {error && <p className={styles.alert} role="alert">{error}</p>}
        <form onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label htmlFor="coordinatorName">Their name</label>
            <input
              id="coordinatorName"
              onChange={(event) => update({ coordinatorName: event.target.value })}
              value={draft.coordinatorName}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="coordinatorPhone">Phone number</label>
            <input
              id="coordinatorPhone"
              inputMode="tel"
              onChange={(event) => update({ coordinatorPhone: event.target.value })}
              value={draft.coordinatorPhone}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="coordinatorEmail">Email <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(optional if you gave a phone number)</span></label>
            <input
              id="coordinatorEmail"
              inputMode="email"
              onChange={(event) => update({ coordinatorEmail: event.target.value })}
              value={draft.coordinatorEmail}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="callbackNotes">Anything else we should know? <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(optional)</span></label>
            <textarea
              id="callbackNotes"
              onChange={(event) => update({ callbackNotes: event.target.value })}
              value={draft.callbackNotes}
            />
          </div>

          <button className={styles.primaryButton} type="submit">Continue</button>
        </form>
        <Link className={styles.backLink} href="/start/situation">← Back</Link>
      </main>
    </div>
  );
}
