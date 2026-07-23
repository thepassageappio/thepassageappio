import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SiteHeader, SiteFooter } from '../components/SiteChrome';

const C = {
  bg: '#FBF8F3',
  panel: '#FEFDFB',
  ink: '#1C1917',
  mid: '#5A5348',
  soft: '#9A9081',
  border: '#E6DDCB',
  sage: '#245A4B',
  sageFaint: '#F2F6F3',
  rose: '#B5622F',
  roseFaint: '#FBF0E7',
  goldFaint: '#F5E4D6',
  amber: '#9A4F26',
};

const BODY_FONT = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const MOMENT_FONT = "'Fraunces', serif";

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
    <main style={{ minHeight: '100vh', background: C.bg, fontFamily: BODY_FONT, color: C.ink }}>
      <style jsx>{`
        .mission-hero-grid { grid-template-columns: minmax(0, .96fr) minmax(320px, .64fr); }
        .mission-proof-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        .mission-path-grid { grid-template-columns: 210px minmax(0, 1fr); }

        @media (max-width: 720px) {
          .mission-hero-grid,
          .mission-proof-grid,
          .mission-path-grid { grid-template-columns: minmax(0, 1fr); }
        }
      `}</style>
      <SiteHeader />
      <section style={{ maxWidth: 1120, margin: '0 auto', padding: '6px 22px 10px' }}>
        <div className="mission-hero-grid" style={{ display: 'grid', gap: 10, alignItems: 'stretch', marginBottom: 7 }}>
          <div style={{ minWidth: 0, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 20, padding: '14px 18px', boxShadow: '0 2px 6px rgba(20,30,25,.05), 0 10px 24px -8px rgba(20,30,25,.10)' }}>
            <div style={{ fontSize: 10.5, color: C.sage, letterSpacing: '.17em', textTransform: 'uppercase', fontWeight: 900, marginBottom: 5 }}>Our mission</div>
            <h1 style={{ fontFamily: MOMENT_FONT, fontWeight: 440, fontSize: 32, lineHeight: .94, margin: '0 0 7px', maxWidth: 690, letterSpacing: '-.015em' }}>
              Make the practical parts survivable.
            </h1>
            <p style={{ color: C.mid, fontSize: 13, lineHeight: 1.38, margin: 0, maxWidth: 700 }}>
              Passage turns scattered calls, documents, roles, service details, and family updates into one calm place to act.
            </p>
            <div style={{ marginTop: 8, color: C.ink, fontSize: 15, lineHeight: 1.15 }}>Not a checklist. One calm place that carries the next step.</div>
          </div>

          <div style={{ minWidth: 0, background: C.sageFaint, border: `1px solid #CFE0D8`, borderRadius: 20, padding: '14px 16px', display: 'grid', alignContent: 'center', gap: 6 }}>
            <div style={{ fontSize: 10.5, color: C.sage, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900 }}>The promise</div>
            <div style={{ fontFamily: MOMENT_FONT, fontWeight: 440, fontSize: 24, lineHeight: 1.02 }}>Less hunting. Fewer decisions. Visible progress.</div>
            <p style={{ color: C.mid, fontSize: 12.4, lineHeight: 1.4, margin: 0 }}>
              We do not pretend grief is manageable. We make the calls, documents, ownership, and next steps easier to carry.
            </p>
            <div style={{ background: C.panel, border: `1px solid #CFE0D8`, borderRadius: 12, padding: '8px 10px', color: C.mid, fontSize: 11.8, lineHeight: 1.3 }}>
              <strong style={{ color: C.sage }}>The Passage family pledge:</strong> {pledgeCopy}
            </div>
          </div>
        </div>

        <div className="mission-proof-grid" style={{ display: 'grid', gap: 7, marginBottom: 8 }}>
          {proof.map(([k, v]) => (
            <div key={k} style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 13, padding: '7px 10px', boxShadow: '0 1px 1px rgba(20,30,25,.03), 0 2px 4px rgba(20,30,25,.03)' }}>
              <div style={{ color: C.sage, fontSize: 10.5, fontWeight: 900, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 3 }}>{k}</div>
              <div style={{ fontSize: 14, lineHeight: 1.1 }}>{v}</div>
            </div>
          ))}
        </div>

        <div className="mission-path-grid" style={{ display: 'grid', gap: 8 }}>
          <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 15, padding: 8, display: 'grid', gap: 6, boxShadow: '0 1px 1px rgba(20,30,25,.03), 0 2px 4px rgba(20,30,25,.03)' }}>
            {paths.map(([label, , , , bg, accent], index) => (
              <button
                key={label}
                type="button"
                onClick={() => setActivePathIndex(index)}
                onFocus={() => setActivePathIndex(index)}
                style={{
                  border: `1px solid ${activePathIndex === index ? accent + '55' : C.border}`,
                  background: activePathIndex === index ? `linear-gradient(155deg, ${accent}, ${C.ink})` : C.bg,
                  color: activePathIndex === index ? '#fff' : C.mid,
                  borderRadius: 999,
                  padding: '9px 12px',
                  minHeight: 44,
                  textAlign: 'left',
                  fontFamily: BODY_FONT,
                  fontSize: 12,
                  fontWeight: 900,
                  cursor: 'pointer',
                  boxShadow: activePathIndex === index ? '0 1px 2px rgba(20,30,25,.15), 0 6px 14px -6px rgba(20,30,25,.4)' : 'none',
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <Link href={activePath[1]} style={{ display: 'grid', minWidth: 0, minHeight: 118, textDecoration: 'none', color: C.ink, background: activePath[4], border: `1px solid ${activePath[5]}33`, borderRadius: 20, padding: '14px 16px', boxShadow: '0 2px 6px rgba(20,30,25,.05), 0 10px 24px -8px rgba(20,30,25,.10)' }}>
            <div>
              <div style={{ color: activePath[5], fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900, marginBottom: 5 }}>{activePath[0]}</div>
              <div style={{ fontFamily: MOMENT_FONT, fontWeight: 440, fontSize: 23, lineHeight: 1.02, marginBottom: 6 }}>{activePath[2]}</div>
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
