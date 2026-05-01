import Link from 'next/link';
import { SiteHeader, SiteFooter } from '../components/SiteChrome';

const C = {
  bg: '#f6f3ee',
  card: '#fff',
  ink: '#1a1916',
  mid: '#6a6560',
  soft: '#a09890',
  border: '#e4ddd4',
  sage: '#6b8f71',
  sageFaint: '#f0f5f1',
  rose: '#c47a7a',
  roseFaint: '#fdf3f3',
};

export default function MissionPage() {
  const promises = [
    ['One next step', 'Passage shows what matters first, who owns it, and what is waiting.'],
    ['Proof, not guessing', 'Messages, assignments, notes, and confirmations stay visible.'],
    ['Help can join calmly', 'Participants and partners see only the work they were asked to carry.'],
  ];

  return (
    <main style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Georgia,serif', color: C.ink }}>
      <SiteHeader />

      <section style={{ maxWidth: 1080, margin: '0 auto', padding: '10px 22px 34px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, .9fr) minmax(320px, .8fr)', gap: 18, alignItems: 'stretch' }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 22, minHeight: 300, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 10.5, color: C.sage, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 10 }}>Our mission</div>
              <h1 style={{ fontSize: 'clamp(34px, 4.2vw, 54px)', lineHeight: .98, margin: '0 0 12px', fontWeight: 400 }}>
                Make the next step feel possible.
              </h1>
              <p style={{ color: C.mid, fontSize: 15, lineHeight: 1.55, maxWidth: 620, margin: 0 }}>
                When a family is grieving, Passage turns scattered calls, documents, roles, and service details into one calm place to act.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
              <Link href="/urgent" style={{ background: C.rose, color: '#fff', borderRadius: 12, padding: '11px 14px', textDecoration: 'none', fontWeight: 800, fontSize: 13 }}>Someone just passed</Link>
              <Link href="/" style={{ background: C.sage, color: '#fff', borderRadius: 12, padding: '11px 14px', textDecoration: 'none', fontWeight: 800, fontSize: 13 }}>Plan ahead</Link>
            </div>
          </div>

          <div style={{ background: C.ink, color: '#fff', borderRadius: 20, padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ color: '#c8deca', fontSize: 10.5, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 10 }}>The promise</div>
              <div style={{ fontSize: 28, lineHeight: 1.12, marginBottom: 12 }}>Less hunting. Fewer decisions. Visible progress.</div>
              <p style={{ color: '#ded8d0', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                Passage is not trying to make grief efficient. It is trying to make the practical parts survivable.
              </p>
            </div>
            <div style={{ marginTop: 18, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 14, padding: 13, color: '#f2eee8', fontSize: 13, lineHeight: 1.55 }}>
              Every task should answer: what do I do right now, who is responsible, and how will I know it happened?
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))', gap: 12, marginTop: 12 }}>
          {promises.map(([title, body]) => (
            <div key={title} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16 }}>
              <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 8 }}>{title}</div>
              <div style={{ color: C.mid, fontSize: 13.5, lineHeight: 1.55 }}>{body}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(260px, .5fr)', gap: 12 }}>
          <div style={{ background: C.sageFaint, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16 }}>
            <div style={{ fontSize: 20, lineHeight: 1.25, marginBottom: 7 }}>Built for the first hours and the years before them.</div>
            <div style={{ color: C.mid, fontSize: 13.5, lineHeight: 1.6 }}>
              Red path helps after a death. Green path helps families prepare before one. The same estate command center holds the people, tasks, notes, and proof.
            </div>
          </div>
          <Link href="/funeral-home/dashboard" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16, textDecoration: 'none', color: C.ink }}>
            <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 8 }}>For funeral homes</div>
            <div style={{ fontSize: 18, lineHeight: 1.25 }}>Partner command center</div>
            <div style={{ color: C.mid, fontSize: 13, lineHeight: 1.5, marginTop: 6 }}>A quiet B2B door for pilot homes and staff.</div>
          </Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
