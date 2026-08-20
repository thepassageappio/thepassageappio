import Link from 'next/link';
import { TopShell } from '@/components/core';
import { loginPath } from '@/lib/auth/redirects';
import { addEstateSeat, loadBillingSummary, openBillingPortal, upgradePlanningPlan } from './actions';
import styles from '@/components/marketing/MarketingPage.module.css';

export const metadata = { title: 'Plan & billing' };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const BILLING_ERROR_MESSAGES: Record<string, string> = {
  unavailable: 'Billing is temporarily unavailable. Nothing changed. Try again in a moment.',
  denied: 'You need to be signed in to make that change. Nothing changed.',
  'no-subscription': 'That change needs an active recurring subscription. Nothing changed.',
  'invalid-plan': 'That is not an available upgrade for your current plan. Nothing changed.',
  'manage-existing': 'You already have a recurring plan. Change it here so Passage updates the same subscription instead of billing you twice.',
};

const PLAN_LABELS: Record<string, string> = {
  single_monthly: 'Individual · Monthly', single_annual: 'Individual · Annual', single_lifetime: 'Single Estate · One-time',
  couple_monthly: 'Couple · Monthly', couple_annual: 'Couple · Annual',
  family_monthly: 'Family · Monthly', family_annual: 'Family · Annual',
};

const UPGRADE_LABELS = { individual: 'Individual', couple: 'Couple', family: 'Family' } as const;

function formatAmount(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

function formatDate(value: string | null): string {
  return value ? new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(new Date(value)) : 'Not scheduled';
}

function readableStatus(value: string | null): string {
  if (!value) return 'No request yet';
  return value.replaceAll('_', ' ').replace(/^./, (letter) => letter.toUpperCase());
}

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ added?: string; error?: string; upgraded?: string }> }) {
  const [{ added, error, upgraded }, result] = await Promise.all([searchParams, loadBillingSummary()]);
  if (!result.ok) {
    return (
      <TopShell mode="gateway" context="Plan & billing">
        <main id="main-content" className={styles.page}>
          <section className={styles.hero}>
            <p className={styles.eyebrow}>Plan &amp; billing</p>
            <h1>{result.reason === 'signed-out' ? 'Sign in to manage your plan.' : 'We couldn’t load your plan details.'}</h1>
            <p className={styles.lede}>{result.reason === 'signed-out' ? 'Your planning and urgent options will appear together after you sign in.' : 'Nothing changed. Try again.'}</p>
          </section>
          {result.reason === 'signed-out' && <section className={styles.section}><Link className={styles.button} href={loginPath('/account/billing')}>Sign in</Link></section>}
        </main>
      </TopShell>
    );
  }

  const { planning, urgent } = result.data;
  const planningTitle = planning.mode === 'trial' ? 'Planning trial' : planning.mode === 'free' ? 'No paid planning plan' : PLAN_LABELS[planning.plan ?? ''] ?? 'Planning ahead';
  const recurring = planning.mode === 'recurring';

  return (
    <TopShell mode="gateway" context="Plan & billing">
      <main id="main-content" className={styles.page}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Your account</p>
          <h1>Manage your Passage plan.</h1>
          <p className={styles.lede}>Planning-ahead and urgent help are shown separately, so you can see exactly what renews, what was paid once, and what is free.</p>
        </section>

        {error && <div className={styles.checkoutAlert} role="alert"><strong>Nothing changed</strong>{BILLING_ERROR_MESSAGES[error] ?? BILLING_ERROR_MESSAGES.unavailable}</div>}
        {added === 'estate' && <div className={styles.card} role="status"><p className={styles.note}>Another estate was added to this subscription. The prorated charge and new capacity are now reflected below.</p></div>}
        {upgraded && <div className={styles.card} role="status"><p className={styles.note}>Your plan was upgraded to {UPGRADE_LABELS[upgraded as keyof typeof UPGRADE_LABELS] ?? 'the selected plan'}. The prorated charge and estate capacity are now reflected below.</p></div>}

        <section className={styles.section} aria-labelledby="planning-plan-title">
          <div className={styles.sectionHeading} id="planning">
            <h2 id="planning-plan-title">Planning ahead</h2>
            <p>Your green planning path, estate capacity, renewal, and payment controls.</p>
          </div>
          <div className={styles.card} style={{ borderColor: '#7ea88a' }}>
            <p className={styles.badge}>{readableStatus(planning.status)}</p>
            <h3 className={styles.planTitle}>{planningTitle}</h3>
            {recurring && <div className={styles.priceRow}><span>Current total</span><strong>{formatAmount(planning.amountCents)}<em>/{planning.interval}</em></strong></div>}
            {planning.mode === 'one-time' && <div className={styles.priceRow}><span>Paid once</span><strong>{formatAmount(planning.amountCents)}</strong></div>}
            {planning.mode === 'trial' && <div className={styles.priceRow}><span>Trial price</span><strong>$0</strong></div>}
            <p className={styles.note}>{planning.estateCount} estate{planning.estateCount === 1 ? '' : 's'} created · {planning.includedEstateSlots} allowed</p>
            {planning.addOnSeats > 0 && <p className={styles.note}>{planning.addOnSeats} additional estate add-on{planning.addOnSeats === 1 ? '' : 's'} included in the total.</p>}
            {recurring && <p className={styles.note}>{planning.cancelAtPeriodEnd ? `Access remains paid through ${formatDate(planning.renewalDate)}; cancellation is scheduled.` : `Renews ${formatDate(planning.renewalDate)}.`}</p>}
            {planning.mode === 'trial' && <p className={styles.note}>Free through {formatDate(planning.trialEndsAt)}. No card is attached and nothing renews automatically.</p>}
            {planning.mode === 'free' && <p className={styles.note}>There is no recurring planning charge or upcoming renewal on this account.</p>}
            {planning.mode === 'one-time' && <p className={styles.note}>This estate was paid once. It does not renew and there is no subscription to cancel.</p>}
          </div>

          {recurring && planning.upgradeOptions.length > 0 && (
            <div className={styles.card} style={{ marginTop: 16 }}>
              <h3 className={styles.h2Small}>Upgrade this subscription</h3>
              <p className={styles.note}>The current Stripe subscription is updated in place. The price difference is prorated now; you are not enrolled twice.</p>
              {planning.upgradeOptions.map((option) => (
                <form action={upgradePlanningPlan} key={option.plan} style={{ marginTop: 12 }}>
                  <input name="plan" type="hidden" value={option.plan} />
                  <button className={`${styles.buttonSecondary} ${styles.fullWidth}`} type="submit">Upgrade to {UPGRADE_LABELS[option.plan]} · {option.slots} estates · {formatAmount(option.amountCents)}/{planning.interval}</button>
                </form>
              ))}
            </div>
          )}

          {recurring && (
            <div className={styles.card} style={{ marginTop: 16 }}>
              <h3 className={styles.h2Small}>Add one estate</h3>
              <p className={styles.note}>Adds one estate without changing the base plan. Stripe prorates the change for the current billing period.</p>
              <form action={addEstateSeat}>
                <button className={`${styles.buttonSecondary} ${styles.fullWidth}`} type="submit">Add another estate{planning.addOnAmountCents !== null ? ` · ${formatAmount(planning.addOnAmountCents)}/${planning.interval}` : ''}</button>
              </form>
            </div>
          )}

          {recurring ? (
            <div className={styles.card} style={{ marginTop: 16 }}>
              <h3 className={styles.h2Small}>Payment, invoices, and cancellation</h3>
              <p className={styles.note}>Stripe securely handles payment methods, invoices, and cancellation. You return here afterward to see the updated state.</p>
              <form action={openBillingPortal}><button className={`${styles.buttonSecondary} ${styles.fullWidth}`} type="submit">Manage payment &amp; cancellation</button></form>
            </div>
          ) : (
            <div className={styles.card} style={{ marginTop: 16 }}>
              <p className={styles.note}>{planning.mode === 'one-time' ? 'Want ongoing planning for more people?' : 'Ready to keep planning after the free period?'}</p>
              <Link className={styles.buttonSecondary} href="/pricing#planning">Compare planning plans</Link>
            </div>
          )}
        </section>

        <section className={styles.section} aria-labelledby="urgent-plan-title">
          <div className={styles.sectionHeading} id="urgent"><h2 id="urgent-plan-title">Urgent help</h2><p>Your red urgent path and any one-time purchase. Urgent help never silently becomes a recurring subscription.</p></div>
          <div className={`${styles.card} ${styles.urgentCard}`}>
            <p className={`${styles.badge} ${styles.badgeDanger}`}>{urgent.mode === 'one-time' ? 'Paid once' : 'Free urgent access'}</p>
            <h3 className={styles.planTitle}>{urgent.mode === 'one-time' ? 'Urgent · One-time' : 'Immediate-help requests'}</h3>
            {urgent.mode === 'one-time' && <div className={styles.priceRow}><span>Paid once</span><strong>{formatAmount(urgent.amountCents)}</strong></div>}
            <p className={styles.note}>{urgent.requestCount} urgent request{urgent.requestCount === 1 ? '' : 's'} saved on this account.</p>
            <p className={styles.note}>Latest request: {readableStatus(urgent.latestRequestStatus)}.</p>
            <p className={styles.note}>{urgent.mode === 'one-time' ? 'This purchase does not renew and there is no subscription to cancel.' : 'Free immediate help has no charge, card, renewal, or cancellation.'}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 16 }}>
              <Link className={`${styles.button} ${styles.buttonDanger}`} href="/start">Get help now</Link>
              {urgent.mode === 'free' && <Link className={styles.buttonSecondary} href="/pricing#urgent">See one-time urgent support</Link>}
            </div>
          </div>
        </section>

        <footer className={styles.footer}>
          <p><Link href="/case">← Back to your estates</Link> · Questions about a charge? <Link href="/contact?category=billing">Contact Passage</Link>.</p>
          <form action="/auth/signout" method="post" style={{ marginTop: 8 }}><button style={{ background: 'none', border: 'none', padding: 0, color: 'inherit', textDecoration: 'underline', cursor: 'pointer', font: 'inherit' }} type="submit">Sign out</button></form>
        </footer>
      </main>
    </TopShell>
  );
}
