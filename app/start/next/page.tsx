import Link from 'next/link';
import { getRuntimeConfiguration } from '@/lib/runtime-config';
import { UrgentNextClient } from './UrgentNextClient';
import styles from '../Start.module.css';

export const metadata = { title: 'Your next step | Passage' };

export default function StartNextPage() {
  const configuration = getRuntimeConfiguration();

  if (!configuration.available || !configuration.supabaseUrl || !configuration.supabasePublishableKey) {
    return (
      <div className={styles.shell}>
        <main className={styles.main} id="main-content">
          <p className={styles.eyebrow}>NOT AVAILABLE</p>
          <h1 className={styles.title}>This isn't available right now.</h1>
          <p className={styles.lede}>Passage cannot open the save and callback step right now. Your answers are still available in this browser. Nothing has been sent or saved.</p>
          <Link className={styles.recoveryLink} href="/start/people">Review your details</Link>
          <p className={styles.lede}>Try again when service is available. If this is an emergency, call 911 or your local emergency number.</p>
        </main>
      </div>
    );
  }

  return <UrgentNextClient publishableKey={configuration.supabasePublishableKey} supabaseUrl={configuration.supabaseUrl} />;
}
