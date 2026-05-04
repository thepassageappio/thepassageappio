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
  ['Guides', '/content'],
  ['Pricing', '/pricing'],
  ['Contact', '/contact'],
  ['Participant', '/participating'],
  ['Funeral homes', '/funeral-home'],
];

const navLink = {
  color: CHROME_COLORS.mid,
  textDecoration: 'none',
  borderRadius: 12,
  padding: '10px 12px',
  minHeight: 44,
  display: 'inline-flex',
  alignItems: 'center',
};

function isActivePath(current, href) {
  if (!current) return false;
  if (href === '/') return current === '/';
  return current === href || current.startsWith(href + '/');
}

export function SiteHeader({ user, onSignIn, onSignOut }) {
  const router = useRouter();
  const path = router?.pathname || '';
  const dashboardHref = '/?dashboard=1';
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
    borderRadius: 12,
    padding: '10px 13px',
    minHeight: 44,
    display: 'inline-flex',
    alignItems: 'center',
    fontWeight: 800,
  };
  const quietMyEstate = {
    color: CHROME_COLORS.mid,
    background: CHROME_COLORS.sageFaint,
    textDecoration: 'none',
    borderRadius: 12,
    padding: '10px 14px',
    minHeight: 44,
    display: 'inline-flex',
    alignItems: 'center',
    fontWeight: 800,
  };
  return (
    <nav style={{ maxWidth: 1180, margin: '0 auto', padding: '14px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 18 }}>
      <Link href="/" style={{ color: CHROME_COLORS.ink, textDecoration: 'none', fontSize: 26, fontWeight: 700 }}>Passage</Link>
      <div style={{ display: 'flex', gap: 8, fontSize: 14, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        {LINKS.map(([label, href]) => <Link key={href} href={href} style={isActivePath(path, href) ? activeStyle : navLink}>{label}</Link>)}
        <Link href={dashboardHref} style={(isActivePath(path, '/') || isActivePath(path, '/estate')) ? activeStyle : quietMyEstate}>My estate</Link>
        <span style={{ width: 104, display: 'inline-flex', justifyContent: 'flex-end' }}>
          {currentUser && (
            <button onClick={signOutHandler} style={{ width: 100, minHeight: 44, border: '1px solid ' + CHROME_COLORS.border, background: CHROME_COLORS.card, borderRadius: 12, padding: '8px 0', fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' }}>Sign out</button>
          )}
          {!currentUser && (
            <button onClick={signInHandler} style={{ width: 100, minHeight: 44, border: '1px solid ' + CHROME_COLORS.border, background: CHROME_COLORS.card, borderRadius: 12, padding: '8px 0', fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' }}>Sign in</button>
          )}
        </span>
      </div>
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer style={{ maxWidth: 1180, margin: '0 auto', padding: '22px 28px 36px', borderTop: '1px solid ' + CHROME_COLORS.border, display: 'flex', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap', fontSize: 13, color: CHROME_COLORS.soft }}>
      <div>Passage coordinates life-to-death transitions with care.</div>
      <Link href="/contact" style={{ color: CHROME_COLORS.soft, textDecoration: 'none' }}>thepassageappio@gmail.com</Link>
    </footer>
  );
}
