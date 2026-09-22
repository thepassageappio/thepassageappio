import { NextResponse, type NextRequest } from "next/server";
import {
  INVITE_EXCHANGE_IDEMPOTENCY_COOKIE,
  normalizeInviteExchangeIdempotencyKey,
} from "@/lib/authority/invite-exchange-idempotency";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  if (!request.nextUrl.pathname.startsWith("/r/")) return response;

  const existing = normalizeInviteExchangeIdempotencyKey(
    request.cookies.get(INVITE_EXCHANGE_IDEMPOTENCY_COOKIE)?.value,
  );
  if (existing) return response;

  const next = crypto.randomUUID();
  response.cookies.set({
    name: INVITE_EXCHANGE_IDEMPOTENCY_COOKIE,
    value: next,
    httpOnly: true,
    secure: request.nextUrl.protocol === "https:",
    sameSite: "lax",
    path: "/r",
    maxAge: 60 * 60,
  });
  return response;
}

export const config = {
  matcher: ["/r/:path*"],
};
