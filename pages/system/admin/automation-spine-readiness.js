import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseBrowser';
import { SiteFooter, SiteHeader } from '../../../components/SiteChrome';

const C = { bg: '#f6f3ee', card: '#fff', ink: '#1a1916', mid: '#6a6560', border: '#e4ddd4', sage: '#6b8f71', sageFaint: '#f0f5f1', amber: '#b07d2e', amberFaint: '#fdf8ee', rose: '#c47a7a', roseFaint: '#fdf3f3' };
const SYSTEM_ADMIN_EMAILS = ['steventurrisi@gmail.com'];
function normalizeEmail(email) { return String(email || '').trim().toLowerCase(); }
function isSystemAdmin(user) { return SYSTEM_ADMIN_EMAILS.includes(normalizeEmail(user?.email)); }
function toneFor(status) { if (status === 'ready' || status === 'healthy') return 'good'; if (status === 'blocked' || status === 'critical') return 'risk'; return 'warn'; }
function labelFor(status) { return String(status || 'needs_review').replace(/_/g, ' '); }

export default function AutomationSpineReadinessPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!supabase) { setLoading(false); return undefined; }
    supabase.auth.getSession().then(({ data }) => { setUser(data.session?.user || null); setLoading(false); });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => { setUser(session?.user || null); setLoading(false); });
    return () => data.subscription.unsubscribe();
  }, []);

  const admin = useMemo(() => isSystemAdmin(user), [user]);

  async function signIn() {
    if (!supabase || typeof window === 'undefined') return;
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.href } });
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
  }

  async function runCheck() {
    if (!supabase) return;
    setChecking(true); setError('');
    try {
      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token || '';
      const response = await fetch('/api/system/automationSpineReadiness', { headers: token ? { Authorization: 'Bearer ' + token } : {} });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) { setError(json.error || 'Task and message readiness could not load.'); setResult(null); return; }
      setResult(json);
    } catch (err) {
      setError(err.message || 'Task and message readiness could not load.'); setResult(null);
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => { if (admin) runCheck(); }, [admin]);

  if (loading) return <Shell user={user}><Panel>Loading task and message readiness...</Panel></Shell>;
  if (!admin) return <Shell user={user}><Panel><div style={eyebrow}>Owner-only task and message readiness</div><h1 style={h1}>This readiness view is restricted.</h1><p style={lead}>Sign in with the Passage owner account to inspect task, message, owner, waiting, delivery, and proof health.</p><button onClick={signIn} style={primaryButton}>Sign in</button></Panel></Shell>;

  const summary = result?.summary || {};
  const gates = result?.gates || [];
  const cases = result?.cases || [];
  const automation = result?.automation || {};
  const automationTone = (automation.automationReadyPercent || 0) >= 80 ? 'good' : (automation.automationReadyPercent || 0) >= 50 ? 'warn' : 'risk';
  const decisionTone = toneFor(result?.launchDecision);

  return (
    <Shell user={user} onSignOut={signOut}>
      <section style={wrap}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div><div style={eyebrow}>System admin / task and message readiness</div><h1 style={h1}>Tasks, messages, owners, and proof must be unmistakable.</h1><p style={lead}>Every card should answer: what needs to happen, who owns it, who or what is waiting, what message is prepared, what the family or vendor can see, and where proof saves.</p></div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><button onClick={runCheck} disabled={checking} style={primaryButton}>{checking ? 'Checking...' : 'Run check'}</button><Link href="/system/admin/pilot-health" style={secondaryLink}>Pilot Health</Link><Link href="/system/admin/conversion-plan" style={secondaryLink}>Conversion Plan</Link><Link href="/system/admin/funeral-home-qa" style={secondaryLink}>QA Gates</Link></div>
        </div>

        {error && <Panel tone="risk"><strong>{error}</strong></Panel>}
        {result && <Panel tone={decisionTone}><div style={eyebrow}>Readiness decision</div><h2 style={h2}>{labelFor(result.launchDecision)} / {result.readinessScore || 0}%</h2><p style={body}>Checked {new Date(result.checkedAt).toLocaleString()}. Refresh is intentionally limited to protect admin and integration routes.</p></Panel>}

        {result && <section style={grid4}>
          <Metric label="Active cases" value={summary.activeCases || 0} />
          <Metric label="Open tasks" value={summary.openTasks || 0} />
          <Metric label="Blocked" value={summary.blockedTasks || 0} />
          <Metric label="Stale open" value={summary.staleOpenTasks || 0} />
          <Metric label="Unassigned" value={summary.unassignedOpenTasks || 0} />
          <Metric label="Waiting" value={summary.waitingTasks || 0} />
          <Metric label="Proof gaps" value={summary.handledWithoutProof || 0} />
          <Metric label="Card clarity gaps" value={summary.cardContractGaps || 0} />
          <Metric label="Message route gaps" value={summary.messageRouteGaps || 0} />
          <Metric label="Automation ready" value={(summary.automationReadyPercent || 0) + '%'} />
          <Metric label="Automated" value={summary.automatedTasks || 0} />
          <Metric label="Semi-auto" value={summary.semiAutomatedTasks || 0} />
          <Metric label="Manual" value={summary.manualTasks || 0} />
          <Metric label="7-day events" value={summary.statusEventsLast7Days || 0} />
        </section>}

        {result && <Panel tone={automationTone}><div style={eyebrow}>Automation coverage</div><h2 style={h2}>{automation.automationReadyPercent || 0}% automated or semi-automated</h2><p style={body}>Automated: {automation.automated || 0}. Semi-automated: {automation.semiAutomated || 0}. Manual: {automation.manual || 0}. Manual work is acceptable only when the system can explain the blocker and the next owner.</p>{!!automation.topBlockers?.length && <ul style={list}>{automation.topBlockers.map(item => <li key={item.label}>{item.label}: {item.count}</li>)}</ul>}</Panel>}

        {result && <section style={sectionBlock}>
          <h2 style={h2}>Operating gates</h2>
          <div style={gateList}>{gates.map(item => <Gate key={item.id} item={item} />)}</div>
        </section>}

        {result && <Panel tone={automationTone}><div style={eyebrow}>Automation coverage</div><h2 style={h2}>{automation.automationReadyPercent || 0}% automated or semi-automated</h2><p style={body}>Automated: {automation.automated || 0}. Semi-automated: {automation.semiAutomated || 0}. Manual: {automation.manual || 0}. Manual work is acceptable only when the system can explain the blocker and the next owner.</p>{!!automation.topBlockers?.length && <ul style={list}>{automation.topBlockers.map(item => <li key={item.label}>{item.label}: {item.count}</li>)}</ul>}</Panel>}

        {result && <section style={sectionBlock}>
          <h2 style={h2}>Cases that need attention</h2>
          {!cases.length && <Panel>No active cases were returned by the readiness check.</Panel>}
          <div style={caseGrid}>{cases.map(item => <CaseCard key={item.id} item={item} />)}</div>
        </section>}

        {!!result?.sourceErrors?.length && <Panel tone="warn"><strong>Schema fallback notes</strong><ul style={list}>{result.sourceErrors.map(item => <li key={item.source}>{item.source}: {item.error}</li>)}</ul></Panel>}
      </section>
    </Shell>
  );
}

function Shell({ children, user, onSignOut }) {
  return <><SiteHeader /><main style={{ minHeight: '100vh', background: C.bg, color: C.ink, padding: '42px 18px 72px' }}>{children}</main><SiteFooter /></>;
}

function Panel({ children, tone }) {
  const tones = { good: { borderColor: C.sage, background: C.sageFaint }, warn: { borderColor: C.amber, background: C.amberFaint }, risk: { borderColor: C.rose, background: C.roseFaint } };
  return <div style={{ ...panel, ...(tones[tone] || {}) }}>{children}</div>;
}

function Metric({ label, value }) {
  return <div style={metric}><div style={metricValue}>{value}</div><div style={metricLabel}>{label}</div></div>;
}

function Gate({ item }) {
  const tone = toneFor(item.status);
  return <div style={{ ...panel, ...(tone === 'good' ? { borderColor: C.sage } : tone === 'risk' ? { borderColor: C.rose } : { borderColor: C.amber }) }}><div style={{ ...pill, ...(tone === 'good' ? { color: C.sage } : tone === 'risk' ? { color: C.rose } : { color: C.amber }) }}>{labelFor(item.status)}</div><h3 style={h3}>{item.label}</h3><p style={body}>{item.proof}</p><p style={small}>{item.action}</p></div>;
}

function CaseCard({ item }) {
  const tone = toneFor(item.grade);
  const metrics = item.metrics || {};
  return <div style={{ ...panel, ...(tone === 'good' ? { borderColor: C.sage } : tone === 'risk' ? { borderColor: C.rose } : { borderColor: C.amber }) }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}><h3 style={h3}>{item.name}</h3><span style={pill}>{labelFor(item.grade)}</span></div><p style={small}>{item.nextAction}</p><div style={miniGrid}><Metric label="Open" value={metrics.openTasks || 0} /><Metric label="Auto ready" value={(metrics.automationReadyPercent || 0) + '%'} /><Metric label="Manual" value={metrics.manualTasks || 0} /></div>{!!item.risks?.length && <ul style={list}>{item.risks.map((risk, index) => <li key={index}>{risk}</li>)}</ul>}</div>;
}

const wrap = { maxWidth: 1180, margin: '0 auto', display: 'grid', gap: 18 };
const panel = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 18, boxShadow: '0 12px 30px rgba(26,25,22,0.05)' };
const sectionBlock = { display: 'grid', gap: 12 };
const grid4 = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12 };
const gateList = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 12 };
const caseGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 12 };
const miniGrid = { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 12 };
const metric = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 14 };
const metricValue = { fontSize: 28, fontWeight: 800, lineHeight: 1 };
const metricLabel = { marginTop: 6, color: C.mid, fontSize: 13 };
const h1 = { fontSize: 'clamp(32px,5vw,56px)', lineHeight: 1, margin: '8px 0 12px', maxWidth: 820 };
const h2 = { fontSize: 24, margin: '0 0 8px' };
const h3 = { fontSize: 18, margin: 0 };
const lead = { fontSize: 18, lineHeight: 1.5, color: C.mid, maxWidth: 840 };
const body = { fontSize: 15, lineHeight: 1.55, color: C.mid, margin: '8px 0 0' };
const small = { fontSize: 13, lineHeight: 1.45, color: C.mid, margin: '8px 0 0' };
const eyebrow = { textTransform: 'uppercase', letterSpacing: 0, fontSize: 12, color: C.mid, fontWeight: 800 };
const primaryButton = { border: 0, borderRadius: 8, background: C.ink, color: '#fff', padding: '11px 14px', fontWeight: 800, cursor: 'pointer' };
const secondaryLink = { border: `1px solid ${C.border}`, borderRadius: 8, background: C.card, color: C.ink, padding: '10px 12px', fontWeight: 800, textDecoration: 'none', display: 'inline-block' };
const pill = { border: `1px solid ${C.border}`, borderRadius: 999, padding: '5px 8px', fontSize: 12, fontWeight: 800, textTransform: 'capitalize', whiteSpace: 'nowrap' };
const list = { margin: '10px 0 0', paddingLeft: 18, color: C.mid, lineHeight: 1.5 };
