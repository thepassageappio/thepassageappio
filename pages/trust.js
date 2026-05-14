import Link from 'next/link';
import { SiteFooter, SiteHeader } from '../components/SiteChrome';

const C = {
  bg: '#f6f3ee',
  card: '#fff',
  ink: '#1a1916',
  mid: '#6a6560',
  border: '#e4ddd4',
  sage: '#6b8f71',
  rose: '#c47a7a',
  roseFaint: '#fdf3f3',
  goldFaint: '#fbf5e8',
};

const trustCards = [
  ['Coordination, not emergency response', 'Passage helps organize next steps, ownership, messages, proof, and records. It is not an emergency service, medical provider, legal advisor, funeral director, government agency, bank, clergy member, or hospice provider.'],
  ['Role-based visibility', 'The product is built around roles: family coordinator, participant, funeral-home staff, vendor, and Passage system admin. Each role should see only the work and context needed for that role.'],
  ['Proof and audit trail', 'Meaningful actions should leave a visible trail: actor, timestamp, recipient, channel, task, status, and supporting note or document reference where available.'],
  ['Data portability', 'Passage should make estate and case data exportable so families and funeral homes are not trapped in the platform. CSV exports are part of the adoption trust story.'],
  ['Task-native vendors', 'Vendors should appear only inside relevant tasks. Families should feel helped, not sold to or forced to browse a generic marketplace during a stressful moment.'],
  ['Human review stays central', 'Passage can prepare scripts, packets, messages, and next steps, but families and professionals approve what is sent and remain responsible for situation-specific judgment.'],
];

export default function TrustPage() {
  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: 'Georgia,serif' }}>
      <SiteHeader />
      <section style={{ maxWidth: 1080, margin: '0 auto', padding: '24px 28px 48px' }}>
        <div style={eyebrow}>Trust and boundaries</div>
        <h1 style={h1}>Passage should make the work clearer, not pretend it can replace judgment.</h1>
        <p style={lead}>
          Passage is a coordination layer for emotionally difficult work. These boundaries explain what Passage helps organize, what remains human judgment, and when families or providers should contact professionals directly.
        </p>

        <section style={{ background: C.roseFaint, border: `1px solid ${C.rose}33`, borderRadius: 20, padding: 20, marginTop: 18 }}>
          <div style={{ color: C.rose, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900 }}>When safety or legal authority is unclear</div>
          <p style={{ color: C.mid, fontSize: 16, lineHeight: 1.6, margin: '8px 0 0' }}>
            If there is danger, uncertainty about whether someone has died, a medical emergency, an unattended death, or any local rule requiring professional notification, contact emergency services, hospice, medical staff, police, a funeral director, a qualified legal professional, or the appropriate local authority directly. Passage guidance is not a substitute for those decisions.
          </p>
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: 12, marginTop: 16 }}>
          {trustCards.map(([title, body]) => (
            <article key={title} style={panel}>
              <h2 style={h2}>{title}</h2>
              <p style={bodyText}>{body}</p>
            </article>
          ))}
        </div>

        <section style={{ ...panel, marginTop: 16, background: C.goldFaint }}>
          <h2 style={h2}>How Passage earns trust</h2>
          <p style={bodyText}>
            Passage keeps sensitive coordination work role-scoped, review-first, and exportable. Families and professionals remain in control of what is sent, shared, completed, and handed off.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
            <Link href="/privacy" style={primaryLink}>Privacy overview</Link>
            <Link href="/terms" style={secondaryLink}>Terms overview</Link>
            <Link href="/faq" style={secondaryLink}>FAQ</Link>
          </div>
        </section>

        <section style={{ ...panel, marginTop: 16 }}>
          <h2 style={h2}>Compliance posture</h2>
          <p style={bodyText}>
            Passage is not currently claiming HIPAA compliance, SOC 1 compliance, or SOC 2 compliance. The product is being built with role-scoped access, audit trails, review-before-share workflows, security headers, and formal compliance readiness in mind. Covered-entity, hospice, care-facility, or enterprise partner diligence should be handled through a formal security and legal review before production use.
          </p>
        </section>
      </section>
      <SiteFooter />
    </main>
  );
}

const eyebrow = { color: C.sage, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900 };
const h1 = { fontSize: 52, lineHeight: 1.03, margin: '8px 0 10px', fontWeight: 400, maxWidth: 900 };
const h2 = { fontSize: 24, lineHeight: 1.12, margin: '0 0 8px', fontWeight: 400 };
const lead = { color: C.mid, fontSize: 16, lineHeight: 1.6, margin: 0, maxWidth: 780 };
const panel = { background: C.card, border: '1px solid ' + C.border, borderRadius: 18, padding: 18, boxShadow: '0 4px 20px rgba(0,0,0,.04)' };
const bodyText = { color: C.mid, fontSize: 15, lineHeight: 1.6, margin: 0 };
const primaryLink = { display: 'inline-flex', alignItems: 'center', minHeight: 44, background: C.sage, color: '#fff', borderRadius: 13, padding: '0 16px', textDecoration: 'none', fontWeight: 900 };
const secondaryLink = { display: 'inline-flex', alignItems: 'center', minHeight: 44, background: C.card, color: C.sage, border: '1px solid ' + C.border, borderRadius: 13, padding: '0 16px', textDecoration: 'none', fontWeight: 900 };
