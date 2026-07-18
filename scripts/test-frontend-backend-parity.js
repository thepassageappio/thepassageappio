#!/usr/bin/env node
'use strict';

/**
 * Test harness for scripts/check-frontend-backend-parity.js.
 *
 * Two kinds of coverage:
 *   1. Fixture unit tests -- a passing fixture and several deliberately
 *      failing fixtures, each isolating one checker rule, run against a
 *      hermetic temp "repo" so file-existence checks are self-contained.
 *   2. An integration check against the real ledger at
 *      docs/product/frontend-backend-contracts.json, which must pass.
 *
 * Exits 0 only if every fixture behaves as expected AND the real ledger
 * passes. This is what `pnpm test:parity` runs.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

const { checkLedger } = require('./check-frontend-backend-parity');

let passCount = 0;
let failCount = 0;

function report(name, ok, detail) {
  if (ok) {
    passCount += 1;
    console.log(`  ok  - ${name}`);
  } else {
    failCount += 1;
    console.error(`  FAIL - ${name}`);
    if (detail) console.error(`         ${detail}`);
  }
}

function makeTempRepo(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'parity-fixture-'));
  for (const [relPath, contents] of Object.entries(files)) {
    const full = path.join(dir, relPath);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, contents);
  }
  return dir;
}

// ---------------------------------------------------------------------
// Shared fixture building blocks
// ---------------------------------------------------------------------

const FIXTURE_FILES = {
  'docs/fixture/component.tsx': '// fixture component\n',
  'docs/fixture/migration.sql': '-- fixture migration\n',
  'docs/fixture/evidence.md': '# fixture evidence\n',
};

function baseImplementedContract(overrides = {}) {
  return Object.assign(
    {
      id: 'fixture.implemented.one',
      cycle: 'TEST',
      capability: 'Fixture implemented capability',
      status: 'implemented',
      persona: 'director',
      frontend: {
        user_visible: true,
        route: '/fixture',
        component: 'docs/fixture/component.tsx',
        files: ['docs/fixture/component.tsx'],
        note: 'fixture note',
      },
      action_status: 'active',
      server_command: 'public.fixture_command()',
      backend_files: ['docs/fixture/migration.sql'],
      durable_tables: [{ table: 'fixture_table', cardinality: 'one row per fixture' }],
      rls_authority_predicate: 'fixture predicate',
      append_only_event: {
        applicable: true,
        table: 'fixture_events',
        event_type: 'fixture.created',
        idempotency_key: 'fixture:1',
      },
      failure_recovery_states: ['fixture-not-found'],
      persona_projection: 'director only',
      evidence_test_references: ['docs/fixture/evidence.md'],
    },
    overrides
  );
}

function baseBackendOnlyContract(overrides = {}) {
  return Object.assign(
    {
      id: 'fixture.backend_only.one',
      cycle: 'TEST',
      capability: 'Fixture backend-only capability',
      status: 'backend_only',
      persona: 'director',
      frontend: { user_visible: false, route: null, component: null, note: 'no UI yet' },
      action_status: 'active',
      server_command: 'public.fixture_backend_command()',
      backend_files: ['docs/fixture/migration.sql'],
      durable_tables: [{ table: 'fixture_table', cardinality: 'one row per fixture' }],
      rls_authority_predicate: 'fixture predicate',
      append_only_event: {
        applicable: true,
        table: 'fixture_events',
        event_type: 'fixture.attempted',
        idempotency_key: 'fixture:2',
      },
      failure_recovery_states: ['fixture-denied'],
      persona_projection: 'director only',
      evidence_test_references: ['docs/fixture/evidence.md'],
    },
    overrides
  );
}

function baseQueuedContract(overrides = {}) {
  return Object.assign(
    {
      id: 'fixture.queued.one',
      cycle: 'TEST-NEXT',
      capability: 'Fixture queued capability',
      status: 'queued',
      persona: 'staff',
      frontend: { user_visible: false, route: null, component: null, note: 'planned' },
      action_status: 'planned',
      server_command: 'public.fixture_future_command() (planned)',
      backend_files: [],
      durable_tables: [{ table: 'fixture_future_table', cardinality: 'planned' }],
      rls_authority_predicate: 'planned predicate',
      append_only_event: { applicable: true, table: 'fixture_events', event_type: 'fixture.planned', idempotency_key: null, reason: 'not built yet' },
      failure_recovery_states: ['not-yet-built'],
      persona_projection: 'staff only (planned)',
      evidence_test_references: ['docs/fixture/evidence.md'],
    },
    overrides
  );
}

// ---------------------------------------------------------------------
// 1. Passing fixture
// ---------------------------------------------------------------------

function testPassingFixture(repoRoot) {
  const ledger = {
    contracts: [baseImplementedContract(), baseBackendOnlyContract(), baseQueuedContract()],
  };
  const { ok, errors } = checkLedger(ledger, repoRoot);
  report('passing fixture: well-formed ledger passes', ok === true, ok ? '' : errors.join('; '));
}

// ---------------------------------------------------------------------
// 2. Deliberately failing fixtures -- one per rule
// ---------------------------------------------------------------------

function testMissingRequiredField(repoRoot) {
  const bad = baseImplementedContract();
  delete bad.rls_authority_predicate;
  const { ok, errors } = checkLedger({ contracts: [bad] }, repoRoot);
  const expected = errors.some((e) => e.includes('missing required field "rls_authority_predicate"'));
  report(
    'failing fixture: missing required field is rejected',
    ok === false && expected,
    `ok=${ok} errors=${JSON.stringify(errors)}`
  );
}

function testDuplicateIds(repoRoot) {
  const one = baseImplementedContract({ id: 'fixture.duplicate' });
  const two = baseBackendOnlyContract({ id: 'fixture.duplicate' });
  const { ok, errors } = checkLedger({ contracts: [one, two] }, repoRoot);
  const expected = errors.some((e) => e.startsWith('Duplicate contract id "fixture.duplicate"'));
  report('failing fixture: duplicate contract ids are rejected', ok === false && expected, `ok=${ok} errors=${JSON.stringify(errors)}`);
}

function testMissingReferencedFile(repoRoot) {
  const bad = baseImplementedContract({
    backend_files: ['docs/fixture/does-not-exist.sql'],
  });
  const { ok, errors } = checkLedger({ contracts: [bad] }, repoRoot);
  const expected = errors.some((e) => e.includes('does not exist in the repository: "docs/fixture/does-not-exist.sql"'));
  report(
    'failing fixture: implemented contract referencing a missing file is rejected',
    ok === false && expected,
    `ok=${ok} errors=${JSON.stringify(errors)}`
  );
}

function testQueuedClaimsUI(repoRoot) {
  const bad = baseQueuedContract({
    frontend: {
      user_visible: true,
      route: '/fixture-future',
      component: 'docs/fixture/component.tsx',
      files: ['docs/fixture/component.tsx'],
      note: 'should not be allowed for a queued contract',
    },
  });
  const { ok, errors } = checkLedger({ contracts: [bad] }, repoRoot);
  const expected = errors.some((e) => e.includes('must not claim a reachable UI'));
  report(
    'failing fixture: queued contract claiming a reachable UI is rejected',
    ok === false && expected,
    `ok=${ok} errors=${JSON.stringify(errors)}`
  );
}

function testBackendOnlyMarkedUserVisibleWithoutRoute(repoRoot) {
  // The core "reject backend-only capability marked user-visible without
  // route/component" rule: user_visible=true but no route/component.
  const bad = baseBackendOnlyContract({
    frontend: {
      user_visible: true,
      route: null,
      component: null,
      note: 'claims visible but has no route/component',
    },
  });
  const { ok, errors } = checkLedger({ contracts: [bad] }, repoRoot);
  const expectedRouteError = errors.some((e) => e.includes('lacks a route/component') || e.includes('frontend.route" and/or "frontend.component" is missing'));
  const expectedStatusError = errors.some((e) => e.includes('status "backend_only" must not claim frontend.user_visible'));
  report(
    'failing fixture: backend-only capability marked user_visible without route/component is rejected',
    ok === false && (expectedRouteError || expectedStatusError),
    `ok=${ok} errors=${JSON.stringify(errors)}`
  );
}

function testUserVisibleWithoutFiles(repoRoot) {
  const bad = baseImplementedContract();
  delete bad.frontend.files;
  const { ok, errors } = checkLedger({ contracts: [bad] }, repoRoot);
  const expected = errors.some((e) => e.includes('requires a non-empty "frontend.files" array'));
  report('failing fixture: user_visible=true without frontend.files is rejected', ok === false && expected, `ok=${ok} errors=${JSON.stringify(errors)}`);
}

function testInvalidStatus(repoRoot) {
  const bad = baseImplementedContract({ status: 'shipped' });
  const { ok, errors } = checkLedger({ contracts: [bad] }, repoRoot);
  const expected = errors.some((e) => e.includes('"status" must be one of'));
  report('failing fixture: invalid status enum value is rejected', ok === false && expected, `ok=${ok} errors=${JSON.stringify(errors)}`);
}

function testEmptyContractsArray(repoRoot) {
  const { ok, errors } = checkLedger({ contracts: [] }, repoRoot);
  const expected = errors.some((e) => e.includes('non-empty "contracts" array'));
  report('failing fixture: empty contracts array is rejected', ok === false && expected, `ok=${ok} errors=${JSON.stringify(errors)}`);
}

// ---------------------------------------------------------------------
// 3. Integration check against the real ledger
// ---------------------------------------------------------------------

function testRealLedger() {
  const repoRoot = path.resolve(__dirname, '..');
  const ledgerPath = path.join(repoRoot, 'docs', 'product', 'frontend-backend-contracts.json');
  let ledger;
  try {
    ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
  } catch (err) {
    report('integration: real ledger is valid JSON and readable', false, err.message);
    return;
  }
  const { ok, errors } = checkLedger(ledger, repoRoot);
  report('integration: docs/product/frontend-backend-contracts.json passes the checker', ok === true, ok ? '' : errors.join('\n         '));
}

function testRealPendingInvitationProjection() {
  const repoRoot = path.resolve(__dirname, '..');
  const pagePath = path.join(repoRoot, 'app', 'director', 'team', 'page.tsx');
  let source;
  try {
    source = fs.readFileSync(pagePath, 'utf8');
  } catch (err) {
    report('integration: director Team invitation projection is readable', false, err.message);
    return;
  }

  const filtersTerminalStates = source.includes('const pendingInvitations = invitations.filter(')
    && source.includes('!invitation.accepted_at')
    && source.includes('!invitation.revoked_at');
  const rendersOnlyPendingRows = source.includes('{pendingInvitations.map((invitation) => {')
    && !source.includes('{invitations.map((invitation) => {');
  report(
    'integration: accepted/revoked invitations cannot render as pending Team rows',
    filtersTerminalStates && rendersOnlyPendingRows,
    `filtersTerminalStates=${filtersTerminalStates} rendersOnlyPendingRows=${rendersOnlyPendingRows}`
  );
}

// ---------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------

function main() {
  const repoRoot = makeTempRepo(FIXTURE_FILES);
  try {
    console.log('Fixture unit tests (hermetic temp repo):');
    testPassingFixture(repoRoot);
    testMissingRequiredField(repoRoot);
    testDuplicateIds(repoRoot);
    testMissingReferencedFile(repoRoot);
    testQueuedClaimsUI(repoRoot);
    testBackendOnlyMarkedUserVisibleWithoutRoute(repoRoot);
    testUserVisibleWithoutFiles(repoRoot);
    testInvalidStatus(repoRoot);
    testEmptyContractsArray(repoRoot);

    console.log('Integration test (real repository ledger):');
    testRealLedger();
    testRealPendingInvitationProjection();
  } finally {
    fs.rmSync(repoRoot, { recursive: true, force: true });
  }

  console.log('');
  console.log(`test-frontend-backend-parity: ${passCount} passed, ${failCount} failed`);
  if (failCount > 0) {
    process.exitCode = 1;
  }
}

main();
