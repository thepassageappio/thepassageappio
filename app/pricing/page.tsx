import Link from 'next/link';
import { TopShell } from '@/components/core';
import { startB2bCheckout, startCheckout, startOneTimeEstateCheckout, startUrgentOneTimeCheckout } from './actions';
import styles from '@/components/marketing/MarketingPage.module.css';

const groups = [
  { key: 'individual', label: 'Individual', seats: '1 estate', desc: 'For one person or one loved one.', monthly: '$9.99', annual: '$79.99' },
  { key: 'couple', label: 'Couple', seats: '2 estates', desc: 'For partners, spouses, or two parents.', monthly: '$14.99', annual: '$119.99' },
  { key: 'family', label: 'Family', seats: '5 estates', desc: 'For families coordinating care across several loved ones.', monthly: '$24.99', annual: '$199.99' },
];

const b2bGroups = [
  { key: 'funeral_home_pilot', label: 'Pilot', locations: '1 location', desc: 'Try Passage at one location before committing to the full rate. Free for your first 90 days as a new organization, then billed monthly.', monthly: '$99' },
  { key: 'funeral_home_local', label: 'Local', locations: '1 location', desc: 'For a single-location funeral home ready to run on Passage.', monthly: '$249.99' },
  { key: 'funeral_home_multi_location', label: 'Multiple Locations', locations: '2+ locations', desc: 'For a funeral home group operating across several locations.', monthly: '$349.99' },
];

const readiness = [
  ['After checkout', 'Passage opens the right record or dashboard so next step, owner, and proof stay together.'],
  ['Nothing sends yet', 'Invites, packets, emails, and texts stay in review until someone chooses the exact action.'],
  ['Start small', 'Begin with one family record. Add people, documents, and provider handoffs when they matter.'],
];

export const metadata = { title: 'Pricing' };

const checkoutFailureMessages: Record<string, string> = {
  invalid: 'That plan selection was invalid. Nothing was charged — pick a plan below and try again.',
  unavailable: 'Checkout is temporarily unavailable. Nothing was charged. Please try again in a moment.',
  cancelled: 'Checkout was cancelled. Nothing was charged.',
};

export default async function PricingPage({ searchParams }: { searchParams: Promise<{ checkout?: string }> }) {
  const { checkout } = await searchParams;
  const checkoutMessage = checkout ? (checkoutFailureMessages[checkout] ?? checkoutFailureMessages.unavailable) : null;
  return (
    <TopShell mode="gateway" context="Pricing">
      <main id="main-content" className={styles.page}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Pricing</p>
          <h1>Choose the plan that protects your family.</h1>
          <p className={styles.lede}>Start urgent if someone just passed. Plan ahead by choosing the number of family records you need.</p>
          {checkoutMessage && <div className={styles.checkoutAlert} role="alert"><strong>{checkout === 'cancelled' ? 'Checkout cancelled' : 'Checkout didn’t go through'}</strong>{checkoutMessage}</div>}
        </section>

        <section className={styles.section}>
          <div className={`${styles.card} ${styles.urgentCard}`}>
            <p className={`${styles.badge} ${styles.badgeDanger}`}>Someone just passed</p>
            <h2 className={styles.h2Small}>Get help now.</h2>
            <p className={styles.note} style={{ marginBottom: 16, maxWidth: 560 }}>A first-24-hours family record for calls, family notifications, owners, and proof. Includes a remembrance tree dedication and contributes to the 10% Passage family pledge.</p>
            <Link className={`${styles.button} ${styles.buttonDanger}`} href="/start">Get help now</Link>
          </div>

          <div className={styles.card} style={{ marginTop: 12 }}>
            <p className={styles.note}>
              Need dedicated urgent support without a recurring plan? A one-time Urgent record is also available. This is separate from <Link href="/start">free immediate help</Link>, which is always available.
            </p>
            <form action={startUrgentOneTimeCheckout}>
              <button className={`${styles.buttonSecondary} ${styles.fullWidth}`} type="submit">Buy Urgent record — $79.99 one-time</button>
            </form>
          </div>

          <div className={styles.sectionHeading}>
            <h2>Planning ahead</h2>
            <p>Begin with one family record and add estates as your family needs them.</p>
          </div>
          <div className={`${styles.grid} ${styles.grid3}`}>
            {groups.map((group) => (
              <div className={`${styles.card} ${styles.planCard}`} key={group.key}>
                <p className={styles.badge}>{group.seats}</p>
                <h3 className={styles.planTitle}>{group.label}</h3>
                <p className={styles.planDesc}>{group.desc}</p>
                <div className={styles.priceRow}><span>Monthly</span><strong>{group.monthly}<em>/mo</em></strong></div>
                <form action={startCheckout}>
                  <input type="hidden" name="plan" value={group.key} />
                  <input type="hidden" name="period" value="monthly" />
                  <button className={`${styles.buttonSecondary} ${styles.fullWidth}`} type="submit">Subscribe monthly</button>
                </form>
                <div className={styles.priceRow}><span>Annual</span><strong>{group.annual}<em>/yr</em></strong></div>
                <form action={startCheckout}>
                  <input type="hidden" name="plan" value={group.key} />
                  <input type="hidden" name="period" value="annual" />
                  <button className={`${styles.buttonSecondary} ${styles.fullWidth}`} type="submit">Subscribe annually</button>
                </form>
                <Link className={styles.note} href={`/contact?category=pricing&plan=${group.key}`} style={{ display: 'block', textAlign: 'center', marginTop: 8 }}>or talk to us first</Link>
              </div>
            ))}
          </div>

          <div className={styles.card} style={{ marginTop: 20 }}>
            <p className={styles.note}>
              Prefer to pay once? A Single Estate record is also available as a one-time purchase, no subscription required.
            </p>
            <form action={startOneTimeEstateCheckout}>
              <button className={`${styles.buttonSecondary} ${styles.fullWidth}`} type="submit">Buy Single Estate — $299.99 one-time</button>
            </form>
          </div>

          <div className={styles.card} style={{ marginTop: 20 }}>
            <p className={styles.note}>
              Participants invited to a family&apos;s Passage record receive a reduced participant rate (25% off monthly plans, 20% off annual plans). Add-on estates become available after an active paid subscription. Passage directs 10% of proceeds to grief and family-support work; each paid urgent family record also funds a remembrance tree dedication.
            </p>
          </div>

          <div className={`${styles.grid} ${styles.grid3}`} style={{ marginTop: 20 }}>
            {readiness.map(([label, body]) => (
              <div className={styles.readinessCard} key={label}>
                <p className={styles.badge}>{label}</p>
                <p style={{ margin: 0, fontSize: 13 }}>{body}</p>
              </div>
            ))}
          </div>

          <div className={styles.sectionHeading} style={{ marginTop: 32 }}>
            <h2>For funeral homes</h2>
            <p>Bring your team, locations, and cases onto Passage. Self-serve setup, cancel anytime.</p>
          </div>
          <div className={`${styles.grid} ${styles.grid3}`}>
            {b2bGroups.map((group) => (
              <div className={`${styles.card} ${styles.planCard}`} key={group.key}>
                <p className={styles.badge}>{group.locations}</p>
                <h3 className={styles.planTitle}>{group.label}</h3>
                <p className={styles.planDesc}>{group.desc}</p>
                <div className={styles.priceRow}><span>Monthly</span><strong>{group.monthly}<em>/mo</em></strong></div>
                <form action={startB2bCheckout}>
                  <input type="hidden" name="plan" value={group.key} />
                  <button className={`${styles.buttonSecondary} ${styles.fullWidth}`} type="submit">Subscribe</button>
                </form>
                <Link className={styles.note} href={`/contact?category=funeral-home&plan=${group.key}`} style={{ display: 'block', textAlign: 'center', marginTop: 8 }}>or talk to us first</Link>
              </div>
            ))}
          </div>
        </section>

        <footer className={styles.footer}>
          <p>Questions about pricing? <Link href="/contact">Contact Passage</Link>.</p>
        </footer>
      </main>
    </TopShell>
  );
}
