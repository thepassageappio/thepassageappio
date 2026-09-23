import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import {
  INVITE_EXCHANGE_IDEMPOTENCY_COOKIE,
  INVITE_EXCHANGE_IDEMPOTENCY_COOKIE_PATH,
  normalizeInviteExchangeIdempotencyKey,
} from "@/lib/authority/invite-exchange-idempotency";

export async function proxy(request: NextRequest) {
  const needsInviteCookie = request.nextUrl.pathname.startsWith("/r/")
    && !normalizeInviteExchangeIdempotencyKey(request.cookies.get(INVITE_EXCHANGE_IDEMPOTENCY_COOKIE)?.value);
  const exchangeKey = needsInviteCookie ? crypto.randomUUID() : null;
  // Forward the new cookie on this request, so the first form render and POST agree.
  if (exchangeKey) request.cookies.set(INVITE_EXCHANGE_IDEMPOTENCY_COOKIE, exchangeKey);
  const response = await updateSession(request);
  if (exchangeKey) {
    // Clear legacy Path=/r cookie if present so Path=/ is the only value browsers send.
    response.cookies.set({
      name: INVITE_EXCHANGE_IDEMPOTENCY_COOKIE,
      value: "",
      httpOnly: true,
      secure: request.nextUrl.protocol === "https:",
      sameSite: "lax",
      path: "/r",
      maxAge: 0,
    });
    response.cookies.set({
      name: INVITE_EXCHANGE_IDEMPOTENCY_COOKIE,
      value: exchangeKey,
      httpOnly: true,
      secure: request.nextUrl.protocol === "https:",
      sameSite: "lax",
      path: INVITE_EXCHANGE_IDEMPOTENCY_COOKIE_PATH,
      maxAge: 60 * 60,
    });
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
