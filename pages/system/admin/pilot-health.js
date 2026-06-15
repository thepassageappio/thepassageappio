import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseBrowser';
import { SiteFooter, SiteHeader } from '../../../components/SiteChrome';

const C = { bg: '#f6f3ee', card: '#fff', ink: '#1a1916', mid: '#6a6560', border: '#e4ddd4', sage: '#6b8f71', sageFaint: '#f0f5f1', amber: '#b07d2e', amberFaint: '#fdf8ee', rose: '#c47a7a', roseFaint: '#fdf3f3' };
const SYSTEM_ADMIN_EMAILS = ['steventurrisi@gmail.com'];
const LAUNCH_GRADE_LABELS = {
  retention_ready: 'Retention ready',
  conversion_ready: 'Conversion ready',
  proof_ready: 'Proof ready',
  clear_blockers: 'Clear blockers',
  needs_proof: 'Needs proof',
  needs_activation: 'Needs activation',
};
const SPRINT_TWO = [
  ['1', 'Activate one funeral-home workspace', 'Owner, staff member, location, decision maker, and billing plan are visible.'],
  ['2', 'Create the first real case', 'A director can create or import a case in under five minutes with family contact and next action.'],
  ['3', 'Move one task through the spine', 'Assigned, waiting, blocked, handled, and proof states are visible to the right persona.'],
  ['4', 'Send one approved family update', 'The coordinator sees recipient, channel, proof, and next expected update before conversion ask.'],
  ['5', 'Export proof back out', 'CSV or packet export proves Passage does not trap the funeral-home record.'],
  ['6', 'Convert or disqualify', 'Pilot either enters paid Local/Group plan or gets a named product blocker.'],
];
function normalizeEmail(email) { return String(email || '').trim().toLowerCase(); }
function isSystemAdmin(user) { return SYSTEM_ADMIN_EMAILS.includes(normalizeEmail(user?.email)); }
function money(value) { return Number(value || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }); }
function launchGradeLabel(grade) { return LAUNCH_GRADE_LABELS[grade] || 'Needs review'; }
function readinessTone(readiness) {
  const grade = readiness?.launchGrade || '';
  if (grade === 'conversion_ready' || grade === 'retention_ready' || grade === 'proof_ready') return 'good';
  if (grade === 'clear_blockers') return 'risk';
  return 'warn';
}
function conversionTone(conversion) {
  if (conversion?.tone === 'good' || conversion?.status === 'ask_now' || conversion?.status === 'retain') return 'good';
  if (conversion?.tone === 'risk' || conversion?.status === 'clear_blocker') return 'risk';
  return 'warn';
}

export default function PilotHealthPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

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
      const response = await fetch('/api/system/funeralHomePilotHealth', { headers: token ? { Authorization: 'Bearer ' + token } : {} });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) { setError(json.error || 'Pilot health could not load.'); setResult(null); return; }
      setResult(json);
    } catch (err) {
      setError(err.message || 'Pilot health could not load.'); setResult(null);
    } finally { setChecking(false); }
  }

  useEffect(() => { if (admin) runCheck(); }, [admin]);

  if (loading) return <Shell user={user}><Panel>Loading funeral-home pilot health...</Panel></Shell>;
  if (!admin) return <Shell user={user}><Panel><div style={eyebrow}>Owner-only health</div><h1 style={h1}>This pilot dashboard is restricted.</h1><p style={lead}>Sign in with the Passage owner account to view funeral-home pilot health.</p><button onClick={signIn} style={primaryButton}>Sign in</button></Panel></Shell>;

  const totals = result?.totals || {};
  const rows = result?.rows || [];
  const projectedArr = Number(totals.projectedArr ?? totals.arrPotential ?? 0);
  const remainingGap = Number(totals.remainingGapTo300kArr ?? totals.gapTo300kArr ?? Math.max(0, 300000 - projectedArr));
  const accountsNeededAtLocal = Math.max(0, Math.ceil(remainingGap / (249.99 * 12)));
  const accountsNeededAtGroup = Math.max(0, Math.ceil(remainingGap / (349.99 * 12)));

  return (
    <Shell user={user} onSignOut={signOut}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div><div style={eyebrow}>System admin / pilot health</div><h1 style={h1}>Turn funeral-home pilots into measurable ARR.</h1><p style={lead}>This control room shows partner accounts, current stage, next action, usage proof, subscription status, ARR potential, and blockers toward the $300k target.</p></div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><button onClick={runCheck} disabled={checking} style={primaryButton}>{checking ? 'Refreshing...' : 'Refresh'}</button><Link href="/system/admin/conversion-plan" style={secondaryLink}>Conversion plan</Link><Link href="/system/admin/saas-roadmap" style={secondaryLink}>SaaS roadmap</Link><Link href="/funeral-home/pilot-proof" style={secondaryLink}>Sample console</Link></div>
      </div>
      {error && <Panel tone="risk"><strong>{error}</strong></Panel>}
      {result && <section style={grid4}>
        <Metric label="Accounts" value={totals.accounts || 0} />
        <Metric label="Paid ARR" value={money(totals.paidArr || 0)} />
        <Metric label="Ask-ready ARR" value={money(totals.askReadyArr || 0)} />
        <Metric label="Projected ARR" value={money(projectedArr)} />
        <Metric label="Gap to $300k" value={money(remainingGap)} />
        <Metric label="Ask-ready accounts" value={totals.askReadyAccounts || 0} />
        <Metric label="Local accounts needed" value={accountsNeededAtLocal} />
        <Metric label="Group accounts needed" value={accountsNeededAtGroup} />
        <Metric label="Cases coordinated" value={totals.cases || 0} />
        <Metric label="Proof events" value={totals.proofEvents || 0} />
        <Metric label="Family updates" value={totals.familyUpdates || 0} />
        <Metric label="Readiness score" value={(totals.averageReadinessScore || 0) + '/100'} />
        <Metric label="Export-ready pilots" value={totals.exportReadyAccounts || 0} />
        <Metric label="Open task spine" value={totals.openTasks || 0} />
        <Metric label="Waiting / blocked" value={(totals.waitingTasks || 0) + ' / ' + (totals.blockedTasks || 0)} />
      </section>}
      <Panel tone="sage">
        <div style={eyebrow}>Sprint 2 / activation engine</div>
        <h2 style={h2}>The next sprint is not more planning. It is one complete paid-pilot proof loop.</h2>
        <p style={lead}>The business target is simple: prove the workflow with one funeral home, turn proof into conversion, then repeat until the gap to $300k ARR is closed.</p>
        <div style={sprintGrid}>{SPRINT_TWO.map(([number, title, body]) => <div key={title} style={stepCard}><span style={stepNumber}>{number}</span><strong>{title}</strong><p>{body}</p></div>)}</div>
      </Panel>
      <Panel>
        <div style={eyebrow}>Account health</div>
        <h2 style={h2}>Every pilot needs a stage, blocker, and next action.</h2>
        <div style={{ display: 'grid', gap: 12 }}>
          {rows.length ? rows.map(row => <AccountCard key={row.organizationId} row={row} />) : <div style={subPanel}>No funeral-home organizations found yet. First target: create one pilot workspace and drive it to first case, first staff assignment, first proof, first family update, and first export.</div>}
        </div>
      </Panel>
      <Panel tone="sage"><div style={eyebrow}>Conversion rule</div><h2 style={h2}>A pilot is not healthy until value is visible.</h2><p style={lead}>Move each account from invited to active to value-proven to paid. The conversion ask should happen when there are real cases, staff usage, proof events, and family updates, not just a signed-in account.</p></Panel>
    </Shell>
  );
}

function Shell({ children, user, onSignOut }) { return <main style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: 'Georgia,serif' }}><SiteHeader user={user} onSignOut={onSignOut} /><section style={wrap}>{children}</section><SiteFooter /></main>; }
function Panel({ children, tone = 'default' }) { const risk = tone === 'risk'; return <section style={{ background: risk ? C.roseFaint : tone === 'sage' ? C.sageFaint : C.card, border: '1px solid ' + (risk ? '#efc7c7' : tone === 'sage' ? '#c8deca' : C.border), borderRadius: 18, padding: 22, boxShadow: '0 4px 20px rgba(0,0,0,.04)', marginTop: 18 }}>{children}</section>; }
function Metric({ label, value }) { return <div style={metricCard}><div style={eyebrow}>{label}</div><strong style={{ display: 'block', fontSize: 25, marginTop: 8 }}>{value}</strong></div>; }
function AccountCard({ row }) {
  const readiness = row.readiness || {};
  const conversion = row.conversion || {};
  const tone = readinessTone(readiness);
  const readinessPill = tone === 'good' ? goodPill : tone === 'risk' ? riskPill : warnPill;
  const askTone = conversionTone(conversion);
  const askPill = askTone === 'good' ? goodPill : askTone === 'risk' ? riskPill : warnPill;
  const evidenceRows = [
    ['Waiting', readiness.waitingDetail],
    ['Blocked', readiness.blockedDetail],
    ['Recent proof', readiness.recentProofDetail],
  ].filter(([, items]) => items?.length);
  return (
    <div style={subPanel}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div><div style={eyebrow}>{row.stage}</div><h3 style={h3}>{row.name}</h3></div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <span style={readinessPill}>{launchGradeLabel(readiness.launchGrade)}</span>
          {conversion.label && <span style={askPill}>{conversion.label}</span>}
          <span style={row.stage === 'paid_active' || row.stage === 'value_proven' ? goodPill : warnPill}>{row.subscription?.status || 'no billing row'}</span>
        </div>
      </div>
      <p style={smallText}><strong>Next:</strong> {row.nextAction}</p>
      <div style={miniGrid}>
        <Metric label="Cases" value={row.metrics?.cases || 0} />
        <Metric label="Staff" value={row.metrics?.staff || 0} />
        <Metric label="Proof" value={row.metrics?.proofEvents || 0} />
        <Metric label="Readiness" value={(readiness.score || 0) + '/100'} />
        <Metric label="Export ready" value={readiness.exportReady ? 'Yes' : 'No'} />
        <Metric label="Target plan" value={conversion.targetPlanLabel || 'Not set'} />
        <Metric label="Ask ARR" value={money(conversion.askReadyArr || conversion.paidArr || 0)} />
        <Metric label="Open / handled" value={(readiness.openTasks || 0) + ' / ' + (readiness.handledTasks || 0)} />
        <Metric label="Waiting / blocked" value={(readiness.waitingTasks || 0) + ' / ' + (readiness.blockedTasks || 0)} />
        <Metric label="ARR potential" value={money(row.metrics?.arrPotential || 0)} />
      </div>
      {evidenceRows.length ? <div style={innerPanel}><div style={eyebrow}>Export evidence</div>{evidenceRows.map(([label, items]) => <div key={label} style={evidenceRow}><strong>{label}</strong><ul style={ul}>{items.map(item => <li key={item}>{item}</li>)}</ul></div>)}</div> : null}
      {row.blockers?.length ? <div style={innerPanel}><div style={eyebrow}>Blockers become Sprint 2 actions</div><ul style={ul}>{row.blockers.map(item => <li key={item}>{item}</li>)}</ul></div> : <div style={innerPanel}><strong>Value signal is present. Next action: ask for paid conversion or expansion.</strong></div>}
    </div>
  );
}

const wrap = { maxWidth: 1120, margin: '0 auto', padding: '42px 18px 80px' };
const grid4 = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginTop: 20 };
const miniGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginTop: 12 };
const sprintGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginTop: 16 };
const eyebrow = { color: C.sage, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900 };
const h1 = { fontSize: 50, lineHeight: 1.04, margin: '8px 0 10px', fontWeight: 400, maxWidth: 880 };
const h2 = { fontSize: 28, lineHeight: 1.12, margin: '8px 0 10px', fontWeight: 400 };
const h3 = { color: C.ink, fontSize: 22, lineHeight: 1.15, margin: '6px 0 0', fontWeight: 900 };
const lead = { color: C.mid, fontSize: 16, lineHeight: 1.6, margin: 0, maxWidth: 780 };
const smallText = { color: C.mid, fontSize: 14, lineHeight: 1.5, margin: '8px 0 0' };
const primaryButton = { border: 'none', background: C.sage, color: '#fff', borderRadius: 13, minHeight: 44, padding: '0 16px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' };
const secondaryLink = { border: '1px solid ' + C.border, background: C.card, color: C.sage, borderRadius: 13, minHeight: 44, padding: '0 16px', fontFamily: 'Georgia,serif', fontWeight: 900, display: 'inline-flex', alignItems: 'center', textDecoration: 'none' };
const metricCard = { background: C.card, border: '1px solid ' + C.border, borderRadius: 16, padding: 14, boxShadow: '0 4px 20px rgba(0,0,0,.025)' };
const subPanel = { background: C.bg, border: '1px solid ' + C.border, borderRadius: 14, padding: 14 };
const innerPanel = { background: C.card, border: '1px solid ' + C.border, borderRadius: 12, padding: 12, marginTop: 12 };
const stepCard = { background: C.card, border: '1px solid ' + C.border, borderRadius: 14, padding: 13, minHeight: 132 };
const stepNumber = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 999, background: C.sageFaint, color: C.sage, border: '1px solid #c8deca', fontSize: 12, fontWeight: 900, marginBottom: 8 };
const ul = { margin: '8px 0 0', paddingLeft: 18, color: C.mid, fontSize: 13, lineHeight: 1.45 };
const goodPill = { background: C.sageFaint, color: C.sage, border: '1px solid #c8deca', borderRadius: 999, padding: '5px 8px', fontSize: 12, fontWeight: 900, height: 'fit-content' };
const warnPill = { background: C.amberFaint, color: C.amber, border: '1px solid #ead8b8', borderRadius: 999, padding: '5px 8px', fontSize: 12, fontWeight: 900, height: 'fit-content' };
const riskPill = { background: C.roseFaint, color: C.rose, border: '1px solid #efc7c7', borderRadius: 999, padding: '5px 8px', fontSize: 12, fontWeight: 900, height: 'fit-content' };
const evidenceRow = { display: 'grid', gridTemplateColumns: '110px 1fr', gap: 8, alignItems: 'flex-start', marginTop: 8, color: C.mid, fontSize: 13, lineHeight: 1.45 };
