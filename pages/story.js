import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SiteFooter, SiteHeader } from '../components/SiteChrome';

const C = {
  bg: '#f6f3ee',
  card: '#fffdf9',
  ink: '#1a1916',
  mid: '#6a6560',
  soft: '#9a9288',
  border: '#e4ddd4',
  sage: '#6b8f71',
  sageDark: '#4a6e50',
  sageFaint: '#eef5ef',
  sageLight: '#c8deca',
  gold: '#b8945a',
  goldFaint: '#fbf5e8',
  roseFaint: '#fbf0ef',
};

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
    <main style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: 'Georgia,serif' }}>
      <style suppressHydrationWarning>{`
        .story-shell { max-width: 1120px; margin: 0 auto; padding: 14px 28px 18px; }
        .story-hero { display:grid; grid-template-columns:minmax(0,.98fr) minmax(340px,.68fr); gap:18px; align-items:stretch; }
        .story-card { background:${C.card}; border:1px solid ${C.border}; border-radius:20px; padding:20px 22px; box-shadow:0 18px 54px rgba(55,45,35,.05); }
        .story-side { background:${C.sageFaint}; border-color:${C.sageLight}; display:flex; flex-direction:column; gap:12px; }
        .story-tabs { display:grid; grid-template-columns:repeat(3,1fr); gap:7px; }
        .story-tab { border:1px solid ${C.border}; background:${C.card}; color:${C.mid}; border-radius:999px; min-height:34px; font-family:inherit; font-size:12px; font-weight:900; cursor:pointer; }
        .story-tab-active { background:${C.sageFaint}; border-color:${C.sageLight}; color:${C.sageDark}; }
        .story-kicker { color:${C.sage}; font-size:10.5px; letter-spacing:.18em; text-transform:uppercase; font-weight:900; margin-bottom:10px; }
        .story-title { font-size:52px; line-height:.98; margin:0 0 12px; font-weight:400; letter-spacing:0; max-width:700px; }
        .story-lede { color:${C.mid}; font-size:15px; line-height:1.55; margin:0 0 14px; max-width:760px; }
        .story-artifact { display:grid; gap:9px; margin-top:3px; }
        .story-artifact-row { display:grid; grid-template-columns:86px minmax(0,1fr); gap:10px; align-items:center; border-top:1px solid ${C.sageLight}; padding-top:9px; color:${C.mid}; font-size:13.2px; line-height:1.35; }
        .story-artifact-row:first-child { border-top:none; padding-top:0; }
        .story-artifact-row strong { color:${C.ink}; font-size:13.5px; }
        .story-folder-note { color:${C.sageDark}; font-size:24px; line-height:1.06; margin:0; }
        .story-body { margin:12px auto 0; }
        .story-copy { background:${C.card}; border:1px solid ${C.border}; border-radius:18px; padding:16px 18px; display:grid; grid-template-columns:minmax(0,1fr) auto; gap:16px; align-items:center; }
        .story-copy p { color:${C.mid}; font-size:14px; line-height:1.52; margin:0; max-width:760px; }
        .story-body strong { color:${C.ink}; font-weight:500; }
        .story-actions { display:flex; gap:9px; flex-wrap:wrap; justify-content:flex-end; }
        .story-button { min-height:44px; border-radius:13px; display:inline-flex; align-items:center; justify-content:center; padding:0 16px; font-weight:900; text-decoration:none; white-space:nowrap; }
        @media (max-width: 760px) {
          .story-shell { padding:18px 18px 54px; }
          .story-hero { grid-template-columns:1fr; }
          .story-card { padding:20px 18px; }
          .story-copy { grid-template-columns:1fr; }
          .story-copy p { font-size:16px; line-height:1.7; }
          .story-tabs { grid-template-columns:1fr; }
          .story-button { width:100%; }
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
              <Link href="/urgent" className="story-button" style={{ background: C.ink, color: '#fff' }}>Start urgent path</Link>
              <Link href="/mission" className="story-button" style={{ background: C.card, color: C.sageDark, border: `1px solid ${C.sageLight}` }}>Read the mission</Link>
            </div>
          </div>
        </article>
      </section>
      <SiteFooter />
    </main>
  );
}
