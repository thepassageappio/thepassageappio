import Link from 'next/link';
import { AppFrame } from '@/components/operations/AppFrame';
import { loadPayoutStatus, startPayoutOnboarding, syncPayoutStatusOnReturn } from './actions';
import styles from '../../operations-beta.module.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function VendorPayoutsPage({ searchParams }: { searchParams: Promise<{ onboarding?: string; error?: string }> }) {
  const { onboarding, error } = await searchParams;
  if (onboarding === 'return') await syncPayoutStatusOnReturn();

  const result = await loadPayoutStatus();
  if (!result.ok) {
    return (
      <main className={styles.closed} id="main-content">
        <p>VENDOR / PAYOUTS</p><h1>We couldn&apos;t load your payout status.</h1><span>{result.message}</span>
        <Link href="/partner">Return to requests</Link>
      </main>
    );
  }

  const { role, organizationName, status } = result;
  const ready = status.payoutsEnabled;

  return (
    <AppFrame active="partner" identity={organizationName} mode="verified" role={`Vendor · ${organizationName}`}>
      <header className={styles.pageHeading}>
        <div><p>VENDOR / PAYOUTS</p><h1>Get set up to receive requests and get paid.</h1><span>Passage collects payment from the funeral home when a director approves your quote, and releases it to you once your delivery is verified.</span></div>
      </header>

      {error === 'denied' && <p className={styles.commandError} role="alert">Only the vendor account owner can set up payouts.</p>}
      {error === 'unavailable' && <p className={styles.commandError} role="alert">Passage could not start payout setup right now. Nothing changed.</p>}

      <section className={styles.scopeBand} aria-label="Payout status">
        <strong>{organizationName}</strong>
        <span data-state={ready ? 'verified' : 'sent'}>{ready ? 'Ready to receive requests' : status.hasAccount ? 'Setup in progress' : 'Not set up yet'}</span>
      </section>

      <section className={styles.workList} aria-labelledby="payout-status-title">
        <div className={styles.sectionHeading}><div><p>STATUS</p><h2 id="payout-status-title">Your payout account.</h2></div></div>
        <article className={styles.workCard}>
          <div className={styles.cardBody}>
            <dl className={styles.facts}>
              <div><dt>Payout account</dt><dd>{status.hasAccount ? 'Created' : 'Not created'}</dd></div>
              <div><dt>Details submitted</dt><dd>{status.detailsSubmitted ? 'Yes' : 'No'}</dd></div>
              <div><dt>Can accept charges</dt><dd>{status.chargesEnabled ? 'Yes' : 'No'}</dd></div>
              <div><dt>Can receive payouts</dt><dd>{status.payoutsEnabled ? 'Yes' : 'No'}</dd></div>
              <div><dt>Visible to directors</dt><dd>{ready ? 'Yes — you can receive requests' : 'No — finish setup to appear in the vendor picker'}</dd></div>
              <div><dt>Platform fee</dt><dd>12% of each verified order, withheld automatically before payout</dd></div>
            </dl>
          </div>
          {role === 'owner' ? (
            <form action={startPayoutOnboarding}>
              <button type="submit">{status.hasAccount ? 'Continue payout setup' : 'Set up payouts'}</button>
            </form>
          ) : (
            <p className={styles.boundary}>Only the account owner can set up or change payout details.</p>
          )}
        </article>
      </section>
    </AppFrame>
  );
}
