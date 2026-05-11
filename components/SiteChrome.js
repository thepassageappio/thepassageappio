import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase as chromeSupabase } from '../lib/supabaseBrowser';

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

export function SpineTrustStrip({ eyebrow = 'Shared record', title = 'What stays controlled', rows = [], compact = false }) {
  const safeRows = rows.slice(0, compact ? 3 : 4);
  return (
    <div style={{ background: CHROME_COLORS.card, border: '1px solid ' + CHROME_COLORS.border, borderRadius: compact ? 14 : 16, padding: compact ? 11 : 13, color: CHROME_COLORS.mid }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline', marginBottom: safeRows.length ? 8 : 0 }}>
        <div>
          <div style={{ color: CHROME_COLORS.sage, fontSize: 10, letterSpacing: '.13em', textTransform: 'uppercase', fontWeight: 900 }}>{eyebrow}</div>
          <div style={{ color: CHROME_COLORS.ink, fontSize: compact ? 14 : 16, lineHeight: 1.25, fontWeight: 900, marginTop: 2 }}>{title}</div>
        </div>
        <span style={{ border: '1px solid #c8deca', background: CHROME_COLORS.sageFaint, color: CHROME_COLORS.sage, borderRadius: 999, padding: '4px 8px', fontSize: 10.5, fontWeight: 900, whiteSpace: 'nowrap' }}>Proof-first</span>
      </div>
      {safeRows.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: 7 }}>
          {safeRows.map(([label, body]) => (
            <div key={label} style={{ background: CHROME_COLORS.sageFaint, border: '1px solid ' + CHROME_COLORS.border, borderRadius: 11, padding: '8px 9px' }}>
              <div style={{ color: CHROME_COLORS.sage, fontSize: 9.8, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>{label}</div>
              <div style={{ color: CHROME_COLORS.mid, fontSize: compact ? 11.5 : 12, lineHeight: 1.4, marginTop: 3 }}>{body}</div>
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
            <div style={{ color: CHROME_COLORS.sage, fontSize: 9.8, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>{label}</div>
            <div style={{ color: CHROME_COLORS.ink, fontSize: compact ? 11.7 : 12.2, lineHeight: 1.35, marginTop: 3, fontWeight: 800 }}>{body}</div>
          </div>
        ))}
      </div>
      <div style={{ color: CHROME_COLORS.mid, fontSize: compact ? 11.5 : 12, lineHeight: 1.42, marginTop: 8 }}>
        <strong style={{ color: CHROME_COLORS.ink }}>Access boundary:</strong> {privacy}
      </div>
    </div>
  );
}

export function StatusBadge({ status = 'draft', label, compact = false }) {
  const clean = String(status || '').toLowerCase();
  const state = clean === 'done' || clean === 'handled' || clean === 'completed'
    ? { text: 'Handled', icon: '✓', color: CHROME_COLORS.sage, bg: CHROME_COLORS.sageFaint, border: '#c8deca' }
    : clean === 'acknowledged' || clean === 'accepted' || clean === 'viewed'
      ? { text: clean === 'viewed' ? 'Viewed' : 'Accepted', icon: '•', color: CHROME_COLORS.sage, bg: CHROME_COLORS.sageFaint, border: '#c8deca' }
      : clean === 'sent' || clean === 'assigned' || clean === 'waiting' || clean === 'pending' || clean === 'requested'
        ? { text: clean === 'sent' ? 'Sent' : 'Waiting', icon: '…', color: '#7a6a52', bg: '#f7f1e7', border: '#eadcc8' }
        : clean === 'blocked' || clean === 'failed' || clean === 'needs_review' || clean === 'declined'
          ? { text: clean === 'declined' ? 'Needs another option' : 'Needs help', icon: '!', color: '#9a6842', bg: '#fdf3ec', border: '#edd0bd' }
          : { text: 'Draft', icon: '•', color: CHROME_COLORS.soft, bg: CHROME_COLORS.bg, border: CHROME_COLORS.border };
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
      fontSize: compact ? 10.5 : 11.5,
      lineHeight: 1,
      fontWeight: 900,
      whiteSpace: 'nowrap',
    }}>
      <span aria-hidden="true">{state.icon}</span>
      {label || state.text}
    </span>
  );
}

const LINKS = [
  ['Mission', '/mission'],
  ['Our story', '/story'],
  ['Resources', '/resources'],
  ['Pricing', '/pricing'],
  ['Contact', '/contact'],
  ['Funeral homes', '/funeral-home'],
];

const AUTH_LINKS = [
  ['My tasks', '/participating'],
];

const navLink = {
  color: CHROME_COLORS.mid,
  textDecoration: 'none',
  borderRadius: 11,
  padding: '8px 10px',
  minHeight: 38,
  display: 'inline-flex',
  alignItems: 'center',
};

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

const DEMO_TOUR_STEPS = [
  {
    id: 'overview',
    title: 'Start with the funeral-home promise',
    body: 'Open with the Monday-morning value: fewer repeated calls, clearer owners, visible proof, and clean export back to the systems they already use.',
    say: 'Passage is not replacing your case system. It coordinates the family work around it.',
    show: 'The public funeral-home promise before you open the operating console.',
    href: '/hospice?demoTour=funeral-home&demoStep=warm',
    cta: 'Next: warm handoff',
    anchor: 'demo-fh-promise',
  },
  {
    id: 'warm',
    title: 'Show how families arrive prepared',
    body: 'A family may enter before death through hospice, care preparation, senior living, or direct planning. This is the warm inbound handoff a funeral home can receive instead of starting from zero.',
    say: 'The family record can start before crisis and then hand off cleanly when the funeral home is needed.',
    show: 'Care-prep fields, facility or hospice context, permissions, and funeral-home preference.',
    href: '/funeral-home/dashboard?demoTour=funeral-home&demoStep=dashboard',
    cta: 'Open live console',
    anchor: 'demo-warm-record',
  },
  {
    id: 'dashboard',
    title: 'Command center first',
    body: 'Show the operating pane first. A director should see active cases, waiting items, what needs attention, and the next move without hunting through stacked sections.',
    say: 'This is the daily floor: one command center, one case at a time, one next action.',
    show: 'Active cases, waiting response, blocked work, locations, and the next director action.',
    href: '/funeral-home/dashboard?demoTour=funeral-home&demoStep=team',
    cta: 'Next: setup',
    anchor: 'demo-partner-command',
  },
  {
    id: 'team',
    title: 'Set up locations and people once',
    body: 'Show directors, staff, location scope, and permissions as a management pane, not a scattered onboarding checklist. This is where self-service becomes believable.',
    say: 'Once staff and locations are saved, every case task can assign from the same owner list.',
    show: 'Locations, role permissions, staff management, and assignment readiness.',
    href: '/funeral-home/dashboard?demoTour=funeral-home&demoStep=case',
    cta: 'Next: create a case',
    anchor: 'demo-partner-setup',
  },
  {
    id: 'case',
    title: 'Create the family case',
    body: 'Walk through at-need versus pre-need as states of a family case. Keep it simple: add the family contact, case value, prepaid flag when relevant, and the known dates.',
    say: 'At-need and pre-need are case states. Prepaid is a funding detail, not a separate product.',
    show: 'Family contact, case value, prepaid flag, and smart location.',
    href: '/funeral-home/dashboard?demoTour=funeral-home&demoStep=task',
    cta: 'Next: task spine',
    anchor: 'demo-case-create',
  },
  {
    id: 'task',
    title: 'Move one task',
    body: 'Show one task at a time: prepared output, owner, request, proof, waiting state, and reporting. No mystery status changes.',
    say: 'The task is the unit of truth: owner, request, proof, status, report.',
    show: 'Prepared packet preview, owner assignment, family request, proof close, and the actions that move out of the way after completion.',
    href: '/participating?demoTour=funeral-home&demoStep=participant',
    cta: 'Next: participant view',
    anchor: 'demo-task-spine',
  },
  {
    id: 'participant',
    title: 'Participant acts',
    body: 'Show the helper view: one assigned responsibility, clear accept/waiting/handled buttons, and an update back to the coordinator.',
    say: 'Participants are not joining software. They are answering one family ask.',
    show: 'Scoped access, one next action, and coordinator-visible proof.',
    href: '/share?dn=Eleanor%20Price&cn=Price%20family&demoTour=funeral-home&demoStep=announcement',
    cta: 'Next: family update',
    anchor: 'demo-participant-work',
  },
  {
    id: 'announcement',
    title: 'Prepare one family update',
    body: 'Show how a coordinator prepares one careful update, recipient list, and channel copy without sending anything automatically.',
    say: 'Communication is coordination, not a generic chat feed.',
    show: 'Approved copy, recipient list, channel-specific text.',
    href: '/funeral-home/dashboard?demoTour=funeral-home&demoStep=chat',
    cta: 'Next: communication',
    anchor: 'demo-family-update',
  },
  {
    id: 'chat',
    title: 'Coordinate the people',
    body: 'Show that notifications, conversation, proof, and family-visible status are separate layers tied to the same case, not one noisy chat feed.',
    say: 'Every response becomes context for the next handoff.',
    show: 'Family, provider, and staff updates tied to the same case.',
    href: '/vendors/request?demo=1&demoTour=funeral-home&demoStep=vendor',
    cta: 'Next: vendor loop',
    anchor: 'demo-coordination',
  },
  {
    id: 'vendor',
    title: 'Local help stays task-native',
    body: 'Vendors appear only when useful. The request has viewed, accepted, in-progress, and completed states inside Passage.',
    say: 'Vendors see the request, not the whole family file.',
    show: 'One scoped vendor task and the proof/status trail.',
    href: '/funeral-home/dashboard?demoTour=funeral-home&demoStep=export',
    cta: 'Next: close the demo',
    anchor: 'demo-vendor-request',
  },
  {
    id: 'export',
    title: 'Close with adoption trust',
    body: 'Close where a buyer cares: calls avoided, tasks handled, blocked work, case value, staff/location reporting, vendor value, and CSV/full-spine export.',
    say: 'You can use Passage without trapping your data here. Bring case data in, coordinate the family work, then export the record back out.',
    show: 'Reports, exports, ROI, and adoption trust.',
    href: '/funeral-home',
    cta: 'End walkthrough',
    anchor: 'demo-reports',
  },
];

function demoStepFor(path, queryStep) {
  const requested = String(queryStep || '');
  if (DEMO_TOUR_STEPS.some(step => step.id === requested)) return requested;
  if (path === '/funeral-home') return 'overview';
  if (path === '/funeral-home/dashboard') return 'dashboard';
  if (path === '/hospice') return 'warm';
  if (path === '/estate') return 'task';
  if (path === '/participating') return 'participant';
  if (path === '/share') return 'announcement';
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
  const [hydrated, setHydrated] = useState(false);
  const activePath = hydrated ? path : '';
  const estateActive = isActivePath(activePath, '/estate') || (hydrated && router?.query?.dashboard === '1');
  const controlled = typeof user !== 'undefined';
  const [localUser, setLocalUser] = useState(null);
  const currentUser = controlled ? user : localUser;

  useEffect(() => {
    setHydrated(true);
  }, []);

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
  const demoTourActive = hydrated && router?.query?.demoTour === 'funeral-home';
  const activeDemoStep = demoTourActive ? DEMO_TOUR_STEPS.find(step => step.id === demoStepFor(activePath, router?.query?.demoStep)) : null;
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
  };
  return (
    <nav style={{ width: 'min(1180px, 100%)', boxSizing: 'border-box', maxWidth: 1180, margin: '0 auto', padding: '10px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14 }}>
      <style>{`
        @media (max-width: 720px) {
          .passage-nav-secondary { display: none !important; }
          .passage-nav-wrap { gap: 6px !important; font-size: 13px !important; min-width: 0 !important; max-width: calc(100vw - 128px) !important; }
          .passage-nav-wrap a, .passage-nav-wrap button { min-height: 40px !important; padding: 8px 9px !important; }
          .passage-nav-action-slot { width: auto !important; }
        }
      `}</style>
      <Link href="/" onClick={handleHomeClick} style={{ color: CHROME_COLORS.ink, textDecoration: 'none', fontSize: 24, fontWeight: 700 }}>Passage</Link>
      <div className="passage-nav-wrap" style={{ display: 'flex', gap: 7, fontSize: 13.5, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        {LINKS.map(([label, href]) => <Link key={href} href={href} className={['Mission', 'Our story', 'Resources', 'Pricing', 'Contact'].includes(label) ? 'passage-nav-secondary' : ''} style={isActivePath(activePath, href) ? activeStyle : navLink}>{label}</Link>)}
        {currentUser && AUTH_LINKS.map(([label, href]) => <Link key={href} href={href} style={isActivePath(activePath, href) ? activeStyle : navLink}>{label}</Link>)}
        {showSystemAdminLinks && (
          <Link href="/system/admin" style={(isActivePath(activePath, '/system') || isActivePath(activePath, '/vendors/admin')) ? activeStyle : navLink}>System admin</Link>
        )}
        {currentUser && <Link href={dashboardHref} onClick={handleDashboardClick} style={estateActive ? activeStyle : quietMyEstate}>My estate</Link>}
        <span className="passage-nav-action-slot" style={{ width: 96, display: 'inline-flex', justifyContent: 'flex-end' }}>
          {currentUser && (
            <button onClick={signOutHandler} style={{ width: 92, minHeight: 38, border: '1px solid ' + CHROME_COLORS.border, background: CHROME_COLORS.card, borderRadius: 11, padding: '7px 0', fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' }}>Sign out</button>
          )}
          {!currentUser && (
            <button onClick={signInHandler} style={{ width: 92, minHeight: 38, border: '1px solid ' + CHROME_COLORS.border, background: CHROME_COLORS.card, borderRadius: 11, padding: '7px 0', fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' }}>Sign in</button>
          )}
        </span>
      </div>
      {activeDemoStep && <DemoCoach step={activeDemoStep} />}
    </nav>
  );
}

function DemoCoach({ step }) {
  const [targetRect, setTargetRect] = useState(null);
  const [placement, setPlacement] = useState({ right: 24, bottom: 24 });
  const stepIndex = DEMO_TOUR_STEPS.findIndex(item => item.id === step.id);
  const previousStep = stepIndex > 0 ? DEMO_TOUR_STEPS[stepIndex - 1] : null;

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    function locate(shouldScroll = false) {
      if (typeof window === 'undefined' || !step?.anchor) return;
      const target = document.querySelector(`[data-demo-anchor="${step.anchor}"]`) || document.querySelector('[data-demo-anchor]');
      if (!target) {
        setTargetRect(null);
        setPlacement({ right: 24, bottom: 24 });
        if (!cancelled && attempts < 10) {
          attempts += 1;
          window.setTimeout(() => locate(true), 350);
        }
        return;
      }
      attempts = 0;
      if (shouldScroll) target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      window.setTimeout(() => {
        if (cancelled) return;
        const rect = target.getBoundingClientRect();
        const pad = 10;
        const nextRect = {
          top: Math.max(8, rect.top - pad),
          left: Math.max(8, rect.left - pad),
          width: Math.min(window.innerWidth - 16, rect.width + pad * 2),
          height: Math.min(window.innerHeight - 16, rect.height + pad * 2),
        };
        setTargetRect(nextRect);
        const coachWidth = Math.min(390, window.innerWidth - 32);
        const placeRight = window.innerWidth - (nextRect.left + nextRect.width) > coachWidth + 34;
        const placeLeft = nextRect.left > coachWidth + 34;
        const top = Math.min(Math.max(16, nextRect.top), Math.max(16, window.innerHeight - 270));
        if (placeRight) {
          setPlacement({ left: nextRect.left + nextRect.width + 18, top });
        } else if (placeLeft) {
          setPlacement({ left: nextRect.left - coachWidth - 18, top });
        } else {
          setPlacement({ right: 18, bottom: 18 });
        }
      }, 260);
    }
    locate(true);
    const updateOnly = () => locate(false);
    window.addEventListener('resize', updateOnly);
    window.addEventListener('scroll', updateOnly, { passive: true });
    return () => {
      cancelled = true;
      window.removeEventListener('resize', updateOnly);
      window.removeEventListener('scroll', updateOnly);
    };
  }, [step?.anchor, step?.id]);

  function handleAdvance() {
    if (typeof window === 'undefined') return;
    const match = String(step.href || '').match(/[?&]demoStep=([^&]+)/);
    const target = match ? decodeURIComponent(match[1]) : step.id;
    window.dispatchEvent(new CustomEvent('passage-demo-step', { detail: { from: step.id, target } }));
  }

  function exitDemo() {
    if (typeof window === 'undefined') return;
    window.location.assign('/funeral-home');
  }

  return (
    <>
    {targetRect && (
      <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 2147483600, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(26,25,22,.18)' }} />
        <div style={{ position: 'absolute', top: targetRect.top, left: targetRect.left, width: targetRect.width, height: targetRect.height, border: '3px solid #6b8f71', borderRadius: 18, boxShadow: '0 0 0 9999px rgba(26,25,22,.18), 0 18px 50px rgba(0,0,0,.2)', background: 'rgba(240,245,241,.08)' }} />
      </div>
    )}
    <div data-demo-coach="funeral-home" style={{ position: 'fixed', ...(placement.left != null ? { left: placement.left } : { right: placement.right ?? 24 }), ...(placement.top != null ? { top: placement.top } : { bottom: placement.bottom ?? 24 }), zIndex: 2147483601, width: 'min(390px, calc(100vw - 32px))', background: '#1a1916', color: '#fff', borderRadius: 20, padding: 18, boxShadow: '0 18px 55px rgba(0,0,0,.28)', border: '1px solid rgba(255,255,255,.12)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
        <div>
          <div style={{ color: '#b9d2bd', fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900 }}>DEMO DATA - for demonstration only</div>
          <div style={{ fontSize: 22, lineHeight: 1.15, marginTop: 6 }}>{step.title}</div>
        </div>
        <button onClick={exitDemo} style={{ border: '1px solid rgba(255,255,255,.18)', background: 'rgba(255,255,255,.08)', color: '#d8d0c7', borderRadius: 999, minWidth: 58, minHeight: 32, padding: '0 10px', fontFamily: 'Georgia,serif', fontSize: 12, fontWeight: 900, cursor: 'pointer' }}>Exit</button>
      </div>
      <p style={{ color: '#d8d0c7', fontSize: 13.5, lineHeight: 1.5, margin: '10px 0 10px' }}>{step.body}</p>
      <div style={{ display: 'grid', gap: 7, marginBottom: 12 }}>
        {step.say && <div style={{ background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 11, padding: '8px 9px', color: '#eee9e2', fontSize: 12.2, lineHeight: 1.38 }}><strong style={{ color: '#b9d2bd' }}>Say:</strong> {step.say}</div>}
        {step.show && <div style={{ background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 11, padding: '8px 9px', color: '#eee9e2', fontSize: 12.2, lineHeight: 1.38 }}><strong style={{ color: '#b9d2bd' }}>Show:</strong> {step.show}</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: '#b9d2bd', fontSize: 12, fontWeight: 900, whiteSpace: 'nowrap' }}>Step {Math.max(1, stepIndex + 1)} / {DEMO_TOUR_STEPS.length}</span>
        {previousStep && (
          <Link href={previousStep.href} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 46, border: '1px solid rgba(255,255,255,.18)', background: 'rgba(255,255,255,.08)', color: '#eee9e2', borderRadius: 12, textDecoration: 'none', fontWeight: 900, padding: '0 12px', whiteSpace: 'nowrap' }}>{'<'} Back</Link>
        )}
        <Link onClick={handleAdvance} href={step.href} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '100%', minHeight: 46, background: CHROME_COLORS.sage, color: '#fff', borderRadius: 12, textDecoration: 'none', fontWeight: 900 }}>{step.cta} {'->'}</Link>
      </div>
      <div style={{ color: '#aaa39a', fontSize: 11.2, lineHeight: 1.35, marginTop: 9 }}>Demo-safe: highlights guide the story; live email/SMS is not sent from the tour.</div>
    </div>
    </>
  );
}

export function SiteFooter() {
  return (
    <footer style={{ maxWidth: 1180, margin: '0 auto', padding: '10px 24px 12px', borderTop: '1px solid ' + CHROME_COLORS.border, display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', fontSize: 12, color: CHROME_COLORS.soft }}>
      <div>Passage coordinates life-to-death transitions with care.</div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <Link href="/faq" style={{ color: CHROME_COLORS.soft, textDecoration: 'none' }}>FAQ</Link>
        <Link href="/trust" style={{ color: CHROME_COLORS.soft, textDecoration: 'none' }}>Trust</Link>
        <Link href="/privacy" style={{ color: CHROME_COLORS.soft, textDecoration: 'none' }}>Privacy</Link>
        <Link href="/terms" style={{ color: CHROME_COLORS.soft, textDecoration: 'none' }}>Terms</Link>
        <Link href="/contact" style={{ color: CHROME_COLORS.soft, textDecoration: 'none' }}>thepassageappio@gmail.com</Link>
      </div>
    </footer>
  );
}
