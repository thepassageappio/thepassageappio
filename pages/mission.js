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
  ['Urgent help', '/urgent', 'Someone just passed', 'Start with the few actions that matter tonight: who calls, who is notified, what is waiting, and what is already handled.', C.roseFaint, C.rose],
  ['Plan ahead', '/planning', 'Plan before it is needed', 'Gather people, wishes, documents, and confirmation contacts so your family is not starting from zero later.', C.sageFaint, C.sage],
  ['Funeral homes', '/contact?category=funeral-home&plan=partner_pilot', 'For funeral homes', 'Apply to join, book a pilot walkthrough, or tell us how your team wants to receive family handoffs.', C.goldFaint, C.amber],
];

const proof = [
  ['First', 'What matters right now'],
  ['Owned', 'Who is responsible'],
  ['Proven', 'How we know it happened'],
];

const pledgeCopy = 'Passage directs 10% of proceeds to grief and family-support work. For each paid urgent family record, we also fund a remembrance tree dedication in the person\'s name.';

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
      <section style={{ maxWidth: 1120, margin: '0 auto', padding: '6px 22px 10px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, .96fr) minmax(320px, .64fr)', gap: 10, alignItems: 'stretch', marginBottom: 7 }}>
          <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 18, padding: '14px 18px' }}>
            <div style={{ fontSize: 10.5, color: C.sage, letterSpacing: '.17em', textTransform: 'uppercase', fontWeight: 900, marginBottom: 5 }}>Our mission</div>
            <h1 style={{ fontSize: 32, lineHeight: .94, margin: '0 0 7px', fontWeight: 400, maxWidth: 690 }}>
              Make the practical parts survivable.
            </h1>
            <p style={{ color: C.mid, fontSize: 13, lineHeight: 1.38, margin: 0, maxWidth: 700 }}>
              Passage turns scattered calls, documents, roles, service details, and family updates into one calm place to act.
            </p>
            <div style={{ marginTop: 8, color: C.ink, fontSize: 15, lineHeight: 1.15 }}>Not a checklist. One calm place that carries the next step.</div>
          </div>

          <div style={{ background: C.sageFaint, border: `1px solid ${C.sage}22`, borderRadius: 18, padding: '14px 16px', display: 'grid', alignContent: 'center', gap: 6 }}>
            <div style={{ fontSize: 10.5, color: C.sage, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900 }}>The promise</div>
            <div style={{ fontSize: 24, lineHeight: 1.02 }}>Less hunting. Fewer decisions. Visible progress.</div>
            <p style={{ color: C.mid, fontSize: 12.4, lineHeight: 1.4, margin: 0 }}>
              We do not pretend grief is manageable. We make the calls, documents, ownership, and next steps easier to carry.
            </p>
            <div style={{ background: C.panel, border: `1px solid ${C.sage}22`, borderRadius: 12, padding: '8px 10px', color: C.mid, fontSize: 11.8, lineHeight: 1.3 }}>
              <strong style={{ color: C.sage }}>The Passage family pledge:</strong> {pledgeCopy}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 7, marginBottom: 8 }}>
          {proof.map(([k, v]) => (
            <div key={k} style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 13, padding: '7px 10px' }}>
              <div style={{ color: C.sage, fontSize: 10.5, fontWeight: 900, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 3 }}>{k}</div>
              <div style={{ fontSize: 14, lineHeight: 1.1 }}>{v}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '210px minmax(0, 1fr)', gap: 8 }}>
          <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 15, padding: 8, display: 'grid', gap: 6 }}>
            {paths.map(([label, , , , bg, accent], index) => (
              <button
                key={label}
                type="button"
                onClick={() => setActivePathIndex(index)}
                onFocus={() => setActivePathIndex(index)}
                style={{ border: `1px solid ${activePathIndex === index ? accent + '55' : C.border}`, background: activePathIndex === index ? bg : C.bg, color: activePathIndex === index ? accent : C.mid, borderRadius: 11, padding: '9px 10px', textAlign: 'left', fontFamily: 'Georgia,serif', fontSize: 12, fontWeight: 900, cursor: 'pointer' }}
              >
                {label}
              </button>
            ))}
          </div>
          <Link href={activePath[1]} style={{ display: 'grid', minHeight: 118, textDecoration: 'none', color: C.ink, background: activePath[4], border: `1px solid ${activePath[5]}33`, borderRadius: 16, padding: '14px 16px' }}>
            <div>
              <div style={{ color: activePath[5], fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900, marginBottom: 5 }}>{activePath[0]}</div>
              <div style={{ fontSize: 23, lineHeight: 1.02, marginBottom: 6 }}>{activePath[2]}</div>
              <div style={{ color: C.mid, fontSize: 13, lineHeight: 1.35, maxWidth: 740 }}>{activePath[3]}</div>
            </div>
            <div style={{ alignSelf: 'end', color: activePath[5], fontSize: 12, fontWeight: 900, marginTop: 6 }}>Open &rarr;</div>
          </Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}