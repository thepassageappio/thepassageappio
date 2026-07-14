import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SiteFooter, SiteHeader } from '../components/SiteChrome';

const moments = [
  ['The meeting', 'There was care in the room, and still too much for the family to carry home.'],
  ['The folder', 'Instructions, phone numbers, papers, and next steps depended on one person keeping it all straight.'],
  ['The gap', 'Every institution had a role, but the family record did not travel with the family.'],
  ['The product', 'Passage became the calm place for owners, updates, proof, and handoffs to stay together.'],
];

export default function StoryPage() {
  const panes = [
    {
      id: 'folder',
      label: 'The folder',
      eyebrow: 'What came home',
      title: 'The folder was useful. It just could not carry continuity.',
      rows: [
        ['Medicaid', 'Notes from care planning'],
        ['Funeral', 'Wishes, contacts, next calls'],
        ['Family', 'Who owns what after the meeting'],
        ['Proof', 'What happened and what is waiting'],
      ],
    },
    {
      id: 'gap',
      label: 'The gap',
      eyebrow: 'The realization',
      title: 'The missing piece was continuity.',
      rows: moments,
    },
    {
      id: 'promise',
      label: 'The promise',
      eyebrow: 'Why Passage exists',
      title: 'To make the practical parts survivable.',
      rows: [
        ['Now', 'What happens next'],
        ['Owner', 'Who is responsible'],
        ['Waiting', 'What cannot move yet'],
        ['Proof', 'How everyone knows it happened'],
      ],
    },
  ];
  const s0 = useState(0); const activePaneIndex = s0[0]; const setActivePaneIndex = s0[1];
  const activePane = panes[activePaneIndex] || panes[0];

  useEffect(function() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    var timer = window.setInterval(function() {
      setActivePaneIndex(function(current) { return (current + 1) % panes.length; });
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
        .story-shell { max-width: 1120px; margin: 0 auto; padding: 20px 28px 40px; }
        .story-hero { display: grid; grid-template-columns: minmax(0,.98fr) minmax(340px,.68fr); gap: 16px; align-items: stretch; }
        .story-card { background: var(--bone-50); border: 1px solid var(--line-soft); border-radius: var(--r-lg); padding: 22px 24px; box-shadow: var(--e2); }
        .story-side { background: var(--pine-50); border-color: #D5E4DC; display: flex; flex-direction: column; gap: 12px; }
        .story-tabs { display: grid; grid-template-columns: repeat(3,1fr); gap: 7px; }
        .story-tab { border: 1px solid var(--line-soft); background: var(--bone-50); color: var(--ink-600); border-radius: var(--r-full); min-height: 36px; font-family: inherit; font-size: 12px; font-weight: 700; cursor: pointer; }
        .story-tab-active { background: linear-gradient(155deg, var(--pine-600), var(--pine-800)); border-color: var(--pine-600); color: #fff; box-shadow: 0 1px 2px rgba(20,30,25,.15), 0 6px 14px -6px rgba(20,30,25,.4); }
        .story-kicker { color: var(--pine-700); font-size: 10.5px; letter-spacing: .17em; text-transform: uppercase; font-weight: 700; margin-bottom: 9px; }
        .story-title { font-family: 'Fraunces', serif; font-weight: 440; font-size: clamp(34px,4.6vw,48px); line-height: .98; margin: 0 0 12px; letter-spacing: -.015em; color: var(--pine-950); max-width: 700px; }
        .story-lede { color: var(--ink-500); font-size: 14.5px; line-height: 1.52; margin: 0 0 12px; max-width: 760px; }
        .story-artifact { display: grid; gap: 9px; margin-top: 3px; }
        .story-artifact-row { display: grid; grid-template-columns: 86px minmax(0,1fr); gap: 10px; align-items: center; border-top: 1px solid #D5E4DC; padding-top: 9px; color: var(--ink-500); font-size: 13px; line-height: 1.35; }
        .story-artifact-row:first-child { border-top: none; padding-top: 0; }
        .story-artifact-row strong { color: var(--ink-900); font-size: 13.5px; }
        .story-folder-note { color: var(--pine-800); font-family: 'Fraunces', serif; font-weight: 440; font-size: 22px; line-height: 1.08; margin: 0; }
        .story-body { margin: 12px auto 0; }
        .story-copy { background: var(--bone-50); border: 1px solid var(--line-soft); border-radius: var(--r-md); padding: 16px 18px; display: grid; grid-template-columns: minmax(0,1fr) auto; gap: 16px; align-items: center; }
        .story-copy p { color: var(--ink-500); font-size: 14px; line-height: 1.5; margin: 0; max-width: 760px; }
        .story-actions { display: flex; gap: 9px; flex-wrap: wrap; justify-content: flex-end; }
        .story-button { min-height: 44px; border-radius: var(--r-full); display: inline-flex; align-items: center; justify-content: center; padding: 0 16px; font-weight: 700; text-decoration: none; white-space: nowrap; font-size: 13.5px; }
        .story-button-primary { background: var(--ink-900); color: #fff; }
        .story-button-secondary { background: var(--bone-50); color: var(--pine-800); border: 1px solid #D5E4DC; }
        @media (max-width: 760px) {
          .story-shell { padding: 16px 18px 44px; }
          .story-hero { grid-template-columns: 1fr; }
          .story-card { padding: 18px 18px; }
          .story-copy { grid-template-columns: 1fr; }
          .story-copy p { font-size: 15px; line-height: 1.65; }
          .story-tabs { grid-template-columns: 1fr; }
          .story-button { width: 100%; }
        }
      `}</style>
      <SiteHeader />
      <section className="story-shell">
        <div className="story-hero">
          <div className="story-card">
            <div className="story-kicker">Our Story</div>
            <h1 className="story-title">Passage began with a folder.</h1>
            <p className="story-lede">
              Passage's founder helped plan his grandmother's funeral with her while the family was also navigating Medicaid and the practical realities that come with care. The people helping were kind. The system around everyone was not built for continuity.
            </p>
            <p className="story-lede">
              This was not a villain story. The care was real. The burden still moved back to the family: remember this, call that person, find this document, tell everyone what changed.
            </p>
          </div>
          <div className="story-card story-side">
            <div className="story-tabs" role="tablist" aria-label="Story panes">
              {panes.map(function(pane, index) {
                return (
                  <button
                    key={pane.id}
                    type="button"
                    onClick={function() { setActivePaneIndex(index); }}
                    className={'story-tab ' + (activePane.id === pane.id ? 'story-tab-active' : '')}
                    aria-selected={activePane.id === pane.id}
                  >
                    {pane.label}
                  </button>
                );
              })}
            </div>
            <div>
              <div className="story-kicker" style={{ marginBottom: 8 }}>{activePane.eyebrow}</div>
              <p className="story-folder-note">{activePane.title}</p>
            </div>
            <div className="story-artifact" aria-label="A folder of practical next steps">
              {activePane.rows.map(([label, text]) => (
                <div className="story-artifact-row" key={label}>
                  <strong>{label}</strong>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <article className="story-body">
          <div className="story-copy">
            <p>
              Passage came from that gap. The problem was not that people did not care. The problem was that the family record did not travel cleanly.
            </p>
            <div className="story-actions">
              <Link href="/urgent" className="story-button story-button-primary">Start urgent help</Link>
              <Link href="/mission" className="story-button story-button-secondary">Read the mission</Link>
            </div>
          </div>
        </article>
      </section>
      <SiteFooter />
    </main>
  );
}
