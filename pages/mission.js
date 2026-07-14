import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SiteHeader, SiteFooter } from '../components/SiteChrome';

const paths = [
  ['Urgent help', '/urgent', 'Someone just passed', 'Start with the few actions that matter tonight: who calls, who is notified, what is waiting, and what is already handled.', 'rose'],
  ['Plan ahead', '/planning', 'Plan before it is needed', 'Gather people, wishes, documents, and confirmation contacts so your family is not starting from zero later.', 'pine'],
  ['Funeral homes', '/contact?category=funeral-home&plan=partner_pilot', 'For funeral homes', 'Apply to join, book a pilot walkthrough, or tell us how your team wants to receive family handoffs.', 'clay'],
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
    <main className="th-shell">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,440;9..144,520&family=Inter:wght@400;500;600;700&display=swap');
        :root{
          --pine-950:#0A1F1A; --pine-900:#0F2A24; --pine-800:#153A31; --pine-700:#1C4A3E; --pine-600:#245A4B;
          --pine-100:#E7EFEA; --pine-50:#F2F6F3;
          --clay-700:#9A4F26; --clay-600:#B5622F; --clay-200:#EBC6A4; --clay-100:#F5E4D6; --clay-50:#FBF0E7;
          --bone-50:#FEFDFB; --bone-100:#FBF8F3; --bone-200:#F5F0E7; --bone-300:#EBE3D3; --bone-400:#DDD2BB;
          --ink-900:#1C1917; --ink-700:#3D372F; --ink-600:#5A5348; --ink-500:#79705F; --ink-400:#9A9081; --ink-300:#BEB6A8;
          --line:#E6DDCB; --line-soft:#EFE8DA;
          --r-xs:8px; --r-sm:12px; --r-md:18px; --r-lg:26px; --r-full:999px;
          --e1:0 1px 1px rgba(20,30,25,.03), 0 2px 4px rgba(20,30,25,.03);
          --e2:0 2px 6px rgba(20,30,25,.05), 0 10px 24px -8px rgba(20,30,25,.10);
          --ease:cubic-bezier(.22,1,.36,1);
        }
      `}</style>
      <style jsx>{`
        .th-shell {
          min-height: 100vh;
          background: var(--bone-100);
          color: var(--ink-900);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          letter-spacing: -.005em;
        }
        .wrap { max-width: 1120px; margin: 0 auto; padding: 20px 22px 30px; }
        .hero-grid { display: grid; grid-template-columns: minmax(0,.96fr) minmax(320px,.64fr); gap: 14px; align-items: stretch; margin-bottom: 12px; }
        .panel { background: var(--bone-50); border: 1px solid var(--line-soft); border-radius: var(--r-lg); padding: 20px 22px; box-shadow: var(--e2); }
        .eyebrow { color: var(--clay-600); font-size: 10.5px; letter-spacing: .17em; text-transform: uppercase; font-weight: 700; margin-bottom: 7px; }
        h1 { font-family: 'Fraunces', serif; font-weight: 440; font-size: clamp(30px,4.2vw,44px); line-height: .96; margin: 0 0 10px; max-width: 690px; letter-spacing: -.015em; color: var(--pine-950); }
        p.lede { color: var(--ink-500); font-size: 14.5px; line-height: 1.5; margin: 0; max-width: 700px; }
        .promise-line { margin-top: 10px; color: var(--ink-900); font-size: 15px; line-height: 1.25; }
        .promise-card { background: var(--pine-50); border: 1px solid #D5E4DC; border-radius: var(--r-lg); padding: 18px 20px; display: grid; align-content: center; gap: 8px; }
        .promise-title { font-family: 'Fraunces', serif; font-weight: 440; font-size: 24px; line-height: 1.05; color: var(--pine-950); }
        .promise-body { color: var(--ink-500); font-size: 13px; line-height: 1.42; margin: 0; }
        .pledge-box { background: var(--bone-50); border: 1px solid #D5E4DC; border-radius: var(--r-sm); padding: 10px 12px; color: var(--ink-600); font-size: 12px; line-height: 1.4; }
        .pledge-box strong { color: var(--pine-700); }
        .proof-row { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 8px; margin-bottom: 12px; }
        .proof-card { background: var(--bone-50); border: 1px solid var(--line-soft); border-radius: var(--r-sm); padding: 9px 12px; }
        .proof-k { color: var(--pine-700); font-size: 10.5px; font-weight: 700; letter-spacing: .13em; text-transform: uppercase; margin-bottom: 4px; }
        .proof-v { font-size: 14px; line-height: 1.15; color: var(--ink-900); }
        .path-grid { display: grid; grid-template-columns: 210px minmax(0,1fr); gap: 10px; }
        .path-tabs { background: var(--bone-50); border: 1px solid var(--line-soft); border-radius: var(--r-md); padding: 9px; display: grid; gap: 7px; }
        .path-tab {
          border: 1px solid var(--line-soft); background: var(--bone-100); color: var(--ink-600);
          border-radius: var(--r-full); padding: 10px 13px; text-align: left; font-family: 'Inter', sans-serif;
          font-size: 12px; font-weight: 700; cursor: pointer;
        }
        .path-tab.active-rose { border-color: var(--clay-600); background: linear-gradient(155deg, var(--clay-600), var(--ink-900)); color: #fff; box-shadow: 0 1px 2px rgba(20,30,25,.15), 0 6px 14px -6px rgba(20,30,25,.4); }
        .path-tab.active-pine { border-color: var(--pine-600); background: linear-gradient(155deg, var(--pine-600), var(--pine-900)); color: #fff; box-shadow: 0 1px 2px rgba(20,30,25,.15), 0 6px 14px -6px rgba(20,30,25,.4); }
        .path-tab.active-clay { border-color: var(--clay-700); background: linear-gradient(155deg, var(--clay-700), var(--ink-900)); color: #fff; box-shadow: 0 1px 2px rgba(20,30,25,.15), 0 6px 14px -6px rgba(20,30,25,.4); }
        .path-preview { display: grid; min-height: 130px; text-decoration: none; color: var(--ink-900); border-radius: var(--r-lg); padding: 18px 20px; }
        .path-preview.tone-rose { background: var(--clay-50); border: 1px solid var(--clay-600); }
        .path-preview.tone-pine { background: var(--pine-50); border: 1px solid var(--pine-600); }
        .path-preview.tone-clay { background: var(--clay-100); border: 1px solid var(--clay-700); }
        .path-kicker { font-size: 10.5px; letter-spacing: .14em; text-transform: uppercase; font-weight: 700; margin-bottom: 6px; }
        .tone-rose .path-kicker, .tone-rose .path-open { color: var(--clay-600); }
        .tone-pine .path-kicker, .tone-pine .path-open { color: var(--pine-700); }
        .tone-clay .path-kicker, .tone-clay .path-open { color: var(--clay-700); }
        .path-title { font-family: 'Fraunces', serif; font-weight: 440; font-size: 22px; line-height: 1.05; margin-bottom: 7px; }
        .path-body { color: var(--ink-500); font-size: 13.5px; line-height: 1.4; max-width: 740px; }
        .path-open { align-self: end; font-size: 12px; font-weight: 700; margin-top: 8px; }

        @media (max-width: 760px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .proof-row { grid-template-columns: 1fr !important; }
          .path-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <SiteHeader />
      <section className="wrap">
        <div className="hero-grid">
          <div className="panel">
            <div className="eyebrow">Our mission</div>
            <h1>Make the practical parts survivable.</h1>
            <p className="lede">
              Passage turns scattered calls, documents, roles, service details, and family updates into one calm place to act.
            </p>
            <div className="promise-line">Not a checklist. One calm place that carries the next step.</div>
          </div>

          <div className="promise-card">
            <div className="eyebrow">The promise</div>
            <div className="promise-title">Less hunting. Fewer decisions. Visible progress.</div>
            <p className="promise-body">
              We do not pretend grief is manageable. We make the calls, documents, ownership, and next steps easier to carry.
            </p>
            <div className="pledge-box">
              <strong>The Passage family pledge:</strong> {pledgeCopy}
            </div>
          </div>
        </div>

        <div className="proof-row">
          {proof.map(([k, v]) => (
            <div key={k} className="proof-card">
              <div className="proof-k">{k}</div>
              <div className="proof-v">{v}</div>
            </div>
          ))}
        </div>

        <div className="path-grid">
          <div className="path-tabs">
            {paths.map(([label, , , , tone], index) => (
              <button
                key={label}
                type="button"
                onClick={() => setActivePathIndex(index)}
                onFocus={() => setActivePathIndex(index)}
                className={activePathIndex === index ? `path-tab active-${tone}` : 'path-tab'}
              >
                {label}
              </button>
            ))}
          </div>
          <Link href={activePath[1]} className={`path-preview tone-${activePath[4]}`}>
            <div>
              <div className="path-kicker">{activePath[0]}</div>
              <div className="path-title">{activePath[2]}</div>
              <div className="path-body">{activePath[3]}</div>
            </div>
            <div className="path-open">Open &rarr;</div>
          </Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
