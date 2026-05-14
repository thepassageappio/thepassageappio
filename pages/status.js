import { SiteFooter, SiteHeader } from '../components/SiteChrome';

const C = { bg: '#f6f3ee', card: '#fffdf9', ink: '#1a1916', mid: '#6a6560', border: '#e4ddd4', sage: '#6b8f71', sageFaint: '#f0f5f1' };

export default function StatusPage() {
  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: 'Georgia,serif' }}>
      <SiteHeader />
      <section style={{ maxWidth: 880, margin: '0 auto', padding: '46px 28px 72px' }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 22, padding: 30, boxShadow: '0 14px 42px rgba(55,45,35,.055)' }}>
          <div style={{ color: C.sage, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900 }}>Passage status</div>
          <h1 style={{ fontSize: 52, lineHeight: 1, margin: '10px 0 12px', fontWeight: 400 }}>Operational status.</h1>
          <p style={{ color: C.mid, fontSize: 16, lineHeight: 1.65, maxWidth: 680 }}>
            Passage is in pilot readiness. If something appears unavailable or a notification does not arrive, contact Passage and include the page, time, browser, and role you were using.
          </p>
          <div style={{ display: 'grid', gap: 10, marginTop: 18 }}>
            {[
              ['Website', 'Operational'],
              ['Family and participant workspaces', 'Operational'],
              ['Funeral-home and vendor workspaces', 'Pilot readiness'],
              ['SMS', 'Paused until carrier registration is complete'],
            ].map(([label, status]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', background: C.sageFaint, border: '1px solid #c8deca', borderRadius: 14, padding: '13px 14px' }}>
                <strong>{label}</strong>
                <span style={{ color: C.sage, fontWeight: 900 }}>{status}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

