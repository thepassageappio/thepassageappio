import Link from 'next/link';
import { SiteFooter, SiteHeader } from '../../components/SiteChrome';
import { trackEvent } from '../../lib/trackEvent';
import { calendlyUrl } from '../../lib/scheduling';

const myDay = [
  ['Next case', 'Price family arrangement', 'Confirm cemetery plot details and approve the drafted family update.'],
  ['Owner', 'Maria, arranger', 'Assigned owner is visible before the director opens the case.'],
  ['Waiting on', 'Michael Price', 'The family owes plot section, lot number, and deed photo.'],
  ['Proof', 'Case record', 'Hospital release saved. Family request drafted. Export packet ready.'],
];

const taskPreview = [
  ['Passage prepared', 'Drafted ask and case context', 'The cemetery request is already framed with service date, family contact, and the missing plot fields.'],
  ['Staff does next', 'Call or send the prepared request', 'Maria confirms the lot, section, deed photo, and any cemetery deadline before the family update goes out.'],
  ['Waiting on', 'Michael Price', 'The dashboard names the person and missing detail so staff are not guessing why the case is paused.'],
  ['Proof saves', 'Case record and export packet', 'The reply, timestamp, note, and attachment stay with the case and are included in the closeout packet.'],
];

const workflow = [
  ['1', 'My Day', 'Start with the case, owner, waiting point, and proof that need attention now.'],
  ['2', 'Work action', 'Open the client step to see the drafted ask, owner, status, proof requirement, and what done means.'],
  ['3', 'Family update', 'Review the message before anything sends. Families see approved updates, not private staff notes.'],
  ['4', 'Staff queue', 'Employees see assigned work first with context, waiting point, and proof destination.'],
  ['5', 'Export', 'Case status, work outcomes, notes, messages, and proof can be exported for existing systems.'],
];

const boundaries = [
  'This is a sample workspace. No live records, messages, emails, or texts are changed.',
  'Families never see private staff notes, billing details, business-only notes, or unrelated cases.',
  'Staff see assigned work. Directors keep the full case floor, locations, permissions, and export controls.',
  'Every useful card should answer: what is next, who owns it, what is waiting, and what proof exists.',
];

function PreviewIcon({ index }) {
  const common = { width: 19, height: 19, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (index === 0) {
    return (
      <svg {...common}>
        <rect x="4" y="4" width="16" height="16" rx="3" />
        <path d="M8 9h8M8 13h5M8 17h3" />
      </svg>
    );
  }
  if (index === 1) {
    return (
      <svg {...common}>
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    );
  }
  if (index === 2) {
    return (
      <svg {...common}>
        <circle cx="12" cy="8" r="3.4" />
        <path d="M5 20c0-3.6 3-6 7-6s7 2.4 7 6" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M4.5 6.5C6 5 9 4 12 4s6 1 7.5 2.5C21 8 21 10 21 12s0 4-1.5 5.5C18 19 15 20 12 20s-6-1-7.5-2.5C3 16 3 14 3 12s0-4 1.5-5.5z" />
      <path d="M9 12.5l2 2 4.5-4.5" />
    </svg>
  );
}

export default function FuneralHomeWorkspaceDemo() {
  const walkthroughHref = calendlyUrl({ source: 'Funeral home workspace demo' });
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
          --wait-700:#946B23; --wait-100:#F5EAD6;
          --line:#E6DDCB; --line-soft:#EFE8DA;
          --r-xs:8px; --r-sm:12px; --r-md:18px; --r-lg:26px; --r-full:999px;
          --e1:0 1px 1px rgba(20,30,25,.03), 0 2px 4px rgba(20,30,25,.03);
          --e2:0 2px 6px rgba(20,30,25,.05), 0 10px 24px -8px rgba(20,30,25,.10);
          --e3:0 8px 20px -6px rgba(20,30,25,.14), 0 24px 48px -20px rgba(20,30,25,.18);
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
        .wrap { max-width: 1120px; margin: 0 auto; padding: 34px 24px 70px; }
        .eyebrow { color: var(--clay-600); font-size: 11px; letter-spacing: .16em; text-transform: uppercase; font-weight: 700; }
        .hero { display: grid; grid-template-columns: minmax(0,1fr) minmax(320px,.5fr); gap: 18px; align-items: stretch; }
        .panel {
          background: var(--bone-50);
          border: 1px solid var(--line-soft);
          border-radius: var(--r-lg);
          padding: 28px;
          box-shadow: var(--e2);
        }
        h1 {
          font-family: 'Fraunces', serif;
          font-weight: 440;
          font-size: clamp(32px, 4.6vw, 46px);
          line-height: 1.04;
          letter-spacing: -.02em;
          color: var(--pine-950);
          margin: 12px 0 14px;
        }
        h2 {
          font-family: 'Fraunces', serif;
          font-weight: 460;
          letter-spacing: -.015em;
          color: var(--pine-950);
          margin: 8px 0 0;
        }
        p.lede { color: var(--ink-500); font-size: 15.5px; line-height: 1.62; margin: 0; }
        .actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 20px; }
        .th-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          font-family: 'Inter', sans-serif; font-weight: 600; font-size: 14px;
          border-radius: var(--r-full); padding: 0 20px; min-height: 48px;
          border: 1px solid transparent; cursor: pointer; text-decoration: none;
          transition: transform .18s var(--ease), box-shadow .18s var(--ease);
          white-space: nowrap;
        }
        .th-btn:hover { transform: translateY(-1px); }
        .th-btn-primary {
          background: linear-gradient(155deg, var(--pine-600), var(--pine-800));
          color: #fff;
          box-shadow: 0 1px 2px rgba(15,42,36,.15), 0 8px 16px -6px rgba(15,42,36,.35);
        }
        .th-btn-secondary {
          background: var(--bone-50); color: var(--pine-800); border-color: var(--line); box-shadow: var(--e1);
        }
        .th-note {
          background: var(--clay-50); border: 1px solid var(--clay-200); color: var(--clay-700);
          border-radius: var(--r-sm); padding: 12px 15px; font-size: 13px; line-height: 1.5; margin-top: 18px;
        }
        .side-case { background: var(--pine-50); border: 1px solid #D5E4DC; border-radius: var(--r-md); padding: 14px; margin-top: 16px; }
        .side-row { display: grid; grid-template-columns: 92px minmax(0,1fr); gap: 10px; padding: 10px 0; border-top: 1px solid #D5E4DC; }
        .side-row:first-child { border-top: none; }
        .side-row b { color: var(--pine-700); font-size: 10.5px; letter-spacing: .12em; text-transform: uppercase; font-weight: 700; }
        .side-row span { color: var(--ink-600); font-size: 13px; line-height: 1.48; }
        .side-row strong { color: var(--ink-900); }
        section.block { margin-top: 18px; }
        .grid4 { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 10px; margin-top: 16px; }
        .task-card {
          background: var(--bone-50); border: 1px solid var(--line-soft); border-radius: var(--r-md);
          padding: 16px; box-shadow: var(--e1);
          transition: transform .25s var(--ease), box-shadow .25s var(--ease);
        }
        .task-card:hover { transform: translateY(-2px); box-shadow: var(--e2); }
        .task-icon {
          width: 34px; height: 34px; border-radius: var(--r-xs); background: var(--pine-100); color: var(--pine-700);
          display: flex; align-items: center; justify-content: center; margin-bottom: 10px;
        }
        .task-eyebrow { color: var(--pine-700); font-size: 10.5px; letter-spacing: .12em; text-transform: uppercase; font-weight: 700; }
        .task-title { color: var(--ink-900); font-size: 17px; line-height: 1.2; margin-top: 6px; font-weight: 600; }
        .task-body { color: var(--ink-500); font-size: 13px; line-height: 1.48; margin-top: 8px; }
        .step { display: grid; grid-template-columns: 34px minmax(0,1fr); gap: 12px; padding: 13px 0; border-bottom: 1px solid var(--line-soft); }
        .step:last-child { border-bottom: none; }
        .step-num {
          width: 30px; height: 30px; border-radius: var(--r-full); background: var(--pine-100); color: var(--pine-700);
          display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700;
        }
        .step strong { color: var(--ink-900); font-weight: 600; }
        .step-body { color: var(--ink-500); font-size: 13.2px; line-height: 1.48; margin-top: 3px; }
        .boundary-card { background: var(--bone-50); border: 1px solid var(--line-soft); border-radius: var(--r-md); padding: 15px; box-shadow: var(--e1); }
        .boundary-body { color: var(--ink-500); font-size: 13px; line-height: 1.48; margin-top: 7px; }

        @media (max-width: 820px) {
          .wrap { padding: 20px 16px 56px; }
          .hero, .grid4 { grid-template-columns: 1fr; }
          .actions { flex-direction: column; }
          .th-btn { width: 100%; }
          .side-row { grid-template-columns: 1fr; gap: 4px; }
        }
      `}</style>
      <SiteHeader />
      <section className="wrap">
        <div className="hero">
          <div className="panel">
            <span className="eyebrow">Sample funeral-home workspace</span>
            <h1>Hudson Valley Funeral Group</h1>
            <p className="lede">This sample shows what opens after sign-in: My Day, the next family case, assigned staff work, approved family updates, and proof. It is built for funeral-home teams, not public browsing.</p>
            <div className="actions">
              <a href={walkthroughHref} target="_blank" rel="noreferrer" onClick={() => trackEvent('workspace_demo_book_walkthrough_clicked', { source: 'workspace-demo' })} className="th-btn th-btn-primary">Book walkthrough</a>
              <Link href="/funeral-home/login" onClick={() => trackEvent('workspace_demo_customer_login_clicked', { source: 'workspace-demo' })} className="th-btn th-btn-secondary">Customer login</Link>
              <Link href="/funeral-home/sample-case" onClick={() => trackEvent('workspace_demo_sample_case_clicked', { source: 'workspace-demo' })} className="th-btn th-btn-secondary">View sample case</Link>
            </div>
            <div className="th-note">Sample workspace. Actions are simulated and no live records or messages are changed.</div>
          </div>
          <div className="panel">
            <span className="eyebrow">What opens after sign-in</span>
            <h2 style={{ fontSize: 24 }}>Staff queue showing who owns what.</h2>
            <div className="side-case">
              {myDay.map(([label, title, body]) => (
                <div className="side-row" key={label}><b>{label}</b><span><strong>{title}</strong><br />{body}</span></div>
              ))}
            </div>
          </div>
        </div>

        <section className="block">
          <div className="panel">
            <span className="eyebrow">Work card contract</span>
            <h2 style={{ fontSize: 30, marginBottom: 4 }}>Every work card should make the next move obvious.</h2>
            <div className="grid4">
              {taskPreview.map(([label, title, body], index) => (
                <div className="task-card" key={label}>
                  <span className="task-icon"><PreviewIcon index={index} /></span>
                  <div className="task-eyebrow">{label}</div>
                  <div className="task-title">{title}</div>
                  <div className="task-body">{body}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="block">
          <div className="panel">
            <span className="eyebrow">Operating flow</span>
            <h2 style={{ fontSize: 30, marginBottom: 4 }}>The dashboard starts with the work, not the noise.</h2>
            {workflow.map(([num, title, body]) => (
              <div className="step" key={title}>
                <div className="step-num">{num}</div>
                <div><strong>{title}</strong><div className="step-body">{body}</div></div>
              </div>
            ))}
          </div>
        </section>

        <section className="block">
          <div className="grid4">
            {boundaries.map((item) => (
              <div className="boundary-card" key={item}>
                <span className="eyebrow">Boundary</span>
                <div className="boundary-body">{item}</div>
              </div>
            ))}
          </div>
        </section>
      </section>
      <SiteFooter />
    </main>
  );
}
