import Link from 'next/link';
import { SiteFooter, SiteHeader } from '../../components/SiteChrome';
import { trackEvent } from '../../lib/trackEvent';
import { calendlyUrl } from '../../lib/scheduling';

const C = { bg: '#f6f3ee', card: '#fffdf9', ink: '#1a1916', mid: '#6a6560', soft: '#9a9288', border: '#e4ddd4', sage: '#6b8f71', sageDark: '#4a6e50', sageFaint: '#eef5ef', sageLight: '#c8deca', amber: '#a97832', amberFaint: '#fbf5e8' };

const myDay = [
  ['Next case', 'Price family arrangement', 'Confirm cemetery plot details and approve the drafted family update.'],
  ['Owner', 'Maria, arranger', 'Assigned owner is visible before the director opens the case.'],
  ['Waiting on', 'Michael Price', 'The family owes plot section, lot number, and deed photo.'],
  ['Proof', 'Case record', 'Hospital release saved. Family request drafted. Export packet ready.'],
];

const workflow = [
  ['1', 'My Day', 'Start with the case, owner, waiting point, and proof that need attention now.'],
  ['2', 'Task spine', 'Open the task to see the drafted ask, status, proof requirement, and what done means.'],
  ['3', 'Family update', 'Review the message before anything sends. Families see approved updates, not private staff notes.'],
  ['4', 'Staff queue', 'Employees see assigned work first with context, waiting point, and proof destination.'],
  ['5', 'Export', 'Case status, task outcomes, notes, messages, and proof can be exported for existing systems.'],
];

const boundaries = [
  'This is a sample workspace. No live records, messages, emails, or texts are changed.',
  'Families never see private staff notes, billing details, business-only notes, or unrelated cases.',
  'Staff see assigned work. Directors keep the full case floor, locations, permissions, and export controls.',
  'Every useful card should answer: what is next, who owns it, what is waiting, and what proof exists.',
];

export default function FuneralHomeWorkspaceDemo() {
  const walkthroughHref = calendlyUrl({ source: 'Funeral home workspace demo' });
  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: 'Georgia,serif' }}>
      <style>{`
        .wd-shell, .wd-shell * { box-sizing:border-box; }
        .wd-shell { max-width:1120px; margin:0 auto; padding:28px 24px 70px; }
        .wd-kicker { color:${C.sage}; font-size:11px; letter-spacing:.16em; text-transform:uppercase; font-weight:900; }
        .wd-hero { display:grid; grid-template-columns:minmax(0,1fr) minmax(320px,.48fr); gap:16px; align-items:stretch; }
        .wd-panel { background:${C.card}; border:1px solid ${C.border}; border-radius:18px; padding:18px; box-shadow:0 12px 34px rgba(55,45,35,.055); }
        .wd-title { font-size:48px; line-height:1.02; margin:8px 0 10px; font-weight:400; letter-spacing:0; }
        .wd-lede { color:${C.mid}; font-size:15.5px; line-height:1.58; margin:0; }
        .wd-actions { display:flex; gap:8px; flex-wrap:wrap; margin-top:16px; }
        .wd-button { min-height:44px; border-radius:13px; display:inline-flex; align-items:center; justify-content:center; padding:0 15px; font-weight:900; text-decoration:none; font-family:inherit; cursor:pointer; font-size:13px; }
        .wd-primary { background:${C.ink}; color:white; border:1px solid ${C.ink}; }
        .wd-secondary { background:${C.card}; color:${C.sageDark}; border:1px solid ${C.sageLight}; }
        .wd-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:9px; margin-top:12px; }
        .wd-card { background:${C.card}; border:1px solid ${C.border}; border-radius:15px; padding:13px; }
        .wd-case { background:${C.sageFaint}; border:1px solid ${C.sageLight}; border-radius:15px; padding:13px; margin-top:12px; }
        .wd-row { display:grid; grid-template-columns:92px minmax(0,1fr); gap:10px; padding:8px 0; border-top:1px solid ${C.sageLight}; }
        .wd-row:first-child { border-top:none; }
        .wd-row b { color:${C.sageDark}; font-size:10.5px; letter-spacing:.12em; text-transform:uppercase; }
        .wd-row span { color:${C.mid}; font-size:12.8px; line-height:1.42; }
        .wd-step { display:grid; grid-template-columns:34px minmax(0,1fr); gap:10px; padding:11px 0; border-bottom:1px solid ${C.border}; }
        .wd-step:last-child { border-bottom:none; }
        .wd-num { width:28px; height:28px; display:flex; align-items:center; justify-content:center; border-radius:999px; background:${C.sageFaint}; color:${C.sageDark}; font-size:11px; font-weight:900; }
        @media (max-width:820px) { .wd-shell { padding:20px 16px 56px; } .wd-hero, .wd-grid { grid-template-columns:1fr; } .wd-title { font-size:36px; } .wd-actions { flex-direction:column; } .wd-button { width:100%; } .wd-row { grid-template-columns:1fr; gap:4px; } }
      `}</style>
      <SiteHeader />
      <section className="wd-shell">
        <div className="wd-hero">
          <div className="wd-panel">
            <div className="wd-kicker">Sample funeral-home workspace</div>
            <h1 className="wd-title">Hudson Valley Funeral Group</h1>
            <p className="wd-lede">This sample shows what opens after sign-in: My Day, the next family case, assigned staff work, approved family updates, and proof. It is built for funeral-home teams, not public browsing.</p>
            <div className="wd-actions">
              <a href={walkthroughHref} target="_blank" rel="noreferrer" onClick={() => trackEvent('workspace_demo_book_walkthrough_clicked', { source: 'workspace-demo' })} className="wd-button wd-primary">Book walkthrough</a>
              <Link href="/funeral-home/login" onClick={() => trackEvent('workspace_demo_customer_login_clicked', { source: 'workspace-demo' })} className="wd-button wd-secondary">Customer login</Link>
              <Link href="/funeral-home/sample-case" onClick={() => trackEvent('workspace_demo_sample_case_clicked', { source: 'workspace-demo' })} className="wd-button wd-secondary">View sample case</Link>
            </div>
            <div style={{ background: C.amberFaint, border: '1px solid #ead4ac', borderRadius: 13, padding: 12, color: C.mid, fontSize: 13.2, lineHeight: 1.45, marginTop: 14 }}>Sample workspace. Actions are simulated and no live records or messages are changed.</div>
          </div>
          <div className="wd-panel">
            <div className="wd-kicker">What opens after sign-in</div>
            <h2 style={{ fontSize: 24, lineHeight: 1.1, margin: '7px 0 0', fontWeight: 400 }}>Staff queue showing who owns what.</h2>
            <div className="wd-case">
              {myDay.map(([label, title, body]) => (
                <div className="wd-row" key={label}><b>{label}</b><span><strong style={{ color: C.ink }}>{title}</strong><br />{body}</span></div>
              ))}
            </div>
          </div>
        </div>

        <section style={{ marginTop: 16 }}>
          <div className="wd-panel">
            <div className="wd-kicker">Operating flow</div>
            <h2 style={{ fontSize: 30, lineHeight: 1.1, margin: '7px 0 10px', fontWeight: 400 }}>The dashboard starts with the work, not the noise.</h2>
            {workflow.map(([num, title, body]) => <div className="wd-step" key={title}><div className="wd-num">{num}</div><div><strong>{title}</strong><div style={{ color: C.mid, fontSize: 13.2, lineHeight: 1.45, marginTop: 3 }}>{body}</div></div></div>)}
          </div>
        </section>

        <section style={{ marginTop: 16 }}>
          <div className="wd-grid">
            {boundaries.map((item) => <div className="wd-card" key={item}><div className="wd-kicker">Boundary</div><div style={{ color: C.mid, fontSize: 13, lineHeight: 1.45, marginTop: 6 }}>{item}</div></div>)}
          </div>
        </section>
      </section>
      <SiteFooter />
    </main>
  );
}
