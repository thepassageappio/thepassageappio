import Link from 'next/link';
import { redirect } from 'next/navigation';
import { verifiedUser } from '@/lib/auth/session';
import { loginPath } from '@/lib/auth/redirects';
import { createPassageServerClient } from '@/lib/supabase/server';
import { StartFamilyRecordForm } from './StartFamilyRecordForm';
import styles from '../../login/Auth.module.css';

export const metadata = { title: 'Start your family record' };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Fallback entry point -- the normal path is fully automatic at checkout
// (provisionD2cFamilyRecordIfNeeded). This exists for a signed-in,
// actively-subscribed account that somehow doesn't have a record yet.
export default async function CaseStartPage() {
  const client = await createPassageServerClient();
  const user = client ? await verifiedUser(client) : null;
  if (!user) {
    return (
      <main className={styles.shell} id="main-content">
        <header className={styles.brandBar}><Link href="/">PASSAGE</Link></header>
        <section className={styles.panel} aria-labelledby="signup-title">
          <p className={styles.eyebrow}>FAMILY RECORD</p>
          <h1 id="signup-title">Sign in first to start your family record.</h1>
          <Link className={styles.primary} href={loginPath('/case/start')} style={{ display: 'inline-flex' }}>Sign in or create an account</Link>
        </section>
      </main>
    );
  }

  const existingWorkflow = client ? await client.from('workflows').select('id').eq('user_id', user.id).limit(1).maybeSingle() : null;
  if (existingWorkflow?.data) redirect(`/case/${(existingWorkflow.data as { id: string }).id}/today`);

  // Founder decision 2026-08-20: the D2C "green" planning-ahead path gets a
  // 7-day free trial from account creation, matching the B2B org trial
  // pattern -- self_serve_create_family_record enforces the same window
  // server-side (passage_private.d2c_trial_status), this is just the
  // matching page-level gate so a trial user doesn't see a false paywall.
  const trialStatus = client ? (await client.rpc('d2c_trial_status')) : null;
  const trial = trialStatus && !trialStatus.error ? (Array.isArray(trialStatus.data) ? trialStatus.data[0] : trialStatus.data) as { is_gated: boolean; is_paid: boolean } | undefined : undefined;
  if (!trial || trial.is_gated) {
    return (
      <main className={styles.shell} id="main-content">
        <header className={styles.brandBar}><Link href="/">PASSAGE</Link></header>
        <section className={styles.panel}>
          <p className={styles.eyebrow}>PLAN REQUIRED</p>
          <h1>Your free trial has ended.</h1>
          <p className={styles.lede}>Choose a plan to keep going, or start a new free 7-day trial by creating a fresh account.</p>
          <Link className={styles.primary} href="/pricing" style={{ display: 'inline-flex' }}>View plans</Link>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.shell} id="main-content">
      <header className={styles.brandBar}><Link href="/">PASSAGE</Link></header>
      <section className={styles.panel} aria-labelledby="signup-title">
        <p className={styles.eyebrow}>FAMILY RECORD</p>
        <h1 id="signup-title">Start your family record.</h1>
        <p className={styles.lede}>This is where you&apos;ll track tasks, invite family members, and coordinate everything in one place. Free for your first 7 days &mdash; no card required to start.</p>
        <StartFamilyRecordForm />
      </section>
    </main>
  );
}
