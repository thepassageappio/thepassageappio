import { resolveOperationalViewer } from '@/lib/auth/authorization';
import { ManualIntakeForm } from './ManualIntakeForm';
import styles from '../../proof-loop.module.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Previously a pure client-side sandbox (usePassageZero local demo state,
// zero backend calls) that a real signed-in director could mistake for
// creating a real case -- flagged as a Tier 1 trust risk in the 2026-08-17
// full UX audit. create_case_manual_idempotent already existed, built for
// exactly this page, but nothing ever called it. Now wired to the real RPC.
export default async function DirectorIntakePage() {
  const viewer = await resolveOperationalViewer();
  if (!viewer.ok) {
    return <main className={styles.closed} id="main-content"><h1>This isn&apos;t available to your account.</h1><p>Nothing changed.</p></main>;
  }

  return (
    <main id="main-content">
      <header className={styles.hero}>
        <div>
          <p>DIRECTOR / INTAKE</p>
          <h1>Open a case directly.</h1>
          <span>For a phone call, walk-in, pre-need arrangement, or any case that didn&apos;t come through an urgent request.</span>
        </div>
      </header>
      <section className={styles.panel}>
        <ManualIntakeForm locations={viewer.viewer.locations} />
      </section>
    </main>
  );
}
