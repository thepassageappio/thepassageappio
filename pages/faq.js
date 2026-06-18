import Link from 'next/link';
import { SiteFooter, SiteHeader } from '../components/SiteChrome';

const C = {
  bg: '#f6f3ee',
  card: '#fff',
  ink: '#1a1916',
  mid: '#6a6560',
  soft: '#a09890',
  border: '#e4ddd4',
  sage: '#6b8f71',
  sageFaint: '#f0f5f1',
  rose: '#c47a7a',
  roseFaint: '#fdf3f3',
};

const sections = [
  {
    title: 'Families',
    items: [
      ['What is Passage?', 'Passage is a coordination layer for the practical work around a death or future plan: tasks, owners, messages, proof, documents, and updates.'],
      ['Is Passage an emergency service?', 'No. If there is an emergency, danger, uncertainty about death, or local law requires it, call 911, hospice, police, medical staff, or the appropriate authority directly. Passage helps organize next steps after professional/local judgment.'],
      ['What happens after I start urgent help?', 'Passage helps identify the situation, show one clear next step, create a family record, and track who owns each action.'],
      ['Can my family customize the workflow?', 'Yes. Passage provides best-practice guidance and workflow structure, but families and professionals can adapt tasks, owners, and notes to their situation.'],
    ],
  },
  {
    title: 'Participants and helpers',
    items: [
      ['Why did I receive an invite?', 'Someone coordinating an estate assigned you a specific responsibility. You should see one task, context, and a way to say you can handle it, are waiting, completed it, or need help.'],
      ['Am I responsible for the whole estate?', 'No. Participants are responsible only for the tasks they accept or are assigned, unless the coordinator gives them a broader role.'],
      ['Where do my updates go?', 'Your updates are saved in Passage so the coordinator and permitted users can see what happened without chasing a separate text thread.'],
    ],
  },
  {
    title: 'Funeral homes',
    items: [
      ['Does Passage replace our case system?', 'No. Passage is designed to sit on top of existing funeral-home systems as a family-facing coordination layer, with CSV export for portability.'],
      ['What does "act on behalf" mean?', 'A funeral-home user can handle or update family-visible tasks with an audit trail so families know what is done, waiting, or needs their input.'],
      ['How are staff roles handled?', 'Directors, location managers, and staff can have different views so each person sees the cases, tasks, and reporting connected to their role.'],
      ['What metrics should a funeral home see?', 'Calls avoided, waiting items, tasks completed, tasks by employee/location, response times, vendor requests, and exportable case data.'],
    ],
  },
  {
    title: 'Vendors',
    items: [
      ['How do I become a local vendor?', 'Use the vendor application form. Passage reviews business details, category, ZIP codes, contact information, and fit before approval.'],
      ['Do vendor applications come from Contact Us?', 'No. Vendor applications come from the vendor onboarding flow. General Contact Us messages are support, product, billing, or partnership inquiries.'],
      ['What happens after approval?', 'The approved contact email becomes the vendor login identity. Approved vendors can sign in to the vendor page and manage task-native requests.'],
      ['Where do families see vendors?', 'Only inside relevant tasks. Passage is not building a generic directory where families browse vendors under stress.'],
    ],
  },
  {
    title: 'Support, billing, and product requests',
    items: [
      ['How do I report a bug?', 'Use Contact and choose Report a bug or Technical issue. Include the page, what you clicked, and what you expected to happen.'],
      ['How do I request a feature?', 'Use Contact and describe the workflow gap, who needs it, and what proof or output should appear.'],
      ['How do I dispute billing?', 'Use Contact and choose Billing or Stripe. Include the account email and charge date.'],
      ['Where are Terms and Privacy?', 'The public Trust, Privacy, and Terms pages explain current product boundaries, data posture, and user responsibilities in plain language.'],
      ['Where do support requests go today?', 'Contact submissions are captured as support or lead inquiries. Vendor applications use the vendor application form and are routed for Passage review after submission.'],
    ],
  },
];

export default function FAQPage() {
  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: 'Georgia,serif' }}>
      <SiteHeader />
      <section style={{ maxWidth: 1080, margin: '0 auto', padding: '24px 28px 48px' }}>
        <div style={eyebrow}>Passage FAQ</div>
        <h1 style={h1}>Clear answers before anyone has to hunt.</h1>
        <p style={lead}>Passage is built for coordination, not confusion. These answers explain how families, helpers, funeral homes, and vendors use the same shared record without seeing more than they should.</p>

        <div style={{ background: C.roseFaint, border: '1px solid ' + C.rose + '33', borderRadius: 18, padding: 18, marginTop: 18 }}>
          <div style={{ color: C.rose, fontSize: 12, fontWeight: 900, letterSpacing: '.14em', textTransform: 'uppercase' }}>Important boundary</div>
          <p style={{ color: C.mid, fontSize: 15, lineHeight: 1.6, margin: '8px 0 0' }}>Passage provides coordination guidance and recordkeeping. It does not replace emergency services, hospice, medical professionals, legal advice, funeral directors, clergy, government offices, or local authority requirements.</p>
        </div>

        <div style={{ display: 'grid', gap: 14, marginTop: 18 }}>
          {sections.map((section) => (
            <section key={section.title} style={panel}>
              <h2 style={h2}>{section.title}</h2>
              <div style={{ display: 'grid', gap: 10 }}>
                {section.items.map(([question, answer]) => (
                  <details key={question} style={detailCard}>
                    <summary style={{ cursor: 'pointer', fontSize: 18, fontWeight: 900 }}>{question}</summary>
                    <p style={{ color: C.mid, fontSize: 15, lineHeight: 1.6, margin: '10px 0 0' }}>{answer}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>

        <section style={{ ...panel, marginTop: 14 }}>
          <h2 style={h2}>Still need help?</h2>
          <p style={lead}>Support, bug reports, feature requests, billing questions, and funeral-home pilot inquiries can be routed through Contact. Vendor applications should use the vendor application form.</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
            <Link href="/contact" style={primaryLink}>Contact Passage</Link>
            <Link href="/trust" style={secondaryLink}>Read trust boundaries</Link>
          </div>
        </section>
      </section>
      <SiteFooter />
    </main>
  );
}

const eyebrow = { color: C.sage, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900 };
const h1 = { fontSize: 52, lineHeight: 1.03, margin: '8px 0 10px', fontWeight: 400, maxWidth: 760 };
const h2 = { fontSize: 28, lineHeight: 1.12, margin: '0 0 12px', fontWeight: 400 };
const lead = { color: C.mid, fontSize: 16, lineHeight: 1.6, margin: 0, maxWidth: 760 };
const panel = { background: C.card, border: '1px solid ' + C.border, borderRadius: 20, padding: 20, boxShadow: '0 4px 20px rgba(0,0,0,.04)' };
const detailCard = { background: C.sageFaint, border: '1px solid #c8deca', borderRadius: 14, padding: 14 };
const primaryLink = { display: 'inline-flex', alignItems: 'center', minHeight: 46, background: C.sage, color: '#fff', borderRadius: 13, padding: '0 16px', textDecoration: 'none', fontWeight: 900 };
const secondaryLink = { display: 'inline-flex', alignItems: 'center', minHeight: 46, background: C.card, color: C.sage, border: '1px solid ' + C.border, borderRadius: 13, padding: '0 16px', textDecoration: 'none', fontWeight: 900 };