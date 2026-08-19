import Link from 'next/link';
import { TopShell } from '@/components/core';
import { loginPath } from '@/lib/auth/redirects';
import { addEstateSeat, loadBillingSummary, openBillingPortal } from './actions';
import styles from '@/components/marketing/MarketingPage.module.css';

export const metadata = { title: 'Billing' };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const BILLING_ERROR_MESSAGES: Record<string, string> = {
  unavailable: 'Billing is temporarily unavailable. Nothing changed. Try again in a moment.',
  denied: 'You need to be signed in to make that change. Nothing changed.',
  'no-subscription': 'That needs an active subscription with billing set up first. Nothing changed.',
};

const PLAN_LABELS: Record<string, string> = {
  single_monthly: 'Individual · Monthly', single_annual: 'Individual · Annual', single_lifetime: 'Single Estate · One-time',
  couple_monthly: 'Couple · Monthly', couple_annual: 'Couple · Annual',
  family_monthly: 'Family · Monthly', family_annual: 'Family · Annual',
  urgent: 'Urgent · One-time',
};

function formatAmount(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ error?: string; added?: string }> }) {
  const { error, added } = await searchParams;
  const result = await loadBillingSummary();

  if (!result.ok) {
    if (result.reason === 'signed-out') {
      return (
        <TopShell mode="gateway" context="Billing">
          <main id="main-content" className={styles.page}>
            <section className={styles.hero}><p className={styles.eyebrow}>Billing</p><h1>Sign in to manage your subscription.</h1></section>
            <section className={styles.section}><Link className={styles.button} href={loginPath('/account/billing')}>Sign in</Link></section>
          </main>
        </TopShell>
      );
    }
    if (result.reason === 'no-subscription') {
      return (
        <TopShell mode="gateway" context="Billing">
          <main id="main-content" className={styles.page}>
            <section className={styles.hero}><p className={styles.eyebrow}>Billing</p><h1>No active subscription yet.</h1><p className={styles.lede}>Choose a plan to get started.</p></section>
            <section className={styles.section}><Link className={styles.button} href="/pricing">View plans</Link></section>
          </main>
        </TopShell>
      );
    }
    return (
      <TopShell mode="gateway" context="Billing">
        <main id="main-content" className={styles.page}>
          <section className={styles.hero}><p className={styles.eyebrow}>Billing</p><h1>We couldn&apos;t load your billing details.</h1><p className={styles.lede}>Nothing changed. Try again.</p></section>
        </main>
      </TopShell>
    );
  }

  const { plan, amountCents, interval, status, renewalDate, addOnSeats } = result.data;
  const canAddSeat = interval !== 'once' && (status === 'active' || status === 'trialing');

  return (
    <TopShell mode="gateway" context="Billing">
      <main id="main-content" className={styles.page}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Billing</p>
          <h1>Your subscription.</h1>
        </section>

        {error && <div className={styles.checkoutAlert} role="alert">{BILLING_ERROR_MESSAGES[error] ?? BILLING_ERROR_MESSAGES.unavailable}</div>}
        {added === 'estate' && <div className={styles.card}><p className={styles.note}>Estate added to your subscription. It will appear on your next invoice.</p></div>}

        <section className={styles.section}>
          <div className={styles.card}>
            <p className={styles.badge}>{PLAN_LABELS[plan] ?? plan}</p>
            <div className={styles.priceRow}><span>{interval === 'once' ? 'Paid' : 'Current amount'}</span><strong>{formatAmount(amountCents)}{interval !== 'once' && <em>/{interval}</em>}</strong></div>
            {renewalDate && interval !== 'once' && <p className={styles.note}>Renews {new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(new Date(renewalDate))}</p>}
            {addOnSeats > 0 && <p className={styles.note}>Plus {addOnSeats} additional estate{addOnSeats > 1 ? 's' : ''}</p>}
            <p className={styles.note}>Status: {status}</p>
          </div>

          {canAddSeat && (
            <div className={styles.card} style={{ marginTop: 16 }}>
              <p className={styles.note}>Need to coordinate care for another loved one? Add another estate to this subscription.</p>
              <form action={addEstateSeat}>
                <button className={`${styles.buttonSecondary} ${styles.fullWidth}`} type="submit">Add another estate</button>
              </form>
            </div>
          )}

          {interval !== 'once' && (
            <div className={styles.card} style={{ marginTop: 16 }}>
              <p className={styles.note}>Update your payment method, view invoices, or cancel your subscription.</p>
              <form action={openBillingPortal}>
                <button className={`${styles.buttonSecondary} ${styles.fullWidth}`} type="submit">Manage billing</button>
              </form>
            </div>
          )}
        </section>

        <footer className={styles.footer}>
          <p><Link href="/case">← Back to your estates</Link> · Questions about billing? <Link href="/contact">Contact Passage</Link>.</p>
          <form action="/auth/signout" method="post" style={{ marginTop: 8 }}>
            <button style={{ background: 'none', border: 'none', padding: 0, color: 'inherit', textDecoration: 'underline', cursor: 'pointer', font: 'inherit' }} type="submit">Sign out</button>
          </form>
        </footer>
      </main>
    </TopShell>
  );
}
