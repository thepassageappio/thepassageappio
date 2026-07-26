'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useState, type FormEvent } from 'react';
import { getPassageBrowserClient } from '@/lib/supabase/browser';
import { humanSituationCategory, situationGuidance, type SituationCategory } from '@/lib/urgent/situations';
import { submitUrgentIntake, type UrgentCommandState } from '../actions';
import { useStartWizard } from '../StartWizardContext';
import styles from '../Start.module.css';

const initialState: UrgentCommandState = { status: 'idle' };

type ExistingRequest = { id: string; status: string; wants_callback: boolean; coordinator_name: string; coordinator_phone: string | null; coordinator_email: string | null };
type Phase = 'checking' | 'needs-auth' | 'ready' | 'already-saved';

export function UrgentNextClient({ supabaseUrl, publishableKey }: { supabaseUrl: string; publishableKey: string }) {
  const router = useRouter();
  const { draft } = useStartWizard();
  const [phase, setPhase] = useState<Phase>('checking');
  const [existing, setExisting] = useState<ExistingRequest | null>(null);
  const [requestId] = useState(() => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`));
  const [authMode, setAuthMode] = useState<'create' | 'signin'>('create');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState('');
  const [state, formAction, pending] = useActionState(submitUrgentIntake, initialState);

  useEffect(() => {
    if (!draft.situationCategory) { router.replace('/start/situation'); return; }
    let cancelled = false;
    async function check() {
      const client = getPassageBrowserClient(supabaseUrl, publishableKey);
      const { data: userResult } = await client.auth.getUser();
      if (!userResult.user) {
        if (!cancelled) setPhase('needs-auth');
        return;
      }
      const { data } = await client
        .from('urgent_intake_requests')
        .select('id, status, wants_callback, coordinator_name, coordinator_phone, coordinator_email')
        .eq('requester_user_id', userResult.user.id)
        .order('submitted_at', { ascending: false })
        .limit(1);
      if (cancelled) return;
      if (data && data.length > 0) { setExisting(data[0] as ExistingRequest); setPhase('already-saved'); }
      else setPhase('ready');
    }
    check();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.situationCategory]);

  async function handleAuth(event: FormEvent) {
    event.preventDefault();
    setAuthError('');
    setAuthBusy(true);
    const client = getPassageBrowserClient(supabaseUrl, publishableKey);
    if (authMode === 'create') {
      const result = await client.auth.signUp({ email: authEmail.trim(), password: authPassword });
      if (result.error) { setAuthError('Passage could not create that account. Try a different email or sign in instead.'); setAuthBusy(false); return; }
      if (!result.data.session) { setAuthError('Your account was created. Check your email to confirm it, or ask Passage to confirm it for you.'); setAuthBusy(false); return; }
    } else {
      const result = await client.auth.signInWithPassword({ email: authEmail.trim(), password: authPassword });
      if (result.error || !result.data.session) { setAuthError('That email and password did not match. Try again.'); setAuthBusy(false); return; }
    }
    setAuthBusy(false);
    setPhase('ready');
  }

  if (!draft.situationCategory) return null;
  const guidance = situationGuidance(draft.situationCategory as SituationCategory);

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link className={styles.wordmark} href="/">PASSAGE</Link>
        <Link className={styles.exit} href="/start">Exit</Link>
      </header>
      <div className={styles.progress} aria-hidden="true">
        <span className={styles.progressStep} data-done="true" />
        <span className={styles.progressStep} data-done="true" />
        <span className={styles.progressStep} data-done="true" />
      </div>
      <main className={styles.main} id="main-content">
        <p className={styles.eyebrow}>STEP 3 OF 3</p>
        <h1 className={styles.title}>Here's what to do next.</h1>

        <section className={styles.guidance} aria-labelledby="guidance-heading">
          <h2 id="guidance-heading">{guidance.heading}</h2>
          <ol>{guidance.steps.map((step) => <li key={step}>{step}</li>)}</ol>
        </section>

        {phase === 'checking' && <p className={styles.lede}>One moment…</p>}

        {phase === 'already-saved' && existing && (
          <div className={styles.receipt}>
            <div className={styles.receiptMark} aria-hidden="true">✓</div>
            <h1>Already saved.</h1>
            <p>
              {existing.status === 'claimed' || existing.status === 'case_created'
                ? `A director from Passage is already helping with this for ${existing.coordinator_name}.`
                : existing.wants_callback
                  ? `We have this saved and a director will reach out to ${existing.coordinator_name} shortly.`
                  : `We saved this for ${existing.coordinator_name}'s records. No callback was requested.`}
            </p>
            <dl className={styles.receiptFacts}>
              <div><dt>Situation</dt><dd>{humanSituationCategory(draft.situationCategory)}</dd></div>
              <div><dt>Contact</dt><dd>{existing.coordinator_phone || existing.coordinator_email}</dd></div>
            </dl>
          </div>
        )}

        {phase === 'needs-auth' && (
          <div className={styles.authCard}>
            <h2>Save this and continue</h2>
            <p>Create a free account (or sign in) so nothing is lost and, if you ask for one, a director can call you back.</p>
            <div className={styles.authToggle}>
              <button data-active={authMode === 'create'} onClick={() => setAuthMode('create')} type="button">Create account</button>
              <button data-active={authMode === 'signin'} onClick={() => setAuthMode('signin')} type="button">I already have one</button>
            </div>
            {authError && <p className={styles.alert} role="alert">{authError}</p>}
            <form onSubmit={handleAuth} noValidate>
              <div className={styles.field}>
                <label htmlFor="authEmail">Email</label>
                <input id="authEmail" inputMode="email" onChange={(event) => setAuthEmail(event.target.value)} required type="email" value={authEmail} />
              </div>
              <div className={styles.field}>
                <label htmlFor="authPassword">Password</label>
                <input autoComplete={authMode === 'create' ? 'new-password' : 'current-password'} id="authPassword" minLength={8} onChange={(event) => setAuthPassword(event.target.value)} required type="password" value={authPassword} />
              </div>
              <button className={styles.primaryButton} disabled={authBusy} type="submit">{authBusy ? 'Please wait…' : authMode === 'create' ? 'Create account and continue' : 'Sign in and continue'}</button>
            </form>
            <p style={{ fontSize: 12.5, color: '#6b6258', marginTop: 10 }}>This is a preview workspace using test data. No real messages are sent.</p>
          </div>
        )}

        {phase === 'ready' && state.status !== 'saved' && (
          <form action={formAction} aria-busy={pending} noValidate>
            <input name="situationCategory" type="hidden" value={draft.situationCategory} />
            <input name="personName" type="hidden" value={draft.personName} />
            <input name="personLocation" type="hidden" value={draft.personLocation} />
            <input name="personTiming" type="hidden" value={draft.personTiming} />
            <input name="coordinatorName" type="hidden" value={draft.coordinatorName} />
            <input name="coordinatorPhone" type="hidden" value={draft.coordinatorPhone} />
            <input name="coordinatorEmail" type="hidden" value={draft.coordinatorEmail} />
            <input name="callbackNotes" type="hidden" value={draft.callbackNotes} />
            <input name="requestId" type="hidden" value={requestId} />
            {state.status !== 'idle' && state.message && <p className={styles.alert} role="alert">{state.message}</p>}
            <fieldset disabled={pending} style={{ border: 'none', padding: 0, margin: 0 }}>
              <button className={styles.primaryButton} name="wantsCallback" type="submit" value="true">{pending ? 'Saving…' : 'Request a callback from Passage'}</button>
              <button className={styles.secondaryButton} name="wantsCallback" type="submit" value="false">I'll take this step myself for now</button>
            </fieldset>
          </form>
        )}

        {state.status === 'saved' && (
          <div className={styles.receipt}>
            <div className={styles.receiptMark} aria-hidden="true">✓</div>
            <h1>Saved.</h1>
            <p>{state.receipt?.wantsCallback ? `A director will reach out to ${draft.coordinatorName || 'your contact'} shortly.` : 'We saved this for your records. Come back anytime if you need a callback.'}</p>
          </div>
        )}
      </main>
    </div>
  );
}
