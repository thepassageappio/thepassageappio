import type { RuntimeConfiguration } from '@/lib/runtime-config';

export const OPERATIONAL_PATHNAME_HEADER = 'x-passage-operational-pathname';
export const DIRECTOR_INVITATION_PATH = '/director/invitations/new';
const ISOLATED_PREVIEW_PROJECT_REF = 'uyacxqtsiwlvtmhxvoxr';

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
  return pathname === DIRECTOR_INVITATION_PATH && isolatedPreviewInvitationEnabled(configuration);
}

export function operationalRecoveryPath(pathname: string | null, fallback: '/director' | '/director/intake' | '/staff') {
  return pathname === DIRECTOR_INVITATION_PATH ? DIRECTOR_INVITATION_PATH : fallback;
}
