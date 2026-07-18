import type { ReactNode } from 'react';
import Link from 'next/link';
import styles from './OperationsShell.module.css';

type AppFrameProps = {
  active: 'director' | 'team' | 'activity' | 'intake' | 'staff' | 'receive';
  children: ReactNode;
  identity: string;
  mode?: 'demo' | 'verified';
  role: string;
};

export function AppFrame({ active, children, identity, mode = 'demo', role }: AppFrameProps) {
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
          {!staffView && <Link aria-current={active === 'director' ? 'page' : undefined} href="/director">Today</Link>}
          {!staffView && mode === 'verified' && <Link aria-current={active === 'team' ? 'page' : undefined} href="/director/team">Team</Link>}
          {!staffView && mode === 'verified' && <Link aria-current={active === 'activity' ? 'page' : undefined} href="/director/activity">Activity</Link>}
          {!staffView && mode === 'demo' && <Link aria-current={active === 'intake' ? 'page' : undefined} href="/director/intake">Intake</Link>}
          {staffView && <Link aria-current="page" href="/staff">My work</Link>}
          {!staffView && mode === 'demo' && <Link aria-current={active === 'receive' ? 'page' : undefined} href="/receive">Receive</Link>}
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
