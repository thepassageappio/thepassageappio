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
        .story-shell { max-width: 1040px; margin: 0 auto; padding: 20px 28px 54px; }
        .story-hero { display:grid; grid-template-columns:minmax(0,1.02fr) minmax(280px,.52fr); gap:18px; align-items:stretch; }
        .story-card { background:${C.card}; border:1px solid ${C.border}; border-radius:20px; padding:26px 28px; box-shadow:0 18px 54px rgba(55,45,35,.05); }
        .story-side { background:${C.sageFaint}; border-color:${C.sageLight}; display:grid; align-content:center; gap:16px; }
        .story-kicker { color:${C.sage}; font-size:11px; letter-spacing:.18em; text-transform:uppercase; font-weight:900; margin-bottom:14px; }
        .story-title { font-size:clamp(38px,4.8vw,58px); line-height:1; margin:0 0 14px; font-weight:400; letter-spacing:0; max-width:660px; }
        .story-lede { color:${C.mid}; font-size:16px; line-height:1.58; margin:0; max-width:720px; }
        .story-artifact { display:grid; gap:9px; margin-top:3px; }
        .story-artifact-row { display:grid; grid-template-columns:90px minmax(0,1fr); gap:10px; align-items:center; border-top:1px solid ${C.sageLight}; padding-top:9px; color:${C.mid}; font-size:13.2px; line-height:1.35; }
        .story-artifact-row:first-child { border-top:none; padding-top:0; }
        .story-artifact-row strong { color:${C.ink}; font-size:13.5px; }
        .story-folder-note { color:${C.sageDark}; font-size:clamp(21px,2.2vw,28px); line-height:1.08; }
        .story-body { display:grid; grid-template-columns:minmax(0,1fr) minmax(250px,.42fr); gap:22px; align-items:start; margin:20px auto 0; }
        .story-copy p { color:${C.mid}; font-size:15.5px; line-height:1.66; margin:0 0 14px; }
        .story-body strong { color:${C.ink}; font-weight:500; }
        .story-moments { background:${C.card}; border:1px solid ${C.border}; border-radius:16px; padding:14px; display:grid; gap:8px; }
        .story-moment { display:grid; grid-template-columns:74px minmax(0,1fr); gap:10px; align-items:start; border-top:1px solid ${C.border}; padding-top:8px; }
        .story-moment:first-child { border-top:none; padding-top:0; }
        .story-moment-title { color:${C.sage}; font-size:11px; letter-spacing:.12em; text-transform:uppercase; font-weight:900; line-height:1.16; }
        .story-moment-body { color:${C.mid}; font-size:12.8px; line-height:1.42; }
        .story-quote { background:${C.ink}; color:white; border-radius:18px; padding:22px 24px; margin:0 0 18px; box-shadow:0 18px 50px rgba(25,24,21,.11); }
        .story-quote div { color:${C.sageLight}; font-size:11px; letter-spacing:.18em; text-transform:uppercase; font-weight:900; margin-bottom:12px; }
        .story-quote p { color:white; font-size:clamp(22px,2.5vw,32px); line-height:1.12; margin:0; }
        .story-promise { border-top:1px solid ${C.border}; padding:20px 0 0; margin-top:18px; }
        .story-promise h2 { font-size:clamp(26px,2.8vw,34px); line-height:1.06; font-weight:400; margin:0 0 8px; }
        .story-actions { display:flex; gap:10px; flex-wrap:wrap; margin-top:18px; }
        .story-button { min-height:48px; border-radius:13px; display:inline-flex; align-items:center; justify-content:center; padding:0 18px; font-weight:900; text-decoration:none; }
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
              The experience was not a villain story. The funeral home was kind. Care workers were kind. Family members were doing their best. But after each conversation, the burden moved back to the family: remember this, call that person, find this document, tell everyone what changed.
            </p>
            <p>
              Passage came from that gap. The problem was not that people did not care. The problem was that the family record did not travel cleanly. Ownership got blurry. Updates scattered. Proof lived in texts, calls, email threads, paper folders, and memory.
            </p>
            <div className="story-promise">
              <div className="story-kicker">Why Passage exists</div>
              <h2>To make the practical parts survivable.</h2>
              <p>
                Families need one calm place that says what happens now, who owns it, what is waiting, and how everyone knows it happened.
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
            <div className="story-moments" aria-label="How Passage formed">
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
