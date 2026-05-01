import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const chromeSupabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export const CHROME_COLORS = {
  bg: '#f6f3ee',
  card: '#ffffff',
  ink: '#1a1916',
  mid: '#6a6560',
  soft: '#a09890',
  border: '#e4ddd4',
  sage: '#6b8f71',
  sageFaint: '#f0f5f1',
};

const LINKS = [
  ['Mission', '/mission'],
  ['Resources', '/content'],
  ['Pricing', '/pricing'],
  ['Contact', '/contact'],
  ['Participating', '/participating'],
  ['Funeral homes', '/funeral-home'],
];

const navLink = { color: CHROME_COLORS.mid, textDecoration: 'none', borderRadius: 10, padding: '7px 10px' };

function isActivePath(current, href) {
  if (!current) return false;
  if (href === '/') return current === '/';
  return current === href || current.startsWith(href + '/');
}

export function SiteHeader({ user, onSignIn, onSignOut }) {
  const router = useRouter();
  const path = router?.pathname || '';
  const controlled = typeof user !== 'undefined';
  const [localUser, setLocalUser] = useState(null);
  const currentUser = controlled ? user : localUser;

  useEffect(() => {
    if (controlled || !chromeSupabase) return undefined;
    chromeSupabase.auth.getSession().then(({ data }) => setLocalUser(data.session?.user || null));
    const { data } = chromeSupabase.auth.onAuthStateChange((_event, session) => setLocalUser(session?.user || null));
    return () => data.subscription.unsubscribe();
  }, [controlled]);

  async function defaultSignIn() {
    if (!chromeSupabase || typeof window === 'undefined') return;
    await chromeSupabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.href } });
  }

  async function defaultSignOut() {
    if (!chromeSupabase) return;
    await chromeSupabase.auth.signOut();
    setLocalUser(null);
  }

  const signInHandler = onSignIn || defaultSignIn;
  const signOutHandler = onSignOut || defaultSignOut;
  const activeStyle = {
    background: CHROME_COLORS.sage,
    color: '#fff',
    textDecoration: 'none',
    borderRadius: 10,
    padding: '7px 11px',
    fontWeight: 800,
  };
  const quietMyEstate = {
    color: CHROME_COLORS.mid,
    background: CHROME_COLORS.sageFaint,
    textDecoration: 'none',
    borderRadius: 10,
    padding: '8px 14px',
    fontWeight: 800,
  };
  return (
    <nav style={{ maxWidth: 1080, margin: '0 auto', padding: '9px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14 }}>
      <Link href="/" style={{ color: CHROME_COLORS.ink, textDecoration: 'none', fontSize: 22, fontWeight: 700 }}>Passage</Link>
      <div style={{ display: 'flex', gap: 6, fontSize: 13, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        {LINKS.map(([label, href]) => <Link key={href} href={href} style={isActivePath(path, href) ? activeStyle : navLink}>{label}</Link>)}
        <Link href="/" style={isActivePath(path, '/') ? activeStyle : quietMyEstate}>My estate</Link>
        <span style={{ width: 92, display: 'inline-flex', justifyContent: 'flex-end' }}>
          {currentUser && (
            <button onClick={signOutHandler} style={{ width: 88, border: '1px solid ' + CHROME_COLORS.border, background: CHROME_COLORS.card, borderRadius: 10, padding: '8px 0', fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' }}>Sign out</button>
          )}
          {!currentUser && (
            <button onClick={signInHandler} style={{ width: 88, border: '1px solid ' + CHROME_COLORS.border, background: CHROME_COLORS.card, borderRadius: 10, padding: '8px 0', fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' }}>Sign in</button>
          )}
        </span>
      </div>
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer style={{ maxWidth: 1080, margin: '0 auto', padding: '14px 22px 28px', borderTop: '1px solid ' + CHROME_COLORS.border, display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', fontSize: 12, color: CHROME_COLORS.soft }}>
      <div>Passage coordinates life-to-death transitions with care.</div>
      <Link href="/contact" style={{ color: CHROME_COLORS.soft, textDecoration: 'none' }}>thepassageappio@gmail.com</Link>
    </footer>
  );
}
