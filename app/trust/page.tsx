import type { Metadata } from 'next';
import { CardGrid, ContentSection, PublicPage, Steps } from '@/components/public/PublicPage';

export const metadata: Metadata = { title: 'Trust and privacy', description: 'How Passage explains saving, sharing, visibility, and confirmation.' };

export default function TrustPage() {
  return (
    <PublicPage eyebrow="Trust and privacy" title="Know what is shared, saved, and seen." lead="Passage is designed to show who can see information, why they need it, what will happen after an action, and what to do if something is wrong.">
      <ContentSection title="Words should match what actually happened.">
        <CardGrid cards={[
          { title: 'Prepared', body: 'Passage has helped draft or organize something. Nothing has been sent merely because it was prepared.' },
          { title: 'Saved', body: 'Information was stored with the related family record or work step for the people allowed to see it.' },
          { title: 'Sent or delivered', body: 'Sent means a delivery attempt began. Delivered means the delivery service reported receipt. Neither means a person read or approved it.' },
          { title: 'Verified', body: 'An authorized person reviewed the submitted work and confirmed it. Submission alone is not verification.' },
        ]} />
      </ContentSection>
      <ContentSection title="Before a meaningful action" tone="green">
        <Steps items={[
          { title: 'See the audience', body: 'The page should name who will receive or be able to view the information.' },
          { title: 'See what will be saved', body: 'The page should explain what confirmation or record will remain after the action.' },
          { title: 'Review before sharing', body: 'When information leaves the family’s current view, the intended audience and purpose should be clear first.' },
          { title: 'Recover from a problem', body: 'A failed action should say what did not happen, what stayed unchanged, and the safest next step.' },
        ]} />
      </ContentSection>
    </PublicPage>
  );
}
