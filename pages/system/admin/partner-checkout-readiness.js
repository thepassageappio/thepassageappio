import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseBrowser';
import { SiteFooter, SiteHeader } from '../../../components/SiteChrome';

const C = { bg: '#f6f3ee', card: '#fff', ink: '#1a1916', mid: '#6a6560', border: '#e4ddd4', sage: '#6b8f71', sageFaint: '#f0f5f1', amber: '#b07d2e', amberFaint: '#fdf8ee', rose: '#c47a7a', roseFaint: '#fdf3f3' };
const SYSTEM_ADMIN_EMAILS = ['steventurrisi@gmail.com'];
function normalizeEmail(email) { return String(email || '').trim().toLowerCase(); }
function isSystemAdmin(user) { return SYSTEM_ADMIN_EMAILS.includes(normalizeEmail(user?.email)); }
function statusTone(status) { if (status === 'ready') return 'good'; if (status === 'blocked') return 'risk'; return 'warn'; }

export default function PartnerCheckoutReadinessPage() {
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
    window.location.assign('/auth/google?next=' + encodeURIComponent(window.location.pathname + window.location.search + window.location.hash));
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
      const response = await fetch('/api/system/partnerCheckoutReadiness', { headers: token ? { Authorization: 'Bearer ' + token } : {} });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) { setError(json.error || 'Partner checkout readiness could not load.'); setResult(null); return; }
      setResult(json);
    } catch (err) {
      setError(err.message || 'Partner checkout readiness could not load.'); setResult(null);
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => { if (admin) runCheck(); }, [admin]);

  if (loading) return <Shell user={user}><Panel>Loading partner checkout readiness...</Panel></Shell>;
  if (!admin) return <Shell user={user}><Panel><div style={eyebrow}>Owner-only billing readiness</div><h1 style={h1}>This checkout gate is restricted.</h1><p style={lead}>Sign in with the Passage owner account to view funeral-home partner billing readiness.</p><button onClick={signIn} style={primaryButton}>Sign in</button></Panel></Shell>;

  const launchDecision = result?.launchDecision || null;
  const items = result?.items || [];
  const ready = result?.summary?.ready || 0;
  const warnings = result?.summary?.warning || 0;
  const blocked = result?.summary?.blocked || 0;

  return (
    <Shell user={user} onSignOut={signOut}>
      <section style={wrap}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div><div style={eyebrow}>System admin / partner checkout</div><h1 style={h1}>Paid conversion needs a billing gate, not hope.</h1><p style={lead}>This owner-only check confirms the funeral-home paid plan path has Stripe prices, pilot discount, webhook mirror, checkout auth, and partner metadata before ask-ready pilots are pushed into billing.</p></div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><button onClick={runCheck} disabled={checking} style={primaryButton}>{checking ? 'Checking...' : 'Run check'}</button><Link href="/system/admin/conversion-plan" style={secondaryLink}>Conversion Plan</Link><Link href="/system/admin/pilot-health" style={secondaryLink}>Pilot Health</Link></div>
        </div>
        {error && <Panel tone="risk"><strong>{error}</strong></Panel>}
        {result && <section style={grid3}><Metric label="Ready" value={ready} /><Metric label="Warnings" value={warnings} /><Metric label="Blocked" value={blocked} /></section>}
        {launchDecision && <Panel tone={launchDecision.status === 'blocked' ? 'risk' : 'sage'}><div style={eyebrow}>Launch decision</div><h2 style={h2}>{launchDecision.label}</h2><p style={lead}>{launchDecision.summary}</p><div style={decisionBox}><strong>Next action:</strong> {launchDecision.nextAction}</div></Panel>}
        <Panel>
          <div style={eyebrow}>Checkout gates</div>
          <h2 style={h2}>Every paid ask depends on these gates.</h2>
          <div style={{ display: 'grid', gap: 10 }}>{items.map(item => <ReadinessRow key={item.id || item.label} item={item} />)}</div>
        </Panel>
        <Panel tone="sage"><div style={eyebrow}>Conversion rule</div><h2 style={h2}>Ask-ready is not bill-ready until this page is green.</h2><p style={lead}>Conversion Plan can identify a paid ask, but this page answers whether the Stripe partner checkout path can safely collect and mirror the subscription.</p></Panel>
      </section>
    </Shell>
  );
}

function Shell({ children, user, onSignOut }) { return <main style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: 'Georgia,serif' }}><SiteHeader user={user} onSignOut={onSignOut} />{children}<SiteFooter /></main>; }
function Panel({ children, tone = 'default' }) { const risk = tone === 'risk'; return <section style={{ background: risk ? C.roseFaint : tone === 'sage' ? C.sageFaint : C.card, border: '1px solid ' + (risk ? '#efc7c7' : tone === 'sage' ? '#c8deca' : C.border), borderRadius: 18, padding: 22, boxShadow: '0 4px 20px rgba(0,0,0,.04)', marginTop: 18 }}>{children}</section>; }
function Metric({ label, value }) { return <div style={metricCard}><div style={eyebrow}>{label}</div><strong style={{ display: 'block', fontSize: 25, marginTop: 8 }}>{value}</strong></div>; }
function ReadinessRow({ item }) { const tone = statusTone(item.status); const pill = tone === 'good' ? goodPill : tone === 'risk' ? riskPill : warnPill; return <div style={subPanel}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}><strong>{item.label}</strong><span style={pill}>{item.status}</span></div><p style={smallText}>{item.proof}</p>{item.configuredKey && <div style={eyebrow}>{item.configuredKey}</div>}</div>; }

const wrap = { maxWidth: 1120, margin: '0 auto', padding: '42px 18px 80px' };
const grid3 = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12, marginTop: 20 };
const eyebrow = { color: C.sage, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900 };
const h1 = { fontSize: 50, lineHeight: 1.04, margin: '8px 0 10px', fontWeight: 400, maxWidth: 900 };
const h2 = { fontSize: 28, lineHeight: 1.12, margin: '8px 0 10px', fontWeight: 400 };
const lead = { color: C.mid, fontSize: 16, lineHeight: 1.6, margin: 0, maxWidth: 820 };
const smallText = { color: C.mid, fontSize: 14, lineHeight: 1.5, margin: '8px 0 0' };
const primaryButton = { border: 'none', background: C.sage, color: '#fff', borderRadius: 13, minHeight: 44, padding: '0 16px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' };
const secondaryLink = { border: '1px solid ' + C.border, background: C.card, color: C.sage, borderRadius: 13, minHeight: 44, padding: '0 16px', fontFamily: 'Georgia,serif', fontWeight: 900, display: 'inline-flex', alignItems: 'center', textDecoration: 'none' };
const metricCard = { background: C.card, border: '1px solid ' + C.border, borderRadius: 16, padding: 16, boxShadow: '0 4px 20px rgba(0,0,0,.035)' };
const subPanel = { background: C.bg, border: '1px solid ' + C.border, borderRadius: 14, padding: 14 };
const decisionBox = { background: C.card, border: '1px solid ' + C.border, borderRadius: 14, padding: 14, color: C.mid, fontSize: 14, lineHeight: 1.5, marginTop: 14 };
const goodPill = { background: C.sageFaint, color: C.sage, border: '1px solid #c8deca', borderRadius: 999, padding: '5px 8px', fontSize: 12, fontWeight: 900 };
const warnPill = { background: C.amberFaint, color: C.amber, border: '1px solid #ead8b8', borderRadius: 999, padding: '5px 8px', fontSize: 12, fontWeight: 900 };
const riskPill = { background: C.roseFaint, color: C.rose, border: '1px solid #efc7c7', borderRadius: 999, padding: '5px 8px', fontSize: 12, fontWeight: 900 };
