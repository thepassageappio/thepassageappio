import type { Metadata } from 'next';
import { Callout, CardGrid, ContentSection, PublicPage, Steps } from '@/components/public/PublicPage';

export const metadata: Metadata = {
  title: 'For funeral homes',
  description: 'Passage gives every case a clear owner, a clear next step, and a useful record of what was confirmed.',
};

export default function FuneralHomePage() {
  return (
    <PublicPage
      eyebrow="For funeral-home teams"
      title="One clear owner for every next step."
      lead="Passage helps directors see what needs attention, give staff the right work, keep families informed, and confirm what happened without opening the whole family record to everyone."
      actions={[
        { href: '/demo', label: 'View the funeral-home demo' },
        { href: '/pricing', label: 'See pricing availability', secondary: true },
      ]}
    >
      <ContentSection title="The day starts with what needs attention." intro="Directors see the work that is waiting, who owns it, what the family needs next, and where confirmation is still missing.">
        <CardGrid cards={[
          { title: 'Directors', body: 'See case ownership, staff workload, waiting points, family-update needs, vendor work, and missing confirmation in one operating view.' },
          { title: 'Staff', body: 'See assigned work only, with the case context, one next action, the person waiting, and a clear place to save confirmation.' },
          { title: 'Families', body: 'See understandable updates and next steps without being exposed to internal staffing or operational notes.' },
        ]} />
      </ContentSection>
      <ContentSection eyebrow="From first call to follow-through" title="A calmer operating rhythm." tone="green">
        <Steps items={[
          { title: 'Receive the family', body: 'Start with the minimum information needed. Missing details become guided next steps instead of a longer intake meeting.' },
          { title: 'Assign the right person', body: 'A director chooses the responsible location and team member. Staff see only work their role and assignment allow.' },
          { title: 'Coordinate the handoffs', body: 'Family updates, outside requests, and supporting details stay connected to the related work instead of disappearing into separate messages.' },
          { title: 'Confirm what happened', body: 'The team keeps a clear, time-stamped record of submitted and verified work. Submitted, sent, delivered, and verified never mean the same thing.' },
        ]} />
      </ContentSection>
      <Callout title="Try the complete example before you share information." action={{ href: '/demo', label: 'Open the demo' }}>
        <p>The demo uses example people and work. Nothing is sent to a real family, staff member, or vendor, and no payment is collected.</p>
      </Callout>
    </PublicPage>
  );
}
