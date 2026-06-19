import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseBrowser';
import { SiteFooter, SiteHeader } from '../../../components/SiteChrome';

const C = { bg: '#f6f3ee', card: '#fff', ink: '#1a1916', mid: '#6a6560', border: '#e4ddd4', sage: '#6b8f71', sageFaint: '#f0f5f1', rose: '#c47a7a', roseFaint: '#fdf3f3' };
const SYSTEM_ADMIN_EMAILS = ['steventurrisi@gmail.com'];

function normalizeEmail(email) { return String(email || '').trim().toLowerCase(); }
function isSystemAdmin(user) { return SYSTEM_ADMIN_EMAILS.includes(normalizeEmail(user?.email)); }

export default function ConsolidatedSprintRoute() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const admin = useMemo(() => isSystemAdmin(user), [user]);

  useEffect(() => {
    if (!supabase) { setLoading(false); return undefined; }
    supabase.auth.getSession().then(({ data }) => { setUser(data.session?.user || null); setLoading(false); });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => { setUser(session?.user || null); setLoading(false); });
    return () => data.subscription.unsubscribe();
  }, []);

  async function signIn() {
    if (!supabase || typeof window === 'undefined') return;
    window.location.assign('/auth/google?next=' + encodeURIComponent('/system/admin/saas-roadmap'));
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
  }

  if (loading) return <Shell user={user}><GatePanel title="Loading owner workspace..." body="Checking owner access before opening the consolidated roadmap pointer." /></Shell>;
  if (!admin) return <Shell user={user}><GatePanel title="This owner workspace is restricted." body="Sign in with the Passage owner account to open the single roadmap." action={<button onClick={signIn} style={primaryButton}>Sign in</button>} /></Shell>;

  return (
    <Shell user={user} onSignOut={signOut}>
      <section className="s2-shell">
        <div className="s2-kicker">System admin / consolidated worksheet</div>
        <h1 className="s2-title">This sprint board now lives inside the single SaaS roadmap.</h1>
        <p className="s2-lede">This route is retained for old links only. Strategy, sprint status, milestones, acceptance criteria, and current operating takeaways now live in one canonical owner-only roadmap.</p>
        <div className="s2-actions">
          <Link className="s2-link s2-primary" href="/system/admin/saas-roadmap">Open single roadmap</Link>
          <Link className="s2-link s2-secondary" href="/system/admin">System Admin</Link>
          <Link className="s2-link s2-secondary" href="/system/admin/pilot-health">Pilot evidence</Link>
        </div>
        <section className="s2-panel">
          <div className="s2-kicker">Rule</div>
          <h2>Do not use this page as a second roadmap.</h2>
          <p>Roadmap decisions belong in the SaaS roadmap. Pilot health, conversion evidence, QA, and readiness pages feed it with proof; they do not replace it.</p>
        </section>
      </section>
    </Shell>
  );
}

function Shell({ children, user, onSignOut }) {
  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: 'Georgia,serif' }}>
      <style>{'.s2-shell, .s2-shell * { box-sizing:border-box; } .s2-shell { max-width:980px; margin:0 auto; padding:42px 20px 80px; } .s2-kicker { color:#6b8f71; font-size:11px; letter-spacing:.16em; text-transform:uppercase; font-weight:900; } .s2-title { font-size:52px; line-height:1.02; margin:8px 0 10px; font-weight:400; max-width:860px; } .s2-lede { color:#6a6560; font-size:16px; line-height:1.6; margin:0; max-width:780px; } .s2-actions { display:flex; gap:8px; flex-wrap:wrap; margin-top:18px; } .s2-link { min-height:44px; display:inline-flex; align-items:center; justify-content:center; border-radius:13px; padding:0 15px; font-weight:900; text-decoration:none; font-size:13px; } .s2-primary { background:#1a1916; color:#fff; border:1px solid #1a1916; } .s2-secondary { background:#fff; color:#6b8f71; border:1px solid #e4ddd4; } .s2-panel { margin-top:18px; background:#f0f5f1; border:1px solid #c8deca; border-radius:18px; padding:18px; } .s2-panel h2 { font-size:28px; line-height:1.12; margin:8px 0 8px; font-weight:400; } .s2-panel p { color:#6a6560; font-size:14px; line-height:1.55; margin:0; } @media (max-width:820px) { .s2-shell { padding:24px 16px 60px; } .s2-title { font-size:38px; } .s2-actions { flex-direction:column; } .s2-link { width:100%; } }'}</style>
      <SiteHeader user={user} onSignOut={onSignOut} />
      {children}
      <SiteFooter />
    </main>
  );
}

function GatePanel({ title, body, action }) {
  return (
    <section style={gateWrap}>
      <div style={eyebrow}>System admin / single roadmap</div>
      <h1 style={h1}>{title}</h1>
      <p style={lead}>{body}</p>
      {action && <div style={{ marginTop: 18 }}>{action}</div>}
    </section>
  );
}

const gateWrap = { maxWidth: 760, margin: '0 auto', padding: '64px 20px 90px' };
const eyebrow = { color: C.sage, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900 };
const h1 = { fontSize: 48, lineHeight: 1.04, margin: '8px 0 10px', fontWeight: 400 };
const lead = { color: C.mid, fontSize: 16, lineHeight: 1.6, margin: 0, maxWidth: 680 };
const primaryButton = { border: 'none', background: C.sage, color: '#fff', borderRadius: 13, minHeight: 44, padding: '0 16px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' };
