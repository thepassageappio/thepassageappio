import type { ReactNode } from 'react';
import Link from 'next/link';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { canOpenOperationalPath, landingPathForRole, resolveOperationalViewer } from '@/lib/auth/authorization';
import { canRenderVerifiedOperationalChild, DIRECTOR_INVITATION_PATH, isolatedPreviewInvitationEnabled, operationalRecoveryPath, OPERATIONAL_PATHNAME_HEADER } from '@/lib/auth/operational-route-gate';
import { loginPath } from '@/lib/auth/redirects';
import { getRuntimeConfiguration, publicRuntimeLabel } from '@/lib/runtime-config';
import styles from './OperationalBoundary.module.css';

// Plain HTML form POST to a route handler, not a Server Action - this must
// keep working as an auth escape hatch even if client-side JS/fetch is flaky.
const SIGNOUT_ACTION = '/auth/signout';

function SignOutButton() {
  return <form action={SIGNOUT_ACTION} method="post"><button type="submit">Sign out</button></form>;
}

type OperationalBoundaryProps = {
  children: ReactNode;
  requestedPath: '/director' | '/director/intake' | '/staff';
  requiredWorkspace: '/director' | '/staff';
};

const reasonCopy = {
  'environment-unavailable': 'Secure workspace access is not configured for this environment.',
  'signed-out': 'Sign in before opening a funeral-home workspace.',
  'membership-required': 'This account does not have an active funeral-home membership.',
  'membership-revoked': 'Your team access has ended. No funeral-home work is visible.',
  'membership-selection-required': 'This account belongs to more than one organization. Workspace selection must be completed before any operator data can be shown.',
  'authority-unavailable': 'Passage could not verify an active role and location for this account. Operator data remains closed.',
} as const;

export async function OperationalBoundary({ children, requestedPath, requiredWorkspace }: OperationalBoundaryProps) {
  const configuration = getRuntimeConfiguration();
  const pathname = (await headers()).get(OPERATIONAL_PATHNAME_HEADER);
  const recoveryPath = operationalRecoveryPath(pathname, requestedPath);
  const result = await resolveOperationalViewer();
  if (!result.ok && result.reason === 'signed-out') redirect(loginPath(recoveryPath));

  if (!result.ok) {
    const isSelectionRequired = result.reason === 'membership-selection-required';
    return (
      <AccessSurface
        title={isSelectionRequired ? 'Choose a workspace' : 'Workspace access remains closed'}
        message={reasonCopy[result.reason]}
        runtime={publicRuntimeLabel(configuration.runtime)}
        recoveryHref={isSelectionRequired ? '/workspace/select' : undefined}
        recoveryLabel={isSelectionRequired ? 'Choose a workspace' : undefined}
      />
    );
  }

  const { viewer } = result;
  if (!canOpenOperationalPath(viewer.role, requiredWorkspace)) {
    const correctPath = landingPathForRole(viewer.role);
    return <AccessSurface title="This workspace is outside your role" message={viewer.role === 'staff' ? 'Your funeral-home employee membership opens My work, not the director workspace.' : 'Your director membership opens the director workspace, not an employee’s assigned queue.'} runtime={publicRuntimeLabel(configuration.runtime)} recoveryHref={correctPath} recoveryLabel={correctPath === '/staff' ? 'Open My work' : 'Open director workspace'} />;
  }

  if (configuration.runtime === 'demo' && pathname !== DIRECTOR_INVITATION_PATH) {
    return <div className={styles.demoBoundary}><div className={styles.demoNotice} role="status"><span>SECURE PREVIEW · CHANGES ARE SAVED</span><p>You’re signed in as {viewer.displayName}. This workspace uses sample information, and no real messages are sent.</p><SignOutButton /></div>{children}</div>;
  }

  if (canRenderVerifiedOperationalChild(pathname, configuration)) return children;

  return (
    <main className={styles.shell} id="main-content">
      <section className={styles.ready} aria-labelledby="workspace-ready-title">
        <p className={styles.eyebrow}>SECURE PREVIEW</p>
        <h1 id="workspace-ready-title">You’re signed in.</h1>
        <p>You can manage team access, but no cases are assigned to this account yet.</p>
        <dl>
          <div><dt>Account</dt><dd>{viewer.displayName}<small>{viewer.email}</small></dd></div>
          <div><dt>Organization</dt><dd>{viewer.organizationName}</dd></div>
          <div><dt>Role</dt><dd>{viewer.role}</dd></div>
          <div><dt>Authorized locations</dt><dd>{viewer.locations.map((location) => location.name).join(' · ')}</dd></div>
          <div><dt>Assigned work</dt><dd>No cases assigned yet</dd></div>
        </dl>
        <div className={styles.recovery}>
          {isolatedPreviewInvitationEnabled(configuration) && viewer.role !== 'staff' && <Link href={DIRECTOR_INVITATION_PATH}>Create a controlled staff invitation</Link>}
          <SignOutButton />
        </div>
      </section>
    </main>
  );
}

function AccessSurface({ title, message, runtime, recoveryHref, recoveryLabel }: { title: string; message: string; runtime: string; recoveryHref?: string; recoveryLabel?: string }) {
  return (
    <main className={styles.shell} id="main-content">
      <section className={styles.denied} aria-labelledby="access-title">
        {runtime && <p className={styles.eyebrow}>{runtime}</p>}<h1 id="access-title">{title}</h1><p>{message}</p>
        <div className={styles.recovery}>
          {/* Plain <a> tags, not next/link Link: these are auth escape hatches and must not depend on
              client-side RSC navigation succeeding (see QA sweep PR #50, bug 1). */}
          {recoveryHref && recoveryLabel && <a href={recoveryHref}>{recoveryLabel}</a>}
          <a href="/login">Return to sign in</a>
          <SignOutButton />
        </div>
      </section>
    </main>
  );
}
