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

const folderItems = [
  'Medicaid notes',
  'Funeral wishes',
  'Phone numbers',
  'Questions for later',
];

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
        .story-shell { max-width: 1120px; margin: 0 auto; padding: 22px 28px 70px; }
        .story-hero { display:grid; grid-template-columns:minmax(0,1fr) minmax(320px,.62fr); gap:28px; align-items:start; }
        .story-card { background:${C.card}; border:1px solid ${C.border}; border-radius:24px; padding:34px 36px; box-shadow:0 20px 62px rgba(55,45,35,.06); }
        .story-side { background:${C.sageFaint}; border-color:${C.sageLight}; overflow:hidden; min-height:420px; display:grid; align-content:space-between; gap:24px; }
        .story-kicker { color:${C.sage}; font-size:11px; letter-spacing:.18em; text-transform:uppercase; font-weight:900; margin-bottom:14px; }
        .story-title { font-size:clamp(42px,5.2vw,68px); line-height:.98; margin:0 0 18px; font-weight:400; letter-spacing:0; }
        .story-lede { color:${C.mid}; font-size:18px; line-height:1.68; margin:0; max-width:720px; }
        .story-folder { position:relative; min-height:245px; border:1px solid ${C.gold}55; border-radius:18px; background:${C.goldFaint}; box-shadow:0 22px 58px rgba(55,45,35,.12); padding:22px; margin-top:8px; }
        .story-folder:before { content:''; position:absolute; left:22px; top:-18px; width:150px; height:36px; background:${C.goldFaint}; border:1px solid ${C.gold}55; border-bottom:none; border-radius:14px 14px 0 0; }
        .story-paper { position:relative; background:${C.card}; border:1px solid ${C.border}; border-radius:13px; padding:12px 13px; margin-bottom:9px; color:${C.mid}; font-size:13.5px; line-height:1.35; box-shadow:0 8px 18px rgba(55,45,35,.04); }
        .story-paper strong { display:block; color:${C.ink}; font-size:14px; margin-bottom:3px; }
        .story-folder-note { position:relative; color:${C.sageDark}; font-size:clamp(24px,2.5vw,34px); line-height:1.08; z-index:2; }
        .story-body { max-width:820px; margin:34px auto 0; }
        .story-body p { color:${C.mid}; font-size:18px; line-height:1.78; margin:0 0 22px; }
        .story-body strong { color:${C.ink}; font-weight:500; }
        .story-moments { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:10px; margin:34px 0; }
        .story-moment { background:${C.card}; border:1px solid ${C.border}; border-radius:18px; padding:17px 16px; min-height:160px; }
        .story-moment-number { width:28px; height:28px; border-radius:50%; background:${C.sageFaint}; color:${C.sageDark}; display:inline-flex; align-items:center; justify-content:center; font-size:12px; font-weight:900; margin-bottom:12px; }
        .story-moment-title { color:${C.ink}; font-size:18px; line-height:1.16; margin-bottom:7px; }
        .story-moment-body { color:${C.mid}; font-size:13.8px; line-height:1.52; }
        .story-quote { background:${C.ink}; color:white; border-radius:24px; padding:30px 32px; margin:34px 0; box-shadow:0 20px 60px rgba(25,24,21,.12); }
        .story-quote div { color:${C.sageLight}; font-size:11px; letter-spacing:.18em; text-transform:uppercase; font-weight:900; margin-bottom:12px; }
        .story-quote p { color:white; font-size:clamp(25px,3vw,38px); line-height:1.12; margin:0; }
        .story-promise { border-top:1px solid ${C.border}; border-bottom:1px solid ${C.border}; padding:28px 0; margin:32px 0; }
        .story-promise h2 { font-size:clamp(30px,3.4vw,44px); line-height:1.06; font-weight:400; margin:0 0 12px; }
        .story-actions { display:flex; gap:12px; flex-wrap:wrap; margin-top:28px; }
        .story-button { min-height:52px; border-radius:14px; display:inline-flex; align-items:center; justify-content:center; padding:0 20px; font-weight:900; text-decoration:none; }
        @media (max-width: 760px) {
          .story-shell { padding:18px 18px 54px; }
          .story-hero { grid-template-columns:1fr; }
          .story-card { padding:26px 24px; }
          .story-side { min-height:0; }
          .story-folder { padding:18px; }
          .story-moments { grid-template-columns:1fr; }
          .story-moment { min-height:0; }
          .story-quote { padding:26px 24px; }
          .story-body p { font-size:16.5px; line-height:1.72; }
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
              Families should not leave one of life's hardest meetings carrying the whole operating system in their hands.
            </div>
            <div className="story-folder" aria-label="A folder of practical next steps">
              {folderItems.map((item, index) => (
                <div className="story-paper" key={item} style={{ transform: `rotate(${index % 2 === 0 ? '-.7deg' : '.5deg'})` }}>
                  <strong>{item}</strong>
                  Saved somewhere. Needed later. Easy to lose in the handoff.
                </div>
              ))}
            </div>
          </div>
        </div>

        <article className="story-body">
          <p>
            The experience was not a dramatic villain story. That matters. The funeral home was doing its job. Care workers were doing their jobs. Family members were doing their best. But after each conversation, the burden kept moving back to the family: remember this, call that person, find this document, bring this paper, tell everyone what changed.
          </p>
          <p>
            At one point, the handoff looked like what it still looks like for too many families: a folder of papers, a head full of instructions, and the quiet expectation that someone grieving or exhausted would become the coordinator.
          </p>
          <p>
            Passage came from that gap. Not from blaming funeral homes, hospice teams, attorneys, or families. Most of the people in this work are trying to help under impossible constraints. The problem is that the record does not travel cleanly. Ownership gets blurry. Updates scatter. Proof lives in texts, calls, email threads, paper folders, and memory.
          </p>

          <div className="story-moments">
            {moments.map(([title, body], index) => (
              <div className="story-moment" key={title}>
                <span className="story-moment-number">{index + 1}</span>
                <div className="story-moment-title">{title}</div>
                <div className="story-moment-body">{body}</div>
              </div>
            ))}
          </div>

          <div className="story-quote">
            <div>The realization</div>
            <p>The folder was not the problem. The missing continuity was.</p>
          </div>

          <div className="story-promise">
            <div className="story-kicker">Why Passage exists</div>
            <h2>To make the practical parts survivable.</h2>
            <p>
              We believe families need one calm place that says what happens now, who owns it, what is waiting, and how everyone knows it happened.
            </p>
          </div>

          <p>
            That is why Passage is not trying to replace the people who already serve families. It is built to sit between families and institutions as a continuity layer: planning while someone is living, preparation during care, urgent coordination after death, funeral-home logistics, and the long tail of estate, notifications, remembrance, and family updates.
          </p>
          <p>
            The goal is simple and hard: when a family walks out of a meeting, hangs up a call, or hands work from one person to another, the next step should not disappear into a folder.
          </p>

          <div className="story-actions">
            <Link href="/urgent" className="story-button" style={{ background: C.ink, color: '#fff' }}>Start urgent path</Link>
            <Link href="/mission" className="story-button" style={{ background: C.card, color: C.sageDark, border: `1px solid ${C.sageLight}` }}>Read the mission</Link>
          </div>
        </article>
      </section>
      <SiteFooter />
    </main>
  );
}
