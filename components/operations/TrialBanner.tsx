import Link from 'next/link';
import styles from '@/app/operations-beta.module.css';

// organization_trial_status has existed since the self-serve trial gating
// migration, but nothing ever rendered it -- a director signing up had zero
// visibility into their own trial status until this component.
export function TrialBanner({ isGated, isPaid, trialEndsAt }: { isGated: boolean; isPaid: boolean; trialEndsAt: string | null }) {
  if (isPaid) return null;

  if (isGated) {
    return (
      <div className={`${styles.trialBanner} ${styles.trialBannerGated}`} role="status">
        <span><strong>Your 90-day trial has ended.</strong> New cases and vendor requests are paused until you upgrade.</span>
        <Link href="/pricing">Upgrade now</Link>
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
