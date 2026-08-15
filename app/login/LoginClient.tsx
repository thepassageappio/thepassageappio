'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { validInvitationToken } from '@/lib/auth/invitations';
import { getPassageBrowserClient } from '@/lib/supabase/browser';
import styles from './Auth.module.css';

type LoginClientProps = { next: string; supabaseUrl: string; publishableKey: string; googleEnabled: boolean; emailEnabled: boolean; passwordEnabled: boolean };

export function LoginClient({ next, supabaseUrl, publishableKey, googleEnabled, emailEnabled, passwordEnabled }: LoginClientProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  async function continueWithPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setStatus('');
    if (!passwordEnabled) {
      setError('Password sign-in is not available in this environment.');
      return;
    }
    setBusy(true);
    const client = getPassageBrowserClient(supabaseUrl, publishableKey);
    const result = await client.auth.signInWithPassword({ email: email.trim(), password });
    if (result.error || !result.data.session) {
      setError('Passage could not verify that email and password. No workspace access was granted.');
      setBusy(false);
      return;
    }
    router.replace(next);
    router.refresh();
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
      {(googleEnabled || emailEnabled) ? (
        <>
          {googleEnabled && <button className={styles.primary} disabled={busy} onClick={continueWithGoogle} type="button">{busy ? 'Opening Google…' : 'Continue with Google'}</button>}
          {emailEnabled && <form className={styles.inviteForm} onSubmit={continueWithEmail}>
            <label htmlFor="sign-in-email">Invited email address</label>
            <input autoComplete="email" id="sign-in-email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
            <button className={styles.secondary} disabled={busy} type="submit">Request secure email link</button>
          </form>}
          <p className={styles.helper}>Passage does not finish sign-in until the account is verified by the server.</p>
          <div className={styles.divider}><span>or open an existing invitation</span></div>
        </>
      ) : (
        <p className={styles.notice} role="status">Email delivery and Google sign-in are not available here. Use the secure account credentials provided by your administrator.</p>
      )}
      {passwordEnabled && <form className={styles.inviteForm} onSubmit={continueWithPassword}>
        <label htmlFor="password-sign-in-email">Work email</label>
        <input autoComplete="username" id="password-sign-in-email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
        <label htmlFor="password-sign-in-password">Password</label>
        <input autoComplete="current-password" id="password-sign-in-password" onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
        <button className={styles.primary} disabled={busy} type="submit">{busy ? 'Verifying account…' : 'Sign in securely'}</button>
      </form>}
      {passwordEnabled && <div className={styles.divider}><span>or open an invitation first</span></div>}
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
