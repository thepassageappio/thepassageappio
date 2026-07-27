'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useState, type FormEvent } from 'react';
import { startPreviewDemo } from '@/app/demo/actions';
import { getPassageBrowserClient } from '@/lib/supabase/browser';
import { humanSituationCategory, PREVIEW_RECEIVING_ORGANIZATION, situationGuidance, type SituationCategory } from '@/lib/urgent/situations';
import { submitUrgentIntake, type UrgentCommandState } from '../actions';
import { useStartWizard } from '../StartWizardContext';
import styles from '../Start.module.css';

const initialState: UrgentCommandState = { status: 'idle' };

type ExistingRequest = { id: string; status: string; wants_callback: boolean; coordinator_name: string; coordinator_phone: string | null; coordinator_email: string | null };
type Phase = 'checking' | 'needs-auth' | 'ready' | 'already-saved';

export function UrgentNextClient({ supabaseUrl, publishableKey }: { supabaseUrl: string; publishableKey: string }) {
  const router = useRouter();
  const { draft, hydrated } = useStartWizard();
  const [phase, setPhase] = useState<Phase>('checking');
  const [existing, setExisting] = useState<ExistingRequest | null>(null);
  const [requestId] = useState(() => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`));
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState('');
  const [state, formAction, pending] = useActionState(submitUrgentIntake, initialState);

  useEffect(() => {
    if (!hydrated) return;
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
  }, [draft.situationCategory, hydrated]);

  async function handleExistingPreviewSignIn(event: FormEvent) {
    event.preventDefault();
    setAuthError('');
    setAuthBusy(true);
    const client = getPassageBrowserClient(supabaseUrl, publishableKey);
    const result = await client.auth.signInWithPassword({ email: authEmail.trim(), password: authPassword });
    if (result.error || !result.data.session) {
      setAuthError('That Preview email and password did not match. Try again.');
      setAuthBusy(false);
      return;
    }
    setAuthBusy(false);
    setPhase('ready');
  }

  if (!hydrated || !draft.situationCategory) return null;
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

        <section className={styles.receivingHome} aria-labelledby="receiving-home-heading">
          <span>If you request a callback</span>
          <strong id="receiving-home-heading">{PREVIEW_RECEIVING_ORGANIZATION.name}</strong>
          <p>Only an active owner or director at Northstar can open the request and start a case. Saving privately keeps it hidden from Northstar.</p>
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
                  : `This is saved privately for ${existing.coordinator_name}. Northstar cannot see it.`}
            </p>
            <dl className={styles.receiptFacts}>
              <div><dt>Situation</dt><dd>{humanSituationCategory(draft.situationCategory)}</dd></div>
              {existing.wants_callback
                ? <div><dt>Sent to</dt><dd>{PREVIEW_RECEIVING_ORGANIZATION.name}</dd></div>
                : <div><dt>Visibility</dt><dd>Only you</dd></div>}
              <div><dt>Contact</dt><dd>{existing.coordinator_phone || existing.coordinator_email}</dd></div>
            </dl>
          </div>
        )}

        {phase === 'needs-auth' && (
          <div className={styles.authCard}>
            <h2>Keep your answers and continue</h2>
            <p>Use the family demo to finish this Preview with made-up details. You will return here, and nothing is saved until you choose what to do next.</p>
            <form action={startPreviewDemo}>
              <input name="persona" type="hidden" value="family" />
              <button className={styles.primaryButton} type="submit">Continue with the family demo</button>
            </form>
            <div className={styles.authExisting}>
              <h3>Already have a Preview account?</h3>
              <p>Sign in below to continue with that account. No email is sent.</p>
            </div>
            {authError && <p className={styles.alert} role="alert">{authError}</p>}
            <form onSubmit={handleExistingPreviewSignIn} noValidate>
              <div className={styles.field}>
                <label htmlFor="authEmail">Preview account email</label>
                <input autoComplete="email" id="authEmail" inputMode="email" onChange={(event) => setAuthEmail(event.target.value)} required type="email" value={authEmail} />
              </div>
              <div className={styles.field}>
                <label htmlFor="authPassword">Password</label>
                <input autoComplete="current-password" id="authPassword" minLength={8} onChange={(event) => setAuthPassword(event.target.value)} required type="password" value={authPassword} />
              </div>
              <button className={styles.secondaryButton} disabled={authBusy} type="submit">{authBusy ? 'Signing in…' : 'Sign in to an existing Preview account'}</button>
            </form>
            <p className={styles.authBoundary}>Preview only. Use made-up details. No messages or confirmation emails are sent.</p>
          </div>
        )}

        {phase === 'ready' && state.status !== 'saved' && (
          <form action={formAction} aria-busy={pending} noValidate>
            <input name="receivingOrganizationId" type="hidden" value={PREVIEW_RECEIVING_ORGANIZATION.id} />
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
              <button className={styles.secondaryButton} name="wantsCallback" type="submit" value="false">Save privately — don’t share with Northstar</button>
            </fieldset>
          </form>
        )}

        {state.status === 'saved' && (
          <div className={styles.receipt}>
            <div className={styles.receiptMark} aria-hidden="true">✓</div>
            <h1>Saved.</h1>
            <p>{state.receipt?.wantsCallback ? `Northstar Funeral Home received this request. An active owner or director can now take it on and reach out to ${draft.coordinatorName || 'your contact'}.` : 'Saved privately. Northstar cannot see this. Come back anytime if you decide to request a callback.'}</p>
          </div>
        )}
      </main>
    </div>
  );
}
