export const INVITATION_INTENT_COOKIE = 'passage_invitation_intent';
export const INVITATION_CONTINUE_PATH = '/invite/continue';

export function invitationIntentCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    maxAge: 30 * 60,
    path: '/',
    sameSite: 'lax' as const,
    secure,
  };
}
