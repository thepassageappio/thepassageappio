import Link from 'next/link';
import { SiteFooter, SiteHeader } from '../components/SiteChrome';

const C = {
  bg: '#f6f3ee',
  card: '#fffdf9',
  ink: '#1a1916',
  mid: '#6a6560',
  soft: '#9a9288',
  border: '#e4ddd4',
  sage: '#6b8f71',
  sageDark: '#4a6e50',
  sageFaint: '#eef5ef',
  sageLight: '#c8deca',
  gold: '#b8945a',
  goldFaint: '#fbf5e8',
  roseFaint: '#fbf0ef',
};

const moments = [
  ['The meeting', 'There was care in the room, and still too much for the family to carry home.'],
  ['The folder', 'Instructions, phone numbers, papers, and next steps depended on one person keeping it all straight.'],
  ['The gap', 'Every institution had a role, but the family record did not travel with the family.'],
  ['The product', 'Passage became the calm place for owners, updates, proof, and handoffs to stay together.'],
];

export default function StoryPage() {
  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: 'Georgia,serif' }}>
      <style suppressHydrationWarning>{`
        .story-shell { max-width: 1060px; margin: 0 auto; padding: 20px 28px 62px; }
        .story-hero { display:grid; grid-template-columns:minmax(0,1.02fr) minmax(280px,.58fr); gap:22px; align-items:stretch; }
        .story-card { background:${C.card}; border:1px solid ${C.border}; border-radius:20px; padding:30px 32px; box-shadow:0 18px 54px rgba(55,45,35,.05); }
        .story-side { background:${C.sageFaint}; border-color:${C.sageLight}; display:grid; align-content:center; gap:16px; }
        .story-kicker { color:${C.sage}; font-size:11px; letter-spacing:.18em; text-transform:uppercase; font-weight:900; margin-bottom:14px; }
        .story-title { font-size:clamp(42px,5.2vw,64px); line-height:.98; margin:0 0 16px; font-weight:400; letter-spacing:0; max-width:660px; }
        .story-lede { color:${C.mid}; font-size:17px; line-height:1.62; margin:0; max-width:720px; }
        .story-artifact { display:grid; gap:9px; margin-top:3px; }
        .story-artifact-row { display:grid; grid-template-columns:90px minmax(0,1fr); gap:10px; align-items:center; border-top:1px solid ${C.sageLight}; padding-top:9px; color:${C.mid}; font-size:13.2px; line-height:1.35; }
        .story-artifact-row:first-child { border-top:none; padding-top:0; }
        .story-artifact-row strong { color:${C.ink}; font-size:13.5px; }
        .story-folder-note { color:${C.sageDark}; font-size:clamp(22px,2.3vw,30px); line-height:1.08; }
        .story-body { display:grid; grid-template-columns:minmax(0,1fr) minmax(260px,.48fr); gap:28px; align-items:start; margin:28px auto 0; }
        .story-copy p { color:${C.mid}; font-size:16.5px; line-height:1.72; margin:0 0 18px; }
        .story-body strong { color:${C.ink}; font-weight:500; }
        .story-moments { display:grid; gap:8px; margin:0 0 18px; }
        .story-moment { background:${C.card}; border:1px solid ${C.border}; border-radius:14px; padding:12px 13px; }
        .story-moment-title { color:${C.ink}; font-size:15px; line-height:1.16; margin-bottom:4px; }
        .story-moment-body { color:${C.mid}; font-size:12.5px; line-height:1.48; }
        .story-quote { background:${C.ink}; color:white; border-radius:18px; padding:22px 24px; margin:0 0 18px; box-shadow:0 18px 50px rgba(25,24,21,.11); }
        .story-quote div { color:${C.sageLight}; font-size:11px; letter-spacing:.18em; text-transform:uppercase; font-weight:900; margin-bottom:12px; }
        .story-quote p { color:white; font-size:clamp(22px,2.5vw,32px); line-height:1.12; margin:0; }
        .story-promise { border-top:1px solid ${C.border}; padding:24px 0 0; margin-top:24px; }
        .story-promise h2 { font-size:clamp(28px,3vw,38px); line-height:1.06; font-weight:400; margin:0 0 10px; }
        .story-actions { display:flex; gap:12px; flex-wrap:wrap; margin-top:22px; }
        .story-button { min-height:52px; border-radius:14px; display:inline-flex; align-items:center; justify-content:center; padding:0 20px; font-weight:900; text-decoration:none; }
        @media (max-width: 760px) {
          .story-shell { padding:18px 18px 54px; }
          .story-hero { grid-template-columns:1fr; }
          .story-card { padding:24px 22px; }
          .story-body { grid-template-columns:1fr; }
          .story-copy p { font-size:16px; line-height:1.7; }
          .story-button { width:100%; }
        }
      `}</style>
      <SiteHeader />
      <section className="story-shell">
        <div className="story-hero">
          <div className="story-card">
            <div className="story-kicker">Our Story</div>
            <h1 className="story-title">Passage began with a folder.</h1>
            <p className="story-lede">
              Founder Steve Turrisi helped plan his grandmother's funeral with her while the family was also navigating Medicaid and the practical realities that come with care. The people helping were kind. The system around everyone was not built for continuity.
            </p>
          </div>
          <div className="story-card story-side">
            <div className="story-folder-note">
              The folder was useful. It just could not carry continuity.
            </div>
            <div className="story-artifact" aria-label="A folder of practical next steps">
              {[
                ['Medicaid', 'Notes from care planning'],
                ['Funeral', 'Wishes, contacts, next calls'],
                ['Family', 'Who owns what after the meeting'],
                ['Proof', 'What happened and what is waiting'],
              ].map(([label, text]) => (
                <div className="story-artifact-row" key={label}>
                  <strong>{label}</strong>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <article className="story-body">
          <div className="story-copy">
            <p>
              The experience was not a dramatic villain story. That matters. The funeral home was doing its job. Care workers were doing their jobs. Family members were doing their best. But after each conversation, the burden kept moving back to the family: remember this, call that person, find this document, tell everyone what changed.
            </p>
            <p>
              Passage came from that gap. Not from blaming funeral homes, hospice teams, attorneys, or families. Most of the people in this work are trying to help under impossible constraints. The problem is that the record does not travel cleanly. Ownership gets blurry. Updates scatter. Proof lives in texts, calls, email threads, paper folders, and memory.
            </p>
            <div className="story-promise">
              <div className="story-kicker">Why Passage exists</div>
              <h2>To make the practical parts survivable.</h2>
              <p>
                We believe families need one calm place that says what happens now, who owns it, what is waiting, and how everyone knows it happened.
              </p>
              <div className="story-actions">
                <Link href="/urgent" className="story-button" style={{ background: C.ink, color: '#fff' }}>Start urgent path</Link>
                <Link href="/mission" className="story-button" style={{ background: C.card, color: C.sageDark, border: `1px solid ${C.sageLight}` }}>Read the mission</Link>
              </div>
            </div>
          </div>
          <div>
            <div className="story-quote">
              <div>The realization</div>
              <p>The missing piece was continuity.</p>
            </div>
            <div className="story-moments">
              {moments.map(([title, body]) => (
                <div className="story-moment" key={title}>
                  <div className="story-moment-title">{title}</div>
                  <div className="story-moment-body">{body}</div>
                </div>
              ))}
            </div>
          </div>
        </article>
      </section>
      <SiteFooter />
    </main>
  );
}
