import Link from 'next/link';

const C = {
  bg: '#f6f3ee',
  card: '#fff',
  ink: '#1a1916',
  mid: '#6a6560',
  soft: '#a09890',
  border: '#e4ddd4',
  sage: '#6b8f71',
  sageFaint: '#f0f5f1',
  sageLight: '#c8deca',
  rose: '#c47a7a',
  roseFaint: '#fdf3f3',
  gold: '#b08a55',
  goldFaint: '#fbf5ec',
};

const navLink = { color: C.mid, textDecoration: 'none' };

export default function MissionPage() {
  return (
    <main style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Georgia,serif', color: C.ink }}>
      <nav style={{ maxWidth: 1080, margin: '0 auto', padding: '22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <Link href="/" style={{ color: C.ink, textDecoration: 'none', fontSize: 24, fontWeight: 700 }}>Passage</Link>
        <div style={{ display: 'flex', gap: 14, fontSize: 13, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <Link href="/pricing" style={navLink}>Pricing</Link>
          <Link href="/content" style={navLink}>Resources</Link>
          <Link href="/contact" style={navLink}>Contact</Link>
          <Link href="/participating" style={navLink}>Participating</Link>
        </div>
      </nav>

      <section style={{ maxWidth: 1080, margin: '0 auto', padding: '34px 22px 22px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: 30, alignItems: 'center' }}>
          <div style={{ maxWidth: 610 }}>
            <div style={{ fontSize: 11, color: C.sage, letterSpacing: '.18em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 12 }}>Our mission</div>
            <h1 style={{ fontSize: 'clamp(38px, 5.2vw, 62px)', lineHeight: 1.04, margin: '0 0 16px', fontWeight: 400, letterSpacing: 0 }}>
              Families need one calm next step.
            </h1>
            <p style={{ color: C.mid, fontSize: 16, lineHeight: 1.7, maxWidth: 560, margin: 0 }}>
              Passage turns the blur after a death, and the planning before one, into one place to know what matters, who owns it, and what happens next.
            </p>
          </div>
          <div style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: 16, padding: 20, boxShadow: '0 14px 42px rgba(55,45,35,.06)' }}>
            <div style={{ fontSize: 11, color: C.soft, textTransform: 'uppercase', letterSpacing: '.14em', fontWeight: 800, marginBottom: 10 }}>We believe</div>
            {['No one should become an operations manager in grief.', 'Every task should answer: what do I do right now?', 'Planning ahead should feel loving, not morbid.'].map((line) => (
              <div key={line} style={{ display: 'flex', gap: 10, padding: '8px 0', borderTop: '1px solid ' + C.border }}>
                <span style={{ color: C.sage, fontWeight: 800 }}>✓</span>
                <span style={{ color: C.mid, fontSize: 13.5, lineHeight: 1.5 }}>{line}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1080, margin: '0 auto', padding: '12px 22px 18px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))', gap: 14 }}>
          {[
            ['When someone just passed', 'Passage narrows the first hours into a guided command center: calls, documents, family updates, owners, and timing.'],
            ['When you plan ahead', 'Passage gathers wishes, people, documents, and roles so your family is not guessing later.'],
            ['When others need to help', 'Participants and partners get only their assigned work, with context, notes, and a clear way to mark progress.'],
          ].map(([title, body]) => (
            <div key={title} style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: 16, padding: 20 }}>
              <div style={{ fontSize: 18, color: C.ink, marginBottom: 8 }}>{title}</div>
              <div style={{ fontSize: 13.5, color: C.mid, lineHeight: 1.7 }}>{body}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 1080, margin: '0 auto', padding: '18px 22px 88px' }}>
        <div style={{ background: C.ink, color: '#fff', borderRadius: 20, padding: '30px 26px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: 18, alignItems: 'center' }}>
          <div>
            <div style={{ color: C.sageLight, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 10 }}>The product promise</div>
            <div style={{ fontSize: 28, lineHeight: 1.18, marginBottom: 10 }}>Less hunting. Fewer decisions. One next step.</div>
            <div style={{ color: '#d8d2ca', fontSize: 14, lineHeight: 1.7, maxWidth: 680 }}>
              Passage is not a checklist. It is an execution system for families, coordinators, and trusted partners moving through life-to-death transition with care.
            </div>
          </div>
          <Link href="/" style={{ background: C.sage, color: '#fff', borderRadius: 12, padding: '13px 18px', textDecoration: 'none', fontSize: 13, fontWeight: 800, whiteSpace: 'nowrap' }}>
            Open Passage
          </Link>
        </div>
      </section>
    </main>
  );
}
