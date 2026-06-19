import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseBrowser';
import { SiteFooter, SiteHeader } from '../../components/SiteChrome';
import { VENDOR_CATEGORIES } from '../../lib/vendors';
import { FUNERAL_HOME_PLAN_OPTIONS, partnerPlanFor } from '../../lib/partnerPlans';

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

const toolSections = [
  {
    title: 'Canonical roadmap',
    summary: 'One owner-only planning surface. Everything else below is evidence, readiness, QA, or operating tooling that feeds this roadmap.',
    tools: [
      ['Single SaaS roadmap', '/system/admin/saas-roadmap', 'Strategy, milestones, sprint governance, business goal, product doctrine, and release acceptance live here only.'],
    ],
  },
  {
    title: 'Roadmap evidence and readiness tools',
    summary: 'Operational evidence for the roadmap. These pages do not replace or fork the plan.',
    tools: [
      ['Pilot health', '/system/admin/pilot-health', 'Account stage, launch grade, blockers, proof, conversion next action, and account risk evidence.'],
      ['Conversion evidence', '/system/admin/conversion-plan', 'Owner-only evidence for demo-to-pilot and pilot-to-paid movement.'],
      ['Enterprise readiness', '/system/admin/enterprise-funeral-home-readiness', 'B2B readiness evidence: locations, roles, cases, owners, proof, exports, billing, and controls.'],
      ['Partner checkout readiness', '/system/admin/partner-checkout-readiness', 'Checkout, entitlement, and billing readiness evidence.'],
    ],
  },
  {
    title: 'Funeral-home QA and persona UAT',
    summary: 'Persona-by-persona validation for the workflows that must feel flawless before betas expand.',
    tools: [
      ['Funeral-home QA', '/system/admin/funeral-home-qa', 'Director, employee, family, participant, vendor, and admin UAT script.'],
      ['Demo guide', '/system/admin?tool=demo-studio#demo-studio', 'Owner-only demo guide lives inside this cabinet; sample-data links open from here only.'],
      ['Director sandbox', '/funeral-home/dashboard?demo=1&persona=fh-director&source=system-admin-sandbox', 'Director view: My Day, cases, staff, reports, setup, exports.'],
      ['Staff sandbox', '/funeral-home/dashboard?demo=1&persona=fh-employee&role=staff&source=system-admin-sandbox', 'Employee view: assigned work, waiting point, proof action, drafted updates.'],
      ['Participant sandbox', '/participating?demo=1&persona=participant&source=system-admin-sandbox', 'Scoped helper request without full estate access.'],
      ['Vendor sandbox', '/vendors/request?demo=1&persona=vendor&source=system-admin-sandbox', 'Scoped vendor request, quote/update, and proof trail.'],
    ],
  },
  {
    title: 'Automation layer and trust controls',
    summary: 'Readiness gates for tasks, notifications, refresh/rate limits, abuse controls, compliance posture, and mobile scope.',
    tools: [
      ['Automation readiness', '/system/admin/automation-spine-readiness', 'Assignment, waiting hygiene, stuck work, proof gaps, delivery telemetry, reminders.'],
      ['Refresh and rate limits', '/system/admin/rate-limit-readiness', 'Launch decision and abuse/refresh controls for high-risk routes.'],
      ['Abuse controls', '/system/admin/abuse-controls', 'Owner-only review of abuse prevention and safety posture.'],
      ['Trust page', '/trust', 'Public trust claims that must stay aligned with backend proof.'],
      ['Terms', '/terms', 'Production legal terms.'],
      ['Privacy', '/privacy', 'Production privacy posture.'],
    ],
  },
  {
    title: 'Operating actions',
    summary: 'Owner actions for partner setup, vendor review, support intake, metrics, and proof exports.',
    tools: [
      ['Vendor applications', '/vendors/admin', 'Review and approve support vendors.'],
      ['Vendor request QA', '/vendors/request?demo=1&source=system-admin-sandbox', 'Task-native vendor request transitions.'],
      ['Support intake', '/contact', 'Contact, guide, vendor, funeral-home, bug, billing, and feature inquiries.'],
      ['Partner export', '/api/partnerExport?view=summary', 'Funeral-home proof export summary.'],
      ['FAQ', '/faq', 'Public support and product explanations.'],
    ],
  },
];

const launchRules = [
  'The roadmap has one visible owner surface: /system/admin/saas-roadmap. Other admin pages are evidence or tools, not planning boards.',
  'Future agents must read AGENTS.md and docs/agent-operating-context.md before changes, then update the context before handoff.',
  'Do not add new top-level internal tabs. Add internal tools to this cabinet or retire the old surface.',
  'Public and persona pages cannot expose ARR, sprint, roadmap, QA, founder/internal, or pilot-conversion language.',
  'Funeral-home views should explain what to do next: owner, waiting point, proof, drafted message, and outcome.',
  'Run public surface, workflow, payment/CRM, compliance, and rate-limit checks before demos or beta expansion.',
];

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isSystemAdmin(user) {
  return SYSTEM_ADMIN_EMAILS.includes(normalizeEmail(user?.email));
}

function money(amount) {
  const value = Number(amount || 0);
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: value % 1 ? 2 : 0 });
}

export default function SystemAdminPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkResults, setCheckResults] = useState({});
  const [runningKey, setRunningKey] = useState('');
  const [checkCooldowns, setCheckCooldowns] = useState({});
  const [metrics, setMetrics] = useState(null);
  const [metricsError, setMetricsError] = useState('');
  const [partnerInviteDraft, setPartnerInviteDraft] = useState({ organizationName: '', directorName: '', directorEmail: '', supportEmail: '', supportPhone: '', planId: 'partner_local' });
  const [partnerInviteResult, setPartnerInviteResult] = useState(null);
  const [partnerInviteLoading, setPartnerInviteLoading] = useState(false);
  const [vendorSetupDraft, setVendorSetupDraft] = useState({ businessName: '', category: 'florist', email: '', phone: '', zipCodes: '', website: '', description: '' });
  const [vendorSetupResult, setVendorSetupResult] = useState(null);
  const [vendorSetupLoading, setVendorSetupLoading] = useState(false);
  const [authError, setAuthError] = useState('');

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

  useEffect(() => {
    if (!admin) return;
    loadMetrics();
  }, [admin]);

  async function authHeaders() {
    if (!supabase) return {};
    const session = await supabase.auth.getSession();
    const token = session?.data?.session?.access_token || '';
    return token ? { Authorization: 'Bearer ' + token } : {};
  }

  async function signIn() {
    setAuthError('');
    if (typeof window === 'undefined') return;
    window.location.assign('/auth/google?next=' + encodeURIComponent(window.location.pathname + window.location.search + window.location.hash));
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
  }

  function checkCooldownSeconds(key) {
    const until = Number(checkCooldowns[key] || 0);
    return Math.max(0, Math.ceil((until - Date.now()) / 1000));
  }

  async function runCheck(key, label, endpoint, options = {}) {
    if (runningKey) return;
    const remaining = checkCooldownSeconds(key);
    if (remaining > 0) {
      setCheckResults(prev => ({ ...prev, [key]: { ok: false, label, status: 'cooldown', message: `Wait ${remaining}s before running this check again.` } }));
      return;
    }
    setRunningKey(key);
    setCheckCooldowns(prev => ({ ...prev, [key]: Date.now() + 60000 }));
    setCheckResults(prev => ({ ...prev, [key]: null }));
    try {
      const headers = await authHeaders();
      const response = await fetch(endpoint, {
        method: options.method || 'GET',
        headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...headers },
        body: options.body ? JSON.stringify(options.body) : undefined,
      });
      const json = await response.json().catch(() => ({}));
      if (response.status === 429) {
        const retryAfter = Number(response.headers.get('Retry-After') || json.retryAfterSeconds || 60);
        setCheckCooldowns(prev => ({ ...prev, [key]: Date.now() + Math.max(1, retryAfter) * 1000 }));
      }
      setCheckResults(prev => ({ ...prev, [key]: { label, ok: response.ok, status: response.status, json } }));
    } catch (error) {
      setCheckResults(prev => ({ ...prev, [key]: { label, ok: false, status: 0, json: { status: 'failed', error: error.message || 'Check failed.' } } }));
    } finally {
      setRunningKey('');
    }
  }

  async function loadMetrics() {
    setMetricsError('');
    try {
      const headers = await authHeaders();
      const response = await fetch('/api/system/metrics?days=30', { headers });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMetricsError(json.error || 'System metrics could not load.');
        return;
      }
      setMetrics(json);
    } catch (error) {
      setMetricsError(error.message || 'System metrics could not load.');
    }
  }

  async function sendPartnerInvite(event) {
    event?.preventDefault?.();
    if (!supabase) return;
    setPartnerInviteLoading(true);
    setPartnerInviteResult(null);
    try {
      const headers = await authHeaders();
      const response = await fetch('/api/partnerInvite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(partnerInviteDraft),
      });
      const json = await response.json().catch(() => ({}));
      setPartnerInviteResult({ ok: response.ok, status: response.status, json });
      if (response.ok) setPartnerInviteDraft({ organizationName: '', directorName: '', directorEmail: '', supportEmail: '', supportPhone: '', planId: 'partner_local' });
    } catch (error) {
      setPartnerInviteResult({ ok: false, status: 0, json: { error: error.message || 'Partner invite failed.' } });
    } finally {
      setPartnerInviteLoading(false);
    }
  }

  async function submitVendorSetup(event) {
    event?.preventDefault?.();
    setVendorSetupLoading(true);
    setVendorSetupResult(null);
    try {
      const response = await fetch('/api/vendors/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...vendorSetupDraft, source: 'system_admin_setup' }),
      });
      const json = await response.json().catch(() => ({}));
      setVendorSetupResult({ ok: response.ok, status: response.status, json });
      if (response.ok) setVendorSetupDraft({ businessName: '', category: 'florist', email: '', phone: '', zipCodes: '', website: '', description: '' });
    } catch (error) {
      setVendorSetupResult({ ok: false, status: 0, json: { error: error.message || 'Vendor setup failed.' } });
    } finally {
      setVendorSetupLoading(false);
    }
  }

  if (loading) {
    return <Shell user={user} onSignIn={signIn} onSignOut={signOut}><section style={wrap}><Panel>Checking system-admin access...</Panel></section></Shell>;
  }

  if (!user) {
    return (
      <Shell user={user} onSignIn={signIn} onSignOut={signOut}>
        <section style={wrap}>
          <Panel>
            <div style={eyebrow}>Private Passage workspace</div>
            <h1 style={h1}>Sign in to continue.</h1>
            <p style={lead}>This area is restricted to Passage system operators. Customer dashboards, vendor portals, and participant requests live outside this admin cabinet.</p>
            <button onClick={signIn} style={primaryButton}>Sign in with Google</button>
            {authError && <div style={{ marginTop: 12, background: C.roseFaint, border: `1px solid ${C.rose}33`, color: C.rose, borderRadius: 12, padding: '10px 12px', fontSize: 13.5, lineHeight: 1.45 }}>{authError}</div>}
          </Panel>
        </section>
      </Shell>
    );
  }

  if (!admin) {
    return (
      <Shell user={user} onSignIn={signIn} onSignOut={signOut}>
        <section style={wrap}>
          <Panel>
            <div style={eyebrow}>System Admin</div>
            <h1 style={h1}>This account is not a Passage system admin.</h1>
            <p style={lead}>Customer account admins use their own dashboard. Passage internal tools are intentionally separated.</p>
            <Link href="/funeral-home/dashboard" style={secondaryLink}>Open customer dashboard</Link>
          </Panel>
        </section>
      </Shell>
    );
  }

  return (
    <Shell user={user} onSignIn={signIn} onSignOut={signOut}>
      <section style={wrap}>
        <div style={eyebrow}>Passage System Admin</div>
        <h1 style={h1}>Owner tool cabinet.</h1>
        <p style={lead}>One internal surface for roadmap, QA, pilot health, automation readiness, abuse controls, refresh limits, metrics, and setup actions. Public and persona-facing pages should never carry this operating language.</p>

        <Panel tone="sage">
          <div style={eyebrow}>Launch rules</div>
          <div style={ruleGrid}>{launchRules.map(rule => <div key={rule} style={ruleCard}>{rule}</div>)}</div>
        </Panel>

        <Panel>
          <div style={eyebrow}>Internal tool cabinet</div>
          <h2 style={h2}>Open the category you need.</h2>
          <div style={{ display: 'grid', gap: 12 }}>{toolSections.map((section, index) => <ToolSection key={section.title} section={section} open={index === 0} />)}</div>
        </Panel>

        <Panel>
          <div style={eyebrow}>Readiness checks</div>
          <h2 style={h2}>Run proof before demos, pilots, and public pushes.</h2>
          <div style={checkGrid}>
            <CheckButton label="Public surface" running={runningKey === 'public'} disabled={Boolean(runningKey) || checkCooldownSeconds('public') > 0} cooldown={checkCooldownSeconds('public')} onClick={() => runCheck('public', 'Public surface', '/api/system/publicSurfaceReadiness')} />
            <CheckButton label="Workflow smoke" running={runningKey === 'spine'} disabled={Boolean(runningKey) || checkCooldownSeconds('spine') > 0} cooldown={checkCooldownSeconds('spine')} onClick={() => runCheck('spine', 'Spine smoke', '/api/system/orchestrationSmokeTest', { method: 'POST', body: { recipientEmail: user?.email || 'steventurrisi@gmail.com', keepRecords: false } })} />
            <CheckButton label="Payment + CRM" running={runningKey === 'payment'} disabled={Boolean(runningKey) || checkCooldownSeconds('payment') > 0} cooldown={checkCooldownSeconds('payment')} onClick={() => runCheck('payment', 'Payment + CRM', '/api/system/paymentCrmReadiness')} />
            <CheckButton label="CRM routing" running={runningKey === 'crm'} disabled={Boolean(runningKey) || checkCooldownSeconds('crm') > 0} cooldown={checkCooldownSeconds('crm')} onClick={() => runCheck('crm', 'CRM routing', '/api/system/crmRoutingReadiness')} />
            <CheckButton label="Compliance" running={runningKey === 'compliance'} disabled={Boolean(runningKey) || checkCooldownSeconds('compliance') > 0} cooldown={checkCooldownSeconds('compliance')} onClick={() => runCheck('compliance', 'Compliance', '/api/system/complianceReadiness')} />
            <CheckButton label="Mobile scope" running={runningKey === 'mobile'} disabled={Boolean(runningKey) || checkCooldownSeconds('mobile') > 0} cooldown={checkCooldownSeconds('mobile')} onClick={() => runCheck('mobile', 'Mobile scope', '/api/system/mobileCompanionReadiness')} />
          </div>
          {Object.values(checkResults).filter(Boolean).length > 0 && (
            <div style={{ display: 'grid', gap: 9, marginTop: 14 }}>
              {Object.entries(checkResults).filter(([, result]) => result).map(([key, result]) => <CheckResult key={key} result={result} />)}
            </div>
          )}
        </Panel>

        <Panel>
          <div style={eyebrow}>Business health</div>
          <h2 style={h2}>Thirty-day operating snapshot.</h2>
          {metricsError && <div style={{ ...smallText, color: C.rose }}>{metricsError}</div>}
          <div style={metricGrid}>
            {(metrics?.metrics || []).slice(0, 8).map(item => <MetricCard key={item.label} label={item.label} value={formatMetric(item)} source={item.source} muted={item.status !== 'real'} />)}
            {!(metrics?.metrics || []).length && ['ARR / MRR', 'Pilot customers', 'Leads by source', 'Tasks by account', 'Exports', 'Notifications'].map(label => <MetricCard key={label} label={label} value="Pending" muted />)}
          </div>
        </Panel>

        <Panel>
          <div style={eyebrow}>Partner setup</div>
          <h2 style={h2}>Invite a funeral-home workspace.</h2>
          <PartnerInviteForm draft={partnerInviteDraft} setDraft={setPartnerInviteDraft} onSubmit={sendPartnerInvite} loading={partnerInviteLoading} result={partnerInviteResult} />
        </Panel>

        <Panel>
          <div style={eyebrow}>Vendor setup</div>
          <h2 style={h2}>Create a reviewed vendor record.</h2>
          <VendorSetupForm draft={vendorSetupDraft} setDraft={setVendorSetupDraft} onSubmit={submitVendorSetup} loading={vendorSetupLoading} result={vendorSetupResult} />
        </Panel>
      </section>
    </Shell>
  );
}

function Shell({ children, user, onSignIn, onSignOut }) {
  return <main style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: 'Georgia,serif' }}><SiteHeader user={user} onSignIn={onSignIn} onSignOut={onSignOut} />{children}<SiteFooter /></main>;
}

function Panel({ children, tone = 'default' }) {
  return <section style={{ background: tone === 'sage' ? C.sageFaint : C.card, border: '1px solid ' + (tone === 'sage' ? '#c8deca' : C.border), borderRadius: 18, padding: 22, boxShadow: '0 4px 20px rgba(0,0,0,.04)', marginTop: 18 }}>{children}</section>;
}

function ToolSection({ section, open }) {
  return (
    <details id={section.title === 'Funeral-home QA and persona UAT' ? 'demo-studio' : undefined} open={open} style={accordionPanel}>
      <summary style={accordionSummary}>
        <span>{section.title}</span>
        <span style={countPill}>{section.tools.length} tools</span>
      </summary>
      <p style={{ ...smallText, margin: '10px 0 12px' }}>{section.summary}</p>
      <div style={toolGrid}>{section.tools.map(([title, href, body]) => <ToolLink key={href + title} title={title} href={href} body={body} />)}</div>
    </details>
  );
}

function ToolLink({ title, href, body }) {
  return (
    <Link href={href} target={href.startsWith('/api/') ? '_blank' : undefined} style={toolCard}>
      <strong style={{ color: C.ink }}>{title}</strong>
      <span style={{ ...smallText, marginTop: 4 }}>{body}</span>
      <span style={{ color: C.sage, fontSize: 12.5, fontWeight: 900, marginTop: 4 }}>Open</span>
    </Link>
  );
}

function CheckButton({ label, running, disabled, cooldown = 0, onClick }) {
  const text = running ? 'Running...' : cooldown > 0 ? `${label} (${cooldown}s)` : label;
  return <button type="button" onClick={onClick} disabled={disabled || running} title={cooldown > 0 ? 'Cooldown prevents repeated readiness refreshes.' : ''} style={{ ...secondaryButton, opacity: disabled || running ? .62 : 1 }}>{text}</button>;
}

function CheckResult({ result }) {
  const json = result.json || {};
  const blockers = json.blockers || json.errors || [];
  const warnings = json.warnings || [];
  return (
    <div style={{ background: result.ok ? C.sageFaint : C.roseFaint, border: '1px solid ' + (result.ok ? '#c8deca' : '#efc7c7'), borderRadius: 13, padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <strong style={{ color: result.ok ? C.sage : C.rose }}>{result.label}</strong>
        <span style={countPill}>Status {result.status}</span>
      </div>
      <p style={{ ...smallText, marginTop: 6 }}>{json.status || json.message || json.error || (result.ok ? 'Ready' : 'Needs review')}</p>
      {Array.isArray(blockers) && blockers.length > 0 && <p style={{ ...smallText, color: C.rose }}>Blockers: {blockers.slice(0, 3).join(' | ')}</p>}
      {Array.isArray(warnings) && warnings.length > 0 && <p style={{ ...smallText, color: C.amber }}>Warnings: {warnings.slice(0, 3).join(' | ')}</p>}
    </div>
  );
}

function MetricCard({ label, value, source, muted = false }) {
  return <div style={muted ? mutedMetricCard : metricCard}><div style={eyebrow}>{source || 'Metric'}</div><strong style={{ display: 'block', color: C.ink, fontSize: 24, lineHeight: 1.05, marginTop: 6 }}>{value}</strong><div style={{ ...smallText, marginTop: 5 }}>{label}</div></div>;
}

function PartnerInviteForm({ draft, setDraft, onSubmit, loading, result }) {
  const plan = partnerPlanFor(draft.planId);
  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: 10 }}>
      <div style={formGrid}>
        <input value={draft.organizationName} onChange={event => setDraft(prev => ({ ...prev, organizationName: event.target.value }))} placeholder="Funeral home name" style={inputStyle} />
        <input value={draft.directorName} onChange={event => setDraft(prev => ({ ...prev, directorName: event.target.value }))} placeholder="Director / owner name" style={inputStyle} />
        <input value={draft.directorEmail} onChange={event => setDraft(prev => ({ ...prev, directorEmail: event.target.value }))} placeholder="director@funeralhome.com" style={inputStyle} />
        <select value={draft.planId} onChange={event => setDraft(prev => ({ ...prev, planId: event.target.value }))} style={inputStyle} aria-label="Funeral home subscription type">
          {Object.values(FUNERAL_HOME_PLAN_OPTIONS).map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
        </select>
        <input value={draft.supportPhone} onChange={event => setDraft(prev => ({ ...prev, supportPhone: event.target.value }))} placeholder="Support phone" style={inputStyle} />
        <input value={draft.supportEmail} onChange={event => setDraft(prev => ({ ...prev, supportEmail: event.target.value }))} placeholder="Family support email" style={inputStyle} />
      </div>
      <div style={infoBox}><strong>{plan.label}:</strong> {plan.description} Includes {plan.includedLocationSlots} location slot{plan.includedLocationSlots === 1 ? '' : 's'}; additional locations are {money(plan.additionalLocationFeeCents / 100)}/mo.</div>
      <button type="submit" disabled={loading} style={{ ...primaryButton, justifySelf: 'start', opacity: loading ? .62 : 1 }}>{loading ? 'Sending invite...' : 'Create workspace + send invite'}</button>
      {result && <ResultBox result={result} success="Invite ready" failure="Invite failed" />}
    </form>
  );
}

function VendorSetupForm({ draft, setDraft, onSubmit, loading, result }) {
  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: 10 }}>
      <div style={formGrid}>
        <input value={draft.businessName} onChange={event => setDraft(prev => ({ ...prev, businessName: event.target.value }))} placeholder="Vendor business name" style={inputStyle} />
        <select value={draft.category} onChange={event => setDraft(prev => ({ ...prev, category: event.target.value }))} style={inputStyle}>
          {Object.entries(VENDOR_CATEGORIES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <input value={draft.email} onChange={event => setDraft(prev => ({ ...prev, email: event.target.value }))} placeholder="vendor@email.com" style={inputStyle} />
        <input value={draft.phone} onChange={event => setDraft(prev => ({ ...prev, phone: event.target.value }))} placeholder="Support phone" style={inputStyle} />
        <input value={draft.zipCodes} onChange={event => setDraft(prev => ({ ...prev, zipCodes: event.target.value }))} placeholder="ZIPs served, comma separated" style={inputStyle} />
        <input value={draft.website} onChange={event => setDraft(prev => ({ ...prev, website: event.target.value }))} placeholder="Website" style={inputStyle} />
      </div>
      <textarea value={draft.description} onChange={event => setDraft(prev => ({ ...prev, description: event.target.value }))} placeholder="How this vendor helps families" style={{ ...inputStyle, minHeight: 78, resize: 'vertical' }} />
      <button type="submit" disabled={loading} style={{ ...primaryButton, justifySelf: 'start', opacity: loading ? .62 : 1 }}>{loading ? 'Creating vendor...' : 'Create vendor for review'}</button>
      {result && <ResultBox result={result} success="Vendor created" failure="Vendor setup failed" />}
    </form>
  );
}

function ResultBox({ result, success, failure }) {
  return (
    <div style={{ background: result.ok ? C.sageFaint : C.roseFaint, border: '1px solid ' + (result.ok ? '#c8deca' : '#efc7c7'), borderRadius: 13, padding: 12 }}>
      <div style={{ color: result.ok ? C.sage : C.rose, fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>{result.ok ? success : failure}</div>
      <div style={{ ...smallText, marginTop: 5 }}>{result.json?.message || result.json?.error || (result.ok ? 'Action completed.' : 'Action needs review.')}</div>
      {result.json?.inviteUrl && <input readOnly value={result.json.inviteUrl} style={{ ...inputStyle, width: '100%', marginTop: 8 }} />}
    </div>
  );
}

function formatMetric(item) {
  if (item?.value == null) return 'N/A';
  if (item?.unit === 'cents') return '$' + (Number(item.value || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return item.value;
}

const wrap = { maxWidth: 1120, margin: '0 auto', padding: '34px 18px 78px' };
const eyebrow = { color: C.sage, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900 };
const h1 = { fontSize: 52, lineHeight: 1.04, margin: '8px 0 10px', fontWeight: 400, maxWidth: 820 };
const h2 = { fontSize: 28, lineHeight: 1.12, margin: '8px 0 12px', fontWeight: 400 };
const lead = { color: C.mid, fontSize: 16, lineHeight: 1.6, margin: 0, maxWidth: 780 };
const smallText = { color: C.mid, fontSize: 14, lineHeight: 1.5, marginTop: 8 };
const primaryButton = { border: 'none', background: C.sage, color: '#fff', borderRadius: 13, minHeight: 48, padding: '0 18px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' };
const secondaryButton = { border: '1px solid ' + C.border, background: C.card, color: C.sage, borderRadius: 13, minHeight: 44, padding: '0 15px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' };
const secondaryLink = { border: '1px solid ' + C.border, background: C.card, color: C.sage, borderRadius: 13, minHeight: 48, padding: '0 18px', fontFamily: 'Georgia,serif', fontWeight: 900, display: 'inline-flex', alignItems: 'center', textDecoration: 'none', marginTop: 16 };
const ruleGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 10, marginTop: 12 };
const ruleCard = { background: C.card, border: '1px solid ' + C.border, borderRadius: 13, padding: 12, color: C.ink, fontSize: 13.5, lineHeight: 1.45, fontWeight: 800 };
const accordionPanel = { background: C.bg, border: '1px solid ' + C.border, borderRadius: 14, padding: 14 };
const accordionSummary = { cursor: 'pointer', color: C.ink, fontSize: 16, fontWeight: 900, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' };
const toolGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 };
const toolCard = { background: C.card, border: '1px solid ' + C.border, borderRadius: 13, padding: 12, color: C.ink, textDecoration: 'none', display: 'grid', gap: 2 };
const countPill = { background: C.sageFaint, color: C.sage, border: '1px solid #c8deca', borderRadius: 999, padding: '5px 8px', fontSize: 12, fontWeight: 900, whiteSpace: 'nowrap' };
const checkGrid = { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 };
const metricGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginTop: 12 };
const metricCard = { background: C.sageFaint, border: '1px solid #c8deca', borderRadius: 13, padding: 12 };
const mutedMetricCard = { background: C.amberFaint, border: '1px solid #ead8b8', borderRadius: 13, padding: 12 };
const formGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 9 };
const inputStyle = { border: '1px solid ' + C.border, background: C.bg, borderRadius: 12, padding: '11px 12px', color: C.ink, fontFamily: 'Georgia,serif', fontSize: 14 };
const infoBox = { background: C.sageFaint, border: '1px solid #c8deca', borderRadius: 13, padding: '10px 11px', color: C.mid, fontSize: 12.5, lineHeight: 1.5 };
