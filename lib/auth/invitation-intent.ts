import 'server-only';

import { cookies } from 'next/headers';
import { validInvitationToken } from '@/lib/auth/invitations';
import { INVITATION_INTENT_COOKIE } from './invitation-intent-cookie';

export async function readInvitationIntent() {
  const value = (await cookies()).get(INVITATION_INTENT_COOKIE)?.value ?? '';
  return validInvitationToken(value) ? value : null;
}
