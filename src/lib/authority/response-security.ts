export const baselineResponseHeaders = [
  // Stricter than strict-origin-when-cross-origin on purpose: invite and request links carry tokens in the path.
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
] as const;
export const privateResponseHeaders = [
  ...baselineResponseHeaders,
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
  { key: "Cache-Control", value: "private, no-store, max-age=0" },
  { key: "Pragma", value: "no-cache" },
  { key: "Expires", value: "0" },
] as const;

export const privateRoutePatterns = [
  "/app",
  "/app/:path*",
  "/auth/:path*",
  "/onboarding/:path*",
  "/start",
  "/start/:path*",
  "/team/:path*",
  "/request/:path*",
  "/r/:path*",
  "/api/:path*",
  "/institution",
  "/institution/:path*",
  "/developer",
  "/developer/:path*",
  "/workspace/:path*",
] as const;

type SecurityEnv = Record<string, string | undefined>;

function originOf(value: string | undefined) {
  try {
    const url = new URL(value?.trim() ?? "");
    return url.protocol === "https:" || url.protocol === "http:" ? url.origin : null;
  } catch {
    return null;
  }
}

// Report-only for now: browsers log violations to the console and block nothing.
// Sources come from a grep of the app (2026-09-29): no third-party scripts, fonts,
// analytics, or frames. Next.js App Router emits inline bootstrap scripts without a
// nonce, so script-src needs 'unsafe-inline' until nonces are added. React style
// props need style-src 'unsafe-inline'. Supabase MFA QR codes are data: SVG images.
// Browser Supabase calls (auth, and direct-to-storage uploads) go to the project URL.
// Server actions may redirect to Supabase OAuth (then Google) and Stripe invoices.
export function buildContentSecurityPolicy(env: SecurityEnv = process.env) {
  const development = env.NODE_ENV === "development";
  const supabaseOrigin = originOf(env.NEXT_PUBLIC_SUPABASE_URL);
  // The app does not use Supabase Realtime, so no wss: source is needed.
  const supabaseSources = ["https://*.supabase.co", ...(supabaseOrigin ? [supabaseOrigin] : [])];
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "base-uri": ["'self'"],
    "object-src": ["'none'"],
    "frame-ancestors": ["'none'"],
    "frame-src": ["'none'"],
    "script-src": ["'self'", "'unsafe-inline'", ...(development ? ["'unsafe-eval'"] : [])],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:"],
    "font-src": ["'self'", "data:"],
    "connect-src": ["'self'", ...supabaseSources, ...(development ? ["ws:"] : [])],
    "worker-src": ["'self'", "blob:"],
    "manifest-src": ["'self'"],
    "form-action": ["'self'", "https://*.supabase.co", ...(supabaseOrigin ? [supabaseOrigin] : []), "https://accounts.google.com", "https://invoice.stripe.com", "https://checkout.stripe.com"],
  };
  return Object.entries(directives)
    .map(([name, sources]) => `${name} ${[...new Set(sources)].join(" ")}`)
    .join("; ");
}

export function contentSecurityPolicyReportOnlyHeader(env: SecurityEnv = process.env) {
  return { key: "Content-Security-Policy-Report-Only", value: buildContentSecurityPolicy(env) } as const;
}

// The full next.config headers() list. Kept here so tests can check the real config.
export function securityHeaderRoutes(env: SecurityEnv = process.env) {
  return [
    { source: "/:path*", headers: [...baselineResponseHeaders, contentSecurityPolicyReportOnlyHeader(env)] },
    ...privateRoutePatterns.map((source) => ({ source, headers: [...privateResponseHeaders] })),
  ];
}
