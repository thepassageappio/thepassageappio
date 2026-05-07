import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { SiteFooter, SiteHeader } from '../../components/SiteChrome';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

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

const SYSTEM_ADMIN_EMAILS = ['thepassageappio@gmail.com', 'steventurrisi@gmail.com'];

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isSystemAdmin(user) {
  return SYSTEM_ADMIN_EMAILS.includes(normalizeEmail(user?.email));
}

const adminModules = [
  {
    title: 'Demo studio',
    body: 'Dummy-only guided sales walkthrough for funeral-home prospects.',
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

export default function SystemAdminPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [metricsError, setMetricsError] = useState('');
  const [metricsLoading, setMetricsLoading] = useState(false);

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
    if (!admin || !supabase) return undefined;
    let cancelled = false;
    async function loadMetrics() {
      setMetricsLoading(true);
      setMetricsError('');
      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token || '';
      const response = await fetch('/api/system/metrics', {
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
  }, [admin]);

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
    const response = await fetch('/api/system/metrics?format=csv', {
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

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: 'Georgia,serif' }}>
      <SiteHeader user={user} onSignIn={signIn} onSignOut={user ? signOut : null} />
      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '28px' }}>
        <div style={eyebrow}>Passage system admin</div>
        <h1 style={h1}>One command center for internal Passage operations.</h1>
        <p style={lead}>This area is for Passage system admins only. It is separate from estate admins, funeral-home admins, vendor admins, and family coordinators.</p>

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
            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, marginTop: 22 }}>
              {adminModules.map((module) => (
                <Link key={module.title} href={module.href} style={{ ...cardLink, opacity: module.status === 'Planned' || module.status === 'Roadmap' ? .78 : 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                    <h2 style={{ ...h3, margin: 0 }}>{module.title}</h2>
                    <span style={module.status === 'Live' || module.status === 'Live demo' || module.status === 'Intake live' || module.status === 'Live scaffold' ? livePill : plannedPill}>{module.status}</span>
                  </div>
                  <p style={{ ...smallText, marginBottom: 0 }}>{module.body}</p>
                </Link>
              ))}
            </section>

            <section id="business-health" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(280px, .9fr)', gap: 18, marginTop: 22, alignItems: 'start' }}>
              <Panel>
                <div style={eyebrow}>Business health dashboard</div>
                <h2 style={h2}>Internal metrics spine.</h2>
                <p style={lead}>This will act as the rough CRM and operating console until Passage grows into a dedicated reporting stack. Every metric needs a raw CSV export and a source-table label.</p>
                <button onClick={downloadMetricsCsv} style={primaryButton}>Export raw metrics CSV</button>
                {metricsLoading && <div style={{ ...smallText, marginTop: 12 }}>Loading live metrics...</div>}
                {metricsError && <div style={{ ...smallText, marginTop: 12, color: C.rose }}>{metricsError}</div>}
                {metrics?.metrics?.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 9, marginTop: 14 }}>
                    {metrics.metrics.map((item) => (
                      <div key={item.label} style={item.status === 'real' ? metricCard : unavailableMetricCard}>
                        <div style={{ fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: item.status === 'real' ? C.sage : C.amber, marginBottom: 5 }}>{item.status}</div>
                        <div style={{ fontSize: 24, lineHeight: 1.05 }}>{item.value == null ? 'N/A' : item.value}</div>
                        <div style={{ fontSize: 12, color: C.mid, lineHeight: 1.35, marginTop: 5 }}>{item.label}</div>
                        <div style={{ fontSize: 10.5, color: C.soft, marginTop: 5 }}>Source: {item.source}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 9, marginTop: 14 }}>
                    {reportingMetrics.map((metric) => <div key={metric} style={metricCard}>{metric}</div>)}
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
              </Panel>
              <Panel>
                <div style={eyebrow}>Data honesty</div>
                <h2 style={h2}>No fake dashboards.</h2>
                <p style={lead}>Internal numbers must be labeled as real, estimated, demo-only, or unavailable. ARR/MRR/churn should not appear as real until subscriptions and accounts are writing correctly.</p>
              </Panel>
            </section>

            <section id="trust-layer" style={{ marginTop: 22 }}>
              <Panel>
                <div style={eyebrow}>FAQ, support, terms, and privacy</div>
                <h2 style={h2}>Public trust layer is queued behind owner/legal review.</h2>
                <p style={lead}>The FAQ should explain vendor applications, support requests, feature requests, bug reports, billing disputes, urgent-path limits, and data ownership. Terms and Privacy need owner/counsel approval before production legal claims change.</p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
                  <Link href="/faq" style={secondaryLink}>FAQ</Link>
                  <Link href="/trust" style={secondaryLink}>Trust</Link>
                  <Link href="/privacy" style={secondaryLink}>Privacy</Link>
                  <Link href="/terms" style={secondaryLink}>Terms</Link>
                  <Link href="/contact" style={secondaryLink}>Contact intake</Link>
                </div>
              </Panel>
            </section>
          </>
        )}
      </section>
      <SiteFooter />
    </main>
  );
}

function Panel({ children }) {
  return <div style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: 20, padding: 22, boxShadow: '0 4px 20px rgba(0,0,0,.05)', marginTop: 18 }}>{children}</div>;
}

function MetricRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, borderTop: '1px solid ' + C.border, padding: '8px 0', alignItems: 'flex-start' }}>
      <span style={{ color: C.mid, fontSize: 12.5, lineHeight: 1.35 }}>{label}</span>
      <strong style={{ color: C.ink, fontSize: 12.5, textAlign: 'right', lineHeight: 1.35 }}>{value}</strong>
    </div>
  );
}

const eyebrow = { color: C.sage, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900 };
const h1 = { fontSize: 'clamp(34px, 5vw, 56px)', lineHeight: 1.04, margin: '8px 0 10px', fontWeight: 400, maxWidth: 820 };
const h2 = { fontSize: 28, lineHeight: 1.12, margin: '8px 0 10px', fontWeight: 400 };
const h3 = { fontSize: 22, lineHeight: 1.15, fontWeight: 900 };
const lead = { color: C.mid, fontSize: 16, lineHeight: 1.6, margin: 0, maxWidth: 760 };
const smallText = { color: C.mid, fontSize: 14, lineHeight: 1.5, marginTop: 8 };
const primaryButton = { border: 'none', background: C.sage, color: '#fff', borderRadius: 13, minHeight: 48, padding: '0 18px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer', marginTop: 16 };
const secondaryLink = { border: '1px solid ' + C.border, background: C.card, color: C.sage, borderRadius: 13, minHeight: 48, padding: '0 18px', fontFamily: 'Georgia,serif', fontWeight: 900, display: 'inline-flex', alignItems: 'center', textDecoration: 'none', marginTop: 16 };
const cardLink = { background: C.card, border: '1px solid ' + C.border, borderRadius: 18, padding: 18, color: C.ink, textDecoration: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.04)' };
const livePill = { background: C.sageFaint, color: C.sage, border: '1px solid #c8deca', borderRadius: 999, padding: '5px 8px', fontSize: 12, fontWeight: 900, whiteSpace: 'nowrap' };
const plannedPill = { background: C.amberFaint, color: C.amber, border: '1px solid #ead8b8', borderRadius: 999, padding: '5px 8px', fontSize: 12, fontWeight: 900, whiteSpace: 'nowrap' };
const metricCard = { background: C.sageFaint, border: '1px solid #c8deca', borderRadius: 13, padding: 12, color: C.sage, fontWeight: 900, fontSize: 14 };
const unavailableMetricCard = { background: C.amberFaint, border: '1px solid #ead8b8', borderRadius: 13, padding: 12, color: C.amber, fontWeight: 900, fontSize: 14 };
const subPanel = { background: C.bg, border: '1px solid ' + C.border, borderRadius: 14, padding: 14 };
