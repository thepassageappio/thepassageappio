import Link from 'next/link';
import { signOut } from '@/app/auth/actions';
import styles from './WorkspaceHeader.module.css';

type WorkspaceHeaderProps = {
  displayName: string;
  detail: string;
};

export function WorkspaceHeader({ displayName, detail }: WorkspaceHeaderProps) {
  return (
    <header className={styles.bar}>
      <Link className={styles.brand} href="/" aria-label="Passage home">
        <span className="signal-mark" aria-hidden="true"><i /><i /><i /></span>
        <strong>PASSAGE</strong>
      </Link>
      <details className={styles.menu}>
        <summary className={styles.trigger}>
          <span className={styles.name}>{displayName}</span>
          <span className={styles.chevron} aria-hidden="true" />
        </summary>
        <div className={styles.panel} role="menu">
          <p className={styles.detail}>{detail}</p>
          <form action={signOut}>
            <button className={styles.signOut} type="submit">Sign out</button>
          </form>
        </div>
      </details>
    </header>
  );
}
