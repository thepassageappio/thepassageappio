import { useMemo, useState } from 'react';
import { SiteHeader, SiteFooter } from '../components/SiteChrome';

const C = { bg: '#f6f3ee', card: '#fffdf9', ink: '#1a1916', mid: '#6a6560', soft: '#9a9288', border: '#e4ddd4', sage: '#6b8f71', sageFaint: '#eef5ef', gold: '#b8945a', rose: '#c47a7a', roseFaint: '#fbf0ef' };

const guides = [
  {
    type: 'First 24 Hours Guide',
    title: 'Know exactly what to do tonight',
    fullTitle: 'First 24 Hours Guide - Know Exactly What to Do Tonight',
    subtitle: 'A calm, step-by-step order of operations for the first hours after a death.',
    audience: 'For the first hours after a death',
    body: 'A calm order of operations: who to call first, what can wait, and what details to write down before decisions pile up.',
    sections: [
      ['Immediate steps', ['Get an official pronouncement of death. If the death happened at home or unexpectedly, call 911 or the hospice nurse. In a hospital, nursing home, or under hospice care, staff usually handles this.', 'Notify immediate family and closest friends. Start with spouse, children, siblings, or parents. Use simple language and delegate if possible.', 'Contact the funeral home. They arrange transportation and guide the next practical steps.', 'Secure the immediate environment. Arrange care for dependents, pets, young children, mail, and the home.']],
      ['Within the first 24 hours', ['Locate important documents: will, pre-arrangement papers, insurance policies, Social Security card, and birth or marriage certificates.', 'Start a list of people and organizations to notify later: employer, banks, attorney, and benefits providers.', 'Order 10-15 certified death certificates. You will need them for most estate, insurance, and account steps.']],
      ['Words you can use', ['I have very sad news. [Name] passed away [time]. We are still in shock and figuring out next steps.', 'Can you help notify [group/person] so I do not have to make every call myself?']],
      ['Next step with Passage', ['Go to your estate dashboard. Passage can help prepare notifications, scripts, and task assignments so the next days feel less chaotic.']],
    ],
  },
  {
    type: 'Family Notification Playbook',
    title: 'Tell the right people without writing from scratch',
    fullTitle: 'Family Notification Playbook - Tell the Right People Without Writing from Scratch',
    subtitle: 'Simple language and order for notifying close family and helpers.',
    audience: 'For close family and helpers',
    body: 'Simple language for first calls, texts, and emails, plus guidance on what not to broadcast before service details are confirmed.',
    sections: [
      ['Recommended order', ['Immediate inner circle: spouse or partner, children, siblings, and parents. Call or tell in person if possible.', 'Extended family and close friends.', 'Employer, faith community, neighbors, and other important circles.']],
      ['Suggested scripts', ['Close family: I am so sorry to tell you this over the phone. [Name] passed away earlier today. It was [peaceful / after a long illness / sudden]. We are still processing everything.', 'Friends or wider circle: With heavy hearts, we wanted to let you know that [Full Name] passed away on [date]. Details about the service will follow soon. Thank you for your love and support.']],
      ['What to include', ['Basic facts: name, date, and general cause only if the family is comfortable sharing.', 'Whether the family wants privacy or visitors right now.', 'Do not share full service details until confirmed. This prevents confusion and repeated corrections.']],
      ['Next step with Passage', ['Passage can prepare personalized notification messages and help assign who contacts whom so nothing falls through the cracks.']],
    ],
  },
  {
    type: 'Executor Checklist',
    title: 'Protect the estate without guessing',
    fullTitle: 'Executor Checklist - Protect the Estate Without Guessing',
    subtitle: 'Practical first financial, legal, and document steps for executors and responsible relatives.',
    audience: 'For executors and responsible relatives',
    body: 'The first financial, legal, and document steps to start, with proof to save and what requires authority before acting.',
    sections: [
      ['First 7-14 days', ['Obtain 10-15 certified death certificates. Order them early for banks, insurance, Social Security, and more.', 'Locate key documents: will or trust, life insurance policies, bank and investment statements, deeds, titles, loan documents, and recent tax returns.', 'Secure physical assets. Change locks if needed, forward mail, and maintain insurance on property and vehicles.']],
      ['Notify institutions', ['Social Security: report the death and ask about survivor benefits.', 'Life insurance companies.', 'Banks and credit card companies: freeze or close accounts as appropriate.', 'Employer, pension administrator, attorney, financial advisor, or CPA.']],
      ['Common mistake to avoid', ['Do not distribute assets or pay large bills from personal accounts until you understand your legal role and the estate is properly opened.']],
      ['Next step with Passage', ['Use your Passage estate dashboard to track tasks, assign helpers, and keep proof, notes, and documents in one place.']],
    ],
  },
  {
    type: 'Funeral Home Meeting Prep',
    title: 'Walk in with the facts they need',
    fullTitle: 'Funeral Home Meeting Prep - Walk In With the Facts They Need',
    subtitle: 'Be prepared for your arrangement meeting so you can focus on honoring your loved one instead of scrambling for information.',
    audience: 'For arrangement meetings',
    body: 'A focused prep sheet for transportation, death certificates, pricing questions, service timing, and who approves next steps.',
    sections: [
      ['Bring these details', ['Full legal name, date of birth, place of birth, and Social Security number.', 'Father’s full name and mother’s maiden name.', 'Marital status and spouse’s name if applicable.', 'Highest level of education and usual occupation.']],
      ['Bring these documents', ['Pre-arrangement paperwork if any.', 'Will or funeral wishes.', 'Life insurance or burial insurance policies.', 'Military discharge papers (DD-214) if veteran.', 'Recent photo for obituary or service materials.']],
      ['Questions to ask', ['What are the total estimated costs and what is included?', 'What are the options for burial vs. cremation?', 'How soon can we hold the service?', 'What paperwork will you handle and what do we need to do?', 'Are there veteran or other benefits we should apply for?']],
      ['Next step with Passage', ['After the meeting, bring the details back to your Passage estate so tasks, people, service details, and messages stay organized.']],
    ],
  },
];

export default function ContentPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [interest, setInterest] = useState(guides[0].title);
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState('');
  const selected = useMemo(() => guides.find(g => g.title === interest) || guides[0], [interest]);

  async function submit(e) {
    e.preventDefault();
    setError('');
    const response = await fetch('/api/supportInquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        name,
        category: 'Resource guide lead',
        urgency: selected.type === 'First 24 Hours Guide' ? 'Urgent family support' : 'Normal',
        source: 'resource_guides',
        flowType: 'resource_guide_gate',
        message: `New gated resource lead\n\nGuide: ${selected.fullTitle}\nAudience: ${selected.audience}`,
      }),
    }).catch(() => null);
    const data = response ? await response.json().catch(() => ({})) : {};
    if (!response || !response.ok) {
      setError(data.error || 'Please enter a real email address so we can send the guide.');
      return;
    }
    setUnlocked(true);
  }

  return (
    <main style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Georgia,serif', color: C.ink }}>
      <SiteHeader />
      <section style={{ maxWidth: 1060, margin: '0 auto', padding: '12px 22px 34px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(310px,.62fr)', gap: 18, alignItems: 'start', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 10.5, color: C.sage, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 7 }}>Resource guides</div>
            <h1 style={{ fontSize: 'clamp(31px, 3.6vw, 45px)', lineHeight: 1.01, margin: '0 0 9px', fontWeight: 400 }}>Four guides for the moments families should not have to figure out alone.</h1>
            <p style={{ color: C.mid, fontSize: 14, lineHeight: 1.5, margin: 0, maxWidth: 720 }}>Choose the situation closest to yours. Passage will unlock the guide here and point you toward the clearest next step.</p>
          </div>
          <form onSubmit={submit} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 15, boxShadow: '0 14px 40px rgba(55,45,35,.05)' }}>
            <div style={{ fontSize: 19, lineHeight: 1.2, marginBottom: 7 }}>Send me the guide</div>
            <p style={{ color: C.mid, fontSize: 13, lineHeight: 1.45, marginTop: 0 }}>No drip campaign. Just the guide and the next place to start.</p>
            <input required type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }} placeholder="Real email address" style={inputStyle} />
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" style={inputStyle} />
            <select value={interest} onChange={e => { setInterest(e.target.value); setUnlocked(false); }} style={inputStyle}>
              {guides.map(g => <option key={g.title}>{g.title}</option>)}
            </select>
            <button style={{ width: '100%', border: 'none', borderRadius: 12, padding: '13px 16px', background: C.sage, color: '#fff', fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' }}>{unlocked ? 'Guide unlocked' : 'Unlock guide'}</button>
            {error && <p style={{ color: C.rose, background: C.roseFaint, border: `1px solid ${C.rose}25`, borderRadius: 10, padding: '9px 10px', fontSize: 12.5, lineHeight: 1.45, margin: '10px 0 0' }}>{error}</p>}
          </form>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(230px, 100%), 1fr))', gap: 10, marginBottom: 14 }}>
          {guides.map(g => {
            const active = selected.title === g.title;
            return (
              <button key={g.title} onClick={() => { setInterest(g.title); setUnlocked(false); }} style={{ textAlign: 'left', background: active ? C.sageFaint : C.card, border: `1px solid ${active ? C.sage : C.border}`, borderRadius: 15, padding: 13, fontFamily: 'Georgia,serif', cursor: 'pointer', minHeight: 148 }}>
                <div style={{ fontSize: 9.5, color: active ? C.sage : C.gold, letterSpacing: '.13em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 7 }}>{g.type}</div>
                <div style={{ fontSize: 17, color: C.ink, lineHeight: 1.18, marginBottom: 7 }}>{g.title}</div>
                <div style={{ fontSize: 12, color: C.mid, lineHeight: 1.4, marginBottom: 6 }}>{g.audience}</div>
                <div style={{ fontSize: 12, color: C.soft, lineHeight: 1.38 }}>{g.body}</div>
              </button>
            );
          })}
        </div>

        <article style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 18, boxShadow: '0 14px 40px rgba(55,45,35,.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'flex-start', borderBottom: `1px solid ${C.border}`, paddingBottom: 14, marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 10.5, color: C.sage, letterSpacing: '.15em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 7 }}>{selected.type}</div>
              <h2 style={{ fontSize: 'clamp(24px, 3vw, 34px)', lineHeight: 1.06, margin: '0 0 7px', fontWeight: 400 }}>{selected.fullTitle}</h2>
              <p style={{ color: C.mid, fontSize: 14, lineHeight: 1.5, margin: 0 }}>{selected.subtitle}</p>
            </div>
            {!unlocked && <span style={{ color: C.rose, background: C.roseFaint, borderRadius: 999, padding: '6px 10px', fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap' }}>Locked</span>}
          </div>

          {!unlocked ? (
            <div style={{ background: C.roseFaint, border: `1px solid ${C.rose}25`, borderRadius: 14, padding: 15, color: C.mid, fontSize: 13.5, lineHeight: 1.55 }}>
              Enter your email above to unlock the full guide immediately. You will stay on this page.
            </div>
          ) : (
            <div>
              <p style={{ color: C.mid, fontSize: 14.5, lineHeight: 1.65, marginTop: 0 }}>You do not have to figure this out alone. Start with the next section that matches where you are right now.</p>
              <div style={{ display: 'grid', gap: 12 }}>
                {selected.sections.map(([title, items]) => (
                  <section key={title} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 15, padding: 15 }}>
                    <h3 style={{ fontSize: 18, lineHeight: 1.2, margin: '0 0 10px', fontWeight: 800 }}>{title}</h3>
                    <div style={{ display: 'grid', gap: 8 }}>
                      {items.map((item, index) => (
                        <div key={index} style={{ display: 'grid', gridTemplateColumns: '24px minmax(0,1fr)', gap: 9, alignItems: 'start', color: C.mid, fontSize: 13.5, lineHeight: 1.55 }}>
                          <span style={{ width: 24, height: 24, borderRadius: '50%', background: C.sageFaint, color: C.sage, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900 }}>{index + 1}</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          )}
        </article>
      </section>
      <SiteFooter />
    </main>
  );
}

const inputStyle = { width: '100%', boxSizing: 'border-box', border: `1.5px solid ${C.border}`, borderRadius: 12, padding: '12px 13px', fontFamily: 'Georgia,serif', fontSize: 14, color: C.ink, outline: 'none', background: '#fff', marginBottom: 10 };
