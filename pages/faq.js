import Link from 'next/link';
import { SiteFooter, SiteHeader } from '../components/SiteChrome';

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
    <main className="th-shell">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,440;9..144,520&family=Inter:wght@400;500;600;700&display=swap');
        :root{
          --pine-950:#0A1F1A; --pine-900:#0F2A24; --pine-800:#153A31; --pine-700:#1C4A3E; --pine-600:#245A4B;
          --pine-100:#E7EFEA; --pine-50:#F2F6F3;
          --clay-700:#9A4F26; --clay-600:#B5622F; --clay-200:#EBC6A4; --clay-100:#F5E4D6; --clay-50:#FBF0E7;
          --bone-50:#FEFDFB; --bone-100:#FBF8F3; --bone-200:#F5F0E7; --bone-300:#EBE3D3; --bone-400:#DDD2BB;
          --ink-900:#1C1917; --ink-700:#3D372F; --ink-600:#5A5348; --ink-500:#79705F; --ink-400:#9A9081; --ink-300:#BEB6A8;
          --line:#E6DDCB; --line-soft:#EFE8DA;
          --r-xs:8px; --r-sm:12px; --r-md:18px; --r-lg:26px; --r-full:999px;
          --e1:0 1px 1px rgba(20,30,25,.03), 0 2px 4px rgba(20,30,25,.03);
          --e2:0 2px 6px rgba(20,30,25,.05), 0 10px 24px -8px rgba(20,30,25,.10);
          --ease:cubic-bezier(.22,1,.36,1);
        }
      `}</style>
      <style jsx>{`
        .th-shell {
          min-height: 100vh;
          background: var(--bone-100);
          color: var(--ink-900);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          letter-spacing: -.005em;
        }
        .wrap { max-width: 1080px; margin: 0 auto; padding: 28px 28px 52px; }
        .eyebrow { color: var(--clay-600); font-size: 11px; letter-spacing: .16em; text-transform: uppercase; font-weight: 700; }
        h1 { font-family: 'Fraunces', serif; font-weight: 440; font-size: clamp(34px,5vw,50px); line-height: 1.02; margin: 8px 0 10px; letter-spacing: -.02em; color: var(--pine-950); max-width: 760px; }
        p.lede { color: var(--ink-500); font-size: 16px; line-height: 1.6; margin: 0; max-width: 760px; }
        .boundary { background: var(--clay-50); border: 1px solid var(--clay-200); border-radius: var(--r-lg); padding: 18px; margin-top: 18px; }
        .boundary-title { color: var(--clay-700); font-size: 12px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; }
        .boundary-body { color: var(--ink-600); font-size: 15px; line-height: 1.6; margin: 8px 0 0; }
        .sections { display: grid; gap: 14px; margin-top: 18px; }
        .panel { background: var(--bone-50); border: 1px solid var(--line-soft); border-radius: var(--r-lg); padding: 20px; box-shadow: var(--e1); }
        h2 { font-family: 'Fraunces', serif; font-weight: 460; font-size: 26px; line-height: 1.12; margin: 0 0 12px; letter-spacing: -.015em; color: var(--pine-950); }
        .qa-stack { display: grid; gap: 10px; }
        details { background: var(--pine-50); border: 1px solid #D5E4DC; border-radius: var(--r-md); padding: 14px; }
        summary { cursor: pointer; font-size: 17px; font-weight: 600; color: var(--ink-900); }
        details p { color: var(--ink-600); font-size: 14.5px; line-height: 1.58; margin: 10px 0 0; }
        .cta-row { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 14px; }
        .th-btn {
          display: inline-flex; align-items: center; min-height: 46px; border-radius: var(--r-full);
          padding: 0 16px; text-decoration: none; font-weight: 600; font-family: 'Inter', sans-serif; font-size: 13.5px;
          border: 1px solid transparent;
        }
        .th-btn-primary { background: linear-gradient(155deg, var(--pine-600), var(--pine-800)); color: #fff; box-shadow: 0 1px 2px rgba(15,42,36,.15), 0 8px 16px -6px rgba(15,42,36,.35); }
        .th-btn-secondary { background: var(--bone-50); color: var(--pine-800); border-color: var(--line); box-shadow: var(--e1); }
      `}</style>
      <SiteHeader />
      <section className="wrap">
        <span className="eyebrow">Passage FAQ</span>
        <h1>Clear answers before anyone has to hunt.</h1>
        <p className="lede">Passage is built for coordination, not confusion. These answers explain how families, helpers, funeral homes, and vendors use the same shared record without seeing more than they should.</p>

        <div className="boundary">
          <div className="boundary-title">Important boundary</div>
          <p className="boundary-body">Passage provides coordination guidance and recordkeeping. It does not replace emergency services, hospice, medical professionals, legal advice, funeral directors, clergy, government offices, or local authority requirements.</p>
        </div>

        <div className="sections">
          {sections.map((section) => (
            <section key={section.title} className="panel">
              <h2>{section.title}</h2>
              <div className="qa-stack">
                {section.items.map(([question, answer]) => (
                  <details key={question}>
                    <summary>{question}</summary>
                    <p>{answer}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>

        <section className="panel" style={{ marginTop: 14 }}>
          <h2>Still need help?</h2>
          <p className="lede">Support, bug reports, feature requests, billing questions, and funeral-home pilot inquiries can be routed through Contact. Vendor applications should use the vendor application form.</p>
          <div className="cta-row">
            <Link href="/contact" className="th-btn th-btn-primary">Contact Passage</Link>
            <Link href="/trust" className="th-btn th-btn-secondary">Read trust boundaries</Link>
          </div>
        </section>
      </section>
      <SiteFooter />
    </main>
  );
}
