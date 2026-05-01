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
  roseFaint: '#fdf3f3',
  goldFaint: '#fbf5e8',
  amber: '#a97832',
};

const paths = [
  ['Red path', '/urgent', 'Someone just passed', 'Start with the few actions that matter tonight: who calls, who is notified, what is waiting, and what is already handled.', C.roseFaint, C.rose],
  ['Green path', '/?start=plan', 'Plan before it is needed', 'Gather people, wishes, documents, and confirmation contacts so your family is not starting from zero later.', C.sageFaint, C.sage],
  ['Partner path', '/funeral-home', 'For funeral homes', 'A case workspace for directors to see family progress, act on behalf, and reduce repeated status calls.', C.goldFaint, C.amber],
];

const proof = [
  ['First', 'What matters right now'],
  ['Owned', 'Who is responsible'],
  ['Proven', 'How we know it happened'],
];

export default function MissionPage() {
  return (
    <main style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Georgia,serif', color: C.ink }}>
      <SiteHeader />
      <section style={{ maxWidth: 1120, margin: '0 auto', padding: '8px 22px 18px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, .95fr) minmax(320px, .65fr)', gap: 12, alignItems: 'stretch', marginBottom: 10 }}>
          <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 20, padding: '18px 22px' }}>
            <div style={{ fontSize: 9.5, color: C.sage, letterSpacing: '.18em', textTransform: 'uppercase', fontWeight: 900, marginBottom: 7 }}>Our mission</div>
            <h1 style={{ fontSize: 'clamp(30px, 4.35vw, 52px)', lineHeight: .94, margin: '0 0 9px', fontWeight: 400, maxWidth: 720 }}>
              Make the practical parts survivable.
            </h1>
            <p style={{ color: C.mid, fontSize: 14, lineHeight: 1.48, margin: 0, maxWidth: 700 }}>
              Passage turns scattered calls, documents, roles, service details, and family updates into one calm place to act.
            </p>
            <div style={{ marginTop: 12, color: C.ink, fontSize: 17, lineHeight: 1.2 }}>Not a checklist. One calm place that carries the next step.</div>
          </div>

          <div style={{ background: C.sageFaint, border: `1px solid ${C.sage}22`, borderRadius: 20, padding: '18px 20px', display: 'grid', alignContent: 'center', gap: 8 }}>
            <div style={{ fontSize: 10, color: C.sage, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900 }}>The promise</div>
            <div style={{ fontSize: 'clamp(22px, 2.55vw, 29px)', lineHeight: 1.05 }}>Less hunting. Fewer decisions. Visible progress.</div>
            <p style={{ color: C.mid, fontSize: 13, lineHeight: 1.48, margin: 0 }}>
              We do not pretend grief is manageable. We make the calls, documents, ownership, and next steps easier to carry.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 9, marginBottom: 10 }}>
          {proof.map(([k, v]) => (
            <div key={k} style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14, padding: '10px 12px' }}>
              <div style={{ color: C.sage, fontSize: 9.5, fontWeight: 900, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 4 }}>{k}</div>
              <div style={{ fontSize: 15.5, lineHeight: 1.18 }}>{v}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 9 }}>
          {paths.map(([label, href, title, body, bg, accent]) => (
            <Link key={label} href={href} style={{ display: 'grid', minHeight: 130, textDecoration: 'none', color: C.ink, background: bg, border: `1px solid ${accent}33`, borderRadius: 16, padding: 14 }}>
              <div>
                <div style={{ color: accent, fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900, marginBottom: 5 }}>{label}</div>
                <div style={{ fontSize: 19, lineHeight: 1.08, marginBottom: 6 }}>{title}</div>
                <div style={{ color: C.mid, fontSize: 12.5, lineHeight: 1.42 }}>{body}</div>
              </div>
              <div style={{ alignSelf: 'end', color: accent, fontSize: 12, fontWeight: 900, marginTop: 8 }}>Open &rarr;</div>
            </Link>
          ))}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
