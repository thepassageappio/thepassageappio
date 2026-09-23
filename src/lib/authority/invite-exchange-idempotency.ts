/** Browser-bound idempotency for one-time invite exchange (same tab remount / double-submit). */
export const INVITE_EXCHANGE_IDEMPOTENCY_COOKIE = "pa_invite_exchange_id";

/** Companion cookie: which /r/{token} the exchange id is bound to. */
export const INVITE_EXCHANGE_BOUND_TOKEN_COOKIE = "pa_invite_exchange_for";

/** Broad path so Server Action POSTs always receive the cookie (not only /r/* navigations). */
export const INVITE_EXCHANGE_IDEMPOTENCY_COOKIE_PATH = "/";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const INVITE_TOKEN_RE = /^[0-9a-f]{64}$/i;

export function normalizeInviteExchangeIdempotencyKey(value: string | undefined | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return UUID_RE.test(trimmed) ? trimmed.toLowerCase() : null;
}

export function normalizeInviteExchangeBoundToken(value: string | undefined | null): string | null {
  if (!value) return null;
  const trimmed = value.trim().toLowerCase();
  return INVITE_TOKEN_RE.test(trimmed) ? trimmed : null;
}

/**
 * Reuse the browser exchange key only when it is bound to the current invite token.
 * Decision → receipt reissue keeps the same invitation_id but a new token; reusing the
 * unbound/global key collides with the prior command receipt and surfaces session_unavailable.
 */
export function shouldReuseInviteExchangeIdempotencyKey(input: {
  inviteToken?: string | null;
  boundToken?: string | null;
}): boolean {
  const token = normalizeInviteExchangeBoundToken(input.inviteToken);
  const bound = normalizeInviteExchangeBoundToken(input.boundToken);
  if (!token) return false;
  return Boolean(bound && bound === token);
}

/** Prefer browser cookie over form field so remounted UUIDs still replay the same exchange. */
export function resolveInviteExchangeIdempotencyKey(input: {
  cookieValue?: string | null;
  formValue?: string | null;
  inviteToken?: string | null;
  boundToken?: string | null;
}): string | null {
  const cookieKey = normalizeInviteExchangeIdempotencyKey(input.cookieValue);
  const formKey = normalizeInviteExchangeIdempotencyKey(input.formValue);
  if (cookieKey && shouldReuseInviteExchangeIdempotencyKey({
    inviteToken: input.inviteToken,
    boundToken: input.boundToken,
  })) {
    return cookieKey;
  }
  // Token changed (or unbound legacy cookie): do not reuse cookie across invite generations.
  if (input.inviteToken !== undefined || input.boundToken !== undefined) {
    return formKey;
  }
  // Legacy callers without token binding keep prior prefer-cookie behavior.
  return cookieKey ?? formKey;
}

/**
 * Domain model for exchange idempotency replay after reissue (mirrors RPC).
 * command receipt + active session → replay; receipt + pending invite → fresh; else fail.
 */
export function decideInviteExchangeReplay(input: {
  commandReceiptFound: boolean;
  activeSessionFound: boolean;
  invitationStatus: string;
}): "proceed" | "replay" | "fresh_after_reissue" | "session_unavailable" {
  if (!input.commandReceiptFound) return "proceed";
  if (input.activeSessionFound) return "replay";
  if (input.invitationStatus === "pending") return "fresh_after_reissue";
  return "session_unavailable";
}
