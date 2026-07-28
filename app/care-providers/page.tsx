import type { Metadata } from 'next';
import { Callout, CardGrid, ContentSection, PublicPage } from '@/components/public/PublicPage';

export const metadata: Metadata = { title: 'For care providers', description: 'How care providers may support a clear, family-directed handoff.' };

export default function CareProvidersPage() {
  return (
    <PublicPage eyebrow="For care providers" title="A focused handoff without opening the whole family record." lead="Passage is designed to help care teams understand the requested coordination step, the family contact boundary, who is waiting, and what confirmation belongs with the handoff.">
      <ContentSection title="The intended care-provider experience">
        <CardGrid cards={[
          { title: 'A clear responsibility', body: 'See the specific handoff or coordination detail that needs attention, not unrelated family or funeral-home work.' },
          { title: 'A clear audience', body: 'Know whether a response is intended for the family contact, funeral-home team, or another authorized participant.' },
          { title: 'A clear finish', body: 'Save the useful confirmation with the related handoff so the next person knows what happened.' },
        ]} />
      </ContentSection>
      <Callout title="Self-serve care-provider accounts are not available on this website.">
        <p>This page does not connect to a medical record, authorize care, send a referral, or create a provider account. Passage does not claim a live care-system integration here.</p>
      </Callout>
    </PublicPage>
  );
}
