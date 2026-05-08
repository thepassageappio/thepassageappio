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
  ['Guides', '/guides'],
  ['Pricing', '/pricing'],
  ['Contact', '/contact'],
  ['My tasks', '/participating'],
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

const DEFAULT_SYSTEM_ADMIN_EMAILS = ['thepassageappio@gmail.com', 'steventurrisi@gmail.com'];

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

const DEMO_TOUR_STEPS = [
  {
    id: 'overview',
    title: 'Start with the promise',
    body: 'Open with the funeral-home problem: fewer repeated calls, visible proof, and data that can leave Passage any time.',
    href: '/system/demo?demoTour=funeral-home&demoStep=team',
    cta: 'Next: team setup',
  },
  {
    id: 'team',
    title: 'Show staff setup',
    body: 'Explain directors, arrangers, coordinators, and location admins. This is where a home sees Passage as operational, not consumer-only.',
    href: '/system/demo?demoTour=funeral-home&demoStep=case',
    cta: 'Next: create a case',
  },
  {
    id: 'case',
    title: 'Create the family case',
    body: 'Walk through at-need versus pre-need. Keep it simple: add the family contact, then Passage creates the command center.',
    href: '/system/demo?demoTour=funeral-home&demoStep=dashboard',
    cta: 'Next: dashboard value',
  },
  {
    id: 'dashboard',
    title: 'Director dashboard',
    body: 'Point to active cases, waiting items, calls avoided, and the next partner work. This is the B2B value in under ten seconds.',
    href: '/system/demo?demoTour=funeral-home&demoStep=task',
    cta: 'Next: task spine',
  },
  {
    id: 'task',
    title: 'Move one task',
    body: 'Show one task at a time: what Passage handles, what staff handles, and how proof is recorded. No mystery status changes.',
    href: '/system/demo?demoTour=funeral-home&demoStep=participant',
    cta: 'Next: participant view',
  },
  {
    id: 'participant',
    title: 'Participant acts',
    body: 'Show the helper view: one assigned responsibility, clear accept/waiting/handled buttons, and an update back to the coordinator.',
    href: '/system/demo?demoTour=funeral-home&demoStep=chat',
    cta: 'Next: communication',
  },
  {
    id: 'chat',
    title: 'Coordinate the people',
    body: 'Use the mock chats to show family, cemetery, clergy, and funeral-home staff in one tracked coordination trail.',
    href: '/system/demo?demoTour=funeral-home&demoStep=vendor',
    cta: 'Next: vendor loop',
  },
  {
    id: 'vendor',
    title: 'Local help stays task-native',
    body: 'Vendors appear only when useful. The request has viewed, accepted, in-progress, and completed states inside Passage.',
    href: '/system/demo?demoTour=funeral-home&demoStep=export',
    cta: 'Next: close the demo',
  },
  {
    id: 'export',
    title: 'Close with adoption trust',
    body: 'Show CSV export, reporting, and the line that matters: Passage sits on top of their system without trapping data.',
    href: '/system/demo',
    cta: 'End walkthrough',
  },
];

function demoStepFor(path, queryStep) {
  const requested = String(queryStep || '');
  if (DEMO_TOUR_STEPS.some(step => step.id === requested)) return requested;
  if (path === '/funeral-home/dashboard') return 'dashboard';
  if (path === '/estate') return 'task';
  if (path === '/participating') return 'participant';
  if (path === '/vendors/request') return 'vendor';
  if (path === '/vendors/onboard' || path === '/vendors/admin') return 'vendor';
  return 'overview';
}

function isActivePath(current, href) {
  if (!current) return false;
  if (href === '/') return current === '/';
  return current === href || current.startsWith(href + '/');
}

export function SiteHeader({ user, onSignIn, onSignOut, onDashboard, onHome }) {
  const router = useRouter();
  const path = router?.pathname || '';
  const dashboardHref = '/?dashboard=1';
  const estateActive = isActivePath(path, '/estate') || router?.query?.dashboard === '1';
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

  const showSystemAdminLinks = isSystemAdminUser(currentUser);
  const demoTourActive = router?.query?.demoTour === 'funeral-home' && showSystemAdminLinks;
  const activeDemoStep = demoTourActive ? DEMO_TOUR_STEPS.find(step => step.id === demoStepFor(path, router?.query?.demoStep)) : null;
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
      <style>{`
        @media (max-width: 720px) {
          .passage-nav-secondary { display: none !important; }
          .passage-nav-wrap { gap: 6px !important; font-size: 13px !important; }
          .passage-nav-wrap a, .passage-nav-wrap button { min-height: 40px !important; padding: 8px 9px !important; }
        }
      `}</style>
      <Link href="/" onClick={handleHomeClick} style={{ color: CHROME_COLORS.ink, textDecoration: 'none', fontSize: 26, fontWeight: 700 }}>Passage</Link>
      <div className="passage-nav-wrap" style={{ display: 'flex', gap: 8, fontSize: 14, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        {LINKS.map(([label, href]) => <Link key={href} href={href} className={['Mission', 'Pricing', 'Contact'].includes(label) ? 'passage-nav-secondary' : ''} style={isActivePath(path, href) ? activeStyle : navLink}>{label}</Link>)}
        {showSystemAdminLinks && (
          <Link href="/system/admin" style={(isActivePath(path, '/system') || isActivePath(path, '/vendors/admin')) ? activeStyle : navLink}>System admin</Link>
        )}
        <Link href={dashboardHref} onClick={handleDashboardClick} style={estateActive ? activeStyle : quietMyEstate}>My estate</Link>
        <span style={{ width: 104, display: 'inline-flex', justifyContent: 'flex-end' }}>
          {currentUser && (
            <button onClick={signOutHandler} style={{ width: 100, minHeight: 44, border: '1px solid ' + CHROME_COLORS.border, background: CHROME_COLORS.card, borderRadius: 12, padding: '8px 0', fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' }}>Sign out</button>
          )}
          {!currentUser && (
            <button onClick={signInHandler} style={{ width: 100, minHeight: 44, border: '1px solid ' + CHROME_COLORS.border, background: CHROME_COLORS.card, borderRadius: 12, padding: '8px 0', fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' }}>Sign in</button>
          )}
        </span>
      </div>
      {activeDemoStep && <DemoCoach step={activeDemoStep} />}
    </nav>
  );
}

function DemoCoach({ step }) {
  return (
    <div style={{ position: 'fixed', right: 24, bottom: 24, zIndex: 80, width: 'min(390px, calc(100vw - 32px))', background: '#1a1916', color: '#fff', borderRadius: 20, padding: 18, boxShadow: '0 18px 55px rgba(0,0,0,.28)', border: '1px solid rgba(255,255,255,.12)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
        <div>
          <div style={{ color: '#b9d2bd', fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900 }}>Passage demo guide</div>
          <div style={{ fontSize: 22, lineHeight: 1.15, marginTop: 6 }}>{step.title}</div>
        </div>
        <Link href={step.href === '/system/demo' ? '/system/demo' : '/system/demo?demoTour=funeral-home'} style={{ color: '#d8d0c7', textDecoration: 'none', fontSize: 12 }}>Exit</Link>
      </div>
      <p style={{ color: '#d8d0c7', fontSize: 14, lineHeight: 1.55, margin: '10px 0 14px' }}>{step.body}</p>
      <Link href={step.href} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '100%', minHeight: 46, background: CHROME_COLORS.sage, color: '#fff', borderRadius: 12, textDecoration: 'none', fontWeight: 900 }}>{step.cta} {'->'}</Link>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer style={{ maxWidth: 1180, margin: '0 auto', padding: '22px 28px 36px', borderTop: '1px solid ' + CHROME_COLORS.border, display: 'flex', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap', fontSize: 13, color: CHROME_COLORS.soft }}>
      <div>Passage coordinates life-to-death transitions with care.</div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <Link href="/faq" style={{ color: CHROME_COLORS.soft, textDecoration: 'none' }}>FAQ</Link>
        <Link href="/trust" style={{ color: CHROME_COLORS.soft, textDecoration: 'none' }}>Trust</Link>
        <Link href="/privacy" style={{ color: CHROME_COLORS.soft, textDecoration: 'none' }}>Privacy</Link>
        <Link href="/terms" style={{ color: CHROME_COLORS.soft, textDecoration: 'none' }}>Terms</Link>
        <Link href="/contact" style={{ color: CHROME_COLORS.soft, textDecoration: 'none' }}>thepassageappio@gmail.com</Link>
      </div>
    </footer>
  );
}
