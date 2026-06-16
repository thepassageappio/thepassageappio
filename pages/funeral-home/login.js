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
    eyebrow: 'Customer login',
    title: 'Director or manager',
    body: 'Open the actual funeral-home workspace: My Day, cases, employees, family requests, proof, reports, and exports.',
    href: '/funeral-home/dashboard?partner=1',
    action: 'Open dashboard',
    tone: 'primary',
  },
  {
    eyebrow: 'Customer login',
    title: 'Staff queue',
    body: 'Open assigned case work first: what is due, what is waiting, the drafted ask, and the proof needed to close the loop.',
    href: '/funeral-home/staff',
    action: 'Open staff login',
  },
  {
    eyebrow: 'New partner',
    title: 'Set up a workspace',
    body: 'Start setup after Passage has approved your funeral-home account: organization, locations, employees, family view, and first cases.',
    href: '/funeral-home/setup',
    action: 'Start setup',
  },
];

const helperCards = [
  ['Learn functionality', '/funeral-home', 'See how Passage helps directors coordinate cases, staff, family updates, proof, and exports.'],
  ['Book a demo', calendlyUrl({ source: 'funeral home login doorway' }), 'For funeral homes evaluating Passage or needing help getting started.'],
  ['View sample case', '/funeral-home/pilot-proof', 'Explore a safe sample case before logging into a real customer workspace.'],
];

export default function FuneralHomeLogin() {
  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: 'Georgia,serif' }}>
      <SiteHeader />
      <section style={{ maxWidth: 1080, margin: '0 auto', padding: '28px 24px 58px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,.82fr) minmax(320px,1fr)', gap: 18, alignItems: 'start' }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 24, boxShadow: '0 12px 34px rgba(55,45,35,.055)' }}>
            <div style={eyebrow}>Funeral-home portal</div>
            <h1 style={{ fontSize: 52, lineHeight: .98, margin: '10px 0 12px', fontWeight: 400 }}>Customers sign in. Prospects learn or book a demo.</h1>
            <p style={lead}>
              This is the doorway to the working funeral-home product. If your organization already uses Passage, choose your role. If you are evaluating Passage, use the sales page, sample case, or walkthrough instead.
            </p>
            <div style={{ background: C.amberFaint, border: `1px solid ${C.amber}33`, borderRadius: 13, padding: 12, color: C.mid, fontSize: 13.2, lineHeight: 1.45, marginTop: 16 }}>
              Use the email invited to your funeral-home organization. Directors see the business workspace; staff see assigned work. Public visitors should not land inside customer data or internal admin tools.
            </div>
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            {roleCards.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 14, alignItems: 'center', background: card.tone === 'primary' ? C.sageFaint : C.card, border: `1px solid ${card.tone === 'primary' ? C.sage + '33' : C.border}`, borderRadius: 16, padding: '16px 17px', textDecoration: 'none', color: C.ink, boxShadow: '0 8px 24px rgba(55,45,35,.04)' }}
              >
                <span>
                  <span style={eyebrow}>{card.eyebrow}</span>
                  <span style={{ display: 'block', color: C.ink, fontSize: 20, lineHeight: 1.15, marginTop: 4, fontWeight: 900 }}>{card.title}</span>
                  <span style={{ display: 'block', color: C.mid, fontSize: 13.2, lineHeight: 1.45, marginTop: 4 }}>{card.body}</span>
                </span>
                <span style={{ border: `1px solid ${C.border}`, background: C.card, color: card.tone === 'primary' ? C.sage : C.mid, borderRadius: 999, padding: '8px 11px', fontSize: 12.5, fontWeight: 900, whiteSpace: 'nowrap' }}>{card.action}</span>
              </Link>
            ))}
          </div>
        </div>

        <section style={{ marginTop: 18, background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 18, boxShadow: '0 8px 24px rgba(55,45,35,.04)' }}>
          <div style={eyebrow}>Not a customer yet?</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginTop: 12 }}>
            {helperCards.map(([title, href, body]) => {
              const external = href.startsWith('http');
              return (
                <Link key={title} href={href} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: 13, color: C.ink, textDecoration: 'none', display: 'grid', gap: 5 }}>
                  <strong style={{ fontSize: 16, lineHeight: 1.18 }}>{title}</strong>
                  <span style={{ color: C.mid, fontSize: 12.8, lineHeight: 1.45 }}>{body}</span>
                  <span style={{ color: C.sage, fontSize: 12.5, fontWeight: 900 }}>{external ? 'Open booking page' : 'Open'}</span>
                </Link>
              );
            })}
          </div>
        </section>
      </section>
      <SiteFooter />
    </main>
  );
}

const eyebrow = { display: 'block', color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 };
const lead = { color: C.mid, fontSize: 15.5, lineHeight: 1.62, margin: 0 };
