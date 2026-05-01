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
};

const principles = [
  ['What matters first', 'A small number of next actions, not a wall of tasks.'],
  ['Who owns it', 'Every item has a person, status, and place to respond.'],
  ['Proof it happened', 'Messages, notes, confirmations, and waiting items stay visible.'],
];

export default function MissionPage() {
  return (
    <main style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Georgia,serif', color: C.ink }}>
      <SiteHeader />

      <section style={{ maxWidth: 1080, margin: '0 auto', padding: '16px 22px 34px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.08fr) minmax(320px, .72fr)', gap: 22, alignItems: 'center', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 10.5, color: C.sage, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 10 }}>Our mission</div>
            <h1 style={{ fontSize: 'clamp(38px, 5vw, 64px)', lineHeight: .96, margin: '0 0 14px', fontWeight: 400, maxWidth: 680 }}>
              Make the next step feel possible.
            </h1>
            <p style={{ color: C.mid, fontSize: 16, lineHeight: 1.55, maxWidth: 650, margin: '0 0 18px' }}>
              When a family is grieving, Passage turns scattered calls, documents, roles, and service details into one calm place to act.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link href="/urgent" style={{ background: C.rose, color: '#fff', borderRadius: 12, padding: '12px 17px', textDecoration: 'none', fontWeight: 800, fontSize: 13 }}>Someone just passed</Link>
              <Link href="/" style={{ background: C.sage, color: '#fff', borderRadius: 12, padding: '12px 17px', textDecoration: 'none', fontWeight: 800, fontSize: 13 }}>Plan ahead</Link>
              <Link href="/funeral-home/dashboard" style={{ background: C.card, color: C.sage, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 17px', textDecoration: 'none', fontWeight: 800, fontSize: 13 }}>For funeral homes</Link>
            </div>
          </div>

          <div style={{ background: '#191815', color: '#fff', borderRadius: 22, padding: 22, boxShadow: '0 20px 54px rgba(40,34,28,.12)' }}>
            <div style={{ color: '#c8deca', fontSize: 10.5, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 12 }}>The promise</div>
            <div style={{ fontSize: 28, lineHeight: 1.12, marginBottom: 12 }}>Less hunting. Fewer decisions. Visible progress.</div>
            <p style={{ color: '#e5ded6', fontSize: 14, lineHeight: 1.55, margin: '0 0 16px' }}>
              Passage is not trying to make grief efficient. It is trying to make the practical parts survivable.
            </p>
            <div style={{ display: 'grid', gap: 8 }}>
              {['What do I do right now?', 'Who is responsible?', 'How will I know it happened?'].map((line) => (
                <div key={line} style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.11)', borderRadius: 12, padding: '10px 12px', color: '#f5f0ea', fontSize: 13.5, fontWeight: 800 }}>
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(250px, 100%), 1fr))', gap: 12, marginBottom: 12 }}>
          {principles.map(([title, body]) => (
            <div key={title} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '16px 17px' }}>
              <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 8 }}>{title}</div>
              <div style={{ color: C.mid, fontSize: 13.5, lineHeight: 1.55 }}>{body}</div>
            </div>
          ))}
        </div>

        <div style={{ background: C.sageFaint, border: `1px solid ${C.border}`, borderRadius: 18, padding: 18, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 16, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 22, lineHeight: 1.18, marginBottom: 6 }}>Built for the first hours and the years before them.</div>
            <div style={{ color: C.mid, fontSize: 13.5, lineHeight: 1.55, maxWidth: 760 }}>
              Red path helps after a death. Green path helps families prepare before one. The same estate command center holds the people, tasks, notes, and proof.
            </div>
          </div>
          <Link href="/" style={{ background: C.card, border: `1px solid ${C.border}`, color: C.sage, borderRadius: 12, padding: '11px 15px', textDecoration: 'none', fontWeight: 800, fontSize: 13, whiteSpace: 'nowrap' }}>Open Passage</Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
