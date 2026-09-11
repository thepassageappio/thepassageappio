import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const cli = process.env.LOCAL_SUPABASE_CLI;
assert.ok(cli, 'Set LOCAL_SUPABASE_CLI. This test only uses the fixed local database.');
execFileSync(cli, ['db', 'query', '--db-url',
  'postgresql://postgres:postgres@127.0.0.1:55322/postgres?sslmode=disable',
  '-f', 'supabase/tests/contact_replay.sql'],
{ encoding: 'utf8', stdio: 'pipe', env: { ...process.env, SUPABASE_TELEMETRY_DISABLED: '1' } });
console.log('PASS: local inquiry replay preserves reference and original fields; one inquiry, event and HubSpot outbox item; browser roles denied; rollback cleanup. No provider call.');
