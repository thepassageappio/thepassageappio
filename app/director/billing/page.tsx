import Link from 'next/link';
import { AppFrame } from '@/components/operations/AppFrame';
import { humanizePreviewIdentity, humanizePreviewLabel } from '@/lib/presentation/plain-language';
import { resolveOperationalViewer } from '@/lib/auth/authorization';
import { addLocationSeat, loadDirectorBillingSummary, openDirectorBillingPortal } from './actions';
import styles from '../../operations-beta.module.css';

export const metadata = { title: 'Billing · Passage' };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ERROR_MESSAGES: Record<string, string> = {
  denied: 'You need owner or director access to change billing. Nothing changed.',
  'no-subscription': 'An active paid subscription is required before a location can be added. Nothing changed.',
  'not-needed': 'Your Multiple Locations plan already includes additional locations. Nothing changed.',
  unavailable: 'Billing is temporarily unavailable. Nothing changed. Try again in a moment.',
};

function formatAmount(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

function readableStatus(status: string) {
  return status.replaceAll('_', ' ').replace(/^./, (letter) => letter.toUpperCase());
}

export default async function DirectorBillingPage({ searchParams }: { searchParams: Promise<{ added?: string; error?: string }> }) {
  const [{ added, error }, viewerResult, summary] = await Promise.all([
    searchParams,
    resolveOperationalViewer(),
    loadDirectorBillingSummary(),
  ]);
  if (!viewerResult.ok || !['owner', 'director'].includes(viewerResult.viewer.role) || !summary.ok) {
    return <main className={styles.closed}><p>DIRECTOR / BILLING</p><h1>We couldn&apos;t verify billing access.</h1><span>Nothing changed. Return to your workspace and try again.</span><Link href="/director">Back to Today</Link></main>;
  }

  const viewer = viewerResult.viewer;
  const billing = summary.data;
  const hasPaidSubscription = billing.amountCents > 0;

  return (
    <AppFrame active="billing" identity={humanizePreviewIdentity(viewer.displayName, viewer.role)} mode="verified" role={`Director · ${humanizePreviewLabel(viewer.organizationName)}`}>
      <header className={styles.pageHeading}>
        <div><p>DIRECTOR / BILLING</p><h1>Your organization&apos;s plan and billing.</h1><span>See what is active, add a location, or open Stripe to manage payment details and cancellation.</span></div>
      </header>

      {error && <div className={styles.commandError} role="alert"><strong>Nothing changed</strong><p>{ERROR_MESSAGES[error] ?? ERROR_MESSAGES.unavailable}</p></div>}
      {added === 'location' && <div className={styles.commandReceipt} role="status"><strong>Location added to your plan</strong><p>Your organization can now create one more location. Stripe will include the prorated amount on your billing.</p></div>}

      <section className={styles.workList} aria-labelledby="plan-title">
        <div className={styles.sectionHeading}><div><p>PLAN</p><h2 id="plan-title">Current subscription.</h2></div><span>{readableStatus(billing.status)}</span></div>
        <article className={styles.teamCard}>
          <div>
            <p>{readableStatus(billing.status)}</p>
            <h3>{billing.plan}</h3>
            <dl className={styles.facts}>
              <div><dt>Organization</dt><dd>{billing.organizationName}</dd></div>
              <div><dt>Current amount</dt><dd>{hasPaidSubscription ? `${formatAmount(billing.amountCents)} / month` : 'No paid subscription'}</dd></div>
              <div><dt>Renewal</dt><dd>{billing.renewalDate ? new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(new Date(billing.renewalDate)) : 'Not scheduled'}</dd></div>
              <div><dt>Locations</dt><dd>{billing.locationCount} created · {billing.includedLocationSlots} allowed</dd></div>
            </dl>
          </div>
          <div className={styles.compactForm}>
            {hasPaidSubscription ? <><strong>Payment and cancellation</strong><p className={styles.formBoundary}>Update your payment method, view invoices, or cancel securely in Stripe.</p><form action={openDirectorBillingPortal}><button type="submit">Manage billing</button></form></> : <><strong>No paid billing is attached yet.</strong><p className={styles.formBoundary}>Your current trial or free access remains visible here. Contact Passage before purchasing if this organization already exists, so a duplicate workspace is not created.</p><Link className={styles.primaryLink} href="/contact?category=funeral-home">Contact Passage</Link></>}
          </div>
        </article>
      </section>

      <section className={styles.workList} aria-labelledby="locations-title">
        <div className={styles.sectionHeading}><div><p>LOCATIONS</p><h2 id="locations-title">Add capacity when you need it.</h2></div><span>{billing.additionalLocations} add-on{billing.additionalLocations === 1 ? '' : 's'}</span></div>
        <article className={styles.teamCard}>
          <div><p>AD-HOC ADD-ON</p><h3>Add a location · $49/month</h3><p className={styles.formBoundary}>Adds one location to this organization&apos;s existing subscription. Stripe prorates the change for the current billing period.</p></div>
          <div className={styles.compactForm}>
            {billing.canAddLocation ? <form action={addLocationSeat}><button type="submit">Add a location — $49/month</button></form> : <><strong>{hasPaidSubscription ? 'No add-on is needed for this plan.' : 'A paid subscription is required first.'}</strong><p className={styles.formBoundary}>{hasPaidSubscription ? 'Your current plan already covers additional locations.' : 'Contact Passage to attach billing to this existing organization.'}</p></>}
          </div>
        </article>
      </section>

      <footer style={{ marginTop: 32 }}><p><Link href="/director/team">← Back to Team</Link> · Questions about billing? <Link href="/contact">Contact Passage</Link>.</p></footer>
    </AppFrame>
  );
}
