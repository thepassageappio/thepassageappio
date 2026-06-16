import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase as chromeSupabase } from '../lib/supabaseBrowser';
import { PassageLogo } from './PassageLogo';
import { PASSAGE_FONT, PASSAGE_TYPE, typeStyle } from '../lib/typography';
import { trackEvent } from '../lib/trackEvent';
import { PASSAGE_BRAND } from '../lib/brand';

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

const PUBLIC_LINKS = [
  ['Mission', '/mission'],
  ['Our story', '/story'],
  ['Resources', '/guides'],
  ['Blog', '/blog'],
  ['Pricing', '/pricing'],
  ['Contact', '/contact'],
  ['Funeral homes', '/funeral-home'],
  ['Care providers', '/care-providers'],
  ['Participants', '/participants'],
  ['Vendors', '/vendors'],
];

const DEFAULT_SYSTEM_ADMIN_EMAILS = ['steventurrisi@gmail.com'];

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function systemAdminEmails() {
  const configured = String(process.env.NEXT_PUBLIC_PASSAGE_ADMIN_EMAILS || '')
    .split(',')
    .map(normalizeEmail)
    .filter(Boolean);
  return Array.from(new Set([...DEFAULT_SYSTEM_ADMIN_EMAILS, ...configured]));
}

function isSystemAdminUser(user) {
  const email = normalizeEmail(user?.email);
  return !!email && systemAdminEmails().includes(email);
}

function isActivePath(current, href) {
  if (!current) return false;
  if (href === '/') return current === '/';
  return current === href || current.startsWith(href + '/');
}

export function SpineTrustStrip({ eyebrow = 'Shared record', title = 'What stays controlled', rows = [], compact = false }) {
  const safeRows = rows.slice(0, compact ? 3 : 4);
  return (
    <div style={{ background: CHROME_COLORS.card, border: '1px solid ' + CHROME_COLORS.border, borderRadius: compact ? 14 : 16, padding: compact ? 11 : 13, color: CHROME_COLORS.mid }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline', marginBottom: safeRows.length ? 8 : 0 }}>
        <div>
          <div style={{ ...PASSAGE_TYPE.meta, color: CHROME_COLORS.sage }}>{eyebrow}</div>
          <div style={{ ...PASSAGE_TYPE.h3, color: CHROME_COLORS.ink, fontSize: compact ? 14 : 16, marginTop: 2 }}>{title}</div>
        </div>
        <span style={{ ...PASSAGE_TYPE.badge, border: '1px solid #c8deca', background: CHROME_COLORS.sageFaint, color: CHROME_COLORS.sage, borderRadius: 999, padding: '4px 8px', fontSize: 10.5, whiteSpace: 'nowrap' }}>Proof-first</span>
      </div>
      {safeRows.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: 7 }}>
          {safeRows.map(([label, body]) => (
            <div key={label} style={{ background: CHROME_COLORS.sageFaint, border: '1px solid ' + CHROME_COLORS.border, borderRadius: 11, padding: '8px 9px' }}>
              <div style={{ ...PASSAGE_TYPE.meta, color: CHROME_COLORS.sage, fontSize: 10.5 }}>{label}</div>
              <div style={{ ...PASSAGE_TYPE.caption, color: CHROME_COLORS.mid, fontSize: compact ? 11.5 : 12, marginTop: 3 }}>{body}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function RoleActionStrip({ role = 'Your role', action = 'Take the next action', waiting = 'Passage keeps the waiting point visible.', proof = 'Your update is saved as proof.', privacy = 'You only see the work connected to your role.', compact = false }) {
  const rows = [
    ['Role', role],
    ['Next action', action],
    ['Waiting', waiting],
    ['Proof', proof],
  ];
  return (
    <div style={{ background: CHROME_COLORS.sageFaint, border: '1px solid #c8deca', borderRadius: compact ? 13 : 15, padding: compact ? 10 : 12, color: CHROME_COLORS.mid }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: 7 }}>
        {rows.map(([label, body]) => (
          <div key={label} style={{ background: CHROME_COLORS.card, border: '1px solid ' + CHROME_COLORS.border, borderRadius: 11, padding: compact ? '7px 8px' : '8px 9px' }}>
            <div style={{ ...PASSAGE_TYPE.meta, color: CHROME_COLORS.sage, fontSize: 10.5 }}>{label}</div>
            <div style={{ ...PASSAGE_TYPE.caption, color: CHROME_COLORS.ink, fontSize: compact ? 11.7 : 12.2, lineHeight: 1.35, marginTop: 3, fontWeight: 800 }}>{body}</div>
          </div>
        ))}
      </div>
      <div style={{ ...PASSAGE_TYPE.caption, color: CHROME_COLORS.mid, fontSize: compact ? 11.5 : 12, lineHeight: 1.42, marginTop: 8 }}>
        <strong style={{ color: CHROME_COLORS.ink }}>Access boundary:</strong> {privacy}
      </div>
    </div>
  );
}

export function StatusBadge({ status = 'draft', label, compact = false }) {
  const clean = String(status || '').toLowerCase();
  const state = clean === 'done' || clean === 'handled' || clean === 'completed'
    ? { text: 'Handled', icon: 'OK', color: CHROME_COLORS.sage, bg: CHROME_COLORS.sageFaint, border: '#c8deca' }
    : clean === 'acknowledged' || clean === 'accepted' || clean === 'viewed'
      ? { text: clean === 'viewed' ? 'Viewed' : 'Accepted', icon: 'Seen', color: CHROME_COLORS.sage, bg: CHROME_COLORS.sageFaint, border: '#c8deca' }
      : clean === 'sent' || clean === 'assigned' || clean === 'waiting' || clean === 'pending' || clean === 'requested'
        ? { text: clean === 'sent' ? 'Sent' : 'Waiting', icon: 'Wait', color: '#7a6a52', bg: '#f7f1e7', border: '#eadcc8' }
        : clean === 'blocked' || clean === 'failed' || clean === 'needs_review' || clean === 'declined'
          ? { text: clean === 'declined' ? 'Needs another option' : 'Needs help', icon: '!', color: '#9a6842', bg: '#fdf3ec', border: '#edd0bd' }
          : { text: 'Draft', icon: 'New', color: CHROME_COLORS.soft, bg: CHROME_COLORS.bg, border: CHROME_COLORS.border };
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      border: `1px solid ${state.border}`,
      background: state.bg,
      color: state.color,
      borderRadius: 999,
      padding: compact ? '3px 7px' : '5px 9px',
      fontSize: compact ? 10.5 : PASSAGE_TYPE.badge.fontSize,
      lineHeight: 1,
      fontWeight: 900,
      whiteSpace: 'nowrap',
    }}>
      <span aria-hidden="true" style={{ fontSize: compact ? 8.5 : 9, letterSpacing: '.04em' }}>{state.icon}</span>
      {label || state.text}
    </span>
  );
}

export function SiteHeader({ user, authReady = true, onSignIn, onSignOut, onDashboard, onHome }) {
  const router = useRouter();
  const path = router?.pathname || '';
  const dashboardHref = '/estate';
  const [hydrated, setHydrated] = useState(false);
  const controlled = typeof user !== 'undefined';
  const [localUser, setLocalUser] = useState(null);
  const [localAuthReady, setLocalAuthReady] = useState(controlled ? !!authReady : false);
  const currentUser = controlled ? user : localUser;
  const activePath = path || '';
  const estateActive = isActivePath(activePath, '/estate') || (hydrated && router?.query?.dashboard === '1');

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (controlled) {
      setLocalAuthReady(!!authReady);
      return undefined;
    }
    if (!chromeSupabase) {
      setLocalAuthReady(true);
      return undefined;
    }
    let active = true;
    function applySession(session) {
      if (!active) return;
      setLocalUser(prev => {
        const prevKey = prev ? `${prev.id || ''}:${prev.email || ''}` : '';
        const nextUser = session?.user || null;
        const nextKey = nextUser ? `${nextUser.id || ''}:${nextUser.email || ''}` : '';
        return prevKey === nextKey ? prev : nextUser;
      });
      setLocalAuthReady(true);
    }
    chromeSupabase.auth.getSession().then(({ data }) => applySession(data.session || null)).catch(() => {
      if (active) setLocalAuthReady(true);
    });
    const { data } = chromeSupabase.auth.onAuthStateChange((_event, session) => applySession(session || null));
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [controlled, authReady]);

  async function defaultSignIn() {
    if (typeof window === 'undefined') return;
    const next = window.location.pathname + window.location.search;
    window.location.assign('/login?next=' + encodeURIComponent(next));
  }

  async function defaultSignOut() {
    if (!chromeSupabase) return;
    await chromeSupabase.auth.signOut();
    setLocalUser(null);
  }

  function handleDashboardClick(event) {
    if (path !== '/' || typeof onDashboard !== 'function') return;
    event.preventDefault();
    if (typeof window !== 'undefined') window.history.pushState(null, '', dashboardHref);
    onDashboard();
  }

  function handleHomeClick(event) {
    if (path !== '/' || typeof onHome !== 'function') return;
    event.preventDefault();
    if (typeof window !== 'undefined') window.history.pushState(null, '', '/');
    onHome();
  }

  const signInHandler = onSignIn || defaultSignIn;
  const signOutHandler = onSignOut || defaultSignOut;
  const adminUser = isSystemAdminUser(currentUser);
  const systemRouteActive = isActivePath(activePath, '/system');
  const ownerConsoleActive = systemRouteActive;
  const partnerSurfaceActive = isActivePath(activePath, '/funeral-home') || isActivePath(activePath, '/vendors') || isActivePath(activePath, '/care-providers') || isActivePath(activePath, '/participating');
  const showFamilyDashboardLink = currentUser && !ownerConsoleActive && !partnerSurfaceActive;
  const navLinks = ownerConsoleActive ? [['System admin', '/system/admin']] : PUBLIC_LINKS;

  const navLink = {
    color: CHROME_COLORS.mid,
    textDecoration: 'none',
    borderRadius: 11,
    padding: '8px 10px',
    minHeight: 38,
    display: 'inline-flex',
    alignItems: 'center',
    ...PASSAGE_TYPE.nav,
  };
  const activeStyle = {
    background: CHROME_COLORS.sage,
    color: '#fff',
    textDecoration: 'none',
    borderRadius: 11,
    padding: '8px 11px',
    minHeight: 38,
    display: 'inline-flex',
    alignItems: 'center',
    fontWeight: 800,
    fontSize: PASSAGE_TYPE.nav.fontSize,
    lineHeight: PASSAGE_TYPE.nav.lineHeight,
  };
  const quietMyEstate = {
    color: CHROME_COLORS.mid,
    background: CHROME_COLORS.sageFaint,
    textDecoration: 'none',
    borderRadius: 11,
    padding: '8px 12px',
    minHeight: 38,
    display: 'inline-flex',
    alignItems: 'center',
    fontWeight: 800,
    fontSize: PASSAGE_TYPE.nav.fontSize,
    lineHeight: PASSAGE_TYPE.nav.lineHeight,
  };

  return (
    <nav style={{ width: 'min(1180px, 100%)', boxSizing: 'border-box', maxWidth: 1180, margin: '0 auto', padding: '10px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, fontFamily: PASSAGE_FONT.family }}>
      <style>{`
        @media (max-width: 720px) {
          .passage-nav-secondary { display: none !important; }
          .passage-nav-wrap { gap: 6px !important; font-size: 13px !important; min-width: 0 !important; max-width: calc(100vw - 128px) !important; }
          .passage-nav-wrap a, .passage-nav-wrap button { min-height: 40px !important; padding: 8px 9px !important; }
          .passage-nav-action-slot { width: auto !important; }
        }
      `}</style>
      <Link href="/" onClick={handleHomeClick} aria-label="Passage home" style={{ color: CHROME_COLORS.ink, textDecoration: 'none', flex: '0 0 auto' }}>
        <PassageLogo compact size={36} />
      </Link>
      <div className="passage-nav-wrap" style={{ display: 'flex', gap: 7, ...PASSAGE_TYPE.nav, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        {navLinks.map(([label, href]) => (
          <Link
            key={href}
            href={href}
            onClick={() => trackEvent(ownerConsoleActive ? 'system_admin_nav_clicked' : 'public_nav_clicked', { label, href })}
            className={['Mission', 'Our story', 'Resources', 'Pricing', 'Contact', 'Vendors'].includes(label) ? 'passage-nav-secondary' : ''}
            style={isActivePath(activePath, href) ? activeStyle : navLink}
          >
            {label}
          </Link>
        ))}
        {showFamilyDashboardLink && <Link href={dashboardHref} onClick={(event) => { trackEvent('my_estate_nav_clicked', { href: dashboardHref }); handleDashboardClick(event); }} style={estateActive ? activeStyle : quietMyEstate}>My estate</Link>}
        <span className="passage-nav-action-slot" style={{ width: 96, display: 'inline-flex', justifyContent: 'flex-end' }}>
          {!localAuthReady && <span aria-hidden="true" style={{ width: 92, minHeight: 38, display: 'inline-flex' }} />}
          {localAuthReady && currentUser && (
            <button onClick={signOutHandler} style={{ width: 92, minHeight: 38, border: '1px solid ' + CHROME_COLORS.border, background: CHROME_COLORS.card, borderRadius: 11, padding: '7px 0', ...typeStyle('button', { fontSize: 14, fontWeight: 800 }), cursor: 'pointer' }}>Sign out</button>
          )}
          {localAuthReady && !currentUser && (
            <button onClick={signInHandler} style={{ width: 92, minHeight: 38, border: '1px solid ' + CHROME_COLORS.border, background: CHROME_COLORS.card, borderRadius: 11, padding: '7px 0', ...typeStyle('button', { fontSize: 14, fontWeight: 800 }), cursor: 'pointer' }}>Sign in</button>
          )}
        </span>
      </div>
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer style={{ maxWidth: 1180, margin: '0 auto', padding: '10px 24px 12px', borderTop: '1px solid ' + CHROME_COLORS.border, display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', ...PASSAGE_TYPE.caption, color: CHROME_COLORS.soft, fontFamily: PASSAGE_FONT.family }}>
      <div>Passage coordinates life-to-death transitions with care.</div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <Link href="/faq" style={{ color: CHROME_COLORS.soft, textDecoration: 'none' }}>FAQ</Link>
        <Link href="/trust" style={{ color: CHROME_COLORS.soft, textDecoration: 'none' }}>Trust</Link>
        <Link href="/privacy" style={{ color: CHROME_COLORS.soft, textDecoration: 'none' }}>Privacy</Link>
        <Link href="/terms" style={{ color: CHROME_COLORS.soft, textDecoration: 'none' }}>Terms</Link>
        <a
          href={`mailto:${PASSAGE_BRAND.supportEmail}`}
          onClick={() => trackEvent('footer_email_clicked', { email: PASSAGE_BRAND.supportEmail })}
          style={{ color: CHROME_COLORS.soft, textDecoration: 'none' }}
        >
          {PASSAGE_BRAND.supportEmail}
        </a>
      </div>
    </footer>
  );
}
