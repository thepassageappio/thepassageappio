import Link from 'next/link';
import styles from '@/app/operations-beta.module.css';

// organization_trial_status has existed since the self-serve trial gating
// migration, but nothing ever rendered it -- a director signing up had zero
// visibility into their own trial status until this component. The
// 'estate' context reuses the same component for D2C's d2c_trial_status
// (20260820030000_d2c_self_serve_trial_gating.sql) -- founder decision
// 2026-08-20: D2C mirrors B2B's "never lock out" model (an estate created
// inside the 7-day trial window stays free permanently), so the gated
// copy below is honest about nothing being paused, unlike B2B's.
export function TrialBanner({ context = 'organization', isGated, isPaid, trialEndsAt }: { context?: 'organization' | 'estate'; isGated: boolean; isPaid: boolean; trialEndsAt: string | null }) {
  if (isPaid) return null;

  if (isGated) {
    return (
      <div className={`${styles.trialBanner} ${styles.trialBannerGated}`} role="status">
        <span>
          {context === 'estate'
            ? <><strong>Your 7-day trial has ended.</strong> This estate stays free to use. Upgrade to add more estates or support Passage.</>
            : <><strong>Your 90-day trial has ended.</strong> New cases and vendor requests are paused until you upgrade.</>}
        </span>
        <Link href={context === 'estate' ? '/account/billing' : '/director/billing'}>{context === 'estate' ? 'Manage plan' : 'Upgrade now'}</Link>
      </div>
    );
  }

  const daysLeft = trialEndsAt ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86_400_000)) : null;
  return (
    <div className={styles.trialBanner} role="status">
      <span>{daysLeft !== null ? `${daysLeft} day${daysLeft === 1 ? '' : 's'} left in your free trial.` : 'You are on a free trial.'}</span>
      <Link href="/pricing">See plans</Link>
    </div>
  );
}
