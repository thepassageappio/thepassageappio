import Link from 'next/link';
import styles from '../../login/Auth.module.css';

export default function InvitationLinkFallback() {
  return (
    <main className={styles.shell} id="main-content">
      <header className={styles.brandBar}>
        <Link href="/" aria-label="Passage home">PASSAGE</Link>
      </header>
      <section className={styles.panel} aria-labelledby="invite-title">
        <p className={styles.eyebrow}>SECURE INVITATION</p>
        <h1 id="invite-title">We cannot open this invitation.</h1>
        <p className={styles.lede}>
          Check that you copied the complete secure link, or ask the person who invited you for a new one.
          Nothing was joined or changed.
        </p>
        <Link className={styles.primaryLink} href="/">Return to Passage</Link>
      </section>
    </main>
  );
}
