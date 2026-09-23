import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Regression lock: App Router <Link> soft-navigates to /app/evidence/[id],
 * which returns Content-Disposition: attachment (not RSC). That can wedge the
 * client router / server-action queue so the first "Accept for this review"
 * after a successful download appears to no-op until reload.
 * Use a plain same-origin <a download> so the browser downloads without soft-nav.
 */
test("Open authorized source uses plain anchor download, not App Router Link", () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const src = readFileSync(
    join(here, "../../app/app/requests/[id]/HostedAuthorityRequestLower.tsx"),
    "utf8",
  );
  assert.match(
    src,
    /<a href=\{`\/app\/evidence\/\$\{encodeURIComponent\(String\(artifact\.id\)\)\}`\} download>Open authorized source<\/a>/,
  );
  assert.equal(src.includes("<Link href={`/app/evidence/"), false);
});
