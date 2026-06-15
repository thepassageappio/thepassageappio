import Link from 'next/link';
import { SiteFooter, SiteHeader } from '../../components/SiteChrome';

const C = { bg: '#f6f3ee', card: '#fffdf9', ink: '#1a1916', mid: '#6a6560', soft: '#9a9288', border: '#e4ddd4', sage: '#6b8f71', sageDark: '#4a6e50', sageFaint: '#eef5ef', sageLight: '#c8deca', rose: '#c47a7a', roseFaint: '#fdf3f3', amber: '#a97832', amberFaint: '#fbf5e8' };
const proofSteps = [
  ['Workspace', 'Hudson Valley Funeral Group', 'Director, staff, location, and plan are visible before case work starts.', 'Ready'],
  ['Case', 'Price family arrangement', 'Family contact, service date, owner, and next waiting point are in one pane.', 'Needs action'],
  ['Task spine', 'Confirm cemetery plot details', 'Owner: Maria. Waiting on: Michael Price. Proof destination: case record.', 'Waiting'],
  ['Family update', 'Service detail approval', 'Message is prepared for family review. Nothing sends automatically.', 'Draft'],
  ['Export', 'Case proof packet', 'Dates, task outcomes, update proof, and vendor request context are ready to export.', 'Ready'],
  ['Conversion', 'Paid-fit decision', 'If one case moves cleanly, ask for Local plan or identify the blocker.', 'Next'],
];
const metrics = [['ARR target', '$300k'], ['Local accounts', '100'], ['Group accounts', '72'], ['Pilot proof loop', '6 steps']];

export default function PilotProofConsole() {
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
        .pp-button { min-height:44px; border-radius:13px; display:inline-flex; align-items:center; justify-content:center; padding:0 15px; font-weight:900; text-decoration:none; font-size:13px; }
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
        .pp-note { margin-top:14px; background:${C.ink}; color:#eee9e2; border-radius:18px; padding:16px; display:grid; grid-template-columns:minmax(0,1fr) auto; gap:14px; align-items:center; }
        .pp-note strong { color:#fff; font-size:20px; font-weight:400; }
        @media (max-width:820px) { .pp-shell { padding:20px 16px 56px; } .pp-hero, .pp-grid, .pp-note { grid-template-columns:1fr; } .pp-title { font-size:36px; } .pp-actions { flex-direction:column; } .pp-button { width:100%; } }
      `}</style>
      <SiteHeader />
      <section className="pp-shell">
        <div className="pp-hero">
          <div className="pp-panel">
            <div className="pp-kicker">Funeral-home pilot proof console</div>
            <h1 className="pp-title">Show the complete paid-pilot loop in under two minutes.</h1>
            <p className="pp-lede">This is the fast sales and QA surface for Sprint 2: one workspace, one case, one task, one family update, one export, and one conversion decision. It is intentionally smaller than the full operating dashboard so demos do not depend on heavy workspace hydration.</p>
            <div className="pp-actions">
              <Link className="pp-button pp-primary" href="/funeral-home/dashboard?demo=1">Open full workspace</Link>
              <Link className="pp-button pp-secondary" href="/system/admin/pilot-health">Pilot health</Link>
              <Link className="pp-button pp-secondary" href="/system/admin/funeral-home-qa">QA checklist</Link>
            </div>
          </div>
          <div className="pp-panel">
            <div className="pp-kicker">ARR math</div>
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
        <div className="pp-note">
          <div><div className="pp-kicker" style={{ color: '#b9d2bd' }}>Sprint 2 rule</div><strong>If this proof loop is not flawless, do not scale outreach.</strong><p style={{ color: '#d8d0c7', margin: '7px 0 0', lineHeight: 1.45 }}>Fix the first workspace until a director can explain the value without us narrating it.</p></div>
          <Link className="pp-button pp-primary" href="/funeral-home">Back to sales page</Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
