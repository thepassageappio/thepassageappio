import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseBrowser';
import { SiteFooter, SiteHeader } from '../../../components/SiteChrome';

const C = {
  bg: '#f6f3ee', card: '#fff', ink: '#1a1916', mid: '#6a6560', border: '#e4ddd4',
  sage: '#6b8f71', sageFaint: '#f0f5f1', amber: '#b07d2e', amberFaint: '#fdf8ee', rose: '#c47a7a', roseFaint: '#fdf3f3',
};
const SYSTEM_ADMIN_EMAILS = ['steventurrisi@gmail.com'];

function normalizeEmail(email) { return String(email || '').trim().toLowerCase(); }
function isSystemAdmin(user) { return SYSTEM_ADMIN_EMAILS.includes(normalizeEmail(user?.email)); }

export default function RateLimitReadinessPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const [nextRunAt, setNextRunAt] = useState(0);
  const [lastCheckedAt, setLastCheckedAt] = useState('');

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

  function cooldownSeconds() {
    return Math.max(0, Math.ceil((Number(nextRunAt || 0) - Date.now()) / 1000));
  }

  async function runCheck() {
    if (!supabase || checking) return;
    const remaining = cooldownSeconds();
    if (remaining > 0) {
      setError(`Wait ${remaining}s before running readiness again.`);
      return;
    }
    setChecking(true);
    setNextRunAt(Date.now() + 60000);
    setError('');
    try {
      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token || '';
      const response = await fetch('/api/system/rateLimitReadiness', { headers: token ? { Authorization: 'Bearer ' + token } : {} });
      const json = await response.json().catch(() => ({}));
      if (response.status === 429) {
        const retryAfter = Number(response.headers.get('Retry-After') || json.retryAfterSeconds || 60);
        setNextRunAt(Date.now() + Math.max(1, retryAfter) * 1000);
      }
      if (!response.ok) { setError(json.error || 'Rate-limit readiness could not load.'); setResult(null); return; }
      setLastCheckedAt(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
      setResult(json);
    } catch (err) {
      setError(err.message || 'Rate-limit readiness could not load.');
      setResult(null);
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => { if (admin) runCheck(); }, [admin]);

  if (loading) return <Shell user={user}><Panel>Loading abuse-control readiness...</Panel></Shell>;
  if (!admin) {
    return <Shell user={user}><Panel><div style={eyebrow}>Owner-only readiness</div><h1 style={h1}>This readiness check is restricted.</h1><p style={lead}>Sign in with the Passage owner account to view abuse and refresh controls.</p><button onClick={signIn} style={primaryButton}>Sign in</button></Panel></Shell>;
  }

  const wired = result?.wiredProtections?.filter(item => item.status === 'wired') || [];
  const defined = result?.wiredProtections?.filter(item => item.status !== 'wired') || [];
  const launchDecision = result?.launchDecision || null;
  const refreshCooldown = cooldownSeconds();

  return (
    <Shell user={user} onSignOut={signOut}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div><div style={eyebrow}>System admin / abuse controls</div><h1 style={h1}>Rate limits and refresh rules must be launch gates.</h1><p style={lead}>This page shows what is actually wired, what is only defined, and what still blocks broad outreach or pilot expansion.</p></div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}><button onClick={runCheck} disabled={checking || refreshCooldown > 0} title={refreshCooldown > 0 ? 'Cooldown prevents repeated readiness refreshes.' : ''} style={{ ...primaryButton, opacity: checking || refreshCooldown > 0 ? .62 : 1 }}>{checking ? 'Checking...' : refreshCooldown > 0 ? `Run check (${refreshCooldown}s)` : 'Run check'}</button><Link href="/system/admin/saas-roadmap" style={secondaryLink}>SaaS roadmap</Link>{lastCheckedAt && <span style={smallText}>Last checked {lastCheckedAt}</span>}</div>
      </div>
      {error && <Panel tone="risk"><strong>{error}</strong></Panel>}
      {result && <section style={grid4}>
        <Metric label="Status" value={result.status} />
        <Metric label="Wired" value={result.summary?.wired || 0} />
        <Metric label="Defined not wired" value={result.summary?.definedNotWired || 0} />
        <Metric label="Refresh policies" value={result.summary?.refreshPolicies || 0} />
      </section>}
      {launchDecision && <Panel tone={launchDecision.status === 'blocked' ? 'risk' : 'sage'}><div style={eyebrow}>Launch decision</div><h2 style={h2}>{launchDecision.label}</h2><p style={lead}>{launchDecision.summary}</p><div style={decisionNext}><strong>Next action:</strong> {launchDecision.nextAction}</div></Panel>}
      <Panel tone="sage"><div style={eyebrow}>Wired protection</div><h2 style={h2}>Already protecting production surfaces.</h2><div style={{ display: 'grid', gap: 10 }}>{wired.map(item => <ReadinessRow key={item.route} item={item} good />)}</div></Panel>
      <Panel><div style={eyebrow}>Still to wire</div><h2 style={h2}>Policies that remain implementation work.</h2><div style={{ display: 'grid', gap: 10 }}>{defined.map(item => <ReadinessRow key={item.route} item={item} />)}</div></Panel>
      <Panel><div style={eyebrow}>Refresh cadence</div><h2 style={h2}>Prevent noisy polling and dashboard hammering.</h2><div style={{ display: 'grid', gap: 10 }}>{(result?.refreshPolicies || []).map(item => <div key={item.key} style={subPanel}><strong>{item.label}</strong><p style={smallText}>Minimum: {item.minSeconds}s. {item.backoff}</p></div>)}</div></Panel>
    </Shell>
  );
}

function Shell({ children, user, onSignOut }) { return <main style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: 'Georgia,serif' }}><SiteHeader user={user} onSignOut={onSignOut} /><section style={wrap}>{children}</section><SiteFooter /></main>; }
function Panel({ children, tone = 'default' }) { const risk = tone === 'risk'; return <section style={{ background: risk ? C.roseFaint : tone === 'sage' ? C.sageFaint : C.card, border: '1px solid ' + (risk ? '#efc7c7' : tone === 'sage' ? '#c8deca' : C.border), borderRadius: 18, padding: 22, boxShadow: '0 4px 20px rgba(0,0,0,.04)', marginTop: 18 }}>{children}</section>; }
function Metric({ label, value }) { return <div style={metricCard}><div style={eyebrow}>{label}</div><strong style={{ display: 'block', fontSize: 25, marginTop: 8 }}>{value}</strong></div>; }
function ReadinessRow({ item, good = false }) { return <div style={subPanel}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}><strong>{item.route}</strong><span style={good ? goodPill : warnPill}>{item.status}</span></div><p style={smallText}>{item.proof}</p><div style={eyebrow}>{item.policy}</div></div>; }

const wrap = { maxWidth: 1120, margin: '0 auto', padding: '42px 18px 80px' };
const grid4 = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12, marginTop: 20 };
const eyebrow = { color: C.sage, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900 };
const h1 = { fontSize: 50, lineHeight: 1.04, margin: '8px 0 10px', fontWeight: 400, maxWidth: 880 };
const h2 = { fontSize: 28, lineHeight: 1.12, margin: '8px 0 10px', fontWeight: 400 };
const lead = { color: C.mid, fontSize: 16, lineHeight: 1.6, margin: 0, maxWidth: 780 };
const smallText = { color: C.mid, fontSize: 14, lineHeight: 1.5, margin: '8px 0 0' };
const primaryButton = { border: 'none', background: C.sage, color: '#fff', borderRadius: 13, minHeight: 44, padding: '0 16px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' };
const secondaryLink = { border: '1px solid ' + C.border, background: C.card, color: C.sage, borderRadius: 13, minHeight: 44, padding: '0 16px', fontFamily: 'Georgia,serif', fontWeight: 900, display: 'inline-flex', alignItems: 'center', textDecoration: 'none' };
const metricCard = { background: C.card, border: '1px solid ' + C.border, borderRadius: 16, padding: 16, boxShadow: '0 4px 20px rgba(0,0,0,.035)' };
const subPanel = { background: C.bg, border: '1px solid ' + C.border, borderRadius: 14, padding: 14 };
const decisionNext = { background: C.card, border: '1px solid ' + C.border, borderRadius: 14, padding: 14, color: C.mid, fontSize: 14, lineHeight: 1.5, marginTop: 14 };
const goodPill = { background: C.sageFaint, color: C.sage, border: '1px solid #c8deca', borderRadius: 999, padding: '5px 8px', fontSize: 12, fontWeight: 900 };
const warnPill = { background: C.amberFaint, color: C.amber, border: '1px solid #ead8b8', borderRadius: 999, padding: '5px 8px', fontSize: 12, fontWeight: 900 };
