"use server";

import { cookies } from "next/headers";
import {
  INVITE_EXCHANGE_IDEMPOTENCY_COOKIE,
  normalizeInviteExchangeIdempotencyKey,
} from "@/lib/authority/invite-exchange-idempotency";

/** Read browser-bound exchange idempotency key (set by middleware on /r/*). */
export async function readInviteExchangeIdempotencyKey(): Promise<string | null> {
  const cookieStore = await cookies();
  return normalizeInviteExchangeIdempotencyKey(
    cookieStore.get(INVITE_EXCHANGE_IDEMPOTENCY_COOKIE)?.value,
  );
}
