import type { RuntimeConfiguration } from '@/lib/runtime-config';

export const OPERATIONAL_PATHNAME_HEADER = 'x-passage-operational-pathname';
export const DIRECTOR_INVITATION_PATH = '/director/invitations/new';
const ISOLATED_PREVIEW_PROJECT_REF = 'uyacxqtsiwlvtmhxvoxr';
const VERIFIED_OPERATIONAL_PATHS = new Set(['/director', '/director/team', '/director/activity', DIRECTOR_INVITATION_PATH, '/staff']);
// Case-room and work-detail routes carry a dynamic id segment, so an exact-match
// Set can never cover them. Match those two shapes by pattern instead.
const VERIFIED_OPERATIONAL_PATTERNS = [/^\/director\/cases\/[^/]+$/, /^\/staff\/work\/[^/]+$/];

function isVerifiedOperationalPathname(pathname: string): boolean {
  return VERIFIED_OPERATIONAL_PATHS.has(pathname) || VERIFIED_OPERATIONAL_PATTERNS.some((pattern) => pattern.test(pathname));
}

export function isolatedPreviewInvitationEnabled(configuration: Pick<RuntimeConfiguration, 'available' | 'runtime' | 'projectRef' | 'passwordAuthEnabled'>) {
  return configuration.available
    && configuration.runtime === 'preview'
    && configuration.projectRef === ISOLATED_PREVIEW_PROJECT_REF
    && configuration.passwordAuthEnabled;
}

export function canRenderVerifiedOperationalChild(
  pathname: string | null,
  configuration: Pick<RuntimeConfiguration, 'available' | 'runtime' | 'projectRef' | 'passwordAuthEnabled'>,
) {
  return pathname !== null
    && isVerifiedOperationalPathname(pathname)
    && isolatedPreviewInvitationEnabled(configuration);
}

export function operationalRecoveryPath(pathname: string | null, fallback: '/director' | '/director/intake' | '/staff') {
  return pathname !== null && isVerifiedOperationalPathname(pathname) ? pathname : fallback;
}
