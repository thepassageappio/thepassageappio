import assert from "node:assert/strict";
import test from "node:test";
import { baselineResponseHeaders, buildContentSecurityPolicy, privateResponseHeaders, securityHeaderRoutes } from "./response-security.ts";

function headerMap(headers: ReadonlyArray<{ key: string; value: string }>) {
  return new Map(headers.map(({ key, value }) => [key.toLowerCase(), value]));
}

test("baseline responses deny framing, MIME sniffing, and sensitive browser capabilities", () => {
  const headers = headerMap(baselineResponseHeaders);
  assert.equal(headers.get("x-frame-options"), "DENY");
  assert.equal(headers.get("x-content-type-options"), "nosniff");
  assert.equal(headers.get("referrer-policy"), "no-referrer");
  assert.match(headers.get("permissions-policy") ?? "", /camera=\(\)/);
  assert.match(headers.get("strict-transport-security") ?? "", /includeSubDomains/);
});
test("private responses cannot be indexed or stored", () => {
  const headers = headerMap(privateResponseHeaders);
  assert.equal(headers.get("x-robots-tag"), "noindex, nofollow, noarchive");
  assert.equal(headers.get("cache-control"), "private, no-store, max-age=0");
  assert.equal(headers.get("pragma"), "no-cache");
  assert.equal(headers.get("expires"), "0");
});

function directivesOf(policy: string) {
  return new Map(policy.split(";").map((part) => part.trim().split(/\s+/)).map(([name, ...sources]) => [name, sources]));
}

test("next.config uses the shared security header routes", async () => {
  const { readFile } = await import("node:fs/promises");
  const config = await readFile(new URL("../../../next.config.ts", import.meta.url), "utf8");
  assert.match(config, /securityHeaderRoutes\(process\.env\)/);
});

test("every route gets baseline headers plus a report-only CSP, and private routes stay private", () => {
  const env = { NODE_ENV: "production", NEXT_PUBLIC_SUPABASE_URL: "https://bklrclpertdtmhycpqlz.supabase.co" };
  const routes = securityHeaderRoutes(env);
  const catchAll = routes.find((route) => route.source === "/:path*");
  assert.ok(catchAll);
  const headers = headerMap(catchAll.headers);
  assert.equal(headers.get("strict-transport-security"), "max-age=31536000; includeSubDomains");
  assert.equal(headers.get("x-content-type-options"), "nosniff");
  assert.equal(headers.get("x-frame-options"), "DENY");
  assert.equal(headers.get("referrer-policy"), "no-referrer");
  assert.equal(headers.get("permissions-policy"), "camera=(), microphone=(), geolocation=()");
  assert.ok(headers.get("content-security-policy-report-only"));
  assert.equal(headers.has("content-security-policy"), false, "CSP must stay report-only until reviewed");
  for (const source of ["/app/:path*", "/api/:path*", "/r/:path*", "/workspace/:path*"]) {
    const route = routes.find((candidate) => candidate.source === source);
    assert.ok(route, source);
    assert.equal(headerMap(route.headers).get("cache-control"), "private, no-store, max-age=0");
  }
});

test("the report-only CSP allows only what the app uses", () => {
  const policy = buildContentSecurityPolicy({ NODE_ENV: "production", NEXT_PUBLIC_SUPABASE_URL: "https://bklrclpertdtmhycpqlz.supabase.co/" });
  const directives = directivesOf(policy);
  assert.deepEqual(directives.get("default-src"), ["'self'"]);
  assert.deepEqual(directives.get("frame-ancestors"), ["'none'"]);
  assert.deepEqual(directives.get("object-src"), ["'none'"]);
  assert.deepEqual(directives.get("script-src"), ["'self'", "'unsafe-inline'"]);
  assert.deepEqual(directives.get("connect-src"), ["'self'", "https://*.supabase.co", "https://bklrclpertdtmhycpqlz.supabase.co"]);
  assert.ok(directives.get("img-src")?.includes("data:"), "MFA QR codes are data: images");
  assert.doesNotMatch(policy, /unsafe-eval|\bws:|\*(?!\.supabase\.co)/);
});

test("the CSP adds dev-only allowances and a custom Supabase origin when configured", () => {
  const dev = directivesOf(buildContentSecurityPolicy({ NODE_ENV: "development", NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321" }));
  assert.ok(dev.get("script-src")?.includes("'unsafe-eval'"));
  assert.ok(dev.get("connect-src")?.includes("http://127.0.0.1:54321"));
  assert.ok(dev.get("connect-src")?.includes("ws:"));
  const unset = directivesOf(buildContentSecurityPolicy({ NODE_ENV: "production" }));
  assert.deepEqual(unset.get("connect-src"), ["'self'", "https://*.supabase.co"]);
  const bad = directivesOf(buildContentSecurityPolicy({ NODE_ENV: "production", NEXT_PUBLIC_SUPABASE_URL: "javascript:alert(1)" }));
  assert.deepEqual(bad.get("connect-src"), ["'self'", "https://*.supabase.co"]);
});
