import type { ReactNode } from 'react';
import Link from 'next/link';
import styles from './OperationsShell.module.css';

type AppFrameProps = {
  active: 'director' | 'intake' | 'staff' | 'receive';
  children: ReactNode;
  identity: string;
  role: string;
};

export function AppFrame({ active, children, identity, role }: AppFrameProps) {
  const initials = identity.split(' ').map((word) => word[0]).join('').slice(0, 2);
  const staffView = active === 'staff';

  return (
    <div className={styles.frame}>
      <a className={styles.skip} href="#workspace">Skip to workspace</a>
      <header className={styles.header}>
        <Link className={styles.brand} href={staffView ? '/staff' : '/director'} aria-label="Passage operations home">
          <span className={styles.brandGlyph} aria-hidden="true"><i /><i /><i /></span>
          <span>PASSAGE</span>
        </Link>
        <nav className={styles.nav} aria-label="Operations">
          {!staffView && <Link aria-current={active === 'director' ? 'page' : undefined} href="/director">Director</Link>}
          {!staffView && <Link aria-current={active === 'intake' ? 'page' : undefined} href="/director/intake">Intake</Link>}
          <Link aria-current={active === 'staff' ? 'page' : undefined} href="/staff">My work</Link>
          {!staffView && <Link aria-current={active === 'receive' ? 'page' : undefined} href="/receive">Receive</Link>}
        </nav>
        <div className={styles.identity}>
          <span><strong>{identity}</strong><small>{role}</small></span>
          <b aria-hidden="true">{initials}</b>
        </div>
      </header>
      <main id="workspace" className={styles.main}>{children}</main>
    </div>
  );
}
