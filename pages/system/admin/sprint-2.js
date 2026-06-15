import Link from 'next/link';
import { SiteFooter, SiteHeader } from '../../../components/SiteChrome';

const C = { bg: '#f6f3ee', card: '#fff', ink: '#1a1916', mid: '#6a6560', border: '#e4ddd4', sage: '#6b8f71', sageFaint: '#f0f5f1', amber: '#b07d2e', amberFaint: '#fdf8ee', rose: '#c47a7a', roseFaint: '#fdf3f3' };
const milestones = [
  ['M1', 'Demo surface converts', 'Proof console loads fast, explains the paid-pilot loop, and routes to booked walkthrough.', 'Founder', 'Ready to QA'],
  ['M2', 'First workspace activates', 'One funeral home has owner, staff, location, plan, decision maker, and billing status.', 'Founder + product', 'Needs live data'],
  ['M3', 'First case created', 'A director can create or import one case in under five minutes with family contact and next action.', 'Product', 'Blocked by live pilot'],
  ['M4', 'Task spine proves value', 'One task moves through assigned, waiting/blocked, handled, and proof states across personas.', 'Product + QA', 'Blocked by live pilot'],
  ['M5', 'Family update proof', 'One approved family update shows recipient, channel, proof, and next expected update.', 'Product + QA', 'Blocked by live pilot'],
  ['M6', 'Conversion ask', 'Pilot either becomes paid Local/Group or produces a named blocker and next repair sprint.', 'Founder', 'Blocked by proof'],
];
const acceptance = [
  'A funeral-home director understands the value without founder narration.',
  'The demo never depends on a slow heavy dashboard before the buyer gets the point.',
  'Pilot Health shows current account stage, blocker, ARR potential, and next action.',
  'Rate limits protect public intake, telemetry, outbound delivery, and owner refresh surfaces.',
  'The first live pilot has case, staff, proof, family update, export, and billing row before broad outreach.',
];

export default function SprintTwoBoard() {
  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: 'Georgia,serif' }}>
      <style>{`
        .s2-shell, .s2-shell * { box-sizing:border-box; }
        .s2-shell { max-width:1120px; margin:0 auto; padding:42px 20px 80px; }
        .s2-kicker { color:${C.sage}; font-size:11px; letter-spacing:.16em; text-transform:uppercase; font-weight:900; }
        .s2-title { font-size:52px; line-height:1.02; margin:8px 0 10px; font-weight:400; max-width:860px; }
        .s2-lede { color:${C.mid}; font-size:16px; line-height:1.6; margin:0; max-width:820px; }
        .s2-actions { display:flex; gap:8px; flex-wrap:wrap; margin-top:18px; }
        .s2-link { min-height:44px; display:inline-flex; align-items:center; justify-content:center; border-radius:13px; padding:0 15px; font-weight:900; text-decoration:none; font-size:13px; }
        .s2-primary { background:${C.ink}; color:#fff; border:1px solid ${C.ink}; }
        .s2-secondary { background:${C.card}; color:${C.sage}; border:1px solid ${C.border}; }
        .s2-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; margin-top:18px; }
        .s2-card { background:${C.card}; border:1px solid ${C.border}; border-radius:16px; padding:14px; min-height:190px; box-shadow:0 4px 20px rgba(0,0,0,.035); }
        .s2-card-head { display:flex; justify-content:space-between; gap:8px; align-items:flex-start; margin-bottom:8px; }
        .s2-card h2 { font-size:20px; line-height:1.14; margin:0; }
        .s2-card p { color:${C.mid}; font-size:13px; line-height:1.45; margin:0 0 10px; }
        .s2-pill { border-radius:999px; padding:4px 8px; background:${C.amberFaint}; color:${C.amber}; border:1px solid #ead8b8; font-size:11px; font-weight:900; white-space:nowrap; }
        .s2-row { border-top:1px solid ${C.border}; padding-top:8px; margin-top:8px; color:${C.mid}; font-size:12.5px; line-height:1.4; }
        .s2-panel { margin-top:16px; background:${C.sageFaint}; border:1px solid #c8deca; border-radius:18px; padding:18px; }
        .s2-panel ul { margin:10px 0 0; padding-left:18px; color:${C.mid}; font-size:14px; line-height:1.55; }
        @media (max-width:820px) { .s2-shell { padding:24px 16px 60px; } .s2-grid { grid-template-columns:1fr; } .s2-title { font-size:38px; } .s2-actions { flex-direction:column; } .s2-link { width:100%; } }
      `}</style>
      <SiteHeader />
      <section className="s2-shell">
        <div className="s2-kicker">System admin / sprint 2</div>
        <h1 className="s2-title">Sprint 2 exists to create one paid funeral-home proof loop.</h1>
        <p className="s2-lede">The $300k ARR plan only works if the first funeral-home pilot becomes repeatable. This board keeps the sprint tied to buyer conversion, live activation, proof, and paid-fit decisions.</p>
        <div className="s2-actions">
          <Link className="s2-link s2-primary" href="/funeral-home/pilot-proof">Open proof console</Link>
          <Link className="s2-link s2-secondary" href="/system/admin/pilot-health">Pilot health</Link>
          <Link className="s2-link s2-secondary" href="/system/admin/funeral-home-qa">QA checklist</Link>
          <Link className="s2-link s2-secondary" href="/system/admin/rate-limit-readiness">Abuse controls</Link>
        </div>
        <section className="s2-grid" aria-label="Sprint 2 milestones">
          {milestones.map(([code, title, body, owner, status]) => (
            <article className="s2-card" key={code}>
              <div className="s2-card-head"><div><div className="s2-kicker">{code}</div><h2>{title}</h2></div><span className="s2-pill">{status}</span></div>
              <p>{body}</p>
              <div className="s2-row"><strong>Owner:</strong> {owner}</div>
            </article>
          ))}
        </section>
        <section className="s2-panel">
          <div className="s2-kicker">Acceptance criteria</div>
          <h2 style={{ fontSize: 28, lineHeight: 1.12, margin: '8px 0 0', fontWeight: 400 }}>Do not scale outreach until these are true.</h2>
          <ul>{acceptance.map(item => <li key={item}>{item}</li>)}</ul>
        </section>
      </section>
      <SiteFooter />
    </main>
  );
}
