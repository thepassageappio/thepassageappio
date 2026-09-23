import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  new URL("../../../supabase/migrations/20260923102000_exchange_reissue_idempotency_fix.sql", import.meta.url),
  "utf8",
);

test("exchange reissue fix supersedes stale command receipt when invitation is pending again", () => {
  assert.match(migration, /create or replace function authority_private\.exchange_participant_invitation_v1/i);
  assert.match(migration, /v_invitation\.status = 'pending'/);
  assert.match(
    migration,
    /delete from authority_private\.participant_command_receipts[\s\S]*idempotency_key = p_idempotency_key/i,
  );
  assert.match(migration, /participant_session_unavailable/);
});

test("exchange reissue fix scopes payload hash to invitation generation and access purpose", () => {
  assert.match(migration, /'invitation_version', v_invitation\.version/);
  assert.match(migration, /'access_purpose', v_access_purpose/);
  assert.match(migration, /'receipt', v_is_receipt/);
});

test("exchange reissue fix keeps true active-session replay", () => {
  assert.match(migration, /'replayed', true, 'session_token', v_session_token/);
  assert.match(migration, /status = 'active' and expires_at > now\(\)/);
});
