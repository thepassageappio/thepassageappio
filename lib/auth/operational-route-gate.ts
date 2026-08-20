import type { RuntimeConfiguration } from '@/lib/runtime-config';

export const OPERATIONAL_PATHNAME_HEADER = 'x-passage-operational-pathname';
export const DIRECTOR_INVITATION_PATH = '/director/invitations/new';
const ISOLATED_PREVIEW_PROJECT_REF = 'uyacxqtsiwlvtmhxvoxr';
const VERIFIED_OPERATIONAL_PATHS = new Set(['/director', '/director/intake', '/director/team', '/director/activity', '/director/urgent', DIRECTOR_INVITATION_PATH, '/staff']);
// Case-room, work-detail, and urgent-request-detail routes carry a dynamic id
// segment, so an exact-match Set can never cover them. Match those shapes by
// pattern instead.
const VERIFIED_OPERATIONAL_PATTERNS = [/^\/director\/cases\/[^/]+$/, /^\/staff\/work\/[^/]+$/, /^\/director\/urgent\/[^/]+$/];

function isVerifiedOperationalPathname(pathname: string): boolean {
  return VERIFIED_OPERATIONAL_PATHS.has(pathname) || VERIFIED_OPERATIONAL_PATTERNS.some((pattern) => pattern.test(pathname));
}

export function isolatedPreviewInvitationEnabled(configuration: Pick<RuntimeConfiguration, 'available' | 'runtime' | 'projectRef' | 'passwordAuthEnabled'>) {
  return configuration.available
    && configuration.runtime === 'preview'
    && configuration.projectRef === ISOLATED_PREVIEW_PROJECT_REF
    && configuration.passwordAuthEnabled;
}

// Staff invitation creation was built and QA'd only against the disposable
// preview sandbox above, then never extended to real production -- every
// owner/director hit "We couldn't confirm your team access" in production,
// permanently. The RPC (create_employee_invitation_idempotent_v2), its RLS,
// and the accept-invite flow at /invite/[token] have no preview-only
// dependency, so production is enabled here directly rather than by loosening
// the preview check.
export function staffInvitationEnabled(configuration: Pick<RuntimeConfiguration, 'available' | 'runtime' | 'projectRef' | 'passwordAuthEnabled'>) {
  return isolatedPreviewInvitationEnabled(configuration) || (configuration.available && configuration.runtime === 'production');
}

// CRITICAL FIX 2026-08-20: this previously required isolatedPreviewInvitationEnabled
// (true only in the isolated preview environment) for EVERY operational
// path, not just the invitation page it was actually meant for --
// app/director/invitations/new/page.tsx already has its own independent
// isolatedPreviewInvitationEnabled check (defense in depth for that one
// preview-only feature), proving the restriction was only ever meant to
// scope to that page. Because runtime is 'production' in production,
// isolatedPreviewInvitationEnabled is always false there, so this gate
// silently replaced every real director/staff page (dashboard, Case Room,
// work detail, team, activity, urgent) with the generic OperationalBoundary
// fallback ("SECURE PREVIEW · You're signed in.") for every real user,
// site-wide, the entire time this app has been in production. Found via
// live testing during item 8's browser-level denial matrix -- a real,
// authorized test session got the same placeholder on every route,
// regardless of whether the page or the case/task it pointed to existed.
export function canRenderVerifiedOperationalChild(
  pathname: string | null,
  configuration: Pick<RuntimeConfiguration, 'available' | 'runtime' | 'projectRef' | 'passwordAuthEnabled'>,
) {
  if (pathname === null || !isVerifiedOperationalPathname(pathname)) return false;
  if (pathname === DIRECTOR_INVITATION_PATH) return staffInvitationEnabled(configuration);
  return true;
}

export function operationalRecoveryPath(pathname: string | null, fallback: '/director' | '/director/intake' | '/staff') {
  return pathname !== null && isVerifiedOperationalPathname(pathname) ? pathname : fallback;
}
