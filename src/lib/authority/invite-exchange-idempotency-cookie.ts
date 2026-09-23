import { cookies } from "next/headers";
import {
  INVITE_EXCHANGE_BOUND_TOKEN_COOKIE,
  INVITE_EXCHANGE_IDEMPOTENCY_COOKIE,
  INVITE_EXCHANGE_IDEMPOTENCY_COOKIE_PATH,
  normalizeInviteExchangeBoundToken,
  normalizeInviteExchangeIdempotencyKey,
} from "@/lib/authority/invite-exchange-idempotency";

/** Read browser-bound exchange idempotency key (set by proxy on /r/*). Server-only. */
export async function readInviteExchangeIdempotencyKey(): Promise<string | null> {
  const cookieStore = await cookies();
  return normalizeInviteExchangeIdempotencyKey(
    cookieStore.get(INVITE_EXCHANGE_IDEMPOTENCY_COOKIE)?.value,
  );
}

/** Read which invite token the exchange key is bound to. Server-only. */
export async function readInviteExchangeBoundToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return normalizeInviteExchangeBoundToken(
    cookieStore.get(INVITE_EXCHANGE_BOUND_TOKEN_COOKIE)?.value,
  );
}

/** Persist exchange key + token binding for remount / double-submit replay. Server Action / Route only. */
export async function writeInviteExchangeIdempotencyKey(
  key: string,
  options: { secure: boolean; maxAgeSeconds?: number; boundToken?: string | null },
): Promise<void> {
  const normalized = normalizeInviteExchangeIdempotencyKey(key);
  if (!normalized) return;
  const cookieStore = await cookies();
  const maxAge = options.maxAgeSeconds ?? 60 * 60;
  cookieStore.set(INVITE_EXCHANGE_IDEMPOTENCY_COOKIE, normalized, {
    httpOnly: true,
    secure: options.secure,
    sameSite: "lax",
    path: INVITE_EXCHANGE_IDEMPOTENCY_COOKIE_PATH,
    maxAge,
  });
  const bound = normalizeInviteExchangeBoundToken(options.boundToken);
  if (bound) {
    cookieStore.set(INVITE_EXCHANGE_BOUND_TOKEN_COOKIE, bound, {
      httpOnly: true,
      secure: options.secure,
      sameSite: "lax",
      path: INVITE_EXCHANGE_IDEMPOTENCY_COOKIE_PATH,
      maxAge,
    });
  }
}
