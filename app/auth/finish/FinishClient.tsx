'use client';

import { useEffect, useState } from 'react';
import { getPassageBrowserClient } from '@/lib/supabase/browser';
import styles from '../../login/Auth.module.css';

// getSession() awaits the browser client's own initial-session promise,
// which is where detectSessionInUrl's hash-fragment parsing happens -- so
// this reliably waits for that to finish rather than racing it, without
// needing to hand-parse window.location.hash ourselves.
export function FinishClient({ next, supabaseUrl, publishableKey }: { next: string; supabaseUrl: string; publishableKey: string }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const client = getPassageBrowserClient(supabaseUrl, publishableKey);
    client.auth.getSession().then((result: Awaited<ReturnType<typeof client.auth.getSession>>) => {
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
