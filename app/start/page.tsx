import Link from 'next/link';
import styles from './Start.module.css';

export const metadata = { title: 'Someone needs help now | Passage' };

export default function StartPage() {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link className={styles.wordmark} href="/">PASSAGE</Link>
      </header>
      <main className={styles.main} id="main-content">
        <p className={styles.eyebrow}>START HERE</p>
        <h1 className={styles.title}>What do you need right now?</h1>
        <p className={styles.lede}>Answer a few short questions. We will give you one clear next step and, if you want, have someone call you back.</p>
        <Link className={styles.primaryButton} href="/start/situation" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
          Someone needs help now
        </Link>
        <p className={styles.lede} style={{ marginTop: 24, marginBottom: 0, fontSize: 13.5, color: '#6b6258' }}>
          Planning ahead for the future, not an urgent situation? That part of Passage is coming soon.
        </p>
      </main>
    </div>
  );
}
