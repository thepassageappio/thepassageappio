import { cookies } from "next/headers";
import {
  INVITE_EXCHANGE_IDEMPOTENCY_COOKIE,
  INVITE_EXCHANGE_IDEMPOTENCY_COOKIE_PATH,
  normalizeInviteExchangeIdempotencyKey,
} from "@/lib/authority/invite-exchange-idempotency";

/** Read browser-bound exchange idempotency key (set by proxy on /r/*). Server-only. */
export async function readInviteExchangeIdempotencyKey(): Promise<string | null> {
  const cookieStore = await cookies();
  return normalizeInviteExchangeIdempotencyKey(
    cookieStore.get(INVITE_EXCHANGE_IDEMPOTENCY_COOKIE)?.value,
  );
}

/** Persist exchange key for remount / double-submit replay. Server Action / Route only. */
export async function writeInviteExchangeIdempotencyKey(
  key: string,
  options: { secure: boolean; maxAgeSeconds?: number },
): Promise<void> {
  const normalized = normalizeInviteExchangeIdempotencyKey(key);
  if (!normalized) return;
  const cookieStore = await cookies();
  cookieStore.set(INVITE_EXCHANGE_IDEMPOTENCY_COOKIE, normalized, {
    httpOnly: true,
    secure: options.secure,
    sameSite: "lax",
    path: INVITE_EXCHANGE_IDEMPOTENCY_COOKIE_PATH,
    maxAge: options.maxAgeSeconds ?? 60 * 60,
  });
}
