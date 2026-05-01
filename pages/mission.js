import Link from 'next/link';
import { SiteHeader, SiteFooter } from '../components/SiteChrome';

const C = {
  bg: '#f6f3ee',
  card: '#fffdf9',
  ink: '#1a1916',
  mid: '#6a6560',
  soft: '#9a9288',
  border: '#e4ddd4',
  sage: '#6b8f71',
  sageFaint: '#eef5ef',
  rose: '#c47a7a',
  roseFaint: '#fbf0ef',
  dark: '#191815',
};

const proof = [
  ['One next action', 'Passage narrows the moment to what matters first, who owns it, and what can wait.'],
  ['Visible responsibility', 'Every task has an owner, status, notes, and a way to respond without hunting through texts.'],
  ['Proof, not guessing', 'Messages, calls, confirmations, and waiting items stay in the estate record.'],
];

export default function MissionPage() {
  return (
    <main style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Georgia,serif', color: C.ink }}>
      <SiteHeader />
      <section style={{ maxWidth: 1080, margin: '0 auto', padding: '14px 22px 36px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, .95fr) minmax(300px, .72fr)', gap: 18, alignItems: 'stretch', marginBottom: 14 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 22, padding: 24, boxShadow: '0 18px 48px rgba(55,45,35,.06)' }}>
            <div style={{ fontSize: 10.5, color: C.sage, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 9 }}>Our mission</div>
            <h1 style={{ fontSize: 'clamp(36px, 5vw, 62px)', lineHeight: .98, margin: '0 0 13px', fontWeight: 400, maxWidth: 690 }}>
              Make the next step feel possible.
            </h1>
            <p style={{ color: C.mid, fontSize: 15.5, lineHeight: 1.6, maxWidth: 680, margin: '0 0 18px' }}>
              Passage turns scattered calls, documents, roles, service details, and family updates into one calm place to act.
            </p>
            <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
              <Link href="/urgent" style={primary(C.rose)}>Someone just passed</Link>
              <Link href="/" style={primary(C.sage)}>Plan ahead</Link>
              <Link href="/funeral-home" style={secondary}>For funeral homes</Link>
            </div>
          </div>

          <div style={{ background: C.dark, color: '#fff', borderRadius: 22, padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 18px 48px rgba(55,45,35,.09)' }}>
            <div>
              <div style={{ color: '#c8deca', fontSize: 10.5, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 11 }}>The promise</div>
              <div style={{ fontSize: 'clamp(26px, 3vw, 36px)', lineHeight: 1.08, marginBottom: 12 }}>Less hunting. Fewer decisions. Visible progress.</div>
              <p style={{ color: '#e8e0d8', fontSize: 13.5, lineHeight: 1.6, margin: '0 0 14px' }}>
                We are not trying to make grief efficient. We are making the practical parts survivable.
              </p>
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {['What do I do right now?', 'Who is responsible?', 'How will I know it happened?'].map((line) => (
                <div key={line} style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 12, padding: '10px 12px', color: '#f6f1eb', fontSize: 13.5, fontWeight: 800 }}>
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(245px, 100%), 1fr))', gap: 10, marginBottom: 14 }}>
          {proof.map(([title, body]) => (
            <div key={title} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16 }}>
              <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 8 }}>{title}</div>
              <div style={{ color: C.mid, fontSize: 13.5, lineHeight: 1.55 }}>{body}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(280px, .48fr)', gap: 12, alignItems: 'stretch' }}>
          <div style={{ background: C.sageFaint, border: `1px solid ${C.border}`, borderRadius: 18, padding: 18 }}>
            <div style={{ fontSize: 22, lineHeight: 1.18, marginBottom: 7 }}>Built for the first hours and the years before them.</div>
            <div style={{ color: C.mid, fontSize: 13.5, lineHeight: 1.6 }}>
              The red path helps after a death. The green path helps families prepare before one. The same estate command center holds the people, tasks, notes, documents, and proof.
            </div>
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 18 }}>
            <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 8 }}>For funeral homes</div>
            <div style={{ color: C.mid, fontSize: 13.5, lineHeight: 1.55, marginBottom: 12 }}>A family command center your staff can use to see status, act on behalf, and reduce repeated calls.</div>
            <Link href="/funeral-home" style={{ color: '#fff', background: C.sage, borderRadius: 11, padding: '10px 13px', textDecoration: 'none', fontWeight: 800, fontSize: 13, display: 'inline-block' }}>See partner flow</Link>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

const primary = (background) => ({
  background,
  color: '#fff',
  borderRadius: 12,
  padding: '11px 16px',
  textDecoration: 'none',
  fontWeight: 800,
  fontSize: 13,
});

const secondary = {
  background: C.card,
  color: C.sage,
  border: `1px solid ${C.border}`,
  borderRadius: 12,
  padding: '11px 16px',
  textDecoration: 'none',
  fontWeight: 800,
  fontSize: 13,
};
