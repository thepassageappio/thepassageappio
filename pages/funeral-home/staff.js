import Link from 'next/link';
import { SiteFooter, SiteHeader } from '../../components/SiteChrome';

const C = {
  bg: '#f6f3ee',
  card: '#fffdf9',
  ink: '#1a1916',
  mid: '#6a6560',
  border: '#e4ddd4',
  sage: '#6b8f71',
  sageFaint: '#f0f5f1',
};

export default function FuneralHomeStaffLogin() {
  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: 'Georgia,serif' }}>
      <SiteHeader />
      <section style={{ maxWidth: 780, margin: '0 auto', padding: '34px 24px 60px' }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 26, boxShadow: '0 12px 34px rgba(55,45,35,.055)' }}>
          <div style={{ color: C.sage, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900 }}>Funeral-home staff</div>
          <h1 style={{ fontSize: 'clamp(34px,5vw,54px)', lineHeight: 1, margin: '10px 0 12px', fontWeight: 400 }}>Open the work assigned to you.</h1>
          <p style={{ color: C.mid, fontSize: 15.5, lineHeight: 1.62, margin: 0 }}>
            Staff sign in with the email invited by a director. Passage opens assigned case work first: what is due, what is waiting, and what proof closes the loop.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 9, margin: '18px 0' }}>
            {[
              ['Your queue', 'Only work assigned to you appears first.'],
              ['Case context', 'You see the family-facing status and the next expected update.'],
              ['Proof', 'Notes, proof, and completion updates return to the case spine.'],
            ].map(([title, body]) => (
              <div key={title} style={{ background: C.sageFaint, border: `1px solid ${C.sage}30`, borderRadius: 13, padding: 12 }}>
                <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>{title}</div>
                <div style={{ color: C.mid, fontSize: 13, lineHeight: 1.45, marginTop: 4 }}>{body}</div>
              </div>
            ))}
          </div>
          <Link href="/funeral-home/dashboard?staff=1" style={{ minHeight: 52, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: C.sage, color: '#fff', borderRadius: 14, padding: '0 20px', textDecoration: 'none', fontWeight: 900 }}>
            Staff sign in
          </Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
