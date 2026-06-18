import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseBrowser';
import { SiteFooter, SiteHeader } from '../../../components/SiteChrome';

const C = { bg: '#f6f3ee', card: '#fff', ink: '#1a1916', mid: '#6a6560', border: '#e4ddd4', sage: '#6b8f71', sageFaint: '#f0f5f1', amber: '#b07d2e', amberFaint: '#fdf8ee', rose: '#c47a7a', roseFaint: '#fdf3f3' };
const SYSTEM_ADMIN_EMAILS = ['steventurrisi@gmail.com'];
function normalizeEmail(email) { return String(email || '').trim().toLowerCase(); }
function isSystemAdmin(user) { return SYSTEM_ADMIN_EMAILS.includes(normalizeEmail(user?.email)); }
function toneFor(status) { if (status === 'ready' || status === 'enterprise_ready') return 'good'; if (status === 'blocked') return 'risk'; return 'warn'; }
function labelFor(value) { return String(value || 'needs_review').replace(/_/g, ' '); }
function money(value) { return Number(value || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }); }

export default function EnterpriseFuneralHomeReadinessPage() {
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
      const response = await fetch('/api/system/enterpriseFuneralHomeReadiness', { headers: token ? { Authorization: 'Bearer ' + token } : {} });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) { setError(json.error || 'Enterprise readiness could not load.'); setResult(null); return; }
      setResult(json);
    } catch (err) {
      setError(err.message || 'Enterprise readiness could not load.'); setResult(null);
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => { if (admin) runCheck(); }, [admin]);

  if (loading) return <Shell user={user}><Panel>Loading enterprise readiness...</Panel></Shell>;
  if (!admin) return <Shell user={user}><Panel><div style={eyebrow}>Owner-only enterprise readiness</div><h1 style={h1}>This B2B readiness gate is restricted.</h1><p style={lead}>Sign in with the Passage owner account to inspect funeral-home enterprise readiness.</p><button onClick={signIn} style={primaryButton}>Sign in</button></Panel></Shell>;

  const summary = result?.summary || {};
  const gates = result?.gates || [];
  const accounts = result?.accounts || [];

  return (
    <Shell user={user} onSignOut={signOut}>
      <section style={wrap}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div><div style={eyebrow}>System admin / enterprise funeral-home readiness</div><h1 style={h1}>B2B bones first. B2C gets easy when the funeral-home workflow is solid.</h1><p style={lead}>This owner-only gate checks whether funeral-home accounts have enterprise-grade structure: locations, roles, cases, work ownership, waiting clarity, proof trail, family updates, exports, billing, and controls.</p></div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><button onClick={runCheck} disabled={checking} style={primaryButton}>{checking ? 'Checking...' : 'Run check'}</button><Link href="/system/admin/automation-spine-readiness" style={secondaryLink}>Automation Readiness</Link><Link href="/system/admin/conversion-plan" style={secondaryLink}>Conversion Plan</Link><Link href="/system/admin/saas-roadmap" style={secondaryLink}>Roadmap</Link></div>
        </div>

        {error && <Panel tone="risk"><strong>{error}</strong></Panel>}
        {result && <Panel tone={toneFor(result.launchDecision)}><div style={eyebrow}>Enterprise decision</div><h2 style={h2}>{labelFor(result.launchDecision)} / {result.readinessScore || 0}%</h2><p style={body}>Checked {new Date(result.checkedAt).toLocaleString()}. This is the B2B gate before the family experience is asked to carry customer trust.</p></Panel>}

        {result && <section style={grid5}>
          <Metric label="Accounts" value={summary.accounts || 0} />
          <Metric label="Enterprise-ready" value={summary.enterpriseReady || 0} />
          <Metric label="Needs attention" value={summary.needsAttention || 0} />
          <Metric label="Blocked" value={summary.blocked || 0} />
          <Metric label="Projected ARR" value={money(summary.projectedArr || 0)} />
        </section>}

        {result && <section style={sectionBlock}>
          <h2 style={h2}>Platform gates</h2>
          <div style={gateList}>{gates.map(item => <Gate key={item.id} item={item} />)}</div>
        </section>}

        {result && <section style={sectionBlock}>
          <h2 style={h2}>Funeral-home account readiness</h2>
          {!accounts.length && <Panel>No funeral-home-like organizations were returned by the check.</Panel>}
          <div style={accountGrid}>{accounts.map(account => <AccountCard key={account.id} account={account} />)}</div>
        </section>}

        {!!result?.sourceErrors?.length && <Panel tone="warn"><strong>Schema notes</strong><ul style={list}>{result.sourceErrors.map(item => <li key={item.source}>{item.source}: {item.error}</li>)}</ul></Panel>}
      </section>
    </Shell>
  );
}

function Shell({ children, user, onSignOut }) {
  return <><SiteHeader user={user} onSignOut={onSignOut} /><main style={{ minHeight: '100vh', background: C.bg, color: C.ink, padding: '42px 18px 72px' }}>{children}</main><SiteFooter /></>;
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

function AccountCard({ account }) {
  const metrics = account.metrics || {};
  const tone = toneFor(account.status);
  return <div style={{ ...panel, ...(tone === 'good' ? { borderColor: C.sage } : tone === 'risk' ? { borderColor: C.rose } : { borderColor: C.amber }) }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}><div><h3 style={h3}>{account.name}</h3><p style={small}>{labelFor(account.plan)} / {money(Number(account.mrr || 0) * 12)} ARR signal</p></div><span style={pill}>{account.readinessScore}%</span></div><p style={body}>{account.nextAction}</p><div style={miniGrid}><Metric label="Locations" value={metrics.locations || 0} /><Metric label="Staff" value={metrics.staff || 0} /><Metric label="Cases" value={metrics.cases || 0} /><Metric label="Open" value={metrics.openTasks || 0} /><Metric label="Blocked" value={metrics.blockedTasks || 0} /><Metric label="Proof" value={metrics.proofEvents || 0} /></div></div>;
}

const wrap = { maxWidth: 1180, margin: '0 auto', display: 'grid', gap: 18 };
const panel = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 18, boxShadow: '0 12px 30px rgba(26,25,22,0.05)' };
const sectionBlock = { display: 'grid', gap: 12 };
const grid5 = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12 };
const gateList = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 12 };
const accountGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 12 };
const miniGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(92px,1fr))', gap: 8, marginTop: 12 };
const metric = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 12 };
const metricValue = { fontSize: 24, fontWeight: 800, lineHeight: 1 };
const metricLabel = { marginTop: 6, color: C.mid, fontSize: 12 };
const h1 = { fontSize: 'clamp(32px,5vw,56px)', lineHeight: 1, margin: '8px 0 12px', maxWidth: 860 };
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