import type { Metadata } from 'next';
import { Callout, CardGrid, ContentSection, PublicPage } from '@/components/public/PublicPage';

export const metadata: Metadata = { title: 'Guides', description: 'Practical guidance for coordinating family and funeral-home next steps.' };

export default function GuidesPage() {
  return (
    <PublicPage eyebrow="Practical guides" title="Clear answers for the next conversation." lead="Short, useful guidance for families and the people helping them. Reading a guide does not create an account, save personal information, or share anything with a funeral home.">
      <ContentSection title="Start with the question in front of you.">
        <CardGrid cards={[
          { title: 'Your first funeral-home conversation', body: 'A calm way to prepare, what you can ask, and what you do not need to decide before the conversation begins.', href: '/guides/first-funeral-home-conversation', linkLabel: 'Read the guide' },
          { title: 'Choose one family coordinator', body: 'How one point person can reduce repeated calls while keeping decisions and privacy with the right people.', availabilityLabel: 'Coming soon' },
          { title: 'Keep decisions separate from confirmation', body: 'Why choosing what should happen, submitting a request, and confirming completion are three different steps.', availabilityLabel: 'Coming soon' },
          { title: 'Help a friend without taking over', body: 'Useful ways to offer practical help while leaving personal and family decisions with the people closest to them.', availabilityLabel: 'Coming soon' },
          { title: 'Write down who is waiting', body: 'A simple method for finding the next action when several people, providers, and family members are involved.', availabilityLabel: 'Coming soon' },
          { title: 'Share only what is needed', body: 'Questions to ask before sending personal information to another person or organization.', availabilityLabel: 'Coming soon' },
        ]} />
      </ContentSection>
      <Callout title="Need a clear next step now?" action={{ href: '/start', label: 'Get help now' }}>
        <p>Tell Passage whether you are planning ahead or need help today. The next page explains what can be saved and when sign-in is required.</p>
      </Callout>
    </PublicPage>
  );
}
