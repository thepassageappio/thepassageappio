import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseBrowser';
import { SiteFooter, SiteHeader } from '../../../components/SiteChrome';

const C = { bg: '#f6f3ee', card: '#fff', ink: '#1a1916', mid: '#6a6560', border: '#e4ddd4', sage: '#6b8f71', sageFaint: '#f0f5f1', amber: '#b07d2e', amberFaint: '#fdf8ee', rose: '#c47a7a', roseFaint: '#fdf3f3' };
const SYSTEM_ADMIN_EMAILS = ['steventurrisi@gmail.com'];
const PLAN_PRICES = {
  partner_local: { label: 'Single location', mrr: 249.99 },
  partner_group: { label: 'Multi-location', mrr: 349.99 },
};

function normalizeEmail(email) { return String(email || '').trim().toLowerCase(); }
function isSystemAdmin(user) { return SYSTEM_ADMIN_EMAILS.includes(normalizeEmail(user?.email)); }
function money(value) { return Number(value || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }); }
function planFromRow(row) {
  const current = String(row?.subscription?.planId || '').toLowerCase();
  if (current.includes('group') || current.includes('multi')) return { id: 'partner_group', ...PLAN_PRICES.partner_group };
  const staff = Number(row?.metrics?.staff || 0);
  const cases = Number(row?.metrics?.cases || 0);
  if (staff >= 3 || cases >= 5) return { id: 'partner_group', ...PLAN_PRICES.partner_group };
  return { id: 'partner_local', ...PLAN_PRICES.partner_local };
}
function conversionFor(row) {
  const readiness = row?.readiness || {};
  const plan = planFromRow(row);
  const stage = row?.stage || 'needs_activation';
  const launchGrade = readiness.launchGrade || 'needs_activation';
  if (stage === 'paid_active') {
    return { ...plan, status: 'Retain', tone: 'good', askReady: false, arr: plan.mrr * 12, action: 'Keep proof fresh, watch churn risk, and look for extra locations or staff seats.' };
  }
  if (launchGrade === 'conversion_ready' || launchGrade === 'proof_ready') {
    return { ...plan, status: 'Ask now', tone: 'good', askReady: true, arr: plan.mrr * 12, action: `Ask for ${plan.label} at ${money(plan.mrr)}/mo while the pilot proof is still warm.` };
  }
  if (launchGrade === 'clear_blockers') {
    return { ...plan, status: 'Clear blocker', tone: 'risk', askReady: false, arr: 0, action: 'Resolve the named blocker before making the paid conversion ask.' };
  }
  if (launchGrade === 'needs_proof') {
    return { ...plan, status: 'Prove value', tone: 'warn', askReady: false, arr: 0, action: 'Complete one family update, one handled proof event, and one export before asking for payment.' };
  }
  return { ...plan, status: 'Activate', tone: 'warn', askReady: false, arr: 0, action: 'Create the first case, add staff, and move one task through the spine.' };
}

function normalizeConversion(row) {
  const api = row?.conversion;
  if (!api?.targetPlanLabel) return conversionFor(row);
  return {
    ...api,
    displayStatus: api.label || api.status || 'Needs review',
    label: api.targetPlanLabel,
    mrr: Number(api.targetMrr || 0),
    arr: Number(api.targetArr || api.askReadyArr || api.paidArr || 0),
  };
}

export default function ConversionPlanPage() {
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

  async function refresh() {
    if (!supabase) return;
    setChecking(true); setError('');
    try {
      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token || '';
      const response = await fetch('/api/system/funeralHomePilotHealth', { headers: token ? { Authorization: 'Bearer ' + token } : {} });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) { setError(json.error || 'Conversion plan could not load.'); setResult(null); return; }
      const rows = (json.rows || []).map(row => ({ ...row, conversion: normalizeConversion(row) }));
      setResult({ ...json, rows });
    } catch (err) {
      setError(err.message || 'Conversion plan could not load.'); setResult(null);
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => { if (admin) refresh(); }, [admin]);

  if (loading) return <Shell user={user}><Panel>Loading conversion plan...</Panel></Shell>;
  if (!admin) return <Shell user={user}><Panel><div style={eyebrow}>Owner-only conversion plan</div><h1 style={h1}>This revenue plan is restricted.</h1><p style={lead}>Sign in with the Passage owner account to view funeral-home conversion asks.</p><button onClick={signIn} style={primaryButton}>Sign in</button></Panel></Shell>;

  const rows = result?.rows || [];
  const totals = result?.totals || {};
  const paidRows = rows.filter(row => row.stage === 'paid_active');
  const askReady = rows.filter(row => row.conversion?.askReady);
  const blocked = rows.filter(row => row.conversion?.tone === 'risk' || row.conversion?.status === 'clear_blocker');
  const fallbackPaidArr = paidRows.reduce((sum, row) => sum + Number(row.conversion?.paidArr || row.conversion?.arr || row.metrics?.arrPotential || 0), 0);
  const fallbackAskReadyArr = askReady.reduce((sum, row) => sum + Number(row.conversion?.askReadyArr || row.conversion?.arr || 0), 0);
  const paidArr = Number(totals.paidArr ?? fallbackPaidArr);
  const askReadyArr = Number(totals.askReadyArr ?? fallbackAskReadyArr);
  const projectedArr = Number(totals.projectedArr ?? (paidArr + askReadyArr));
  const remainingGap = Number(totals.remainingGapTo300kArr ?? Math.max(0, 300000 - projectedArr));

  return (
    <Shell user={user} onSignOut={signOut}>
      <section style={wrap}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div><div style={eyebrow}>System admin / conversion plan</div><h1 style={h1}>Turn proof-ready pilots into paid funeral-home ARR.</h1><p style={lead}>This page reads Pilot Health and names the next conversion action for every funeral-home account: ask now, prove value, clear blocker, activate, or retain.</p></div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><button onClick={refresh} disabled={checking} style={primaryButton}>{checking ? 'Refreshing...' : 'Refresh'}</button><Link href="/system/admin/pilot-health" style={secondaryLink}>Pilot Health</Link><Link href="/system/admin/saas-roadmap" style={secondaryLink}>Roadmap</Link></div>
        </div>
        {error && <Panel tone="risk"><strong>{error}</strong></Panel>}
        {result && <section style={grid4}>
          <Metric label="Paid ARR" value={money(paidArr)} />
          <Metric label="Ask-ready accounts" value={askReady.length} />
          <Metric label="Ask-ready ARR" value={money(askReadyArr)} />
          <Metric label="Projected ARR" value={money(projectedArr)} />
          <Metric label="Blocked asks" value={blocked.length} />
          <Metric label="Remaining $300k gap" value={money(remainingGap)} />
        </section>}
        <Panel tone="sage"><div style={eyebrow}>Conversion rule</div><h2 style={h2}>Do not ask because an account exists. Ask when proof is visible.</h2><p style={lead}>A healthy conversion ask needs real cases, staff use, proof or handled work, family update evidence, and an export path. If a blocker is named, clear it before pricing pressure enters the conversation.</p></Panel>
        <Panel>
          <div style={eyebrow}>Account asks</div>
          <h2 style={h2}>Each pilot gets one named revenue action.</h2>
          <div style={{ display: 'grid', gap: 12 }}>{rows.length ? rows.map(row => <AccountAsk key={row.organizationId} row={row} />) : <div style={subPanel}>No funeral-home organizations found yet. Create one pilot workspace, complete the first proof loop, then return here for the conversion ask.</div>}</div>
        </Panel>
      </section>
    </Shell>
  );
}

function Shell({ children, user, onSignOut }) { return <main style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: 'Georgia,serif' }}><SiteHeader user={user} onSignOut={onSignOut} />{children}<SiteFooter /></main>; }
function Panel({ children, tone = 'default' }) { const risk = tone === 'risk'; return <section style={{ background: risk ? C.roseFaint : tone === 'sage' ? C.sageFaint : C.card, border: '1px solid ' + (risk ? '#efc7c7' : tone === 'sage' ? '#c8deca' : C.border), borderRadius: 18, padding: 22, boxShadow: '0 4px 20px rgba(0,0,0,.04)', marginTop: 18 }}>{children}</section>; }
function Metric({ label, value }) { return <div style={metricCard}><div style={eyebrow}>{label}</div><strong style={{ display: 'block', fontSize: 25, marginTop: 8 }}>{value}</strong></div>; }
function AccountAsk({ row }) {
  const conversion = row.conversion || conversionFor(row);
  const pill = conversion.tone === 'good' ? goodPill : conversion.tone === 'risk' ? riskPill : warnPill;
  return <div style={subPanel}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}><div><div style={eyebrow}>{row.stage}</div><h3 style={h3}>{row.name}</h3></div><span style={pill}>{conversion.displayStatus || conversion.status}</span></div><p style={smallText}><strong>Action:</strong> {conversion.action}</p><div style={miniGrid}><Metric label="Target plan" value={conversion.label} /><Metric label="Target MRR" value={money(conversion.mrr)} /><Metric label="Target ARR" value={money(conversion.arr)} /><Metric label="Readiness" value={(row.readiness?.score || 0) + '/100'} /><Metric label="Cases" value={row.metrics?.cases || 0} /><Metric label="Proof" value={row.metrics?.proofEvents || 0} /><Metric label="Export ready" value={row.readiness?.exportReady ? 'Yes' : 'No'} /><Metric label="Waiting / blocked" value={(row.readiness?.waitingTasks || 0) + ' / ' + (row.readiness?.blockedTasks || 0)} /></div>{row.blockers?.length ? <div style={innerPanel}><div style={eyebrow}>Blockers</div><ul style={ul}>{row.blockers.map(item => <li key={item}>{item}</li>)}</ul></div> : null}</div>;
}

const wrap = { maxWidth: 1120, margin: '0 auto', padding: '42px 18px 80px' };
const grid4 = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12, marginTop: 20 };
const miniGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginTop: 12 };
const eyebrow = { color: C.sage, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900 };
const h1 = { fontSize: 50, lineHeight: 1.04, margin: '8px 0 10px', fontWeight: 400, maxWidth: 900 };
const h2 = { fontSize: 28, lineHeight: 1.12, margin: '8px 0 10px', fontWeight: 400 };
const h3 = { color: C.ink, fontSize: 22, lineHeight: 1.15, margin: '6px 0 0', fontWeight: 900 };
const lead = { color: C.mid, fontSize: 16, lineHeight: 1.6, margin: 0, maxWidth: 820 };
const smallText = { color: C.mid, fontSize: 14, lineHeight: 1.5, margin: '8px 0 0' };
const primaryButton = { border: 'none', background: C.sage, color: '#fff', borderRadius: 13, minHeight: 44, padding: '0 16px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' };
const secondaryLink = { border: '1px solid ' + C.border, background: C.card, color: C.sage, borderRadius: 13, minHeight: 44, padding: '0 16px', fontFamily: 'Georgia,serif', fontWeight: 900, display: 'inline-flex', alignItems: 'center', textDecoration: 'none' };
const metricCard = { background: C.card, border: '1px solid ' + C.border, borderRadius: 16, padding: 14, boxShadow: '0 4px 20px rgba(0,0,0,.025)' };
const subPanel = { background: C.bg, border: '1px solid ' + C.border, borderRadius: 14, padding: 14 };
const innerPanel = { background: C.card, border: '1px solid ' + C.border, borderRadius: 12, padding: 12, marginTop: 12 };
const ul = { margin: '8px 0 0', paddingLeft: 18, color: C.mid, fontSize: 13, lineHeight: 1.45 };
const goodPill = { background: C.sageFaint, color: C.sage, border: '1px solid #c8deca', borderRadius: 999, padding: '5px 8px', fontSize: 12, fontWeight: 900, height: 'fit-content' };
const warnPill = { background: C.amberFaint, color: C.amber, border: '1px solid #ead8b8', borderRadius: 999, padding: '5px 8px', fontSize: 12, fontWeight: 900, height: 'fit-content' };
const riskPill = { background: C.roseFaint, color: C.rose, border: '1px solid #efc7c7', borderRadius: 999, padding: '5px 8px', fontSize: 12, fontWeight: 900, height: 'fit-content' };
