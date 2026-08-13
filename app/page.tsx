import type { Metadata } from 'next';
import { Callout, CardGrid, ContentSection, PublicPage, Steps } from '@/components/public/PublicPage';

export const metadata: Metadata = {
  title: 'Clear next steps for families and funeral homes',
  description: 'Passage helps families and funeral-home teams understand what needs attention, who owns it, and what has been confirmed.',
};

export default function HomePage() {
  return (
    <PublicPage
      eyebrow="Calm coordination when it matters"
      title="Everyone knows what happens next."
      lead="Passage brings families, funeral-home teams, and invited helpers into one clear flow: what needs attention, who owns it, what is waiting, and what has been confirmed."
      actions={[
        { href: '/start', label: 'Get help now' },
        { href: '/funeral-home', label: 'For funeral homes', secondary: true },
        { href: '/demo', label: 'View the demo', secondary: true },
      ]}
    >
      <ContentSection eyebrow="One shared direction" title="Less repetition. More certainty." intro="Passage keeps each next step connected to the person, the people helping, and the confirmation that it was handled.">
        <CardGrid cards={[
          { title: 'Families', body: 'See the next step, who is handling it, what is waiting, and what information will be shared before you choose to share it.' },
          { title: 'Funeral-home teams', body: 'Give every case a clear owner, keep staff focused on assigned work, and leave a useful record of what happened.' },
          { title: 'Invited helpers', body: 'Receive only the details needed for one responsibility, with a clear audience and a clear way to finish or ask for help.' },
        ]} />
      </ContentSection>
      <ContentSection eyebrow="How it works" title="A clear handoff from question to confirmation." tone="soft">
        <Steps items={[
          { title: 'Ask for help once', body: 'Start with the situation and the people involved. Passage explains what is saved before anything becomes part of a record.' },
          { title: 'Choose who can help', body: 'The right person sees the work that belongs to them. Private family information is not opened to an entire team by default.' },
          { title: 'Follow the next action', body: 'Each step shows the owner, who is waiting, what to do now, and what happens after the action.' },
          { title: 'Keep the confirmation', body: 'When work is confirmed, Passage keeps the useful details with the related step so the family and team do not have to reconstruct it later.' },
        ]} />
      </ContentSection>
      <Callout title="See Passage from every point of view." action={{ href: '/demo', label: 'Open the demo' }}>
        <p>The demo uses example information. It does not create a family record, send a message, make a purchase, or charge a payment method.</p>
      </Callout>
    </PublicPage>
  );
}
