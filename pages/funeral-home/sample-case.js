import Link from 'next/link';
import { SiteFooter, SiteHeader } from '../../components/SiteChrome';
import { calendlyUrl } from '../../lib/scheduling';
import { trackEvent } from '../../lib/trackEvent';

const C = { bg: '#f6f3ee', card: '#fffdf9', ink: '#1a1916', mid: '#6a6560', soft: '#9a9288', border: '#e4ddd4', sage: '#6b8f71', sageDark: '#4a6e50', sageFaint: '#eef5ef', sageLight: '#c8deca', amber: '#a97832', amberFaint: '#fbf5e8' };

const caseSteps = [
  ['Workspace', 'Hudson Valley Funeral Group', 'Director, staff, location, and plan are visible before case work starts.', 'Ready'],
  ['Case', 'Price family arrangement', 'Family contact, service date, owner, and next waiting point are in one pane.', 'Needs action'],
  ['Task spine', 'Confirm cemetery plot details', 'Owner: Maria. Waiting on: Michael Price. Proof destination: case record.', 'Waiting'],
  ['Family update', 'Service detail approval', 'Message is prepared for family review. Nothing sends automatically.', 'Draft'],
  ['Export', 'Case proof packet', 'Dates, task outcomes, update proof, and vendor request context are ready to export.', 'Ready'],
  ['Decision', 'Ready for the next family step', 'The director can see what is waiting, who owns it, and what proof is ready.', 'Next'],
];

const metrics = [['Case view', 'One family'], ['Next action', 'Visible'], ['Family update', 'Drafted'], ['Proof packet', 'Ready']];

const workspaceSteps = [
  ['Intake', 'Capture the family contact, service timing, and who owns the next step.'],
  ['Coordinate', 'Keep staff, family requests, and waiting points tied to one case record.'],
  ['Close the loop', 'Prepare the family update and proof packet before anything is sent or exported.'],
];

export default function FuneralHomeSampleCase() {
  const walkthroughHref = calendlyUrl({ source: 'Funeral home sample case' });

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: 'Georgia,serif' }}>
      <style>{`
        .sample-shell, .sample-shell * { box-sizing:border-box; }
        .sample-shell { max-width:1120px; margin:0 auto; padding:34px 22px 74px; }
        .sample-hero { display:grid; grid-template-columns:minmax(0,1fr) minmax(280px,.42fr); gap:18px; align-items:stretch; }
        .sample-kicker { color:${C.sage}; font-size:11px; letter-spacing:.16em; text-transform:uppercase; font-weight:900; }
        .sample-title { font-size:48px; line-height:1.02; margin:8px 0 10px; font-weight:400; letter-spacing:0; max-width:760px; }
        .sample-lede { color:${C.mid}; font-size:16px; line-height:1.55; margin:0; max-width:760px; }
        .sample-actions { display:flex; gap:8px; flex-wrap:wrap; margin-top:16px; }
        .sample-button { min-height:44px; border-radius:13px; display:inline-flex; align-items:center; justify-content:center; padding:0 15px; font-weight:900; text-decoration:none; font-size:13px; font-family:Georgia,serif; }
        .sample-primary { background:${C.ink}; color:#fff; border:1px solid ${C.ink}; }
        .sample-secondary { background:${C.card}; color:${C.sageDark}; border:1px solid ${C.sageLight}; }
        .sample-panel { background:${C.card}; border:1px solid ${C.border}; border-radius:18px; padding:16px; box-shadow:0 12px 34px rgba(55,45,35,.06); }
        .sample-metrics { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
        .sample-metric { background:${C.sageFaint}; border:1px solid ${C.sageLight}; border-radius:14px; padding:12px; }
        .sample-metric b { display:block; font-size:24px; margin-top:5px; }
        .sample-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; margin-top:14px; }
        .sample-step { background:${C.card}; border:1px solid ${C.border}; border-radius:16px; padding:13px; min-height:160px; display:flex; flex-direction:column; gap:8px; }
        .sample-step-head { display:flex; justify-content:space-between; gap:8px; align-items:flex-start; }
        .sample-step h2 { font-size:18px; line-height:1.15; margin:0; }
        .sample-step p { color:${C.mid}; font-size:13px; line-height:1.42; margin:0; }
        .sample-pill { border-radius:999px; padding:4px 8px; background:${C.sageFaint}; color:${C.sageDark}; border:1px solid ${C.sageLight}; font-size:11px; font-weight:900; white-space:nowrap; }
        .sample-path { margin-top:14px; display:grid; grid-template-columns:minmax(260px,.38fr) minmax(0,1fr); gap:10px; }
        .sample-path-list { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; }
        .sample-path-card { background:${C.card}; border:1px solid ${C.border}; border-radius:14px; padding:12px; }
        .sample-path-card strong { display:block; font-size:14px; margin-bottom:5px; }
        .sample-path-card span { color:${C.mid}; font-size:12.5px; line-height:1.38; }
        .sample-note { margin-top:14px; background:${C.ink}; color:#eee9e2; border-radius:18px; padding:16px; display:grid; grid-template-columns:minmax(0,1fr) auto; gap:14px; align-items:center; }
        .sample-note strong { color:#fff; font-size:20px; font-weight:400; }
        @media (max-width:820px) { .sample-shell { padding:20px 16px 56px; } .sample-hero, .sample-grid, .sample-note, .sample-path, .sample-path-list { grid-template-columns:1fr; } .sample-title { font-size:36px; } .sample-actions { flex-direction:column; } .sample-button { width:100%; } }
      `}</style>
      <SiteHeader />
      <section className="sample-shell">
        <div className="sample-hero">
          <div className="sample-panel">
            <div className="sample-kicker">Funeral-home sample case</div>
            <h1 className="sample-title">Show one family case from intake to proof.</h1>
            <p className="sample-lede">This sample shows how a funeral-home team keeps one family case clear: the next action, the owner, the waiting point, the family update, and the proof packet all stay together.</p>
            <div className="sample-actions">
              <a className="sample-button sample-primary" href={walkthroughHref} target="_blank" rel="noreferrer" onClick={() => trackEvent('funeral_home_sample_book_walkthrough_clicked', { source: 'sample-case' })}>Book walkthrough</a>
              <Link className="sample-button sample-secondary" href="/funeral-home/workspace-demo" onClick={() => trackEvent('funeral_home_sample_full_workspace_clicked', { source: 'sample-case' })}>Open full workspace</Link>
              <Link className="sample-button sample-secondary" href="/funeral-home/login" onClick={() => trackEvent('funeral_home_sample_login_clicked', { source: 'sample-case' })}>Customer login</Link>
            </div>
          </div>
          <div className="sample-panel">
            <div className="sample-kicker">Case clarity</div>
            <div className="sample-metrics">{metrics.map(([label, value]) => <div className="sample-metric" key={label}><div className="sample-kicker">{label}</div><b>{value}</b></div>)}</div>
          </div>
        </div>
        <section className="sample-grid" aria-label="Sample case loop">
          {caseSteps.map(([label, title, body, status]) => <article className="sample-step" key={label}><div className="sample-step-head"><div><div className="sample-kicker">{label}</div><h2>{title}</h2></div><span className="sample-pill">{status}</span></div><p>{body}</p></article>)}
        </section>
        <section className="sample-path" aria-label="Sample case workflow">
          <div className="sample-panel"><div className="sample-kicker">How the workspace helps</div><h2 style={{ fontSize: 24, lineHeight: 1.05, margin: '8px 0 8px', fontWeight: 400 }}>Keep the next step obvious.</h2><p className="sample-lede" style={{ fontSize: 13.5 }}>A director should be able to open the case, understand the waiting point, and move the right next step without extra explanation.</p></div>
          <div className="sample-path-list">{workspaceSteps.map(([label, body]) => <div className="sample-path-card" key={label}><strong>{label}</strong><span>{body}</span></div>)}</div>
        </section>
        <div className="sample-note">
          <div><div className="sample-kicker" style={{ color: '#b9d2bd' }}>Operating rule</div><strong>If the next step is not obvious, the workspace is not done.</strong><p style={{ color: '#d8d0c7', margin: '7px 0 0', lineHeight: 1.45 }}>The screen should make ownership, waiting, family messaging, and proof easy to understand at a glance.</p></div>
          <a className="sample-button sample-primary" href={walkthroughHref} target="_blank" rel="noreferrer" onClick={() => trackEvent('funeral_home_sample_bottom_walkthrough_clicked', { source: 'sample-case' })}>Book walkthrough</a>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
