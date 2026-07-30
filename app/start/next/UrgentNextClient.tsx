'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useRef, useState, type FormEvent } from 'react';
import { getPassageBrowserClient } from '@/lib/supabase/browser';
import { humanSituationCategory, PREVIEW_RECEIVING_ORGANIZATION, situationGuidance, type SituationCategory } from '@/lib/urgent/situations';
import { submitUrgentIntake, type UrgentCommandState } from '../actions';
import { useStartWizard } from '../StartWizardContext';
import styles from '../Start.module.css';

const initialState: UrgentCommandState = { status: 'idle' };

type ExistingRequest = {
  id: string;
  status: string;
  wants_callback: boolean;
  coordinator_name: string;
  coordinator_phone: string | null;
  coordinator_email: string | null;
  occurredAt: string | null;
};
type Phase = 'checking' | 'needs-auth' | 'ready' | 'already-saved' | 'recovery-error';

function formatSavedTime(value: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'long',
      timeZone: 'America/Los_Angeles',
    }).format(new Date(value));
  } catch {
    return 'Saved time could not be displayed. Reload to check.';
  }
}

export function UrgentNextClient({ supabaseUrl, publishableKey }: { supabaseUrl: string; publishableKey: string }) {
  const router = useRouter();
  const { draft, hydrated } = useStartWizard();
  const [phase, setPhase] = useState<Phase>('checking');
  const [existing, setExisting] = useState<ExistingRequest | null>(null);
  const [authMode, setAuthMode] = useState<'create' | 'signin'>('create');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState('');
  const [state, formAction, pending] = useActionState(submitUrgentIntake, initialState);
  const actionError = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.status !== 'idle' && state.status !== 'saved') actionError.current?.focus();
  }, [state.status]);

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
      const requestResult = await client
        .from('urgent_intake_requests')
        .select('id, status, wants_callback, coordinator_name, coordinator_phone, coordinator_email')
        .eq('creation_request_id', draft.requestId)
        .eq('requester_user_id', userResult.user.id)
        .maybeSingle();
      if (cancelled) return;
      if (requestResult.error) {
        setPhase('recovery-error');
        return;
      }
      if (!requestResult.data) {
        setPhase('ready');
        return;
      }
      const eventResult = await client
        .from('urgent_intake_events')
        .select('occurred_at')
        .eq('urgent_intake_request_id', requestResult.data.id)
        .eq('idempotency_key', `urgent_intake_create:${draft.requestId}`)
        .maybeSingle();
      if (cancelled) return;
      setExisting({
        ...(requestResult.data as Omit<ExistingRequest, 'occurredAt'>),
        occurredAt: eventResult.data?.occurred_at ?? null,
      });
      setPhase('already-saved');
    }
    check();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.requestId, draft.situationCategory, hydrated, publishableKey, router, supabaseUrl]);

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
          <p>Only an active owner or director at Northstar can open the request. Saving privately keeps it hidden from Northstar.</p>
        </section>

        {phase === 'checking' && <p className={styles.lede}>One moment…</p>}

        {phase === 'recovery-error' && (
          <div className={styles.alert} role="alert">
            <p>Passage could not check whether this exact request was already saved. Nothing new was sent.</p>
            <button className={styles.recoveryButton} onClick={() => window.location.reload()} type="button">Reload and check</button>
          </div>
        )}

        {phase === 'already-saved' && existing && (
          <div className={styles.receipt}>
            <div className={styles.receiptMark} aria-hidden="true">✓</div>
            <h2>Already saved.</h2>
            <p>
              {existing.status === 'claimed' || existing.status === 'case_created'
                ? 'An authorized director at Northstar Funeral Home is helping with this request.'
                : existing.wants_callback
                  ? `Northstar Funeral Home has this request. An authorized director will contact ${existing.coordinator_name} using the details provided.`
                  : 'Saved privately. Northstar Funeral Home cannot see it.'}
            </p>
            <dl className={styles.receiptFacts}>
              <div><dt>Situation</dt><dd>{humanSituationCategory(draft.situationCategory)}</dd></div>
              {existing.wants_callback
                ? <div><dt>Sent to</dt><dd>{PREVIEW_RECEIVING_ORGANIZATION.name}</dd></div>
                : <div><dt>Visibility</dt><dd>Only you</dd></div>}
              {existing.wants_callback && <div><dt>Visibility</dt><dd>You and an active Northstar owner or director</dd></div>}
              <div><dt>Contact</dt><dd>{existing.coordinator_phone || existing.coordinator_email}</dd></div>
              <div>
                <dt>Saved</dt>
                <dd>
                  {existing.occurredAt
                    ? <time dateTime={existing.occurredAt}>{formatSavedTime(existing.occurredAt)}</time>
                    : 'Saved time could not be confirmed. Reload before trying again.'}
                </dd>
              </div>
            </dl>
            {!existing.occurredAt && <button className={styles.recoveryButton} onClick={() => window.location.reload()} type="button">Reload and check</button>}
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
            <input name="receivingOrganizationId" type="hidden" value={PREVIEW_RECEIVING_ORGANIZATION.id} />
            <input name="situationCategory" type="hidden" value={draft.situationCategory} />
            <input name="personName" type="hidden" value={draft.personName} />
            <input name="personLocation" type="hidden" value={draft.personLocation} />
            <input name="personTiming" type="hidden" value={draft.personTiming} />
            <input name="coordinatorName" type="hidden" value={draft.coordinatorName} />
            <input name="coordinatorPhone" type="hidden" value={draft.coordinatorPhone} />
            <input name="coordinatorEmail" type="hidden" value={draft.coordinatorEmail} />
            <input name="callbackNotes" type="hidden" value={draft.callbackNotes} />
            <input name="requestId" type="hidden" value={draft.requestId} />
            {state.status !== 'idle' && state.message && (
              <div className={styles.alert} ref={actionError} role="alert" tabIndex={-1}>
                <p>{state.message}</p>
                {(state.status === 'unavailable' || state.status === 'conflict') && (
                  <button className={styles.recoveryButton} onClick={() => window.location.reload()} type="button">Reload and check</button>
                )}
              </div>
            )}
            <fieldset disabled={pending} style={{ border: 'none', padding: 0, margin: 0 }}>
              <button className={styles.primaryButton} name="wantsCallback" type="submit" value="true">{pending ? 'Saving…' : 'Request a callback from Northstar Funeral Home'}</button>
              <button className={styles.secondaryButton} name="wantsCallback" type="submit" value="false">Save privately — don&apos;t share with Northstar</button>
            </fieldset>
          </form>
        )}

        {state.status === 'saved' && (
          <div className={styles.receipt}>
            <div className={styles.receiptMark} aria-hidden="true">✓</div>
            <h2>Saved.</h2>
            <p>
              {state.receipt?.wantsCallback
                ? `Northstar Funeral Home has this request. An authorized director will contact ${draft.coordinatorName || 'your contact'} using the details provided.`
                : 'Saved privately. Northstar Funeral Home cannot see it. Come back anytime if you decide to request a callback.'}
            </p>
            {state.receipt && (
              <dl className={styles.receiptFacts}>
                {state.receipt.wantsCallback
                  ? <div><dt>Sent to</dt><dd>{PREVIEW_RECEIVING_ORGANIZATION.name}</dd></div>
                  : <div><dt>Visibility</dt><dd>Only you</dd></div>}
                {state.receipt.wantsCallback && <div><dt>Visibility</dt><dd>You and an active Northstar owner or director</dd></div>}
                <div><dt>Contact</dt><dd>{draft.coordinatorPhone || draft.coordinatorEmail}</dd></div>
                <div><dt>Saved</dt><dd><time dateTime={state.receipt.occurredAt}>{formatSavedTime(state.receipt.occurredAt)}</time></dd></div>
              </dl>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
