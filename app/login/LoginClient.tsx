
'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { validInvitationToken } from '@/lib/auth/invitations';
import { getPassageBrowserClient } from '@/lib/supabase/browser';
import styles from './Auth.module.css';

type LoginClientProps = { next: string; supabaseUrl: string; publishableKey: string; googleEnabled: boolean; emailEnabled: boolean };

export function LoginClient({ next, supabaseUrl, publishableKey, googleEnabled, emailEnabled }: LoginClientProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  async function continueWithGoogle() {
    setBusy(true);
    setError('');
    setStatus('');
    if (!googleEnabled) {
      setError('Google sign-in is not enabled in this environment. Your invitation has not been changed.');
      setBusy(false);
      return;
    }
    const callback = new URL('/auth/callback', window.location.origin);
    callback.searchParams.set('next', next);
    const client = getPassageBrowserClient(supabaseUrl, publishableKey);
    const result = await client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: callback.toString() } });
    if (result.error) {
      setError('Google sign-in is unavailable right now. Your invitation has not been changed.');
      setBusy(false);
    }
  }

  async function continueWithEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setStatus('');
    if (!emailEnabled) {
      setError('Email sign-in delivery is not enabled in this environment. Use the secure invitation link or Google when available.');
      return;
    }
    setBusy(true);
    const callback = new URL('/auth/callback', window.location.origin);
    callback.searchParams.set('next', next);
    const inviteToken = next.startsWith('/invite/') ? decodeURIComponent(next.slice('/invite/'.length)) : '';
    const invitationBoundCreation = validInvitationToken(inviteToken);
    const client = getPassageBrowserClient(supabaseUrl, publishableKey);
    const result = await client.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: callback.toString(), shouldCreateUser: invitationBoundCreation } });
    if (result.error) setError('Passage could not request an email sign-in link. No account access was granted.');
    else setStatus('Request received. If email delivery is available for this invited address, use the link to return and finish server verification.');
    setBusy(false);
  }

  function openInvitation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = token.trim();
    if (!validInvitationToken(normalized)) {
      setError('Use the complete invitation code from your email link.');
      return;
    }
    router.push(`/invite/${encodeURIComponent(normalized)}`);
  }

  return (
    <div className={styles.actions}>
      <button className={styles.primary} disabled={busy || !googleEnabled} onClick={continueWithGoogle} type="button">{googleEnabled ? (busy ? 'Opening Googleâ€¦' : 'Continue with Google') : 'Google sign-in unavailable'}</button>
      <p className={styles.helper}>Passage does not finish sign-in until the account is verified by the server.</p>
      <div className={styles.divider}><span>or continue with invited email</span></div>
      <form className={styles.inviteForm} onSubmit={continueWithEmail}>
        <label htmlFor="sign-in-email">Invited email address</label>
        <input autoComplete="email" id="sign-in-email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
        <button className={styles.secondary} disabled={busy || !emailEnabled} type="submit">{emailEnabled ? 'Request secure email link' : 'Email sign-in unavailable'}</button>
      </form>
      <div className={styles.divider}><span>or open an existing invitation</span></div>
      <form className={styles.inviteForm} onSubmit={openInvitation}>
        <label htmlFor="invitation-code">Invitation code</label>
        <input autoComplete="off" id="invitation-code" onChange={(event) => setToken(event.target.value)} placeholder="Paste the code from your secure link" value={token} />
        <button className={styles.secondary} type="submit">Review invitation</button>
      </form>
      {error && <p className={styles.alert} role="alert">{error}</p>}
      {status && <p className={styles.notice} role="status">{status}</p>}
    </div>
  );
}

