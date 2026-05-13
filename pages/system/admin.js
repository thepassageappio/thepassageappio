import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseBrowser';
import { SiteFooter, SiteHeader } from '../../components/SiteChrome';

const C = {
  bg: '#f6f3ee',
  card: '#fff',
  ink: '#1a1916',
  mid: '#6a6560',
  soft: '#a09890',
  border: '#e4ddd4',
  sage: '#6b8f71',
  sageFaint: '#f0f5f1',
  amber: '#b07d2e',
  amberFaint: '#fdf8ee',
  rose: '#c47a7a',
  roseFaint: '#fdf3f3',
};

const SYSTEM_ADMIN_EMAILS = ['steventurrisi@gmail.com'];

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isSystemAdmin(user) {
  return SYSTEM_ADMIN_EMAILS.includes(normalizeEmail(user?.email));
}

function sandboxHref(href, persona = 'admin-sandbox') {
  const [path, query = ''] = String(href || '/').split('?');
  const params = new URLSearchParams(query);
  params.set('sandbox', '1');
  if (!params.has('demo') && !path.startsWith('/system') && !path.includes('/login') && !path.includes('/onboard')) params.set('demo', '1');
  if (persona && !params.has('persona')) params.set('persona', persona);
  if (!params.has('source')) params.set('source', 'system-admin-sandbox');
  return `${path}?${params.toString()}`;
}

const adminModules = [
  {
    title: 'Demo studio',
    body: 'Admin-only guided walkthrough using sample data for funeral-home demos and persona QA.',
    href: '/system/demo',
    status: 'Live',
  },
  {
    title: 'Vendor applications',
    body: 'Applications submitted from the vendor onboarding form. This is not the general Contact Us inbox.',
    href: '/vendors/admin',
    status: 'Live',
  },
  {
    title: 'Vendor request QA',
    body: 'System-admin demo portal for task-native vendor request status transitions.',
    href: '/vendors/request',
    status: 'Live demo',
  },
  {
    title: 'Support and lead inbox',
    body: 'Contact form intake is live. A filterable internal inbox for feature requests, bug reports, billing disputes, and pilot leads is next.',
    href: '/contact',
    status: 'Intake live',
  },
  {
    title: 'Notification dry-run QA',
    body: 'Email and SMS endpoints can be exercised with dryRun so QA can inspect routing without sending or mutating records.',
    href: '/system/demo',
    status: 'Live scaffold',
  },
  {
    title: 'Business health dashboard',
    body: 'ARR, MRR, churn, pilots, engagement, marketplace value, customer health, and raw exports.',
    href: '/system/admin#business-health',
    status: 'Roadmap',
  },
  {
    title: 'Legal and FAQ trust layer',
    body: 'FAQ, Terms, Privacy, data ownership, urgent-path disclaimer, and support routing.',
    href: '/faq',
    status: 'Live scaffold',
  },
];

const reportingMetrics = [
  'ARR / MRR / NRR / churn',
  'Pilot customers not converted',
  'Leads by inquiry type',
  'Tasks by customer and estate',
  'Participants per estate',
  'Invitation acceptance time',
  'Funeral-home response times',
  'Vendor response times',
  'Marketplace value and rev share',
  'Raw CSV behind every report',
];

const personaProfiles = [
  {
    id: 'red-family',
    label: 'Red-path family',
    role: 'Family coordinator in crisis',
    href: '/urgent?demo=1&persona=red-family',
    proof: 'First-hour guidance, no dashboard setup, save command center.',
  },
  {
    id: 'green-family',
    label: 'Green-path planner',
    role: 'Planning user',
    href: '/?persona=green-family',
    proof: 'Homepage to planning flow, family record, estate switcher.',
  },
  {
    id: 'warm-family',
    label: 'Warm / hospice family',
    role: 'Care-prep coordinator',
    href: '/hospice?persona=warm-family',
    proof: 'Family record before crisis, contacts, dates, handoff promise.',
  },
  {
    id: 'participant',
    label: 'Participant',
    role: 'Invited helper',
    href: '/participating?demo=1&persona=participant&demoTour=funeral-home&demoStep=participant',
    proof: 'Scoped work only, action modal, no full estate workspace.',
  },
  {
    id: 'fh-director',
    label: 'Funeral-home director',
    role: 'Owner / director',
    href: '/funeral-home/dashboard?demo=1&persona=fh-director&demoTour=funeral-home&demoStep=dashboard',
    proof: 'Cases, staff, reports, setup, assignment, export.',
  },
  {
    id: 'fh-employee',
    label: 'Funeral-home employee',
    role: 'Staff queue',
    href: '/funeral-home/dashboard?demo=1&persona=fh-employee&demoTour=funeral-home&demoStep=task&role=staff',
    proof: 'Assigned work, owner dropdown, proof loop, lower admin clutter.',
  },
  {
    id: 'vendor',
    label: 'Vendor',
    role: 'Scoped provider',
    href: '/vendors/request?demo=1&persona=vendor&demoTour=funeral-home&demoStep=vendor',
    proof: 'Request status, response loop, no family browsing.',
  },
  {
    id: 'vendor-admin',
    label: 'Vendor admin',
    role: 'Passage approval queue',
    href: '/vendors/admin?persona=vendor-admin',
    proof: 'System-admin-only vendor approval and trust controls.',
  },
];

const qaFrontDoors = [
  ['Family record', '/estate', 'Gated family workspace and estate switcher'],
  ['Participant', '/participating', 'Invite-only scoped task spine'],
  ['Funeral-home director', '/funeral-home/login', 'Director setup, cases, staff, reporting'],
  ['Funeral-home staff', '/funeral-home/staff', 'Assigned work first'],
  ['Vendor', '/vendors/login', 'Approved vendor sign-in and request queue'],
  ['Vendor application', '/vendors/onboard', 'New support partner review path'],
  ['Demo cockpit', '/system/demo', 'Owner-only linear demo story'],
];

export default function SystemAdminPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [metricsError, setMetricsError] = useState('');
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsRangeDays, setMetricsRangeDays] = useState(30);
  const [adminView, setAdminView] = useState('operations');
  const [activePersonaId, setActivePersonaId] = useState(personaProfiles[0].id);
  const [activeModuleTitle, setActiveModuleTitle] = useState(adminModules[0].title);
  const [dryRunDraft, setDryRunDraft] = useState({ email: '', phone: '', channel: 'email' });
  const [dryRunResult, setDryRunResult] = useState(null);
  const [dryRunLoading, setDryRunLoading] = useState(false);
  const [partnerInviteDraft, setPartnerInviteDraft] = useState({ organizationName: '', directorName: '', directorEmail: '', supportEmail: '', supportPhone: '' });
  const [partnerInviteResult, setPartnerInviteResult] = useState(null);
  const [partnerInviteLoading, setPartnerInviteLoading] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return undefined;
    }
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const admin = useMemo(() => isSystemAdmin(user), [user]);
  const activeModule = useMemo(
    () => adminModules.find(module => module.title === activeModuleTitle) || adminModules[0],
    [activeModuleTitle]
  );
  const activePersona = useMemo(
    () => personaProfiles.find(profile => profile.id === activePersonaId) || personaProfiles[0],
    [activePersonaId]
  );
  const activePersonaHref = useMemo(
    () => sandboxHref(activePersona.href, activePersona.id),
    [activePersona]
  );

  useEffect(() => {
    if (!admin || !supabase) return undefined;
    let cancelled = false;
    async function loadMetrics() {
      setMetricsLoading(true);
      setMetricsError('');
      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token || '';
      const response = await fetch('/api/system/metrics?days=' + encodeURIComponent(metricsRangeDays), {
        headers: token ? { Authorization: 'Bearer ' + token } : {},
      }).catch(() => null);
      if (cancelled) return;
      setMetricsLoading(false);
      if (!response || !response.ok) {
        const data = response ? await response.json().catch(() => ({})) : {};
        setMetricsError(data.error || 'System metrics could not load.');
        return;
      }
      const data = await response.json().catch(() => ({}));
      setMetrics(data);
    }
    loadMetrics();
    return () => { cancelled = true; };
  }, [admin, metricsRangeDays]);

  useEffect(() => {
    if (!user) return;
    setDryRunDraft(prev => ({ ...prev, email: prev.email || user.email || '' }));
  }, [user]);

  async function signIn() {
    if (!supabase || typeof window === 'undefined') return;
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.href } });
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
  }

  async function downloadMetricsCsv() {
    if (!supabase) return;
    const session = await supabase.auth.getSession();
    const token = session?.data?.session?.access_token || '';
    const response = await fetch('/api/system/metrics?format=csv&days=' + encodeURIComponent(metricsRangeDays), {
      headers: token ? { Authorization: 'Bearer ' + token } : {},
    });
    if (!response.ok) return;
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'passage-system-metrics.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function runNotificationDryRun(channel) {
    if (!supabase) return;
    setDryRunLoading(true);
    setDryRunResult(null);
    try {
      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token || '';
      const endpoint = channel === 'sms' ? '/api/sendSMS?dryRun=1' : '/api/sendEmail?dryRun=1';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: 'Bearer ' + token } : {}),
        },
        body: JSON.stringify({
          dryRun: true,
          to: channel === 'sms' ? dryRunDraft.phone : dryRunDraft.email,
          toName: 'Passage QA',
          toEmail: dryRunDraft.email,
          subject: 'Passage dry-run routing check',
          taskTitle: 'Confirm family handoff',
          deceasedName: 'Demo family',
          coordinatorName: user?.email || 'Passage admin',
          actionType: 'assignment',
          messageText: 'Passage dry run: no provider call, no message sent, no production record changed.',
        }),
      });
      const json = await response.json().catch(() => ({}));
      setDryRunResult({ ok: response.ok, channel, status: response.status, json });
    } catch (err) {
      setDryRunResult({ ok: false, channel, status: 0, json: { error: err.message || 'Dry run failed.' } });
    } finally {
      setDryRunLoading(false);
    }
  }

  async function sendPartnerInvite(event) {
    event?.preventDefault?.();
    if (!supabase) return;
    setPartnerInviteLoading(true);
    setPartnerInviteResult(null);
    try {
      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token || '';
      const response = await fetch('/api/partnerInvite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: 'Bearer ' + token } : {}),
        },
        body: JSON.stringify(partnerInviteDraft),
      });
      const json = await response.json().catch(() => ({}));
      setPartnerInviteResult({ ok: response.ok, status: response.status, json });
      if (response.ok) {
        setPartnerInviteDraft({ organizationName: '', directorName: '', directorEmail: '', supportEmail: '', supportPhone: '' });
      }
    } catch (error) {
      setPartnerInviteResult({ ok: false, status: 0, json: { error: error.message || 'Partner invite failed.' } });
    } finally {
      setPartnerInviteLoading(false);
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: 'Georgia,serif' }}>
      <style>{`
        @media (max-width: 760px) {
          .admin-spine-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <SiteHeader user={user} onSignIn={signIn} onSignOut={user ? signOut : null} />
      <section style={{ maxWidth: 1040, margin: '0 auto', padding: '22px 28px 36px' }}>
        <div style={eyebrow}>Passage system admin</div>
        <h1 style={h1}>Internal operating spine.</h1>
        <p style={lead}>Owner-only controls for demos, vendor approval, dry-run QA, metrics export, and trust review. Separate from family, funeral-home, vendor, and estate admin views.</p>

        {loading && <Panel>Checking system-admin access...</Panel>}

        {!loading && !user && (
          <Panel>
            <h2 style={h2}>Sign in to continue.</h2>
            <p style={lead}>Demo, vendor approval, internal reporting, support inbox, and QA shortcuts are restricted to Passage system admins.</p>
            <button onClick={signIn} style={primaryButton}>Sign in with Google</button>
          </Panel>
        )}

        {!loading && user && !admin && (
          <Panel>
            <h2 style={h2}>This account is not a Passage system admin.</h2>
            <p style={lead}>Customer account admins use their own dashboard. Passage internal tools are intentionally separated.</p>
            <Link href="/funeral-home/dashboard" style={secondaryLink}>Open customer dashboard</Link>
          </Panel>
        )}

        {!loading && admin && (
          <>
            <Panel compact>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, .82fr) minmax(260px, .48fr)', gap: 14, alignItems: 'start' }} className="admin-spine-grid">
                <div>
                  <div style={eyebrow}>Today</div>
                  <h2 style={h2}>One internal queue, one source of proof.</h2>
                  <p style={lead}>Start with the operational question, then open the one tool needed. Nothing here should look like a customer dashboard.</p>
                </div>
                <div style={{ background: C.sageFaint, border: '1px solid #c8deca', borderRadius: 15, padding: 13 }}>
                  <div style={eyebrow}>Owner access</div>
                  <div style={{ color: C.ink, fontSize: 17, lineHeight: 1.25, marginTop: 6 }}>Visible only to the Passage owner account.</div>
                  <div style={{ color: C.mid, fontSize: 12.5, lineHeight: 1.45, marginTop: 6 }}>{user?.email}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
                  {[
                    ['operations', 'Operations'],
                    ['personas', 'Personas'],
                    ['metrics', 'Metrics'],
                    ['trust', 'Trust'],
                  ].map(([key, label]) => (
                    <button key={key} onClick={() => setAdminView(key)} style={adminView === key ? selectedTab : tabButton}>{label}</button>
                  ))}
              </div>
            </Panel>

            {adminView === 'operations' && (
            <>
              <Panel compact>
                <div style={eyebrow}>Operations</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(210px, .42fr) minmax(0, 1fr)', gap: 14, marginTop: 10 }} className="admin-spine-grid">
                  <div style={{ display: 'grid', gap: 7 }}>
                    {adminModules.map((module) => (
                      <button key={module.title} onClick={() => setActiveModuleTitle(module.title)} style={activeModule.title === module.title ? selectedToolButton : toolButton}>
                        <span>{module.title}</span>
                        <span style={activeModule.title === module.title ? livePillOnGreen : module.status === 'Live' || module.status === 'Live demo' || module.status === 'Intake live' || module.status === 'Live scaffold' ? livePill : plannedPill}>{module.status}</span>
                      </button>
                    ))}
                  </div>
                  <div style={{ background: activeModule.status === 'Roadmap' ? C.amberFaint : C.sageFaint, border: '1px solid ' + (activeModule.status === 'Roadmap' ? '#ead8b8' : '#c8deca'), borderRadius: 16, padding: 17 }}>
                    <div style={eyebrow}>Selected tool</div>
                    <h2 style={{ ...h2, marginTop: 6 }}>{activeModule.title}</h2>
                    <p style={lead}>{activeModule.body}</p>
                    <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', marginTop: 14 }}>
                      <Link href={activeModule.href} style={primaryLink}>Open</Link>
                      <span style={activeModule.status === 'Roadmap' ? plannedPill : livePill}>{activeModule.status}</span>
                    </div>
                  </div>
                </div>
              </Panel>
              <Panel compact>
                <div style={eyebrow}>Invite funeral home</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, .45fr) minmax(0, 1fr)', gap: 14, alignItems: 'start' }} className="admin-spine-grid">
                  <div>
                    <h2 style={h2}>Send the partner-owner setup email.</h2>
                    <p style={lead}>This creates or updates the funeral-home organization, saves the director as owner, and emails a setup link into the co-branded partner workspace.</p>
                  </div>
                  <form onSubmit={sendPartnerInvite} style={{ display: 'grid', gap: 9 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 8 }}>
                      <input value={partnerInviteDraft.organizationName} onChange={event => setPartnerInviteDraft(prev => ({ ...prev, organizationName: event.target.value }))} placeholder="Funeral home name" style={inputStyle} />
                      <input value={partnerInviteDraft.directorName} onChange={event => setPartnerInviteDraft(prev => ({ ...prev, directorName: event.target.value }))} placeholder="Director / owner name" style={inputStyle} />
                      <input value={partnerInviteDraft.directorEmail} onChange={event => setPartnerInviteDraft(prev => ({ ...prev, directorEmail: event.target.value }))} placeholder="director@funeralhome.com" style={inputStyle} />
                      <input value={partnerInviteDraft.supportPhone} onChange={event => setPartnerInviteDraft(prev => ({ ...prev, supportPhone: event.target.value }))} placeholder="Support phone" style={inputStyle} />
                      <input value={partnerInviteDraft.supportEmail} onChange={event => setPartnerInviteDraft(prev => ({ ...prev, supportEmail: event.target.value }))} placeholder="Family support email (optional)" style={inputStyle} />
                    </div>
                    <button type="submit" disabled={partnerInviteLoading} style={{ ...primaryButton, marginTop: 0, justifySelf: 'start', opacity: partnerInviteLoading ? .6 : 1 }}>{partnerInviteLoading ? 'Sending invite...' : 'Create workspace + send invite'}</button>
                    {partnerInviteResult && (
                      <div style={{ background: partnerInviteResult.ok ? C.sageFaint : C.roseFaint, border: '1px solid ' + (partnerInviteResult.ok ? '#c8deca' : '#efc7c7'), borderRadius: 13, padding: 12 }}>
                        <div style={{ color: partnerInviteResult.ok ? C.sage : C.rose, fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>{partnerInviteResult.ok ? 'Invite ready' : 'Invite failed'}</div>
                        <div style={{ ...smallText, marginTop: 5 }}>{partnerInviteResult.json?.message || partnerInviteResult.json?.error || (partnerInviteResult.json?.inviteUrl ? 'Partner invite sent.' : 'Partner invite processed.')}</div>
                        {partnerInviteResult.json?.inviteUrl && <input readOnly value={partnerInviteResult.json.inviteUrl} style={{ ...inputStyle, width: '100%', marginTop: 8 }} />}
                      </div>
                    )}
                  </form>
                </div>
              </Panel>
            </>
            )}

            {adminView === 'personas' && (
            <>
              <Panel compact>
                <div style={eyebrow}>Demo sandbox cockpit</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(230px, .44fr) minmax(0, 1fr)', gap: 14, marginTop: 10 }} className="admin-spine-grid">
                  <div>
                    <h2 style={h2}>Open each side of the same demo story.</h2>
                    <p style={lead}>Use these sandbox roles to demo the family, participant, funeral-home, employee, and vendor experiences from one admin-only cockpit.</p>
                    <div style={{ background: C.sageFaint, border: '1px solid #c8deca', borderRadius: 13, padding: 12, color: C.mid, fontSize: 12.5, lineHeight: 1.45, marginTop: 10 }}>
                      <strong style={{ color: C.ink }}>Sandbox rule:</strong> these links carry sandbox, demo, source, and persona flags. They are for Steve/admin QA only; public users do not see this switcher.
                    </div>
                    <div style={{ display: 'grid', gap: 7, marginTop: 12 }}>
                      {personaProfiles.map((profile) => (
                        <button key={profile.id} onClick={() => setActivePersonaId(profile.id)} style={activePersona.id === profile.id ? selectedToolButton : toolButton}>
                          <span>
                            <span style={{ display: 'block' }}>{profile.label}</span>
                            <span style={{ display: 'block', fontSize: 11.5, color: activePersona.id === profile.id ? 'rgba(255,255,255,.78)' : C.soft, marginTop: 2 }}>{profile.role}</span>
                          </span>
                          <span style={activePersona.id === profile.id ? livePillOnGreen : livePill}>QA</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={previewPanel}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start', marginBottom: 10 }}>
                      <div>
                        <div style={eyebrow}>Selected role</div>
                        <h2 style={{ ...h2, marginTop: 5 }}>{activePersona.label}</h2>
                        <p style={{ ...smallText, marginTop: 3 }}>{activePersona.proof}</p>
                      </div>
                      <Link href={activePersonaHref} target="_blank" style={{ ...primaryLink, flexShrink: 0 }}>Open sandbox view</Link>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, marginBottom: 10 }}>
                      {[
                        ['Persona', activePersona.role],
                        ['Route mode', 'Sandbox flagged'],
                        ['Messages', 'Demo-safe where supported'],
                      ].map(([label, value]) => (
                        <div key={label} style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: 12, padding: '9px 10px' }}>
                          <div style={{ color: C.sage, fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>{label}</div>
                          <div style={{ color: C.ink, fontSize: 13, lineHeight: 1.3, marginTop: 3, fontWeight: 900 }}>{value}</div>
                        </div>
                      ))}
                    </div>
                    <iframe
                      key={activePersonaHref}
                      src={activePersonaHref}
                      title={'Passage QA preview - ' + activePersona.label}
                      style={{ width: '100%', height: 430, border: '1px solid ' + C.border, borderRadius: 14, background: C.bg }}
                    />
                  </div>
                </div>
                <div style={{ background: C.amberFaint, border: '1px solid #ead8b8', color: C.amber, borderRadius: 13, padding: 12, marginTop: 12, fontSize: 12.5, lineHeight: 1.45, fontWeight: 800 }}>
                  Admin boundary: this is persona simulation, not production impersonation. Use it with owned QA data to test live-feeling interactions across the spine. True customer impersonation remains gated until it has audit logs, scoped tokens, session expiry, and explicit owner approval.
                </div>
              </Panel>
              <Panel compact>
                <div style={eyebrow}>Role front doors</div>
                <h2 style={h2}>The login and onboarding doors to test before every sales push.</h2>
                <p style={lead}>This is the owner-only checklist for public-to-private transitions: family, participant, funeral-home director, staff, vendor, and vendor application.</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 9, marginTop: 14 }}>
                  {qaFrontDoors.map(([label, href, body]) => (
                    <Link key={href} href={sandboxHref(href)} target="_blank" style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: 14, padding: 13, color: C.ink, textDecoration: 'none', display: 'grid', gap: 5 }}>
                      <span style={{ fontSize: 17, fontWeight: 900 }}>{label}</span>
                      <span style={{ ...smallText, marginTop: 0 }}>{body}</span>
                      <span style={{ color: C.sage, fontSize: 12.5, fontWeight: 900 }}>Open sandbox front door</span>
                    </Link>
                  ))}
                </div>
              </Panel>
            </>
            )}

            {adminView === 'metrics' && (
            <section id="business-health" style={{ marginTop: 16 }}>
              <Panel compact>
                <div style={eyebrow}>Business health dashboard</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'start', flexWrap: 'wrap' }}>
                  <div>
                    <h2 style={h2}>Internal metrics spine.</h2>
                    <p style={lead}>Show only the operating truth first. Raw CSV remains the source of record.</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {[7, 30, 90].map(days => (
                      <button key={days} onClick={() => setMetricsRangeDays(days)} style={metricsRangeDays === days ? selectedTab : tabButton}>{days}d</button>
                    ))}
                    <button onClick={downloadMetricsCsv} style={{ ...primaryButton, marginTop: 0 }}>Export raw metrics CSV</button>
                  </div>
                </div>
                {metricsLoading && <div style={{ ...smallText, marginTop: 12 }}>Loading live metrics...</div>}
                {metricsError && <div style={{ ...smallText, marginTop: 12, color: C.rose }}>{metricsError}</div>}
                {metrics?.metrics?.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8, marginTop: 12 }}>
                    {metrics.metrics.slice(0, 12).map((item) => (
                      <div key={item.label} style={item.status === 'real' ? metricCard : unavailableMetricCard}>
                        <div style={{ fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: item.status === 'real' ? C.sage : C.amber, marginBottom: 5 }}>{item.status}</div>
                        <div style={{ fontSize: 24, lineHeight: 1.05 }}>{formatAdminMetricValue(item)}</div>
                        <div style={{ fontSize: 12, color: C.mid, lineHeight: 1.35, marginTop: 5 }}>{item.label}</div>
                        <div style={{ fontSize: 10.5, color: C.soft, marginTop: 5 }}>Source: {item.source}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8, marginTop: 12 }}>
                    {reportingMetrics.slice(0, 6).map((metric) => <div key={metric} style={metricCard}>{metric}</div>)}
                  </div>
                )}
                {metrics?.leads && (
                  <div style={{ marginTop: 18 }}>
                    <div style={eyebrow}>Lead and support CRM</div>
                    <p style={{ ...smallText, marginTop: 4 }}>Contact, vendor, partner, support, billing, feature, and bug inquiries are grouped from the leads table. The export includes the raw rows behind this view.</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10, marginTop: 10 }}>
                      <div style={subPanel}>
                        <h3 style={h3}>By inquiry type</h3>
                        {(metrics.leads.byType || []).length ? metrics.leads.byType.slice(0, 8).map((item) => (
                          <MetricRow key={item.label} label={item.label} value={item.count} />
                        )) : <div style={smallText}>No lead categories yet.</div>}
                      </div>
                      <div style={subPanel}>
                        <h3 style={h3}>Recent inquiries</h3>
                        {(metrics.leads.recent || []).length ? metrics.leads.recent.slice(0, 6).map((item) => (
                          <MetricRow key={item.email + item.createdAt} label={(item.type || 'Inquiry') + (item.urgency ? ' - ' + item.urgency : '')} value={item.email || 'No email'} />
                        )) : <div style={smallText}>No recent inquiries yet.</div>}
                      </div>
                    </div>
                  </div>
                )}
                {metrics?.funnel && (
                  <div style={{ marginTop: 18 }}>
                    <div style={eyebrow}>Signup and onboarding funnel</div>
                    <p style={{ ...smallText, marginTop: 4 }}>Use this to see who created an account, who completed onboarding, who paid, and who fell off inside the selected time window.</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10, marginTop: 10 }}>
                      <div style={subPanel}>
                        <h3 style={h3}>Recent accounts</h3>
                        {(metrics.funnel.recent || []).length ? metrics.funnel.recent.slice(0, 8).map((item) => (
                          <MetricRow
                            key={(item.email || 'user') + item.createdAt}
                            label={[
                              item.onboardingCompleted ? 'Complete' : 'Incomplete',
                              item.lastStage || 'No stage',
                              item.planStatus || 'No plan',
                            ].join(' - ')}
                            value={item.email || 'No email'}
                          />
                        )) : <div style={smallText}>No accounts in this range.</div>}
                      </div>
                      <div style={subPanel}>
                        <h3 style={h3}>Nurture queue</h3>
                        {(metrics.funnel.recent || []).filter(item => !item.onboardingCompleted).length
                          ? metrics.funnel.recent.filter(item => !item.onboardingCompleted).slice(0, 8).map((item) => (
                            <MetricRow key={(item.email || 'user') + item.createdAt + 'nurture'} label={item.lastStage || 'Started, not completed'} value={item.email || 'No email'} />
                          ))
                          : <div style={smallText}>No incomplete onboarding in this range.</div>}
                      </div>
                    </div>
                  </div>
                )}
              </Panel>
            </section>
            )}

            {adminView === 'trust' && (
            <section id="trust-layer" style={{ marginTop: 16 }}>
              <Panel compact>
                <div style={eyebrow}>FAQ, support, terms, and privacy</div>
                <h2 style={h2}>Public trust layer is queued behind owner/legal review.</h2>
                <p style={lead}>The FAQ should explain vendor applications, support requests, feature requests, bug reports, billing disputes, urgent-path limits, and data ownership. Terms and Privacy changes should stay reviewed before production legal claims change.</p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
                  <Link href="/faq" style={secondaryLink}>FAQ</Link>
                  <Link href="/trust" style={secondaryLink}>Trust</Link>
                  <Link href="/privacy" style={secondaryLink}>Privacy</Link>
                  <Link href="/terms" style={secondaryLink}>Terms</Link>
                  <Link href="/contact" style={secondaryLink}>Contact intake</Link>
                </div>
              </Panel>
              <Panel compact>
                <div style={eyebrow}>Notification dry-run QA</div>
                <h2 style={h2}>Preview routing without sending anything.</h2>
                <p style={lead}>This calls the same delivery endpoints with dryRun enabled. The expected result says no provider was called, no fallback was sent, and no production record changed.</p>
                <div style={{ background: C.amberFaint, border: '1px solid #ead8b8', color: C.amber, borderRadius: 13, padding: 12, marginTop: 12, fontSize: 12.5, lineHeight: 1.45, fontWeight: 800 }}>
                  SMS production reality: email dry-runs can be exercised safely here. Live SMS remains paused until Twilio carrier registration/A2P approval is complete and Passage explicitly enables production texting.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginTop: 14 }}>
                  <label style={fieldLabel}>
                    Email recipient
                    <input value={dryRunDraft.email} onChange={event => setDryRunDraft(prev => ({ ...prev, email: event.target.value }))} style={inputStyle} placeholder="qa@example.com" />
                  </label>
                  <label style={fieldLabel}>
                    SMS recipient
                    <input value={dryRunDraft.phone} onChange={event => setDryRunDraft(prev => ({ ...prev, phone: event.target.value }))} style={inputStyle} placeholder="+1..." />
                  </label>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                  <button onClick={() => runNotificationDryRun('email')} disabled={dryRunLoading || !dryRunDraft.email} style={{ ...primaryButton, marginTop: 0, opacity: dryRunLoading || !dryRunDraft.email ? .55 : 1 }}>Dry-run email</button>
                  <button onClick={() => runNotificationDryRun('sms')} disabled={dryRunLoading || !dryRunDraft.phone} style={{ ...secondaryButton, opacity: dryRunLoading || !dryRunDraft.phone ? .55 : 1 }}>Dry-run SMS</button>
                </div>
                {dryRunResult && (
                  <div style={{ background: dryRunResult.ok ? C.sageFaint : C.roseFaint, border: '1px solid ' + (dryRunResult.ok ? '#c8deca' : '#efc7c7'), borderRadius: 13, padding: 12, marginTop: 12 }}>
                    <div style={{ color: dryRunResult.ok ? C.sage : C.rose, fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>{dryRunResult.ok ? 'Dry-run passed' : 'Dry-run failed'} - {dryRunResult.channel}</div>
                    <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: '8px 0 0', color: C.mid, fontSize: 12, lineHeight: 1.45, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>{JSON.stringify(dryRunResult.json, null, 2)}</pre>
                  </div>
                )}
                {metrics?.notifications && (
                  <div style={{ marginTop: 18 }}>
                    <div style={eyebrow}>Recent delivery truth</div>
                    <p style={{ ...smallText, marginTop: 4 }}>These are the latest logged email/SMS outcomes, masked for safety. Use this after testing invites or task updates with your own address only.</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10, marginTop: 10 }}>
                      <div style={subPanel}>
                        <h3 style={h3}>By status</h3>
                        {(metrics.notifications.byStatus || []).length ? metrics.notifications.byStatus.slice(0, 8).map((item) => (
                          <MetricRow key={item.label} label={item.label} value={item.count} />
                        )) : <div style={smallText}>No notification log rows yet.</div>}
                      </div>
                      <div style={subPanel}>
                        <h3 style={h3}>Latest notifications</h3>
                        {(metrics.notifications.recent || []).length ? metrics.notifications.recent.slice(0, 8).map((item) => (
                          <MetricRow
                            key={(item.id || item.channel) + item.sentAt}
                            label={[item.channel || 'message', item.status || 'unknown', item.subject || item.provider || 'Passage'].filter(Boolean).join(' - ')}
                            value={item.error ? 'Failed' : item.recipient}
                          />
                        )) : <div style={smallText}>No recent delivery records.</div>}
                      </div>
                    </div>
                  </div>
                )}
              </Panel>
            </section>
            )}
          </>
        )}
      </section>
      <SiteFooter />
    </main>
  );
}

function Panel({ children, compact = false, tone = 'default' }) {
  return <div style={{ background: tone === 'sage' ? C.sageFaint : C.card, border: '1px solid ' + (tone === 'sage' ? '#c8deca' : C.border), borderRadius: 18, padding: compact ? 18 : 22, boxShadow: '0 4px 20px rgba(0,0,0,.04)', marginTop: compact ? 0 : 18 }}>{children}</div>;
}

function MetricRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, borderTop: '1px solid ' + C.border, padding: '8px 0', alignItems: 'flex-start' }}>
      <span style={{ color: C.mid, fontSize: 12.5, lineHeight: 1.35 }}>{label}</span>
      <strong style={{ color: C.ink, fontSize: 12.5, textAlign: 'right', lineHeight: 1.35 }}>{value}</strong>
    </div>
  );
}

function formatAdminMetricValue(item) {
  if (item?.value == null) return 'N/A';
  if (item?.unit === 'cents') {
    return '$' + (Number(item.value || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return item.value;
}

const eyebrow = { color: C.sage, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900 };
const h1 = { fontSize: 'clamp(34px, 5vw, 56px)', lineHeight: 1.04, margin: '8px 0 10px', fontWeight: 400, maxWidth: 820 };
const h2 = { fontSize: 28, lineHeight: 1.12, margin: '8px 0 10px', fontWeight: 400 };
const h3 = { fontSize: 22, lineHeight: 1.15, fontWeight: 900 };
const lead = { color: C.mid, fontSize: 16, lineHeight: 1.6, margin: 0, maxWidth: 760 };
const smallText = { color: C.mid, fontSize: 14, lineHeight: 1.5, marginTop: 8 };
const primaryButton = { border: 'none', background: C.sage, color: '#fff', borderRadius: 13, minHeight: 48, padding: '0 18px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer', marginTop: 16 };
const secondaryButton = { border: '1px solid ' + C.border, background: C.card, color: C.sage, borderRadius: 13, minHeight: 48, padding: '0 18px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' };
const secondaryLink = { border: '1px solid ' + C.border, background: C.card, color: C.sage, borderRadius: 13, minHeight: 48, padding: '0 18px', fontFamily: 'Georgia,serif', fontWeight: 900, display: 'inline-flex', alignItems: 'center', textDecoration: 'none', marginTop: 16 };
const primaryLink = { border: 'none', background: C.sage, color: '#fff', borderRadius: 13, minHeight: 44, padding: '0 16px', fontFamily: 'Georgia,serif', fontWeight: 900, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' };
const tabButton = { border: '1px solid ' + C.border, background: C.card, color: C.mid, borderRadius: 999, minHeight: 38, padding: '0 14px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' };
const selectedTab = { ...tabButton, border: '1px solid ' + C.sage, background: C.sage, color: '#fff' };
const toolButton = { border: '1px solid ' + C.border, background: C.card, color: C.ink, borderRadius: 13, minHeight: 42, padding: '8px 10px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', textAlign: 'left' };
const selectedToolButton = { ...toolButton, border: '1px solid ' + C.sage, background: C.sage, color: '#fff' };
const livePill = { background: C.sageFaint, color: C.sage, border: '1px solid #c8deca', borderRadius: 999, padding: '5px 8px', fontSize: 12, fontWeight: 900, whiteSpace: 'nowrap' };
const livePillOnGreen = { background: 'rgba(255,255,255,.16)', color: '#fff', border: '1px solid rgba(255,255,255,.28)', borderRadius: 999, padding: '5px 8px', fontSize: 12, fontWeight: 900, whiteSpace: 'nowrap' };
const plannedPill = { background: C.amberFaint, color: C.amber, border: '1px solid #ead8b8', borderRadius: 999, padding: '5px 8px', fontSize: 12, fontWeight: 900, whiteSpace: 'nowrap' };
const metricCard = { background: C.sageFaint, border: '1px solid #c8deca', borderRadius: 13, padding: 12, color: C.sage, fontWeight: 900, fontSize: 14 };
const unavailableMetricCard = { background: C.amberFaint, border: '1px solid #ead8b8', borderRadius: 13, padding: 12, color: C.amber, fontWeight: 900, fontSize: 14 };
const subPanel = { background: C.bg, border: '1px solid ' + C.border, borderRadius: 14, padding: 14 };
const previewPanel = { background: C.bg, border: '1px solid ' + C.border, borderRadius: 16, padding: 14 };
const fieldLabel = { display: 'grid', gap: 5, color: C.soft, fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 };
const inputStyle = { border: '1px solid ' + C.border, background: C.bg, borderRadius: 12, padding: '11px 12px', color: C.ink, fontFamily: 'Georgia,serif', fontSize: 14 };
