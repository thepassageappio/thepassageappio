import Link from 'next/link';
import { StartNewRequestButton } from './StartNewRequestButton';
import styles from './Start.module.css';

export const metadata = { title: 'Someone needs help now' };

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
        <StartNewRequestButton />
        <p className={styles.lede} style={{ marginTop: 24, marginBottom: 0, fontSize: 14, color: '#6b6258' }}>
          Planning ahead for the future, not an urgent situation? That part of Passage is coming soon.
        </p>
      </main>
    </div>
  );
}
