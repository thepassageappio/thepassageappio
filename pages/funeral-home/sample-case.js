import Link from 'next/link';
import { SiteFooter, SiteHeader } from '../../components/SiteChrome';
import { calendlyUrl } from '../../lib/scheduling';
import { trackEvent } from '../../lib/trackEvent';

const caseSteps = [
  ['Workspace', 'Hudson Valley Funeral Group', 'Director, staff, location, and plan are visible before case work starts.', 'Ready'],
  ['Case', 'Price family arrangement', 'Family contact, service date, owner, and next waiting point are in one pane.', 'Needs action'],
  ['Work action', 'Confirm cemetery plot details', 'Owner: Maria. Waiting on: Michael Price. Proof saves to: case record.', 'Waiting'],
  ['Family update', 'Service detail approval', 'Message is prepared for family review. Nothing sends automatically.', 'Draft'],
  ['Export', 'Case proof packet', 'Dates, work outcomes, update proof, and vendor request context are ready to export.', 'Ready'],
  ['Decision', 'Ready for the next family step', 'The director can see what is waiting, who owns it, and what proof is ready.', 'Next'],
];

const metrics = [['Case view', 'One family'], ['Next action', 'Visible'], ['Family update', 'Drafted'], ['Proof packet', 'Ready']];

const workspaceSteps = [
  ['Intake', 'Capture the family contact, service timing, and who owns the next step.'],
  ['Coordinate', 'Keep staff, family requests, and waiting points tied to one case record.'],
  ['Close the loop', 'Prepare the family update and proof packet before anything is sent or exported.'],
];

function statusTone(status) {
  if (status === 'Ready' || status === 'Next') return 'done';
  if (status === 'Waiting') return 'waiting';
  if (status === 'Needs action') return 'attention';
  return 'draft';
}

function StatusPill({ label }) {
  const tone = statusTone(label);
  return (
    <span className={`th-pill tone-${tone}`}>
      <span className="sdot" />
      {label}
    </span>
  );
}

export default function FuneralHomeSampleCase() {
  const walkthroughHref = calendlyUrl({ source: 'Funeral home sample case' });

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
          --ok-700:#3D6449; --ok-600:#4C7A5C; --ok-100:#E3EEE4;
          --wait-700:#946B23; --wait-600:#B5862F; --wait-100:#F5EAD6;
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
        .wrap { max-width: 1120px; margin: 0 auto; padding: 34px 22px 74px; }
        .hero { display: grid; grid-template-columns: minmax(0,1fr) minmax(280px,.42fr); gap: 18px; align-items: stretch; }
        .kicker { color: var(--clay-600); font-size: 11px; letter-spacing: .16em; text-transform: uppercase; font-weight: 700; }
        .title {
          font-family: 'Fraunces', serif;
          font-weight: 440;
          font-size: clamp(34px, 4.6vw, 46px);
          line-height: 1.06;
          letter-spacing: -.018em;
          color: var(--pine-950);
          margin: 12px 0 12px;
          max-width: 760px;
        }
        .lede { color: var(--ink-500); font-size: 15.5px; line-height: 1.6; margin: 0; max-width: 760px; }
        .actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 18px; }
        .th-btn {
          min-height: 46px;
          border-radius: var(--r-full);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 18px;
          font-weight: 600;
          text-decoration: none;
          font-size: 13.5px;
          font-family: 'Inter', sans-serif;
          transition: transform .18s var(--ease), box-shadow .18s var(--ease);
        }
        .th-btn:hover { transform: translateY(-1px); }
        .th-btn-primary {
          background: linear-gradient(155deg, var(--pine-600), var(--pine-800));
          color: #fff;
          box-shadow: 0 1px 2px rgba(15,42,36,.15), 0 8px 16px -6px rgba(15,42,36,.35);
        }
        .th-btn-secondary { background: var(--bone-50); color: var(--pine-800); border: 1px solid var(--line); box-shadow: var(--e1); }
        .panel { background: var(--bone-50); border: 1px solid var(--line-soft); border-radius: var(--r-lg); padding: 22px; box-shadow: var(--e2); }
        .metrics { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 10px; }
        .metric { background: var(--pine-50); border: 1px solid #D5E4DC; border-radius: var(--r-md); padding: 14px; box-shadow: var(--e1); }
        .metric b { display: block; font-family: 'Fraunces', serif; font-weight: 500; font-size: 25px; margin-top: 6px; color: var(--pine-950); letter-spacing: -.01em; }
        .step-grid { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 12px; margin-top: 16px; }
        .step-card {
          background: var(--bone-50);
          border: 1px solid var(--line-soft);
          border-radius: var(--r-md);
          padding: 16px;
          min-height: 160px;
          display: flex;
          flex-direction: column;
          gap: 9px;
          box-shadow: var(--e1);
          transition: transform .22s var(--ease), box-shadow .22s var(--ease);
        }
        .step-card:hover { transform: translateY(-2px); box-shadow: var(--e2); }
        .step-head { display: flex; justify-content: space-between; gap: 8px; align-items: flex-start; }
        .step-card h2 { font-family: 'Fraunces', serif; font-weight: 500; font-size: 18.5px; line-height: 1.18; margin: 0; letter-spacing: -.008em; color: var(--pine-950); }
        .step-card p { color: var(--ink-500); font-size: 13px; line-height: 1.46; margin: 0; }
        .th-pill { display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px; font-weight: 600; padding: 5px 10px; border-radius: var(--r-full); white-space: nowrap; }
        .th-pill .sdot { width: 6px; height: 6px; border-radius: 50%; }
        .th-pill.tone-done { background: var(--ok-100); color: var(--ok-700); border: 1px solid #C7DECB; }
        .th-pill.tone-done .sdot { background: var(--ok-600); }
        .th-pill.tone-waiting { background: var(--wait-100); color: var(--wait-700); border: 1px solid #E9D6A8; }
        .th-pill.tone-waiting .sdot { background: var(--wait-600); }
        .th-pill.tone-attention { background: var(--clay-50); color: var(--clay-700); border: 1px solid var(--clay-200); }
        .th-pill.tone-attention .sdot { background: var(--clay-600); }
        .th-pill.tone-draft { background: var(--bone-200); color: var(--ink-500); border: 1px solid var(--line-soft); }
        .th-pill.tone-draft .sdot { background: var(--ink-300); }
        .path-section { margin-top: 16px; display: grid; grid-template-columns: minmax(260px,.38fr) minmax(0,1fr); gap: 12px; }
        .path-section h2 { font-family: 'Fraunces', serif; font-weight: 460; font-size: 24px; line-height: 1.1; margin: 8px 0 8px; letter-spacing: -.012em; color: var(--pine-950); }
        .path-list { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 10px; }
        .path-card { background: var(--bone-50); border: 1px solid var(--line-soft); border-radius: var(--r-md); padding: 14px; box-shadow: var(--e1); }
        .path-card strong { display: block; font-size: 14px; margin-bottom: 6px; color: var(--ink-900); font-family: 'Fraunces', serif; font-weight: 500; }
        .path-card span { color: var(--ink-500); font-size: 12.5px; line-height: 1.42; }
        .note-banner {
          margin-top: 16px;
          background: linear-gradient(155deg, var(--pine-800), var(--pine-950));
          color: var(--bone-100);
          border-radius: var(--r-lg);
          padding: 22px;
          display: grid;
          grid-template-columns: minmax(0,1fr) auto;
          gap: 16px;
          align-items: center;
          box-shadow: var(--e3);
        }
        .note-banner .kicker { color: #A9C8B8; }
        .note-banner strong { color: #fff; font-size: 21px; font-weight: 500; font-family: 'Fraunces', serif; letter-spacing: -.01em; }
        .note-banner p { color: #D8E4DC; margin: 8px 0 0; line-height: 1.48; font-size: 13.5px; }

        @media (max-width: 820px) {
          .wrap { padding: 20px 16px 56px; }
          .hero, .step-grid, .note-banner, .path-section, .path-list, .metrics { grid-template-columns: 1fr; }
          .title { font-size: 32px; }
          .actions { flex-direction: column; }
          .th-btn { width: 100%; }
        }
      `}</style>
      <SiteHeader />
      <section className="wrap">
        <div className="hero">
          <div className="panel">
            <div className="kicker">Funeral-home sample case</div>
            <h1 className="title">Show one family case from intake to proof.</h1>
            <p className="lede">This sample shows how a funeral-home team keeps one family case clear: the next action, the owner, the waiting point, the family update, and the proof packet all stay together.</p>
            <div className="actions">
              <a className="th-btn th-btn-primary" href={walkthroughHref} target="_blank" rel="noreferrer" onClick={() => trackEvent('funeral_home_sample_book_walkthrough_clicked', { source: 'sample-case' })}>Book walkthrough</a>
              <Link className="th-btn th-btn-secondary" href="/funeral-home/workspace-demo" onClick={() => trackEvent('funeral_home_sample_full_workspace_clicked', { source: 'sample-case' })}>Open full workspace</Link>
              <Link className="th-btn th-btn-secondary" href="/funeral-home/login" onClick={() => trackEvent('funeral_home_sample_login_clicked', { source: 'sample-case' })}>Customer login</Link>
            </div>
          </div>
          <div className="panel">
            <div className="kicker">Case clarity</div>
            <div className="metrics" style={{ marginTop: 12 }}>{metrics.map(([label, value]) => <div className="metric" key={label}><div className="kicker">{label}</div><b>{value}</b></div>)}</div>
          </div>
        </div>
        <section className="step-grid" aria-label="Sample case loop">
          {caseSteps.map(([label, title, body, status]) => (
            <article className="step-card" key={label}>
              <div className="step-head">
                <div><div className="kicker">{label}</div><h2>{title}</h2></div>
                <StatusPill label={status} />
              </div>
              <p>{body}</p>
            </article>
          ))}
        </section>
        <section className="path-section" aria-label="Sample case workflow">
          <div className="panel">
            <div className="kicker">How the workspace helps</div>
            <h2>Keep the next step obvious.</h2>
            <p className="lede" style={{ fontSize: 13.5 }}>A director should be able to open the case, understand the waiting point, and move the right next step without extra explanation.</p>
          </div>
          <div className="path-list">{workspaceSteps.map(([label, body]) => <div className="path-card" key={label}><strong>{label}</strong><span>{body}</span></div>)}</div>
        </section>
        <div className="note-banner">
          <div>
            <div className="kicker">Operating rule</div>
            <strong>If the next step is not obvious, the workspace is not done.</strong>
            <p>The screen should make ownership, waiting, family messaging, and proof easy to understand at a glance.</p>
          </div>
          <a className="th-btn th-btn-primary" href={walkthroughHref} target="_blank" rel="noreferrer" onClick={() => trackEvent('funeral_home_sample_bottom_walkthrough_clicked', { source: 'sample-case' })}>Book walkthrough</a>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
