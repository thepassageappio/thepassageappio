import assert from "node:assert/strict";
import test from "node:test";
import { baselineResponseHeaders, privateResponseHeaders } from "./response-security.ts";

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
