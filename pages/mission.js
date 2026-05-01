import Link from 'next/link';
import { SiteHeader, SiteFooter } from '../components/SiteChrome';

const C = {
  bg: '#f6f3ee',
  panel: '#fffdf9',
  ink: '#1a1916',
  mid: '#6a6560',
  soft: '#9a9288',
  border: '#e4ddd4',
  sage: '#6b8f71',
  sageFaint: '#eef5ef',
  rose: '#c47a7a',
  dark: '#171612',
};

const rows = [
  ['First', 'What matters right now'],
  ['Owned', 'Who is responsible'],
  ['Proven', 'How we know it happened'],
];

export default function MissionPage() {
  return (
    <main style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Georgia,serif', color: C.ink }}>
      <SiteHeader />
      <section style={{ maxWidth: 1080, margin: '0 auto', padding: '12px 22px 30px' }}>
        <div style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto 14px' }}>
          <div style={{ fontSize: 10, color: C.sage, letterSpacing: '.18em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 7 }}>Our mission</div>
          <h1 style={{ fontSize: 'clamp(34px, 4.8vw, 58px)', lineHeight: .96, margin: '0 0 10px', fontWeight: 400 }}>
            Make the practical parts survivable.
          </h1>
          <p style={{ color: C.mid, fontSize: 14.5, lineHeight: 1.55, margin: '0 auto', maxWidth: 640 }}>
            Passage is the execution layer for death: one calm place to act, assign, follow up, and see proof when a family cannot hold every detail at once.
          </p>
        </div>

        <div style={{ background: C.dark, color: '#fff', borderRadius: 22, padding: '20px 24px', boxShadow: '0 18px 45px rgba(55,45,35,.12)', marginBottom: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(260px,.58fr)', gap: 20, alignItems: 'center' }}>
            <div>
              <div style={{ color: '#c8deca', fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 8 }}>The promise</div>
              <div style={{ fontSize: 'clamp(25px, 3.4vw, 38px)', lineHeight: 1.05, marginBottom: 10 }}>Less hunting. Fewer decisions. Visible progress.</div>
              <p style={{ color: '#e8e0d8', fontSize: 13.5, lineHeight: 1.55, margin: 0, maxWidth: 620 }}>
                We do not pretend grief is manageable. We make the calls, documents, roles, and next steps easier to survive.
              </p>
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {rows.map(([k, v]) => (
                <div key={k} style={{ display: 'grid', gridTemplateColumns: '72px minmax(0,1fr)', gap: 10, alignItems: 'center', background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.13)', borderRadius: 14, padding: '11px 12px' }}>
                  <span style={{ color: '#c8deca', fontSize: 11, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase' }}>{k}</span>
                  <span style={{ color: '#fff', fontSize: 14, fontWeight: 800 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(245px, 100%), 1fr))', gap: 10, marginBottom: 12 }}>
          {[
            ['Red path', '/urgent', 'Start with the first few actions after a death. Calls, scripts, ownership, proof, and what comes next.'],
            ['Green path', '/', 'Prepare the family command center before it is needed: people, wishes, documents, and activation contacts.'],
            ['Partner path', '/funeral-home', 'Funeral homes and helpers can see their cases, act on behalf, and reduce repeated status calls.'],
          ].map(([title, href, body]) => (
            <Link key={title} href={href} style={{ display: 'block', background: C.panel, border: `1px solid ${C.border}`, borderRadius: 18, padding: 17, textDecoration: 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 800 }}>{title}</div>
                <span style={{ color: title === 'Red path' ? C.rose : C.sage, fontSize: 12, fontWeight: 900 }}>Open</span>
              </div>
              <div style={{ color: C.mid, fontSize: 13.5, lineHeight: 1.6 }}>{body}</div>
            </Link>
          ))}
        </div>

        <div style={{ background: C.sageFaint, border: `1px solid ${C.border}`, borderRadius: 18, padding: 16 }}>
          <div>
            <div style={{ fontSize: 21, lineHeight: 1.16, marginBottom: 5 }}>Not a checklist. A system that carries the next step.</div>
            <div style={{ color: C.mid, fontSize: 13.5, lineHeight: 1.6 }}>Every task should answer: what do I do now, who owns it, and how will I know it happened?</div>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
