import Link from 'next/link';
import { TopShell } from '@/components/core';
import { getStripeClient } from '@/lib/stripe';
import styles from '@/components/marketing/MarketingPage.module.css';

export const metadata = { title: 'Payment confirmed' };

export default async function PricingSuccessPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id: sessionId } = await searchParams;
  const stripe = getStripeClient();
  const session = stripe && sessionId ? await stripe.checkout.sessions.retrieve(sessionId).catch(() => null) : null;
  const paid = session?.payment_status === 'paid' || session?.status === 'complete';

  return (
    <TopShell mode="gateway" context="Payment confirmed">
      <main id="main-content" className={styles.page}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>{paid ? 'Payment confirmed' : 'Checkout'}</p>
          <h1>{paid ? 'You are all set.' : 'Checking your payment.'}</h1>
          <p className={styles.lede}>
            {paid
              ? 'Your subscription is active. Use the secure link in your confirmation email to sign in and start your family record.'
              : 'We could not confirm this checkout session. If you completed payment, check your email for a receipt, or contact Passage.'}
          </p>
        </section>
        <section className={styles.section}>
          <div className={styles.card}>
            <p className={styles.note}>
              Questions about your plan? <Link href="/contact">Contact Passage</Link>, or head back to <Link href="/">the homepage</Link>.
            </p>
          </div>
        </section>
      </main>
    </TopShell>
  );
}
