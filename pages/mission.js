import { useEffect, useState } from 'react';
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
  const s0 = useState(0); const activePathIndex = s0[0]; const setActivePathIndex = s0[1];
  const activePath = paths[activePathIndex] || paths[0];

  useEffect(function() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    var timer = window.setInterval(function() {
      setActivePathIndex(function(current) { return (current + 1) % paths.length; });
    }, 6500);
    return function() { window.clearInterval(timer); };
  }, []);

  return (
    <main style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Georgia,serif', color: C.ink }}>
      <SiteHeader />
      <section style={{ maxWidth: 1120, margin: '0 auto', padding: '10px 22px 14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, .96fr) minmax(320px, .64fr)', gap: 12, alignItems: 'stretch', marginBottom: 9 }}>
          <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 20, padding: '16px 20px' }}>
            <div style={{ fontSize: 9.5, color: C.sage, letterSpacing: '.18em', textTransform: 'uppercase', fontWeight: 900, marginBottom: 7 }}>Our mission</div>
            <h1 style={{ fontSize: 'clamp(30px, 4vw, 48px)', lineHeight: .94, margin: '0 0 8px', fontWeight: 400, maxWidth: 690 }}>
              Make the practical parts survivable.
            </h1>
            <p style={{ color: C.mid, fontSize: 13.5, lineHeight: 1.44, margin: 0, maxWidth: 700 }}>
              Passage turns scattered calls, documents, roles, service details, and family updates into one calm place to act.
            </p>
            <div style={{ marginTop: 10, color: C.ink, fontSize: 16, lineHeight: 1.18 }}>Not a checklist. One calm place that carries the next step.</div>
          </div>

          <div style={{ background: C.sageFaint, border: `1px solid ${C.sage}22`, borderRadius: 20, padding: '16px 18px', display: 'grid', alignContent: 'center', gap: 7 }}>
            <div style={{ fontSize: 10, color: C.sage, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900 }}>The promise</div>
            <div style={{ fontSize: 'clamp(21px, 2.35vw, 27px)', lineHeight: 1.04 }}>Less hunting. Fewer decisions. Visible progress.</div>
            <p style={{ color: C.mid, fontSize: 12.8, lineHeight: 1.45, margin: 0 }}>
              We do not pretend grief is manageable. We make the calls, documents, ownership, and next steps easier to carry.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, marginBottom: 9 }}>
          {proof.map(([k, v]) => (
            <div key={k} style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14, padding: '8px 11px' }}>
              <div style={{ color: C.sage, fontSize: 9.5, fontWeight: 900, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 4 }}>{k}</div>
              <div style={{ fontSize: 14.5, lineHeight: 1.14 }}>{v}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '220px minmax(0, 1fr)', gap: 9 }}>
          <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 16, padding: 9, display: 'grid', gap: 7 }}>
            {paths.map(([label, , , , bg, accent], index) => (
              <button
                key={label}
                type="button"
                onClick={() => setActivePathIndex(index)}
                style={{ border: `1px solid ${activePathIndex === index ? accent + '55' : C.border}`, background: activePathIndex === index ? bg : C.bg, color: activePathIndex === index ? accent : C.mid, borderRadius: 12, padding: '10px 11px', textAlign: 'left', fontFamily: 'Georgia,serif', fontSize: 12.5, fontWeight: 900, cursor: 'pointer' }}
              >
                {label}
              </button>
            ))}
          </div>
          <Link href={activePath[1]} style={{ display: 'grid', minHeight: 132, textDecoration: 'none', color: C.ink, background: activePath[4], border: `1px solid ${activePath[5]}33`, borderRadius: 18, padding: '16px 18px' }}>
            <div>
              <div style={{ color: activePath[5], fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900, marginBottom: 5 }}>{activePath[0]}</div>
              <div style={{ fontSize: 25, lineHeight: 1.04, marginBottom: 7 }}>{activePath[2]}</div>
              <div style={{ color: C.mid, fontSize: 13.5, lineHeight: 1.42, maxWidth: 740 }}>{activePath[3]}</div>
            </div>
            <div style={{ alignSelf: 'end', color: activePath[5], fontSize: 12.5, fontWeight: 900, marginTop: 8 }}>Open &rarr;</div>
          </Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
