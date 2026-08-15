import Link from 'next/link';
import styles from './Start.module.css';

export function StartWordmark() {
  return (
    <Link className={styles.wordmark} href="/" aria-label="Passage home">
      <span className={styles.wordmarkMark} aria-hidden="true"><i /><i /><i /></span>
      <strong>PASSAGE</strong>
    </Link>
  );
}
