import Link from "next/link";
import type { ReactNode } from "react";
import { signOutAction } from "@/app/account-actions";
import { roleLabel, type AuthorityAccessContext } from "@/lib/authority/access";
import { canCoordinateAuthorityRequests } from "@/lib/authority/role-capabilities";
import styles from "./app-shell.module.css";
import polish from "./workspace-polish.module.css";

export function AppShell({ access, children }: { access: AuthorityAccessContext; children: ReactNode }) {
  if (!access.membership || !access.organization) return null;
  const canCoordinate = canCoordinateAuthorityRequests(access.membership.role);
  const overviewLabel = access.membership.role === "reviewer" ? "Review queue" : "Overview";

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link className={styles.brand} href="/app">
          <span aria-hidden="true"><i /><i /></span>
          Passage Authority
        </Link>
        <div className={styles.organization}>
          <span>Organization</span>
          <strong>{access.organization.displayName}</strong>
          <small>{roleLabel(access.membership.role)}</small>
        </div>
        <nav className={polish.navigation} aria-label="Organization workspace">
          <Link href="/app">{overviewLabel}</Link>
          {canCoordinate ? <Link href="/app/requests/new">Start a request</Link> : null}
          <Link href="/app/team">People and access</Link>
          <Link href="/app/organization">Plan and billing</Link>
          <Link href="/app/policies">Authority policy</Link>
        </nav>
        <div className={styles.sidebarFooter}>
          <span>{access.user.email}</span>
          <form action={signOutAction}><button type="submit">Sign out</button></form>
        </div>
      </aside>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
