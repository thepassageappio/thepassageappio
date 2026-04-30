import Link from 'next/link';

const C = { bg: '#f6f3ee', card: '#fff', ink: '#1a1916', mid: '#6a6560', soft: '#a09890', border: '#e4ddd4', sage: '#6b8f71', sageFaint: '#f0f5f1' };

export default function MissionPage() {
  return (
    <main style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Georgia,serif', color: C.ink }}>
      <nav style={{ maxWidth: 980, margin: '0 auto', padding: '22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ color: C.ink, textDecoration: 'none', fontSize: 24, fontWeight: 700 }}>Passage</Link>
        <div style={{ display: 'flex', gap: 14, fontSize: 13 }}>
          <Link href="/contact" style={{ color: C.mid, textDecoration: 'none' }}>Contact</Link>
          <Link href="/content" style={{ color: C.mid, textDecoration: 'none' }}>Content</Link>
          <Link href="/participating" style={{ color: C.mid, textDecoration: 'none' }}>Participating</Link>
        </div>
      </nav>
      <section style={{ maxWidth: 860, margin: '0 auto', padding: '54px 22px 80px' }}>
        <div style={{ fontSize: 11, color: C.sage, letterSpacing: '.18em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 14 }}>Our mission</div>
        <h1 style={{ fontSize: 48, lineHeight: 1.08, margin: '0 0 18px', fontWeight: 400 }}>Passage was created because families deserve more than a folder, a checklist, and a dozen disconnected phone calls.</h1>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 28, boxShadow: '0 12px 40px rgba(55,45,35,.06)' }}>
          <p style={{ color: C.mid, fontSize: 16, lineHeight: 1.85, marginTop: 0 }}>The idea came from real life: planning a grandmother's prepaid funeral, trying to understand Medicaid, sitting with funeral homes, and realizing how quickly a family is forced to become its own coordinator in the middle of grief.</p>
          <p style={{ color: C.mid, fontSize: 16, lineHeight: 1.85 }}>It also came from watching friends and family lose loved ones and face the same fragmented landscape again and again. Funeral homes, attorneys, government offices, banks, benefits, documents, clergy, florists, announcements, memories, and family communication all matter, but no single system takes calm ownership of the transition.</p>
          <p style={{ color: C.mid, fontSize: 16, lineHeight: 1.85 }}>Passage exists to become that system. We help people plan ahead so their families are not guessing later, and we help grieving families move through urgent next steps one decision at a time. The product prepares the work, asks for approval, sends the right messages, and keeps track of what has happened, what is waiting, and what still needs care.</p>
          <div style={{ background: C.sageFaint, borderRadius: 14, padding: 18, color: C.ink, fontSize: 17, lineHeight: 1.65, marginTop: 24 }}>Our mission is simple: no family should have to become an operations manager in the middle of grief.</div>
        </div>
      </section>
    </main>
  );
}
