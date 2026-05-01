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
  ['Green path', '/', 'Plan before it is needed', 'Gather people, wishes, documents, and confirmation contacts so your family is not starting from zero later.', C.sageFaint, C.sage],
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
      <section style={{ maxWidth: 1120, margin: '0 auto', padding: '14px 22px 30px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, .95fr) minmax(320px, .65fr)', gap: 14, alignItems: 'stretch', marginBottom: 12 }}>
          <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 24, padding: '22px 24px' }}>
            <div style={{ fontSize: 10, color: C.sage, letterSpacing: '.18em', textTransform: 'uppercase', fontWeight: 900, marginBottom: 8 }}>Our mission</div>
            <h1 style={{ fontSize: 'clamp(34px, 5vw, 62px)', lineHeight: .95, margin: '0 0 12px', fontWeight: 400, maxWidth: 720 }}>
              Make the practical parts survivable.
            </h1>
            <p style={{ color: C.mid, fontSize: 15, lineHeight: 1.58, margin: 0, maxWidth: 700 }}>
              Passage turns scattered calls, documents, roles, service details, and family updates into one calm place to act.
            </p>
          </div>

          <div style={{ background: C.sageFaint, border: `1px solid ${C.sage}22`, borderRadius: 24, padding: '20px 22px', display: 'grid', alignContent: 'center', gap: 9 }}>
            <div style={{ fontSize: 10.5, color: C.sage, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900 }}>The promise</div>
            <div style={{ fontSize: 'clamp(24px, 3vw, 34px)', lineHeight: 1.08 }}>Less hunting. Fewer decisions. Visible progress.</div>
            <p style={{ color: C.mid, fontSize: 13.5, lineHeight: 1.55, margin: 0 }}>
              We do not pretend grief is manageable. We make the calls, documents, ownership, and next steps easier to carry.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10, marginBottom: 12 }}>
          {proof.map(([k, v]) => (
            <div key={k} style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 16, padding: 14 }}>
              <div style={{ color: C.sage, fontSize: 10, fontWeight: 900, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 5 }}>{k}</div>
              <div style={{ fontSize: 17, lineHeight: 1.25 }}>{v}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
          {paths.map(([label, href, title, body, bg, accent]) => (
            <Link key={label} href={href} style={{ display: 'grid', minHeight: 172, textDecoration: 'none', color: C.ink, background: bg, border: `1px solid ${accent}33`, borderRadius: 18, padding: 17 }}>
              <div>
                <div style={{ color: accent, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900, marginBottom: 7 }}>{label}</div>
                <div style={{ fontSize: 22, lineHeight: 1.12, marginBottom: 8 }}>{title}</div>
                <div style={{ color: C.mid, fontSize: 13.5, lineHeight: 1.55 }}>{body}</div>
              </div>
              <div style={{ alignSelf: 'end', color: accent, fontSize: 12.5, fontWeight: 900, marginTop: 12 }}>Open &rarr;</div>
            </Link>
          ))}
        </div>

        <div style={{ marginTop: 12, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 18, padding: '15px 17px', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 12, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 22, lineHeight: 1.16 }}>Not a checklist. A system that carries the next step.</div>
            <div style={{ color: C.mid, fontSize: 13.5, lineHeight: 1.55, marginTop: 3 }}>Every task should answer: what do I do now, who owns it, and how will I know it happened?</div>
          </div>
          <Link href="/" style={{ background: C.sage, color: '#fff', borderRadius: 12, padding: '10px 15px', textDecoration: 'none', fontSize: 13, fontWeight: 900 }}>Open Passage</Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
