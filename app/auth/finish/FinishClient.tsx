'use client';

import { useEffect, useState } from 'react';
import { getPassageBrowserClient } from '@/lib/supabase/browser';
import styles from '../../login/Auth.module.css';

// CORRECTED 2026-08-20: the original assumption here was wrong and never
// actually verified live -- @supabase/ssr's createBrowserClient (unlike the
// raw supabase-js client) does NOT auto-detect a session from a URL hash
// fragment; it's built around the cookie/PKCE code-exchange flow used by
// /auth/callback, not the implicit #access_token=... flow admin-generated
// links deliver. Confirmed by direct testing: a real, valid, unexpired
// access_token in the hash still left getSession() empty. Real fix:
// hand-parse the fragment ourselves and hand the tokens to setSession(),
// which @supabase/ssr's client does support and correctly persists to
// cookies regardless of how the tokens were obtained.
export function FinishClient({ next, supabaseUrl, publishableKey }: { next: string; supabaseUrl: string; publishableKey: string }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const client = getPassageBrowserClient(supabaseUrl, publishableKey);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');

    const establish = accessToken && refreshToken
      ? client.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      : client.auth.getSession();

    establish.then((result: { data: { session: unknown } }) => {
      if (cancelled) return;
      if (result.data.session) {
        // A full navigation, not client-side routing: the next request must
        // carry the session cookie @supabase/ssr's browser client just wrote,
        // which a server component's own auth check depends on.
        window.location.replace(next);
      } else {
        setFailed(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [next, supabaseUrl, publishableKey]);

  if (!failed) return <p className={styles.notice} role="status" aria-live="polite">Confirming your secure session…</p>;
  return (
    <div className={styles.unavailable} role="alert">
      <strong>We couldn’t verify that invitation link.</strong>
      <p>It may have expired or already been used. Request a new one, or sign in with the email your invitation was sent to.</p>
      <a className={styles.textLink} href={`/login?next=${encodeURIComponent(next)}`}>Go to sign-in</a>
    </div>
  );
}
