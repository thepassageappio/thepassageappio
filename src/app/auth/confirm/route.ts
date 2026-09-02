import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { getAuthorityAppUrl, getSupabasePublicConfig, safeAppPath } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

const allowedTypes = new Set<EmailOtpType>(["email", "invite", "magiclink", "signup"]);

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const next = safeAppPath(url.searchParams.get("next"), "/onboarding/organization");
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const requestedType = url.searchParams.get("type") as EmailOtpType | null;

  if (!getSupabasePublicConfig()) {
    return NextResponse.redirect(new URL("/start?error=access_unavailable", getAuthorityAppUrl()));
  }

  const supabase = await createClient();
  let error: Error | null = null;

  if (code) {
    const result = await supabase.auth.exchangeCodeForSession(code);
    error = result.error;
  } else if (tokenHash && requestedType && allowedTypes.has(requestedType)) {
    const result = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: requestedType });
    error = result.error;
  } else {
    error = new Error("missing_confirmation");
  }

  if (error) {
    return NextResponse.redirect(new URL("/start?error=link_unavailable", getAuthorityAppUrl()));
  }

  return NextResponse.redirect(new URL(next, getAuthorityAppUrl()));
}
