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

const {
  checkLedger,
  REQUIRED_CONTRACT_SOURCE_BINDINGS,
  REQUIRED_CYCLE8_CONTRACT_IDS,
  REQUIRED_PACKET1_URGENT_CONTRACT_IDS,
  REQUIRED_PACKET1_VENDOR_CONTRACT_IDS,
  REQUIRED_RELEASE_CONTRACT_IDS,
  assignmentRpcUsesWorkflowId,
} = require('./check-frontend-backend-parity');

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

function testCycle8RequiresSourceAssertions(repoRoot) {
  const bad = baseImplementedContract({ id: 'cycle8.fixture.missing-bindings', cycle: '8' });
  const { ok, errors } = checkLedger({ contracts: [bad] }, repoRoot);
  const expected = errors.some((e) => e.includes('Cycle 8 requires a non-empty "source_assertions" array'));
  report('failing fixture: Cycle 8 contract without source assertions is rejected', ok === false && expected, `ok=${ok} errors=${JSON.stringify(errors)}`);
}

function testCycle8SourceDrift(repoRoot) {
  const bad = baseImplementedContract({
    id: 'cycle8.fixture.drift',
    cycle: '8',
    source_assertions: [{ file: 'docs/fixture/component.tsx', includes: ['required binding that is absent'] }],
  });
  const { ok, errors } = checkLedger({ contracts: [bad] }, repoRoot);
  const expected = errors.some((e) => e.includes('is missing required Cycle 8 source binding'));
  report('failing fixture: Cycle 8 source drift is rejected', ok === false && expected, `ok=${ok} errors=${JSON.stringify(errors)}`);
}

function testCycle8IdentityCannotMasquerade(repoRoot) {
  const bad = baseImplementedContract({
    id: 'cycle8.fixture.wrong-cycle',
    cycle: '7B',
    source_assertions: [{ file: 'docs/fixture/component.tsx', includes: ['fixture component'] }],
  });
  const { ok, errors } = checkLedger({ contracts: [bad] }, repoRoot);
  const expected = errors.some((e) => e.includes('a cycle8.* contract id must declare cycle "8"'));
  report('failing fixture: Cycle 8 contract id cannot masquerade as an earlier cycle', ok === false && expected, `ok=${ok} errors=${JSON.stringify(errors)}`);
}

function testRequiredCycle8CoverageCannotBeEmpty(repoRoot) {
  const { ok, errors } = checkLedger(
    { contracts: [baseImplementedContract()] },
    repoRoot,
    { requiredContractIds: REQUIRED_CYCLE8_CONTRACT_IDS }
  );
  const expected = REQUIRED_CYCLE8_CONTRACT_IDS.every((id) => errors.some((e) => e.includes(`Required contract id "${id}" is missing`)));
  report('failing fixture: zero Cycle 8 contract coverage is rejected', ok === false && expected, `ok=${ok} errors=${JSON.stringify(errors)}`);
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
  const { ok, errors } = checkLedger(ledger, repoRoot, { requiredContractIds: REQUIRED_RELEASE_CONTRACT_IDS });
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

function testReviewerVisibilityParityMutations() {
  const repoRoot = path.resolve(__dirname, '..');
  const ledgerPath = path.join(repoRoot, 'docs', 'product', 'frontend-backend-contracts.json');
  const required = REQUIRED_CONTRACT_SOURCE_BINDINGS['cycle8.staff.proof_history'];
  const mutations = [
    {
      name: 'reviewer visibility migration',
      file: 'supabase/migrations/20260726222505_staff_proof_reviewer_visibility.sql',
      source: 'create or replace function passage_private.can_view_proof_reviewer(p_member_id uuid)',
    },
    {
      name: 'reviewer visibility policy',
      file: 'supabase/migrations/20260726222505_staff_proof_reviewer_visibility.sql',
      source: 'or passage_private.can_view_proof_reviewer(id)',
    },
    {
      name: 'reviewer helper ACL hardening',
      file: 'supabase/migrations/20260727025124_staff_proof_reviewer_visibility_acl_hardening.sql',
      source: 'from public, anon, service_role',
    },
    {
      name: 'active workflow-location grant predicate',
      file: 'supabase/migrations/20260727025124_staff_proof_reviewer_visibility_acl_hardening.sql',
      source: 'and viewer_grant.revoked_at is null',
    },
    {
      name: 'staff reviewer-name projection',
      file: 'app/staff/work/[taskId]/page.tsx',
      source: "humanizePreviewIdentity(displayMember(members.find((member) => member.id === review.reviewed_by_organization_member_id)), 'director')",
    },
    {
      name: 'focused reviewer visibility SQL evidence',
      file: 'supabase/tests/staff_proof_reviewer_visibility.sql',
      source: 'Wrong-task reviewer identity leaked to assigned staff',
    },
  ];

  let baseLedger;
  try {
    baseLedger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
  } catch (error) {
    report('integration mutation: reviewer visibility ledger is readable', false, error.message);
    return;
  }

  for (const mutation of mutations) {
    const requiredBinding = required.find((binding) => binding.file === mutation.file);
    if (!requiredBinding?.includes.includes(mutation.source)) {
      report(
        `integration mutation: ${mutation.name} has a deterministic required binding`,
        false,
        `Required binding map does not include ${JSON.stringify(mutation.source)}`
      );
      continue;
    }

    const mutatedLedger = JSON.parse(JSON.stringify(baseLedger));
    const contract = mutatedLedger.contracts.find(
      (candidate) => candidate.id === 'cycle8.staff.proof_history'
    );
    const assertion = contract?.source_assertions.find(
      (candidate) => candidate.file === mutation.file
    );
    if (!assertion) {
      report(
        `integration mutation: ${mutation.name} has a declared source assertion`,
        false,
        `Missing assertion for ${mutation.file}`
      );
      continue;
    }
    assertion.includes = assertion.includes.filter(
      (candidate) => candidate !== mutation.source
    );

    const { ok, errors } = checkLedger(mutatedLedger, repoRoot, {
      requiredContractIds: REQUIRED_CYCLE8_CONTRACT_IDS,
    });
    const expected = errors.some(
      (error) =>
        error.includes(`required source binding declaration for "${mutation.file}"`) &&
        error.includes(JSON.stringify(mutation.source))
    );
    report(
      `integration mutation: removing ${mutation.name} fails parity`,
      ok === false && expected,
      `ok=${ok} errors=${JSON.stringify(errors)}`
    );
  }
}

function testUrgentOrganizationBoundaryParityMutations() {
  const repoRoot = path.resolve(__dirname, '..');
  const ledgerPath = path.join(repoRoot, 'docs', 'product', 'frontend-backend-contracts.json');
  let ledger;
  try {
    ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
  } catch (error) {
    report('urgent parity mutation: ledger is readable', false, error.message);
    return;
  }

  const mutations = [
    {
      contractId: 'packet1.family.urgent_submission',
      file: 'app/start/next/UrgentNextClient.tsx',
      source: 'name="receivingOrganizationId"',
      name: 'family receiver field binding',
    },
    {
      contractId: 'packet1.family.urgent_submission',
      file: 'app/start/next/UrgentNextClient.tsx',
      source: 'Save privately — don’t share with Northstar',
      name: 'requester-private self-handling copy',
    },
    {
      contractId: 'packet1.family.urgent_submission',
      file: 'app/start/next/UrgentNextClient.tsx',
      source: '<dt>Visibility</dt><dd>Only you</dd>',
      name: 'requester-private receipt branch',
    },
    {
      contractId: 'packet1.family.urgent_submission',
      file: 'app/start/next/UrgentNextClient.tsx',
      source: 'action={startPreviewDemo}',
      name: 'gated family demo continuation',
    },
    {
      contractId: 'packet1.family.urgent_submission',
      file: 'app/demo/actions.ts',
      source: "family: '/start/next'",
      name: 'family demo return target',
    },
    {
      contractId: 'packet1.director.urgent_claim_and_case',
      file: 'lib/urgent/hosted.ts',
      source: ".eq('wants_callback', true)",
      name: 'callback-only director loader',
    },
    {
      contractId: 'packet1.director.urgent_claim_and_case',
      file: 'app/director/cases/[workflowId]/page.tsx',
      source: 'The first commitment could not load.',
      name: 'fail-closed zero-task recovery state',
    },
    {
      contractId: 'packet1.director.urgent_claim_and_case',
      file: 'app/director/cases/[workflowId]/page.tsx',
      source: 'Choose who owns the first commitment.',
      name: 'unassigned first-commitment assignment state',
    },
    {
      contractId: 'packet1.director.urgent_claim_and_case',
      file: 'app/director/cases/[workflowId]/page.tsx',
      source: "member.role === 'staff' && member.status === 'active'",
      name: 'active staff role/status candidate filter',
    },
    {
      contractId: 'packet1.director.urgent_claim_and_case',
      file: 'app/director/cases/[workflowId]/page.tsx',
      source: "grant.organization_location_id === workflow.organization_location_id",
      name: 'exact-location assignment candidate filter',
    },
    {
      contractId: 'packet1.director.urgent_claim_and_case',
      file: 'app/director/cases/[workflowId]/page.tsx',
      source: '!grant.revoked_at',
      name: 'non-revoked location grant candidate filter',
    },
    {
      contractId: 'packet1.director.urgent_claim_and_case',
      file: 'app/director/cases/[workflowId]/page.tsx',
      source: "const proofStage = selectedTask.status === 'proof_submitted' || selectedTask.status === 'completed';",
      name: 'proof-submitted and completed stage mapping',
    },
    {
      contractId: 'packet1.director.urgent_claim_and_case',
      file: 'app/director/cases/[workflowId]/page.tsx',
      source: "const activeStage = proofStage ? 'proof' : 'tasks';",
      name: 'Tasks-versus-Proof orientation mapping',
    },
    {
      contractId: 'packet1.director.urgent_claim_and_case',
      file: 'app/director/cases/[workflowId]/page.tsx',
      source: "selectedTask.status === 'blocked' ? 'This commitment is blocked.",
      name: 'blocked task copy',
    },
    {
      contractId: 'packet1.director.urgent_claim_and_case',
      file: 'app/director/cases/[workflowId]/page.tsx',
      source: "selectedTask.status === 'assigned' ? `${ownerName} owns this commitment",
      name: 'assigned task owner copy',
    },
    {
      contractId: 'packet1.director.urgent_claim_and_case',
      file: 'app/director/cases/[workflowId]/page.tsx',
      source: "selectedTask.status === 'proof_submitted' ? 'Proof waiting for review.'",
      name: 'proof-submitted review copy',
    },
    {
      contractId: 'packet1.director.urgent_claim_and_case',
      file: 'app/director/cases/[workflowId]/page.tsx',
      source: 'Proof verified — task complete.',
      name: 'completed verified copy',
    },
    {
      contractId: 'packet1.director.urgent_claim_and_case',
      file: 'lib/presentation/plain-language.ts',
      source: "const urgentFirstCommitmentOwnerAction = 'Confirm the family’s next arrangement step and save the outcome.';",
      name: 'staff-capable urgent owner action mapping',
    },
    {
      contractId: 'packet1.director.urgent_claim_and_case',
      file: 'app/staff/page.tsx',
      source: 'humanTaskOwnerAction(task.human_action',
      name: 'staff queue owner-action presenter',
    },
    {
      contractId: 'packet1.director.urgent_claim_and_case',
      file: 'app/staff/work/[taskId]/page.tsx',
      source: 'humanTaskOwnerAction(task.human_action)',
      name: 'staff detail owner-action presenter',
    },
    {
      contractId: 'packet1.director.urgent_claim_and_case',
      file: 'app/director/CommandForms.tsx',
      source: 'Review Team access',
      name: 'no-eligible-staff recovery link',
    },
    {
      contractId: 'packet1.director.urgent_claim_and_case',
      file: 'app/director/actions.ts',
      source: '!uuid.test(workflowId)',
      name: 'workflow revalidation UUID guard',
    },
    {
      contractId: 'packet1.director.urgent_claim_and_case',
      file: 'app/director/actions.ts',
      source: 'revalidatePath(`/director/cases/${workflowId}`)',
      name: 'exact Case Room assignment revalidation',
    },
    {
      contractId: 'packet1.director.urgent_claim_and_case',
      file: 'app/director/urgent/actions.ts',
      source: 'firstTaskId: receipt.first_task_id',
      name: 'first-commitment Server Action receipt',
    },
    {
      contractId: 'packet1.director.urgent_claim_and_case',
      file: 'app/director/urgent/UrgentForms.tsx',
      source: 'Open the case and assign the first commitment',
      name: 'first-commitment recovery link',
    },
    {
      contractId: 'packet1.director.urgent_claim_and_case',
      file: 'supabase/migrations/20260727194332_urgent_case_first_commitment.sql',
      source: "'first_task_id', v_first_task_id",
      name: 'atomic first-task replay receipt',
    },
    {
      contractId: 'packet1.director.urgent_claim_and_case',
      file: 'supabase/migrations/20260727030000_urgent_receiving_organization_boundary.sql',
      source: 'member_row.organization_id = v_request.receiving_organization_id',
      name: 'exact-organization claim predicate',
    },
    {
      contractId: 'packet1.director.urgent_claim_and_case',
      file: 'supabase/migrations/20260727030000_urgent_receiving_organization_boundary.sql',
      source: 'urgent_intake_requests_packet1_receiver',
      name: 'Packet-1 receiver allowlist constraint',
    },
    {
      contractId: 'packet1.director.urgent_claim_and_case',
      file: 'supabase/migrations/20260727030000_urgent_receiving_organization_boundary.sql',
      source: "v_existing_event.metadata ->> 'family_name'",
      name: 'case replay payload comparison',
    },
    {
      contractId: 'packet1.director.urgent_claim_and_case',
      file: 'supabase/migrations/20260727030000_urgent_receiving_organization_boundary.sql',
      source: 'if not v_replay_authorized then',
      name: 'case replay current authority check',
    },
    {
      contractId: 'packet1.director.urgent_claim_and_case',
      file: 'supabase/tests/urgent_family_organization_boundary.sql',
      source: 'Expected wrong-organization case-creation denial',
      name: 'wrong-organization SQL denial evidence',
    },
    {
      contractId: 'packet1.director.urgent_claim_and_case',
      file: 'supabase/tests/urgent_family_organization_boundary.sql',
      source: 'Northstar director can see requester-private self-handling rows',
      name: 'private self-handling SQL projection denial',
    },
    {
      contractId: 'packet1.director.urgent_claim_and_case',
      file: 'supabase/tests/urgent_family_organization_boundary.sql',
      source: 'Expected revoked-location case replay denial',
      name: 'revoked-location case replay SQL denial',
    },
  ];

  for (const mutation of mutations) {
    const required = REQUIRED_CONTRACT_SOURCE_BINDINGS[mutation.contractId] ?? [];
    const requiredBinding = required.find((binding) => binding.file === mutation.file);
    if (!requiredBinding?.includes.includes(mutation.source)) {
      report(`urgent parity mutation: ${mutation.name} is required`, false, 'binding map is incomplete');
      continue;
    }

    const mutated = JSON.parse(JSON.stringify(ledger));
    const contract = mutated.contracts.find((candidate) => candidate.id === mutation.contractId);
    const assertion = contract?.source_assertions?.find((candidate) => candidate.file === mutation.file);
    if (!assertion) {
      report(`urgent parity mutation: ${mutation.name} is declared`, false, 'ledger assertion is missing');
      continue;
    }
    assertion.includes = assertion.includes.filter((source) => source !== mutation.source);
    const { ok, errors } = checkLedger(mutated, repoRoot, {
      requiredContractIds: REQUIRED_RELEASE_CONTRACT_IDS,
    });
    const expected = errors.some(
      (error) =>
        error.includes(`required source binding declaration for "${mutation.file}"`)
        && error.includes(JSON.stringify(mutation.source))
    );
    report(
      `urgent parity mutation: removing ${mutation.name} fails parity`,
      ok === false && expected,
      `ok=${ok} errors=${JSON.stringify(errors)}`
    );
  }

  report(
    'urgent parity mutation: Packet 1 contract IDs are mandatory',
    REQUIRED_PACKET1_URGENT_CONTRACT_IDS.every((id) =>
      REQUIRED_RELEASE_CONTRACT_IDS.includes(id)
    ),
    JSON.stringify(REQUIRED_RELEASE_CONTRACT_IDS)
  );
}

function testVendorReplayParityMutations() {
  const repoRoot = path.resolve(__dirname, '..');
  const ledgerPath = path.join(repoRoot, 'docs', 'product', 'frontend-backend-contracts.json');
  let ledger;
  try {
    ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
  } catch (error) {
    report('vendor parity mutation: ledger is readable', false, error.message);
    return;
  }

  const mutations = [
    {
      file: 'app/director/cases/[workflowId]/PartnerRequestForms.tsx',
      source: 'humanCategory(selectedPartner.category)',
      name: 'selected-vendor service projection',
    },
    {
      file: 'app/director/cases/[workflowId]/partner-actions.ts',
      source: 'if (!category) {',
      name: 'authoritative replay/new category split',
    },
    {
      file: 'supabase/migrations/20260727025310_partner_vendor_category_compatibility.sql',
      source: 'pg_catalog.pg_advisory_xact_lock(',
      name: 'serialized request-key replay lookup',
    },
    {
      file: 'supabase/migrations/20260727025310_partner_vendor_category_compatibility.sql',
      source: 'v_existing.needed_by is distinct from p_needed_by',
      name: 'needed-by replay conflict',
    },
    {
      file: 'supabase/tests/partner_vendor_category_compatibility.sql',
      source: 'Specialty-changed exact replay was not cardinality-stable',
      name: 'specialty-changed replay SQL evidence',
    },
    {
      file: 'supabase/tests/partner_vendor_category_compatibility.sql',
      source: 'Suspended vendor exact replay was not cardinality-stable',
      name: 'suspended-vendor replay SQL evidence',
    },
    {
      file: 'supabase/tests/partner_vendor_category_compatibility.sql',
      source: 'Expected direct update category denial',
      name: 'direct update trigger denial',
    },
    {
      file: 'supabase/tests/partner_vendor_category_compatibility.sql',
      source: 'Expected append-only event delete denial',
      name: 'append-only event denial',
    },
  ];
  const contractId = 'packet1.vendor.fulfillment';

  for (const mutation of mutations) {
    const required = REQUIRED_CONTRACT_SOURCE_BINDINGS[contractId] ?? [];
    const requiredBinding = required.find((binding) => binding.file === mutation.file);
    if (!requiredBinding?.includes.includes(mutation.source)) {
      report(`vendor parity mutation: ${mutation.name} is required`, false, 'binding map is incomplete');
      continue;
    }

    const mutated = JSON.parse(JSON.stringify(ledger));
    const contract = mutated.contracts.find((candidate) => candidate.id === contractId);
    const assertion = contract?.source_assertions?.find(
      (candidate) => candidate.file === mutation.file
    );
    if (!assertion) {
      report(`vendor parity mutation: ${mutation.name} is declared`, false, 'ledger assertion is missing');
      continue;
    }
    assertion.includes = assertion.includes.filter(
      (source) => source !== mutation.source
    );
    const { ok, errors } = checkLedger(mutated, repoRoot, {
      requiredContractIds: REQUIRED_RELEASE_CONTRACT_IDS,
    });
    const expected = errors.some(
      (error) =>
        error.includes(`required source binding declaration for "${mutation.file}"`)
        && error.includes(JSON.stringify(mutation.source))
    );
    report(
      `vendor parity mutation: removing ${mutation.name} fails parity`,
      ok === false && expected,
      `ok=${ok} errors=${JSON.stringify(errors)}`
    );
  }

  const directorActionSource = fs.readFileSync(path.join(repoRoot, 'app', 'director', 'actions.ts'), 'utf8');
  const injectedWorkflowAuthority = directorActionSource.replace(
    'p_task_id: taskId,',
    'p_task_id: taskId, p_workflow_id: workflowId,'
  );
  report(
    'urgent parity mutation: workflowId cannot enter assignment RPC authority payload',
    assignmentRpcUsesWorkflowId(directorActionSource) === false
      && assignmentRpcUsesWorkflowId(injectedWorkflowAuthority) === true,
    'workflowId must remain a validated exact-route revalidation hint only'
  );

  report(
    'vendor parity mutation: Packet 1 vendor contract ID is mandatory',
    REQUIRED_PACKET1_VENDOR_CONTRACT_IDS.every((id) =>
      REQUIRED_RELEASE_CONTRACT_IDS.includes(id)
    ),
    JSON.stringify(REQUIRED_RELEASE_CONTRACT_IDS)
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
    testCycle8RequiresSourceAssertions(repoRoot);
    testCycle8SourceDrift(repoRoot);
    testCycle8IdentityCannotMasquerade(repoRoot);
    testRequiredCycle8CoverageCannotBeEmpty(repoRoot);

    console.log('Integration test (real repository ledger):');
    testRealLedger();
    testRealPendingInvitationProjection();
    testReviewerVisibilityParityMutations();
    testUrgentOrganizationBoundaryParityMutations();
    testVendorReplayParityMutations();
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
