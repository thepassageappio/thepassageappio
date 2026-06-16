import Link from 'next/link';
import { SiteFooter, SiteHeader } from '../../components/SiteChrome';
import { calendlyUrl } from '../../lib/scheduling';
import { trackEvent } from '../../lib/trackEvent';

const C = { bg: '#f6f3ee', card: '#fffdf9', ink: '#1a1916', mid: '#6a6560', soft: '#9a9288', border: '#e4ddd4', sage: '#6b8f71', sageDark: '#4a6e50', sageFaint: '#eef5ef', sageLight: '#c8deca', rose: '#c47a7a', roseFaint: '#fdf3f3', amber: '#a97832', amberFaint: '#fbf5e8' };
const proofSteps = [
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

export default function PilotProofConsole() {
  const walkthroughHref = calendlyUrl({ source: 'Funeral home pilot proof console' });

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: 'Georgia,serif' }}>
      <style>{`
        .pp-shell, .pp-shell * { box-sizing:border-box; }
        .pp-shell { max-width:1120px; margin:0 auto; padding:34px 22px 74px; }
        .pp-hero { display:grid; grid-template-columns:minmax(0,1fr) minmax(280px,.42fr); gap:18px; align-items:stretch; }
        .pp-kicker { color:${C.sage}; font-size:11px; letter-spacing:.16em; text-transform:uppercase; font-weight:900; }
        .pp-title { font-size:48px; line-height:1.02; margin:8px 0 10px; font-weight:400; letter-spacing:0; max-width:760px; }
        .pp-lede { color:${C.mid}; font-size:16px; line-height:1.55; margin:0; max-width:760px; }
        .pp-actions { display:flex; gap:8px; flex-wrap:wrap; margin-top:16px; }
        .pp-button { min-height:44px; border-radius:13px; display:inline-flex; align-items:center; justify-content:center; padding:0 15px; font-weight:900; text-decoration:none; font-size:13px; font-family:Georgia,serif; }
        .pp-primary { background:${C.ink}; color:#fff; border:1px solid ${C.ink}; }
        .pp-secondary { background:${C.card}; color:${C.sageDark}; border:1px solid ${C.sageLight}; }
        .pp-panel { background:${C.card}; border:1px solid ${C.border}; border-radius:18px; padding:16px; box-shadow:0 12px 34px rgba(55,45,35,.06); }
        .pp-metrics { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
        .pp-metric { background:${C.sageFaint}; border:1px solid ${C.sageLight}; border-radius:14px; padding:12px; }
        .pp-metric b { display:block; font-size:24px; margin-top:5px; }
        .pp-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; margin-top:14px; }
        .pp-step { background:${C.card}; border:1px solid ${C.border}; border-radius:16px; padding:13px; min-height:160px; display:flex; flex-direction:column; gap:8px; }
        .pp-step-head { display:flex; justify-content:space-between; gap:8px; align-items:flex-start; }
        .pp-step h2 { font-size:18px; line-height:1.15; margin:0; }
        .pp-step p { color:${C.mid}; font-size:13px; line-height:1.42; margin:0; }
        .pp-pill { border-radius:999px; padding:4px 8px; background:${C.sageFaint}; color:${C.sageDark}; border:1px solid ${C.sageLight}; font-size:11px; font-weight:900; white-space:nowrap; }
        .pp-conversion { margin-top:14px; display:grid; grid-template-columns:minmax(260px,.38fr) minmax(0,1fr); gap:10px; }
        .pp-conversion-list { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; }
        .pp-conversion-card { background:${C.card}; border:1px solid ${C.border}; border-radius:14px; padding:12px; }
        .pp-conversion-card strong { display:block; font-size:14px; margin-bottom:5px; }
        .pp-conversion-card span { color:${C.mid}; font-size:12.5px; line-height:1.38; }
        .pp-note { margin-top:14px; background:${C.ink}; color:#eee9e2; border-radius:18px; padding:16px; display:grid; grid-template-columns:minmax(0,1fr) auto; gap:14px; align-items:center; }
        .pp-note strong { color:#fff; font-size:20px; font-weight:400; }
        @media (max-width:820px) { .pp-shell { padding:20px 16px 56px; } .pp-hero, .pp-grid, .pp-note, .pp-conversion, .pp-conversion-list { grid-template-columns:1fr; } .pp-title { font-size:36px; } .pp-actions { flex-direction:column; } .pp-button { width:100%; } }
      `}</style>
      <SiteHeader />
      <section className="pp-shell">
        <div className="pp-hero">
          <div className="pp-panel">
            <div className="pp-kicker">Funeral-home proof workspace</div>
            <h1 className="pp-title">Show one family case from intake to proof.</h1>
            <p className="pp-lede">This focused workspace shows how a funeral-home team keeps one family case clear: the next action, the owner, the waiting point, the family update, and the proof packet all stay together.</p>
            <div className="pp-actions">
              <a className="pp-button pp-primary" href={walkthroughHref} target="_blank" rel="noreferrer" onClick={() => trackEvent('pilot_proof_book_walkthrough_clicked', { source: 'pilot-proof-console' })}>Book walkthrough</a>
              <Link className="pp-button pp-secondary" href="/funeral-home/dashboard?demo=1" onClick={() => trackEvent('pilot_proof_full_workspace_clicked', { source: 'pilot-proof-console' })}>Open full workspace</Link>
              
            </div>
          </div>
          <div className="pp-panel">
            <div className="pp-kicker">Case clarity</div>
            <div className="pp-metrics">
              {metrics.map(([label, value]) => <div className="pp-metric" key={label}><div className="pp-kicker">{label}</div><b>{value}</b></div>)}
            </div>
          </div>
        </div>
        <section className="pp-grid" aria-label="Pilot proof loop">
          {proofSteps.map(([label, title, body, status]) => (
            <article className="pp-step" key={label}>
              <div className="pp-step-head"><div><div className="pp-kicker">{label}</div><h2>{title}</h2></div><span className="pp-pill">{status}</span></div>
              <p>{body}</p>
            </article>
          ))}
        </section>
        <section className="pp-conversion" aria-label="Pilot conversion path">
          <div className="pp-panel">
            <div className="pp-kicker">How the workspace helps</div>
            <h2 style={{ fontSize: 24, lineHeight: 1.05, margin: '8px 0 8px', fontWeight: 400 }}>Keep the next step obvious.</h2>
            <p className="pp-lede" style={{ fontSize: 13.5 }}>A director should be able to open the case, understand the waiting point, and move the right next step without extra explanation.</p>
          </div>
          <div className="pp-conversion-list">
            {workspaceSteps.map(([label, body]) => <div className="pp-conversion-card" key={label}><strong>{label}</strong><span>{body}</span></div>)}
          </div>
        </section>
        <div className="pp-note">
          <div><div className="pp-kicker" style={{ color: '#b9d2bd' }}>Operating rule</div><strong>If the next step is not obvious, the workspace is not done.</strong><p style={{ color: '#d8d0c7', margin: '7px 0 0', lineHeight: 1.45 }}>The screen should make ownership, waiting, family messaging, and proof easy to understand at a glance.</p></div>
          <a className="pp-button pp-primary" href={walkthroughHref} target="_blank" rel="noreferrer" onClick={() => trackEvent('pilot_proof_bottom_walkthrough_clicked', { source: 'pilot-proof-console' })}>Book walkthrough</a>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
