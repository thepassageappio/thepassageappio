import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseBrowser';

const C = {
  bg: '#f6f3ee',
  card: '#fffdf9',
  ink: '#1a1916',
  mid: '#6a6560',
  soft: '#a09890',
  border: '#e4ddd4',
  sage: '#6b8f71',
  sageFaint: '#f0f5f1',
  rose: '#c47a7a',
  roseFaint: '#fdf3f3',
};

function safeNextFromSearch(search) {
  const params = new URLSearchParams(search || '');
  const requested = params.get('next') || '';
  return requested.startsWith('/') && !requested.startsWith('//') ? requested : '';
}

function safeNextFromValue(value) {
  const requested = typeof value === 'string' ? value : '';
  return requested.startsWith('/') && !requested.startsWith('//') ? requested : '';
}

export default function GoogleAuthStartPage({ initialNext = '' }) {
  const [error, setError] = useState('');
  const [started, setStarted] = useState(false);
  const next = useMemo(() => {
    if (initialNext) return safeNextFromValue(initialNext);
    return typeof window === 'undefined' ? '' : safeNextFromSearch(window.location.search);
  }, [initialNext]);

  useEffect(() => {
    let active = true;
    async function startGoogle() {
      if (!supabase?.auth) {
        if (active) setError('Google sign-in is not configured in this environment. Use an email sign-in link or contact the Passage owner inbox.');
        return;
      }
      if (typeof window === 'undefined') return;
      setStarted(true);
      const redirectTo = window.location.origin + '/login' + (next ? '?next=' + encodeURIComponent(next) : '');
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });
      if (active && signInError) {
        setError(signInError.message || 'Google sign-in could not start. Try the email sign-in link instead.');
        setStarted(false);
      }
    }
    startGoogle();
    return () => { active = false; };
  }, [next]);

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: 'Georgia,serif', display: 'grid', placeItems: 'center', padding: 24 }}>
      <section style={{ width: 'min(520px, 100%)', background: C.card, border: '1px solid ' + C.border, borderRadius: 18, padding: 22, boxShadow: '0 18px 50px rgba(55,45,35,.08)' }}>
        <div style={{ color: C.sage, fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>Passage sign-in</div>
        <h1 style={{ fontSize: 34, lineHeight: 1.05, margin: '8px 0 10px', fontWeight: 400 }}>{error ? 'Google sign-in needs attention.' : 'Opening Google sign-in...'}</h1>
        <p style={{ color: C.mid, fontSize: 14.5, lineHeight: 1.6, margin: 0 }}>
          {error || 'Passage is opening Google securely. After sign-in, you will return to the correct workspace.'}
        </p>
        {started && !error && <div style={{ color: C.soft, fontSize: 12.5, marginTop: 12 }}>If nothing opens in a few seconds, use the button below.</div>}
        {error && <div style={{ background: C.roseFaint, border: '1px solid ' + C.rose + '33', color: C.rose, borderRadius: 12, padding: '10px 11px', fontSize: 13, lineHeight: 1.45, marginTop: 12 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
          <button onClick={() => window.location.reload()} style={{ border: 'none', background: C.sage, color: '#fff', borderRadius: 12, padding: '11px 14px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>Try Google again</button>
          <Link href={'/login' + (next ? '?next=' + encodeURIComponent(next) : '')} style={{ border: '1px solid ' + C.border, background: C.card, color: C.mid, borderRadius: 12, padding: '11px 14px', fontWeight: 800, textDecoration: 'none' }}>Use login page</Link>
        </div>
      </section>
    </main>
  );
}

export async function getServerSideProps({ query }) {
  return {
    props: {
      initialNext: safeNextFromValue(query?.next),
    },
  };
}
