import type { ReactNode } from 'react';
import Link from 'next/link';
import { MobileNavDisclosure } from '@/components/core/MobileNavDisclosure';
import styles from './OperationsShell.module.css';

type AppFrameProps = {
  active: 'director' | 'team' | 'billing' | 'activity' | 'urgent' | 'intake' | 'staff' | 'receive' | 'partner' | 'payouts' | 'partner-team';
  children: ReactNode;
  identity: string;
  isPlatformAdmin?: boolean;
  mode?: 'demo' | 'verified';
  role: string;
};

export function AppFrame({ active, children, identity, isPlatformAdmin = false, mode = 'demo', role }: AppFrameProps) {
  const initials = identity.split(' ').map((word) => word[0]).join('').slice(0, 2);
  const staffView = active === 'staff';
  const partnerView = active === 'partner' || active === 'payouts' || active === 'partner-team';

  // Built once and rendered twice (inline desktop nav + mobile panel) so the
  // role/mode visibility rules -- e.g. staff only ever sees "My work" -- can't
  // drift between the two surfaces.
  const navLinks = (
    <>
      {!staffView && !partnerView && <Link aria-current={active === 'director' ? 'page' : undefined} href="/director">Today</Link>}
      {!staffView && !partnerView && mode === 'verified' && <Link aria-current={active === 'team' ? 'page' : undefined} href="/director/team">Team</Link>}
      {!staffView && !partnerView && mode === 'verified' && <Link aria-current={active === 'billing' ? 'page' : undefined} href="/director/billing">Billing</Link>}
      {!staffView && !partnerView && mode === 'verified' && <Link aria-current={active === 'activity' ? 'page' : undefined} href="/director/activity">Activity</Link>}
      {!staffView && !partnerView && mode === 'verified' && <Link aria-current={active === 'urgent' ? 'page' : undefined} href="/director/urgent">Urgent</Link>}
      {!staffView && !partnerView && <Link aria-current={active === 'intake' ? 'page' : undefined} href="/director/intake">Intake</Link>}
      {staffView && <Link aria-current="page" href="/staff">My work</Link>}
      {partnerView && <Link aria-current={active === 'partner' ? 'page' : undefined} href="/partner">Requests</Link>}
      {partnerView && <Link aria-current={active === 'payouts' ? 'page' : undefined} href="/partner/payouts">Payouts</Link>}
      {partnerView && <Link aria-current={active === 'partner-team' ? 'page' : undefined} href="/partner/team">Team</Link>}
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
          <span>
            <strong>{identity}</strong>
            <small>{role}</small>
            {/* Founder feedback 2026-08-20: an account with 2+ organizations had no
                persistent way to switch, only a one-time forced gate right after
                sign-in. This is the standard SaaS pattern -- always reachable, not
                just shown to accounts we already know are ambiguous, since a
                single-org viewer landing here is harmless (the page just shows
                their one workspace). Stacked into the existing text column rather
                than a new flex sibling so it doesn't squeeze an already-tight
                fixed-width header column. */}
            {!partnerView && <Link className={styles.switchWorkspace} href="/workspace/select">Switch workspace</Link>}
          </span>
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
