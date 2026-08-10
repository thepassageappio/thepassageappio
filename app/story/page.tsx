import type { Metadata } from 'next';
import { Callout, CardGrid, ContentSection, PublicPage } from '@/components/public/PublicPage';

export const metadata: Metadata = { title: 'Our Story', description: 'Why Passage exists and what guides the product.' };

export default function StoryPage() {
  return (
    <PublicPage eyebrow="Our Story" title="Coordination should feel clear, even when life does not." lead="Passage is being built around a simple belief: families and the people helping them should not have to reconstruct every decision, handoff, and next step from scattered calls, messages, and memory.">
      <ContentSection eyebrow="Our mission" title="Make every handoff around loss clear, deliberate, and easier to follow.">
        <CardGrid cards={[
          { title: 'Clarity before complexity', body: 'Show the next action and its owner first. Keep operational detail available to the people who need it, not in the family’s way.' },
          { title: 'Privacy by audience', body: 'A role title alone should never open an entire family record. People should see the information needed for the responsibility they have.' },
          { title: 'Confirmation over assumption', body: 'Prepared, saved, submitted, sent, delivered, and verified are different states. Passage names the state that is actually known.' },
        ]} />
      </ContentSection>
      <Callout title="See how Passage makes the next step clear." action={{ href: '/demo', label: 'Open the example demo' }}>
        <p>Choose a family, director, staff, or vendor view. The demo explains what is example information before you begin.</p>
      </Callout>
    </PublicPage>
  );
}
