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
  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: 'Georgia,serif' }}>
      <SiteHeader />
      <section style={{ maxWidth: 1060, margin: '0 auto', padding: '22px 28px 18px' }}>
        <div style={{ maxWidth: 760, marginBottom: 18 }}>
          <div style={eyebrow}>Resources</div>
          <h1 style={{ fontSize: 'clamp(34px, 4.5vw, 52px)', lineHeight: 1, margin: '0 0 10px', fontWeight: 400 }}>
            Start with the question you are carrying.
          </h1>
          <p style={{ color: C.mid, fontSize: 17, lineHeight: 1.5, margin: 0 }}>
            Simple guides for families, funeral homes, invited helpers, and local support partners.
          </p>
        </div>

        <section>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 290px), 1fr))', gap: 12 }}>
            {audiences.map(item => (
              <article key={item.label} style={panel}>
                <div style={eyebrow}>{item.label}</div>
                <h3 style={{ fontSize: 23, lineHeight: 1.08, margin: '0 0 8px', fontWeight: 400 }}>{item.title}</h3>
                <p style={{ color: C.mid, fontSize: 14.5, lineHeight: 1.5, margin: '0 0 14px' }}>{item.body}</p>
                <Link href={item.href} style={secondaryLink}>{item.cta}</Link>
              </article>
            ))}
          </div>
        </section>

        <section style={{ ...panel, marginTop: 14, display: 'grid', gridTemplateColumns: 'minmax(0,.9fr) minmax(0,1.1fr)', gap: 18, alignItems: 'start' }} className="resources-hero-grid">
          <div>
            <div style={eyebrow}>The spine</div>
            <h2 style={sectionTitle}>One task keeps the owner, message, proof, and waiting point together.</h2>
            <p style={{ color: C.mid, fontSize: 14.5, lineHeight: 1.5, margin: '9px 0 0' }}>
              Everyone sees only the slice they need. The family record stays continuous as providers rotate in and out.
            </p>
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {spineSteps.map(([number, title]) => (
              <div key={number} style={{ display: 'grid', gridTemplateColumns: '30px minmax(0,1fr)', gap: 9, alignItems: 'center', background: C.sageFaint, border: `1px solid ${C.sage}22`, borderRadius: 11, padding: '8px 10px' }}>
                <span style={{ width: 24, height: 24, borderRadius: '50%', background: C.card, color: C.sage, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 12 }}>{number}</span>
                <span style={{ fontSize: 14, lineHeight: 1.25, fontWeight: 800 }}>{title}</span>
              </div>
            ))}
          </div>
        </section>

        <details style={{ ...panel, marginTop: 14 }}>
          <summary style={{ cursor: 'pointer', color: C.sage, fontWeight: 900 }}>Coordination rules</summary>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 230px), 1fr))', gap: 10, marginTop: 12 }}>
            {trustNotes.map(note => (
              <div key={note} style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10, color: C.mid, fontSize: 14, lineHeight: 1.45 }}>{note}</div>
            ))}
          </div>
        </details>
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
