import type { Metadata } from 'next';
import { Callout, CardGrid, ContentSection, PublicPage } from '@/components/public/PublicPage';

export const metadata: Metadata = { title: 'Pricing', description: 'Current Passage purchasing and pricing availability.' };

export default function PricingPage() {
  return (
    <PublicPage eyebrow="Pricing" title="See the product before a buying decision." lead="Passage does not currently publish self-serve plan prices or offer checkout on this website. Opening the demo does not start a subscription, create a purchase, or charge a payment method." actions={[{ href: '/demo', label: 'View the demo' }, { href: '/funeral-home', label: 'See the funeral-home experience', secondary: true }]}>
      <ContentSection title="What you can evaluate now" intro="The demo is the honest next step while commercial plans and purchasing are not available here.">
        <CardGrid cards={[
          { title: 'Director workflow', body: 'See how a director receives a family, assigns work, reviews waiting points, and confirms completion.' },
          { title: 'Staff workflow', body: 'See how an employee receives only assigned work and saves confirmation for a director to review.' },
          { title: 'Family experience', body: 'See how the family understands the next action, who is helping, and what is shared.' },
        ]} />
      </ContentSection>
      <Callout title="Nothing is purchased on this page.">
        <p>Passage will show plan details, what is included, and the full price before any future purchase action. There is no payment form or hidden order on this website today.</p>
      </Callout>
    </PublicPage>
  );
}
