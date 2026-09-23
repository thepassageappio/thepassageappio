/** Browser-bound idempotency for one-time invite exchange (same tab remount / double-submit). */
export const INVITE_EXCHANGE_IDEMPOTENCY_COOKIE = "pa_invite_exchange_id";

/** Broad path so Server Action POSTs always receive the cookie (not only /r/* navigations). */
export const INVITE_EXCHANGE_IDEMPOTENCY_COOKIE_PATH = "/";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function normalizeInviteExchangeIdempotencyKey(value: string | undefined | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return UUID_RE.test(trimmed) ? trimmed.toLowerCase() : null;
}

/** Prefer browser cookie over form field so remounted UUIDs still replay the same exchange. */
export function resolveInviteExchangeIdempotencyKey(input: {
  cookieValue?: string | null;
  formValue?: string | null;
}): string | null {
  return normalizeInviteExchangeIdempotencyKey(input.cookieValue)
    ?? normalizeInviteExchangeIdempotencyKey(input.formValue);
}
