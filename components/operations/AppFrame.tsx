import type { ReactNode } from 'react';
import Link from 'next/link';
import { MobileNavDisclosure } from '@/components/core/MobileNavDisclosure';
import styles from './OperationsShell.module.css';

type AppFrameProps = {
  active: 'director' | 'team' | 'activity' | 'urgent' | 'intake' | 'staff' | 'receive' | 'partner' | 'payouts';
  children: ReactNode;
  identity: string;
  isPlatformAdmin?: boolean;
  mode?: 'demo' | 'verified';
  role: string;
};

export function AppFrame({ active, children, identity, isPlatformAdmin = false, mode = 'demo', role }: AppFrameProps) {
  const initials = identity.split(' ').map((word) => word[0]).join('').slice(0, 2);
  const staffView = active === 'staff';
  const partnerView = active === 'partner' || active === 'payouts';

  // Built once and rendered twice (inline desktop nav + mobile panel) so the
  // role/mode visibility rules -- e.g. staff only ever sees "My work" -- can't
  // drift between the two surfaces.
  const navLinks = (
    <>
      {!staffView && !partnerView && <Link aria-current={active === 'director' ? 'page' : undefined} href="/director">Today</Link>}
      {!staffView && !partnerView && mode === 'verified' && <Link aria-current={active === 'team' ? 'page' : undefined} href="/director/team">Team</Link>}
      {!staffView && !partnerView && mode === 'verified' && <Link aria-current={active === 'activity' ? 'page' : undefined} href="/director/activity">Activity</Link>}
      {!staffView && !partnerView && mode === 'verified' && <Link aria-current={active === 'urgent' ? 'page' : undefined} href="/director/urgent">Urgent</Link>}
      {!staffView && !partnerView && mode === 'demo' && <Link aria-current={active === 'intake' ? 'page' : undefined} href="/director/intake">Intake</Link>}
      {staffView && <Link aria-current="page" href="/staff">My work</Link>}
      {partnerView && <Link aria-current={active === 'partner' ? 'page' : undefined} href="/partner">Requests</Link>}
      {partnerView && <Link aria-current={active === 'payouts' ? 'page' : undefined} href="/partner/payouts">Payouts</Link>}
      {!staffView && !partnerView && mode === 'demo' && <Link aria-current={active === 'receive' ? 'page' : undefined} href="/receive">Receive</Link>}
      {isPlatformAdmin && <Link href="/demo">Walkthrough</Link>}
    </>
  );

  return (
    <div className={styles.frame}>
      <a className={styles.skip} href="#workspace">Skip to workspace</a>
      <header className={styles.header}>
        <Link className={styles.brand} href={partnerView ? '/partner' : staffView ? '/staff' : '/director'} aria-label="Passage operations home">
          <span className={styles.brandGlyph} aria-hidden="true"><i /><i /><i /></span>
          <span>PASSAGE</span>
        </Link>
        <nav className={styles.nav} aria-label="Operations">{navLinks}</nav>
        <MobileNavDisclosure buttonClassName={styles.navToggle} label="Operations menu" panelClassName={styles.navPanel}>
          {navLinks}
          <form action="/auth/signout" className={styles.navPanelSignOut} method="post">
            <button type="submit">Sign out</button>
          </form>
        </MobileNavDisclosure>
        <div className={styles.identity}>
          <span><strong>{identity}</strong><small>{role}</small></span>
          <b aria-hidden="true">{initials}</b>
          {/* Plain HTML form POST, not a client dropdown - same auth-escape-hatch pattern used
              in OperationalBoundary/PartnerBoundary, so signing out doesn't depend on client JS. */}
          <form className={styles.signOut} action="/auth/signout" method="post">
            <button type="submit">Sign out</button>
          </form>
        </div>
      </header>
      <main id="workspace" className={styles.main}>{children}</main>
    </div>
  );
}
