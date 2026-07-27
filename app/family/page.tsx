import type { Metadata } from 'next';
import { Callout, PublicPage } from '@/components/public/PublicPage';

export const metadata: Metadata = {
  title: 'Family help',
  description: 'Start with private guidance or explore the family experience with example information.',
};

export default function FamilyPage() {
  return (
    <PublicPage
      eyebrow="Family help"
      title="Explore the next step without opening a family account."
      lead="Family account and invitation access is not available from this page today. You can start the private help flow or use the browser demo with example information. Neither option sends a message, creates a real family record, makes a purchase, or processes a payment."
      actions={[
        { href: '/start', label: 'Start private help' },
        { href: '/demo/family', label: 'Try the browser demo', secondary: true },
      ]}
    >
      <Callout title="What is available now?">
        <p>The help flow explains each step before anything is saved. The browser demo stays on this device and uses example information only. Funeral-home team sign-in is separate and does not grant family access.</p>
      </Callout>
    </PublicPage>
  );
}
