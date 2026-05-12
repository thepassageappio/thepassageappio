import Link from 'next/link';
import { SiteFooter, SiteHeader } from '../../components/SiteChrome';
import { calendlyUrl } from '../../lib/scheduling';

const C = {
  bg: '#f6f3ee',
  card: '#fffdf9',
  ink: '#1a1916',
  mid: '#6a6560',
  soft: '#a09890',
  border: '#e4ddd4',
  sage: '#6b8f71',
  sageFaint: '#f0f5f1',
  amber: '#a97832',
  amberFaint: '#fbf5e8',
};

const roleCards = [
  {
    eyebrow: 'Director / manager',
    title: 'Open the partner command center',
    body: 'Set up locations and employees, review warm inbound family requests, assign work, and see reporting.',
    href: '/funeral-home/dashboard?partner=1',
    action: 'Director sign in',
    tone: 'primary',
  },
  {
    eyebrow: 'Funeral-home staff',
    title: 'Open assigned work',
    body: "See today's assigned tasks with case context, waiting points, family requests, and proof actions.",
    href: '/funeral-home/dashboard?staff=1',
    action: 'Staff sign in',
  },
  {
    eyebrow: 'New partner',
    title: 'Create a partner workspace',
    body: 'Start setup yourself: confirm the organization, first location, co-branded family view, employees, cases, and warm inbounds.',
    href: '/funeral-home/setup',
    action: 'Start setup',
  },
];

export default function FuneralHomeLogin() {
  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: 'Georgia,serif' }}>
      <SiteHeader />
      <section style={{ maxWidth: 1060, margin: '0 auto', padding: '28px 24px 54px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,.78fr) minmax(320px,1fr)', gap: 18, alignItems: 'start' }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 24, boxShadow: '0 12px 34px rgba(55,45,35,.055)' }}>
            <div style={{ color: C.sage, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900 }}>Funeral home workspace</div>
            <h1 style={{ fontSize: 'clamp(34px,4.5vw,56px)', lineHeight: .98, margin: '10px 0 12px', fontWeight: 400 }}>Choose the role you are opening.</h1>
            <p style={{ color: C.mid, fontSize: 15.5, lineHeight: 1.62, margin: 0 }}>
              Passage separates the sales page from the working console. Directors manage the business view; staff see the work assigned to them.
            </p>
            <div style={{ background: C.amberFaint, border: `1px solid ${C.amber}33`, borderRadius: 13, padding: 12, color: C.mid, fontSize: 13.2, lineHeight: 1.45, marginTop: 16 }}>
              Sign in with the email invited to your funeral-home organization. If you are not set up yet, create a workspace or book a walkthrough.
            </div>
            <a href={calendlyUrl({ source: 'funeral home login' })} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', marginTop: 10, color: C.sage, fontSize: 13, fontWeight: 900, textDecoration: 'none' }}>Book a walkthrough instead</a>
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            {roleCards.map((card) => {
              const content = (
                <>
                  <span>
                    <span style={{ display: 'block', color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>{card.eyebrow}</span>
                    <span style={{ display: 'block', color: C.ink, fontSize: 20, lineHeight: 1.15, marginTop: 4, fontWeight: 900 }}>{card.title}</span>
                    <span style={{ display: 'block', color: C.mid, fontSize: 13.2, lineHeight: 1.45, marginTop: 4 }}>{card.body}</span>
                  </span>
                  <span style={{ border: `1px solid ${C.border}`, background: C.card, color: card.tone === 'primary' ? C.sage : C.mid, borderRadius: 999, padding: '8px 11px', fontSize: 12.5, fontWeight: 900, whiteSpace: 'nowrap' }}>{card.action}</span>
                </>
              );
              return (
                <Link
                  key={card.title}
                  href={card.href}
                  target={card.external ? '_blank' : undefined}
                  rel={card.external ? 'noreferrer' : undefined}
                  style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 14, alignItems: 'center', background: card.tone === 'primary' ? C.sageFaint : C.card, border: `1px solid ${card.tone === 'primary' ? C.sage + '33' : C.border}`, borderRadius: 16, padding: '16px 17px', textDecoration: 'none', color: C.ink, boxShadow: '0 8px 24px rgba(55,45,35,.04)' }}
                >
                  {content}
                </Link>
              );
            })}
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
