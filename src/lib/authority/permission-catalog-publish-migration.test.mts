import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  new URL("../../../supabase/migrations/20260915170000_permission_catalog_publish_save_for_new_requests.sql", import.meta.url),
  "utf8",
);

test("B1 publish RPCs are scoped per authority kind", () => {
  assert.match(migration, /get_published_permission_catalog_v1/i);
  assert.match(migration, /publish_permission_catalog_v1/i);
  assert.match(migration, /p_authority_type_key text/i);
  assert.match(migration, /authority_type_key = p_authority_type_key/i);
});

test("B1 hard-locks publish to financial_poa and pack_ready", () => {
  assert.match(migration, /p_authority_type_key <> 'financial_poa'/);
  assert.match(migration, /authority_type_publish_not_enabled/);
  assert.match(migration, /authority_type_not_pack_ready/);
  assert.match(migration, /pack_ready is not true/);
});

test("B1 publish requires owner\/admin AAL2 and does not rewrite prior pins", () => {
  assert.match(migration, /require_privileged_mfa_v1/);
  assert.match(migration, /array\['owner', 'admin'\]/);
  assert.match(migration, /stale_permission_published_version/);
  assert.match(migration, /Does not rewrite in-flight draft pins/i);
  assert.match(migration, /state = 'superseded'/);
});

test("B1 UI-facing comments never claim multi-state or buyer unlock", () => {
  assert.match(migration, /Save for new requests/);
  assert.match(migration, /What people may ask for/);
  assert.doesNotMatch(migration, /buyer configure/i);
  assert.doesNotMatch(migration, /multi-state unlock/i);
});
