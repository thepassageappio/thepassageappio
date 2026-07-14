import Link from 'next/link';
import { SiteFooter, SiteHeader } from '../components/SiteChrome';

const trustCards = [
  ['Coordination, not emergency response', 'Passage helps organize next steps, ownership, messages, proof, and records. It is not an emergency service, medical provider, legal advisor, funeral director, government agency, bank, clergy member, or hospice provider.'],
  ['Role-based visibility', 'The product is built around roles: family coordinator, participant, funeral-home staff, vendor, and Passage system admin. Each role should see only the work and context needed for that role.'],
  ['Proof and audit trail', 'Meaningful actions should leave a visible trail: actor, timestamp, recipient, channel, task, status, and supporting note or document reference where available.'],
  ['Data portability', 'Passage should make estate and case data exportable so families and funeral homes are not trapped in the platform. CSV exports are part of the adoption trust story.'],
  ['Task-native vendors', 'Vendors should appear only inside relevant tasks. Families should feel helped, not sold to or forced to browse a generic marketplace during a stressful moment.'],
  ['Human review stays central', 'Passage can prepare scripts, packets, messages, and next steps, but families and professionals approve what is sent and remain responsible for situation-specific judgment.'],
];

const readinessChecklist = [
  ['Privacy policy', 'Live', 'Plain-language privacy page covering collection, role-scoped access, sharing, subprocessors, retention, deletion, and privacy choices.'],
  ['Terms and service boundaries', 'Live', 'Terms explain that Passage coordinates work but does not replace emergency, medical, legal, funeral-director, religious, or financial judgment.'],
  ['Subprocessor list', 'Live', 'Current operating providers are named in Privacy: Supabase, Vercel, Resend, Google services, HubSpot, Stripe when enabled, and Twilio when enabled.'],
  ['Review-before-share model', 'Live', 'External sends, handoffs, vendor requests, and prepared packets are designed around user review before information leaves the record.'],
  ['Role-scoped access', 'Live', 'Family coordinators, participants, funeral-home teams, vendors, and admins are separated by role and context.'],
  ['Audit and proof trail', 'Live', 'Task and communication actions are designed to record actor, timestamp, status, recipient, proof, and source workflow where available.'],
  ['Export and deletion requests', 'Live', 'Users can request export, correction, deletion, billing, privacy, and account review through Contact.'],
  ['Incident and security contact', 'Live', 'Security, privacy, and suspected incident reports route through Contact for review and support triage.'],
  ['BAA / covered-entity review path', 'Partner review', 'Passage is not claiming HIPAA compliance today. Hospice, care-facility, or covered-entity use requires formal diligence and partner-specific agreements before production use.'],
  ['SOC 1 / SOC 2 posture', 'Not claimed', 'Passage is preparing evidence and controls, but does not currently claim SOC 1 or SOC 2 certification.'],
];

const diligenceItems = [
  'Privacy policy and product data-flow overview',
  'Terms, vendor terms, and partner-specific agreement review',
  'Subprocessor list and service-provider purpose',
  'Role and permission model summary',
  'Audit/proof trail and notification logging summary',
  'Data export, retention, and deletion request process',
  'Incident intake and security contact process',
  'BAA review path when a covered-entity workflow requires it',
];

function statusToneClass(status) {
  const text = String(status || '');
  if (text === 'Live') return 'status-pill status-pill-pine';
  if (text === 'Partner review') return 'status-pill status-pill-clay';
  return 'status-pill status-pill-rose';
}

export default function TrustPage() {
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
        .wrap { max-width: 1080px; margin: 0 auto; padding: 24px 28px 48px; }
        .eyebrow { color: var(--clay-600); font-size: 11px; letter-spacing: .16em; text-transform: uppercase; font-weight: 700; }
        h1 { font-family: 'Fraunces', serif; font-weight: 440; font-size: clamp(32px,4.8vw,46px); line-height: 1.05; margin: 8px 0 10px; max-width: 900px; letter-spacing: -.015em; color: var(--pine-950); }
        p.lead { color: var(--ink-500); font-size: 16px; line-height: 1.6; margin: 0; max-width: 780px; }
        .safety-box { background: var(--clay-50); border: 1px solid var(--clay-600); border-radius: var(--r-lg); padding: 20px; margin-top: 18px; }
        .safety-title { color: var(--clay-600); font-size: 11px; letter-spacing: .16em; text-transform: uppercase; font-weight: 700; }
        .safety-body { color: var(--ink-500); font-size: 16px; line-height: 1.6; margin: 8px 0 0; }
        .card-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(300px,100%),1fr)); gap: 12px; margin-top: 16px; }
        .panel { background: var(--bone-50); border: 1px solid var(--line-soft); border-radius: var(--r-lg); padding: 18px; box-shadow: var(--e2); }
        .panel-gold { background: var(--clay-100); }
        .panel-pine { background: var(--pine-50); }
        h2 { font-size: 24px; line-height: 1.12; margin: 0 0 8px; font-weight: 600; color: var(--ink-900); }
        h3 { font-size: 20px; line-height: 1.15; margin: 0 0 6px; font-weight: 700; color: var(--ink-900); }
        .body-text { color: var(--ink-500); font-size: 15px; line-height: 1.6; margin: 0; }
        .link-row { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 14px; }
        .th-btn { display: inline-flex; align-items: center; min-height: 44px; border-radius: var(--r-full); padding: 0 16px; text-decoration: none; font-weight: 700; font-size: 13.5px; border: 1px solid transparent; }
        .th-btn-primary { background: linear-gradient(155deg, var(--pine-600), var(--pine-800)); color: #fff; box-shadow: 0 1px 2px rgba(20,30,25,.15), 0 8px 16px -6px rgba(20,30,25,.35); }
        .th-btn-secondary { background: var(--bone-50); color: var(--pine-700); border-color: var(--line); }
        .readiness-title { font-size: 30px; margin-top: 4px; }
        .check-list-wrap { display: grid; gap: 10px; margin-top: 14px; }
        .check-row { display: grid; grid-template-columns: minmax(0,1fr) auto; gap: 14px; align-items: start; border: 1px solid var(--line-soft); border-radius: var(--r-md); padding: 14px; background: var(--bone-50); }
        .status-pill { display: inline-flex; align-items: center; min-height: 30px; border-radius: var(--r-full); padding: 0 11px; white-space: nowrap; font-size: 12px; font-weight: 700; border: 1px solid transparent; }
        .status-pill-pine { color: var(--pine-700); background: var(--pine-50); border-color: var(--pine-600); }
        .status-pill-clay { color: var(--clay-700); background: var(--clay-100); border-color: var(--clay-700); }
        .status-pill-rose { color: var(--clay-600); background: var(--clay-50); border-color: var(--clay-600); }
        .check-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(260px,100%),1fr)); gap: 8px; padding: 0; margin: 14px 0 0; list-style: none; }
        .check-list-item { border: 1px solid var(--line-soft); border-radius: var(--r-md); padding: 10px 12px; background: var(--bone-50); color: var(--ink-900); font-size: 14px; line-height: 1.35; }
      `}</style>
      <SiteHeader />
      <section className="wrap">
        <div className="eyebrow">Trust and boundaries</div>
        <h1>Passage should make the work clearer, not pretend it can replace judgment.</h1>
        <p className="lead">
          Passage is a coordination layer for emotionally difficult work. These boundaries explain what Passage helps organize, what remains human judgment, and when families or providers should contact professionals directly.
        </p>

        <section className="safety-box">
          <div className="safety-title">When safety or legal authority is unclear</div>
          <p className="safety-body">
            If there is danger, uncertainty about whether someone has died, a medical emergency, an unattended death, or any local rule requiring professional notification, contact emergency services, hospice, medical staff, police, a funeral director, a qualified legal professional, or the appropriate local authority directly. Passage guidance is not a substitute for those decisions.
          </p>
        </section>

        <div className="card-grid">
          {trustCards.map(([title, body]) => (
            <article key={title} className="panel">
              <h2>{title}</h2>
              <p className="body-text">{body}</p>
            </article>
          ))}
        </div>

        <section className="panel panel-gold" style={{ marginTop: 16 }}>
          <h2>How Passage earns trust</h2>
          <p className="body-text">
            Passage keeps sensitive coordination work role-scoped, review-first, and exportable. Families and professionals remain in control of what is sent, shared, completed, and handed off.
          </p>
          <div className="link-row">
            <Link href="/privacy" className="th-btn th-btn-primary">Privacy overview</Link>
            <Link href="/terms" className="th-btn th-btn-secondary">Terms overview</Link>
            <Link href="/faq" className="th-btn th-btn-secondary">FAQ</Link>
          </div>
        </section>

        <section className="panel" style={{ marginTop: 16 }}>
          <div className="eyebrow">Readiness checklist</div>
          <h2 className="readiness-title">What is live, what is reviewed during partner diligence, and what Passage does not claim yet.</h2>
          <div className="check-list-wrap">
            {readinessChecklist.map(([title, status, body]) => (
              <article key={title} className="check-row">
                <div>
                  <h3>{title}</h3>
                  <p className="body-text">{body}</p>
                </div>
                <span className={statusToneClass(status)}>{status}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="panel panel-pine" style={{ marginTop: 16 }}>
          <div className="eyebrow">Partner review packet</div>
          <h2 className="readiness-title">What Passage can organize for a serious pilot or enterprise review.</h2>
          <p className="body-text">
            Funeral homes, hospice organizations, care facilities, and other partners should review the operating model before production use. Passage keeps the public language clear and reserves formal compliance claims for signed agreements, completed diligence, and the right legal review.
          </p>
          <ul className="check-list">
            {diligenceItems.map((item) => (
              <li key={item} className="check-list-item">{item}</li>
            ))}
          </ul>
          <div className="link-row">
            <Link href="/contact" className="th-btn th-btn-primary">Request partner review</Link>
            <Link href="/privacy" className="th-btn th-btn-secondary">Review privacy</Link>
            <Link href="/terms" className="th-btn th-btn-secondary">Review terms</Link>
          </div>
        </section>

        <section className="panel" style={{ marginTop: 16 }}>
          <h2>Compliance posture</h2>
          <p className="body-text">
            Passage is not currently claiming HIPAA compliance, SOC 1 compliance, or SOC 2 compliance. The product is being built with role-scoped access, audit trails, review-before-share workflows, security headers, and formal compliance readiness in mind. Covered-entity, hospice, care-facility, or enterprise partner diligence should be handled through a formal security and legal review before production use.
          </p>
        </section>
      </section>
      <SiteFooter />
    </main>
  );
}
