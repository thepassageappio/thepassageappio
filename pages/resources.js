import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SiteHeader, SiteFooter } from '../components/SiteChrome';

const C = {
  bg: '#f6f3ee',
  card: '#fffdf9',
  ink: '#1a1916',
  mid: '#625d56',
  soft: '#918980',
  border: '#e4ddd4',
  sage: '#6b8f71',
  sageFaint: '#edf5ee',
  gold: '#b8945a',
  goldFaint: '#fbf4e7',
};

const audiences = [
  {
    label: 'For families',
    title: 'Know what needs attention without learning a dashboard.',
    body: 'Passage shows the next useful action, who owns it, what is waiting, and what proof has been saved.',
    href: '/guides',
    cta: 'Open family guides',
  },
  {
    label: 'For funeral homes',
    title: 'Coordinate families, staff, participants, and vendors from the case.',
    body: 'Directors see active cases, waiting responses, staff ownership, proof, and exportable status without replacing their case system.',
    href: '/funeral-home',
    cta: 'See funeral home fit',
  },
  {
    label: 'For invited helpers',
    title: 'See only the work you were asked to handle.',
    body: 'Participants and vendors receive a scoped request tied to one estate task, with context, expectations, and a place to respond.',
    href: '/participating',
    cta: 'Open assigned work',
  },
];

const spineSteps = [
  ['1', 'A case or estate is created', 'The family or funeral home starts the shared workspace.'],
  ['2', 'A task becomes the unit of truth', 'Owner, message, proof, waiting state, and status stay together.'],
  ['3', 'The right person gets the right slice', 'Family, staff, vendor, or participant sees only what they need to act.'],
  ['4', 'Updates become proof', 'Responses, notes, documents, and status changes are recorded without turning into noisy chat.'],
];

const trustNotes = [
  'Email is the default official channel. SMS should be opt-in and used for urgent reminders.',
  'Passage prepares messages and outputs for review; people approve sensitive communication before it is sent.',
  'Audit/proof records are separate from human messages and notification delivery.',
  'Funeral homes can use Passage as an operational layer without trapping their case data.',
];

export default function ResourcesPage() {
  const panes = [
    ...audiences.map(item => ({
      id: item.label,
      label: item.label.replace('For ', ''),
      eyebrow: item.label,
      title: item.title,
      body: item.body,
      href: item.href,
      cta: item.cta,
      rows: [],
      tone: C.sage,
      bg: C.card,
    })),
    {
      id: 'spine',
      label: 'Spine',
      eyebrow: 'The spine',
      title: 'One task keeps the owner, message, proof, and waiting point together.',
      body: 'Everyone sees only the slice they need. The family record stays continuous as providers rotate in and out.',
      href: '/mission',
      cta: 'Read the mission',
      rows: spineSteps,
      tone: C.sage,
      bg: C.sageFaint,
    },
    {
      id: 'rules',
      label: 'Rules',
      eyebrow: 'Coordination rules',
      title: 'Messages, notifications, and proof stay separate.',
      body: 'Passage prepares action without pretending that every update is the work itself.',
      href: '/trust',
      cta: 'Read trust notes',
      rows: trustNotes.map((note, index) => [String(index + 1), note, '']),
      tone: C.gold,
      bg: C.goldFaint,
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
      <SiteHeader />
      <section style={{ maxWidth: 1080, margin: '0 auto', padding: '18px 28px 14px' }}>
        <section style={{ ...panel, display: 'grid', gridTemplateColumns: 'minmax(0,.82fr) minmax(360px,.9fr)', gap: 20, alignItems: 'stretch' }} className="resources-hero-grid">
          <div>
            <div style={eyebrow}>Resources</div>
            <h1 style={{ fontSize: 'clamp(36px, 4.4vw, 56px)', lineHeight: .98, margin: '0 0 11px', fontWeight: 400 }}>
              Start with the question you are carrying.
            </h1>
            <p style={{ color: C.mid, fontSize: 15.5, lineHeight: 1.5, margin: 0, maxWidth: 610 }}>
              Simple guides for families, funeral homes, invited helpers, and local support partners. Choose a path, then move from the same coordination spine.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 8, marginTop: 18 }}>
              {panes.map((pane, index) => (
                <button
                  key={pane.id}
                  type="button"
                  onClick={() => setActivePaneIndex(index)}
                  style={{ border: `1px solid ${activePaneIndex === index ? pane.tone + '55' : C.border}`, background: activePaneIndex === index ? pane.bg : C.bg, color: activePaneIndex === index ? pane.tone : C.mid, borderRadius: 12, minHeight: 40, padding: '0 11px', fontFamily: 'Georgia,serif', fontSize: 12.5, fontWeight: 900, cursor: 'pointer', textAlign: 'left' }}
                >
                  {pane.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ background: activePane.bg, border: `1px solid ${activePane.tone}22`, borderRadius: 18, padding: 18, display: 'flex', flexDirection: 'column', minHeight: 330 }}>
            <div style={{ ...eyebrow, color: activePane.tone }}>{activePane.eyebrow}</div>
            <h2 style={{ ...sectionTitle, fontSize: 'clamp(27px, 3vw, 38px)' }}>{activePane.title}</h2>
            <p style={{ color: C.mid, fontSize: 14.5, lineHeight: 1.5, margin: '9px 0 14px' }}>{activePane.body}</p>
            {activePane.rows.length > 0 && (
              <div style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
                {activePane.rows.map(([number, title, body]) => (
                  <div key={number + title} style={{ display: 'grid', gridTemplateColumns: '34px minmax(0,1fr)', gap: 9, alignItems: 'start', background: C.card, border: `1px solid ${C.border}`, borderRadius: 11, padding: '8px 10px' }}>
                    <span style={{ width: 24, height: 24, borderRadius: '50%', background: C.sageFaint, color: C.sage, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 12 }}>{number}</span>
                    <span>
                      <strong style={{ display: 'block', fontSize: 13.5, lineHeight: 1.2 }}>{title}</strong>
                      {body && <span style={{ display: 'block', color: C.mid, fontSize: 12.5, lineHeight: 1.35, marginTop: 3 }}>{body}</span>}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <Link href={activePane.href} style={{ ...secondaryLink, alignSelf: 'flex-start', marginTop: 'auto', background: C.card }}>{activePane.cta}</Link>
          </div>
        </section>
      </section>
      <SiteFooter />
      <style jsx>{`
        @media (max-width: 780px) {
          .resources-hero-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  );
}

const eyebrow = {
  color: C.sage,
  fontSize: 11,
  letterSpacing: '.16em',
  textTransform: 'uppercase',
  fontWeight: 900,
  marginBottom: 7,
};

const sectionTitle = {
  fontSize: 'clamp(24px, 2.7vw, 34px)',
  lineHeight: 1.02,
  margin: 0,
  fontWeight: 400,
};

const panel = {
  background: C.card,
  border: `1px solid ${C.border}`,
  borderRadius: 16,
  padding: 18,
  boxShadow: '0 14px 36px rgba(55,45,35,.05)',
};

const primaryLink = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 44,
  padding: '0 18px',
  borderRadius: 12,
  background: C.sage,
  color: '#fff',
  textDecoration: 'none',
  fontWeight: 900,
};

const secondaryLink = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 42,
  padding: '0 15px',
  borderRadius: 11,
  border: `1px solid ${C.border}`,
  color: C.sage,
  background: '#fff',
  textDecoration: 'none',
  fontWeight: 900,
};
