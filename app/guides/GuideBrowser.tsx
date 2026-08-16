'use client';

import { useState } from 'react';
import styles from '@/components/marketing/MarketingPage.module.css';

type GuideSection = [string, string[]];

type Guide = {
  type: string;
  title: string;
  fullTitle: string;
  subtitle: string;
  audience: string;
  sections: GuideSection[];
};

const guides: Guide[] = [
  {
    type: 'First 24 Hours Guide',
    title: 'Know exactly what to do tonight',
    fullTitle: 'First 24 Hours Guide: Know Exactly What to Do Tonight',
    subtitle: 'A calm, step-by-step order of operations for the first hours after a death.',
    audience: 'For the first hours after a death',
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
    fullTitle: 'Family Notification Playbook: Tell the Right People Without Writing from Scratch',
    subtitle: 'Simple language and order for notifying close family and helpers.',
    audience: 'For close family and helpers',
    sections: [
      ['Recommended order', ['Immediate inner circle: spouse or partner, children, siblings, and parents. Call or tell in person if possible.', 'Extended family and close friends.', 'Employer, faith community, neighbors, and other important circles.']],
      ['Suggested scripts', ['Close family: I am so sorry to tell you this over the phone. [Name] passed away earlier today. It was [peaceful / after a long illness / sudden]. We are still taking this in.', 'Friends or wider circle: With heavy hearts, we wanted to let you know that [Full Name] passed away on [date]. Details about the service will follow soon. Thank you for your love and support.']],
      ['What to include', ['Basic facts: name, date, and general cause only if the family is comfortable sharing.', 'Whether the family wants privacy or visitors right now.', 'Do not share full service details until confirmed. This prevents confusion and repeated corrections.']],
      ['Next step with Passage', ['Passage can prepare personalized notification messages and help assign who contacts whom so nothing falls through the cracks.']],
    ],
  },
  {
    type: 'Executor Checklist',
    title: 'Protect the estate without guessing',
    fullTitle: 'Executor Checklist: Protect the Estate Without Guessing',
    subtitle: 'Practical first financial, legal, and document steps for executors and responsible relatives.',
    audience: 'For executors and responsible relatives',
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
    fullTitle: 'Funeral Home Meeting Prep: Walk In With the Facts They Need',
    subtitle: 'Be prepared for your arrangement meeting so you can focus on honoring your loved one instead of scrambling for information.',
    audience: 'For arrangement meetings',
    sections: [
      ['Bring these details', ['Full legal name, date of birth, place of birth, and Social Security number.', 'Father’s full name and mother’s maiden name.', 'Marital status and spouse’s name if applicable.', 'Highest level of education and usual occupation.']],
      ['Bring these documents', ['Pre-arrangement paperwork if any.', 'Will or funeral wishes.', 'Life insurance or burial insurance policies.', 'Military discharge papers (DD-214) if veteran.', 'Recent photo for obituary or service materials.']],
      ['Questions to ask', ['What are the total estimated costs and what is included?', 'What are the options for burial vs. cremation?', 'How soon can we hold the service?', 'What paperwork will you handle and what do we need to do?', 'Are there veteran or other benefits we should apply for?']],
      ['Next step with Passage', ['After the meeting, bring the details back to your Passage estate so tasks, people, service details, and messages stay organized.']],
    ],
  },
];

export function GuideBrowser() {
  const [activeTitle, setActiveTitle] = useState(guides[0].title);
  const selected = guides.find((g) => g.title === activeTitle) ?? guides[0];

  return (
    <div className={styles.guideLayout}>
      <div className={styles.tabList}>
        {guides.map((guide) => {
          const active = guide.title === selected.title;
          return (
            <button
              key={guide.title}
              type="button"
              onClick={() => setActiveTitle(guide.title)}
              className={`${styles.tabButton} ${active ? styles.tabButtonActive : ''}`}
            >
              <span className={styles.tabType}>{guide.type}</span>
              <span className={styles.tabTitle}>{guide.title}</span>
              <span className={styles.tabAudience}>{guide.audience}</span>
            </button>
          );
        })}
      </div>

      <article className={styles.guideArticle}>
        <div className={styles.guideHead}>
          <p className={styles.badge}>{selected.type}</p>
          <h2>{selected.fullTitle}</h2>
          <p className={styles.note}>{selected.subtitle}</p>
        </div>
        {selected.sections.map(([title, items]) => (
          <section className={styles.guideSection} key={title}>
            <h3>{title}</h3>
            {items.map((item, index) => (
              <div className={styles.guideItem} key={index}>
                <span className={styles.guideItemMark}>{index + 1}</span>
                <span>{item}</span>
              </div>
            ))}
          </section>
        ))}
      </article>
    </div>
  );
}
