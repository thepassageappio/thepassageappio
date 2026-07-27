#!/usr/bin/env node
'use strict';

/**
 * Frontend/backend parity enforcement checker.
 *
 * Validates docs/product/frontend-backend-contracts.json against the rules
 * required by the Passage frontend/backend parity lane:
 *
 *  - every contract must carry all required fields (persona, visible
 *    route/component, action/status, server command/query, durable
 *    tables/cardinality, RLS/authority predicate, append-only event/proof,
 *    failure/recovery states, persona projection, evidence/test references)
 *  - contract ids must be unique
 *  - a contract that references repository files (frontend.files,
 *    backend_files, evidence_test_references) must reference files that
 *    actually exist in the repository
 *  - "implemented" contracts must have a real, existing frontend route AND
 *    backend implementation
 *  - a capability must never be marked frontend.user_visible = true without
 *    a concrete route/component and existing files backing it
 *  - "queued" contracts must not claim a reachable UI (user_visible must be
 *    false and route/component must be null)
 *
 * This module exports pure functions so scripts/test-frontend-backend-parity.js
 * can exercise the rules directly against fixtures, without shelling out.
 */

const fs = require('fs');
const path = require('path');

const REQUIRED_CONTRACT_FIELDS = [
  'id',
  'cycle',
  'capability',
  'status',
  'persona',
  'frontend',
  'action_status',
  'server_command',
  'backend_files',
  'durable_tables',
  'rls_authority_predicate',
  'append_only_event',
  'failure_recovery_states',
  'persona_projection',
  'evidence_test_references',
];

const VALID_STATUSES = ['implemented', 'backend_only', 'queued'];
const REQUIRED_CYCLE8_CONTRACT_IDS = [
  'cycle8.staff.proof_history',
  'cycle8.staff.proof_submission',
  'cycle8.director.proof_review',
  'cycle8.shared.immutable_proof_history',
];
const REQUIRED_PACKET1_URGENT_CONTRACT_IDS = [
  'packet1.family.urgent_submission',
  'packet1.director.urgent_claim_and_case',
];
const REQUIRED_PACKET1_VENDOR_CONTRACT_IDS = [
  'packet1.vendor.fulfillment',
];
const REQUIRED_RELEASE_CONTRACT_IDS = [
  ...REQUIRED_CYCLE8_CONTRACT_IDS,
  ...REQUIRED_PACKET1_URGENT_CONTRACT_IDS,
  ...REQUIRED_PACKET1_VENDOR_CONTRACT_IDS,
];

const REQUIRED_CONTRACT_SOURCE_BINDINGS = {
  'cycle8.staff.proof_history': [
    {
      file: 'app/staff/work/[taskId]/page.tsx',
      includes: [
        'review.reviewed_by_organization_member_id',
        "humanizePreviewIdentity(displayMember(members.find((member) => member.id === review.reviewed_by_organization_member_id)), 'director')",
      ],
    },
    {
      file: 'supabase/migrations/20260726222505_staff_proof_reviewer_visibility.sql',
      includes: [
        'create or replace function passage_private.can_view_proof_reviewer(p_member_id uuid)',
        "set search_path to ''",
        'create policy cycle_7b_members_authorized_select',
        'or passage_private.can_view_proof_reviewer(id)',
      ],
    },
    {
      file: 'supabase/migrations/20260727025124_staff_proof_reviewer_visibility_acl_hardening.sql',
      includes: [
        'create or replace function passage_private.can_view_proof_reviewer(',
        'join public.workflows as workflow_row',
        'join public.organization_member_locations as viewer_grant',
        'and viewer_grant.organization_location_id =',
        'workflow_row.organization_location_id',
        'and viewer_grant.revoked_at is null',
        'on function passage_private.can_view_proof_reviewer(uuid)',
        'from public, anon, service_role',
        'to authenticated',
      ],
    },
    {
      file: 'supabase/tests/staff_proof_reviewer_visibility.sql',
      includes: [
        'Active assigned staff could not resolve the exact proof reviewer',
        'Wrong-task reviewer identity leaked to assigned staff',
        'Unassigned staff retained proof-reviewer visibility',
        'Former assignee retained proof-reviewer visibility',
        'Revoked staff retained proof-reviewer visibility',
        'Wrong-location staff retained proof-reviewer visibility',
        'Revoked location grant retained proof-reviewer visibility',
        'Wrong-organization staff gained proof-reviewer visibility',
        'Reviewer helper function ACL/search_path posture drifted',
      ],
    },
  ],
  'packet1.family.urgent_submission': [
    {
      file: 'app/start/next/UrgentNextClient.tsx',
      includes: [
        'Save privately — don’t share with Northstar',
        'Northstar cannot see this.',
        'PREVIEW_RECEIVING_ORGANIZATION.name',
        'name="receivingOrganizationId"',
        'existing.wants_callback',
        '<dt>Visibility</dt><dd>Only you</dd>',
        'action={startPreviewDemo}',
        'name="persona" type="hidden" value="family"',
        'Sign in to an existing Preview account',
        'No email is sent.',
      ],
    },
    {
      file: 'app/demo/actions.ts',
      includes: [
        "export type DemoPersona = 'family' | 'director' | 'staff' | 'vendor'",
        "family: '/start/next'",
        'PASSAGE_PREVIEW_DEMO_SESSIONS_ENABLED',
        "configuration.projectRef !== 'uyacxqtsiwlvtmhxvoxr'",
        'client.auth.signInWithPassword(credential)',
      ],
    },
    {
      file: 'app/start/actions.ts',
      includes: [
        'receivingOrganizationId !== PREVIEW_RECEIVING_ORGANIZATION.id',
        'p_receiving_organization_id: receivingOrganizationId',
      ],
    },
  ],
  'packet1.director.urgent_claim_and_case': [
    {
      file: 'lib/urgent/hosted.ts',
      includes: [
        ".eq('receiving_organization_id', organizationId)",
        ".eq('wants_callback', true)",
        ".neq('status', 'self_handling')",
        'loadUrgentIntakeRequest(client: SupabaseClient, id: string, organizationId: string)',
      ],
    },
    {
      file: 'supabase/migrations/20260727030000_urgent_receiving_organization_boundary.sql',
      includes: [
        'member_row.organization_id = v_request.receiving_organization_id',
        'claimed_organization_id = v_request.receiving_organization_id',
        'urgent_intake_requests_claim_matches_receiver',
        'urgent_intake_requests_packet1_receiver',
        'coalesce(',
        'request_row.claimed_organization_id',
        'workflow_row.organization_id',
        'wants_callback',
        "status <> 'self_handling'",
        "v_existing_event.metadata ->> 'expected_version'",
        "v_existing_event.metadata ->> 'organization_location_id'",
        "v_existing_event.metadata ->> 'case_reference'",
        "v_existing_event.metadata ->> 'family_name'",
        'v_replay_authorized :=',
        'if not v_replay_authorized then',
        'from public, anon, authenticated, service_role',
      ],
    },
    {
      file: 'supabase/tests/urgent_family_organization_boundary.sql',
      includes: [
        'Wrong-organization director can see Northstar rows',
        'Expected wrong-organization claim denial',
        'Expected wrong-organization case-creation denial',
        'Expected fresh-key non-allowlisted receiver denial',
        'Northstar director can see requester-private self-handling rows',
        'Expected direct event insert denial',
        'Expected append-only event delete denial',
        'Case replay conflict changed request/workflow/event cardinality',
        'Expected revoked-location case replay denial',
        'Postgres final request/workflow/event cardinality changed',
        'Urgent helper ACL/search_path posture drifted',
      ],
    },
  ],
  'packet1.vendor.fulfillment': [
    {
      file: 'app/director/cases/[workflowId]/PartnerRequestForms.tsx',
      includes: [
        'name="partnerOrganizationId"',
        'humanCategory(selectedPartner.category)',
        'Choose a different vendor to change the service.',
      ],
    },
    {
      file: 'app/director/cases/[workflowId]/partner-actions.ts',
      includes: [
        ".from('partner_requests')",
        ".eq('creation_request_id', requestId)",
        'let category = existingRequestResult.data?.category;',
        'if (!category) {',
        'p_category: category',
        "result.error.code === 'PS001'",
        "result.error.code === '23514'",
      ],
    },
    {
      file: 'supabase/migrations/20260727025310_partner_vendor_category_compatibility.sql',
      includes: [
        'before insert or update of partner_organization_id, category',
        'on function passage_private.enforce_partner_request_category()',
        'from public, anon, authenticated, service_role',
        'pg_catalog.pg_advisory_xact_lock(',
        'select request.* into v_existing',
        'if found then',
        'v_existing.needed_by is distinct from p_needed_by',
        'where organization.id = p_partner_organization_id',
        "and organization.status = 'active'",
        'v_partner_org.category is distinct from p_category',
      ],
    },
    {
      file: 'supabase/tests/partner_vendor_category_compatibility.sql',
      includes: [
        'Denied category mismatch left a partial write',
        'Specialty-changed exact replay was not cardinality-stable',
        'Suspended vendor exact replay was not cardinality-stable',
        'Changed % replay did not return 22023',
        'Suspended fresh vendor was not rejected atomically',
        'Fresh specialty mismatch was not atomic',
        'Matching current-specialty request cardinality failed',
        'Expected direct insert category denial',
        'Expected direct update category denial',
        'Expected direct authenticated event insert denial',
        'Expected append-only event update denial',
        'Expected append-only event delete denial',
        'Vendor compatibility final cardinality changed',
      ],
    },
  ],
};

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isNonEmptyStringOrArray(value) {
  if (isNonEmptyString(value)) return true;
  return Array.isArray(value) && value.length > 0 && value.every((item) => isNonEmptyString(item));
}

/** Resolve a repo-relative path (optionally with a "#anchor" suffix) against repoRoot. */
function fileExists(repoRoot, relPath) {
  if (!isNonEmptyString(relPath)) return false;
  const filePart = relPath.split('#')[0].trim();
  if (filePart.length === 0) return false;
  try {
    return fs.existsSync(path.join(repoRoot, filePart));
  } catch {
    return false;
  }
}

function checkSourceAssertions(contract, label, repoRoot, errors) {
  const assertions = contract.source_assertions;
  if (!Array.isArray(assertions) || assertions.length === 0) {
    errors.push(`${label}: Cycle 8 requires a non-empty "source_assertions" array so file existence alone cannot produce a false green.`);
    return;
  }

  for (const [assertionIndex, assertion] of assertions.entries()) {
    const assertionLabel = `${label}.source_assertions[${assertionIndex}]`;
    if (!assertion || typeof assertion !== 'object' || Array.isArray(assertion)) {
      errors.push(`${assertionLabel}: entry must be an object.`);
      continue;
    }
    if (!isNonEmptyString(assertion.file)) {
      errors.push(`${assertionLabel}: "file" must be a non-empty repository-relative path.`);
      continue;
    }
    if (!Array.isArray(assertion.includes) || assertion.includes.length === 0 || !assertion.includes.every(isNonEmptyString)) {
      errors.push(`${assertionLabel}: "includes" must be a non-empty array of non-empty source strings.`);
      continue;
    }

    const absolute = path.join(repoRoot, assertion.file);
    if (!fileExists(repoRoot, assertion.file)) {
      errors.push(`${assertionLabel}: source assertion file does not exist: "${assertion.file}".`);
      continue;
    }
    let source;
    try {
      source = fs.readFileSync(absolute, 'utf8');
    } catch (error) {
      errors.push(`${assertionLabel}: could not read "${assertion.file}": ${error.message}.`);
      continue;
    }
    for (const expected of assertion.includes) {
      if (!source.includes(expected)) {
        errors.push(`${assertionLabel}: "${assertion.file}" is missing required Cycle 8 source binding ${JSON.stringify(expected)}.`);
      }
    }
  }

  const requiredBindings = REQUIRED_CONTRACT_SOURCE_BINDINGS[contract.id] ?? [];
  for (const requiredBinding of requiredBindings) {
    const declaration = assertions.find((assertion) => assertion?.file === requiredBinding.file);
    if (!declaration) {
      errors.push(
        `${label}: required source binding declaration is missing for "${requiredBinding.file}".`
      );
      continue;
    }
    if (!Array.isArray(declaration.includes)) {
      continue;
    }
    for (const requiredSource of requiredBinding.includes) {
      if (!declaration.includes.includes(requiredSource)) {
        errors.push(
          `${label}: required source binding declaration for "${requiredBinding.file}" is missing ${JSON.stringify(requiredSource)}.`
        );
      }
    }
  }
}

function checkContract(contract, index, repoRoot, errors, seenIds) {
  const idForLabel = contract && typeof contract.id === 'string' ? contract.id : `#${index}`;
  const label = `contracts[${index}] (${idForLabel})`;

  if (!contract || typeof contract !== 'object' || Array.isArray(contract)) {
    errors.push(`${label}: entry must be an object.`);
    return;
  }

  // Rule: required fields present.
  for (const field of REQUIRED_CONTRACT_FIELDS) {
    if (!(field in contract) || contract[field] === undefined) {
      errors.push(`${label}: missing required field "${field}".`);
    }
  }

  // Rule: unique, non-empty id.
  if (isNonEmptyString(contract.id)) {
    if (seenIds.has(contract.id)) {
      errors.push(
        `Duplicate contract id "${contract.id}" (first seen at contracts[${seenIds.get(contract.id)}], again at contracts[${index}]).`
      );
    } else {
      seenIds.set(contract.id, index);
    }
  } else {
    errors.push(`${label}: "id" must be a non-empty string.`);
  }

  if (!isNonEmptyString(contract.cycle)) errors.push(`${label}: "cycle" must be a non-empty string.`);
  if (!isNonEmptyString(contract.capability)) errors.push(`${label}: "capability" must be a non-empty string.`);
  if (!isNonEmptyString(contract.action_status)) errors.push(`${label}: "action_status" must be a non-empty string.`);
  if (!isNonEmptyStringOrArray(contract.persona)) errors.push(`${label}: "persona" must be a non-empty string or array of strings.`);
  if (!isNonEmptyStringOrArray(contract.server_command)) errors.push(`${label}: "server_command" must be a non-empty string or array of strings.`);
  if (!isNonEmptyString(contract.rls_authority_predicate)) errors.push(`${label}: "rls_authority_predicate" must be a non-empty string.`);
  if (!isNonEmptyString(contract.persona_projection)) errors.push(`${label}: "persona_projection" must be a non-empty string.`);

  const claimsCycle8 = isNonEmptyString(contract.id) && contract.id.startsWith('cycle8.');
  if (claimsCycle8 && contract.cycle !== '8') {
    errors.push(`${label}: a cycle8.* contract id must declare cycle "8".`);
  }
  if (
    contract.cycle === '8'
    || claimsCycle8
    || REQUIRED_CONTRACT_SOURCE_BINDINGS[contract.id]
  ) {
    checkSourceAssertions(contract, label, repoRoot, errors);
  }

  const status = contract.status;
  if (!VALID_STATUSES.includes(status)) {
    errors.push(`${label}: "status" must be one of ${VALID_STATUSES.join(', ')} (got ${JSON.stringify(status)}).`);
  }
  const statusBuiltOnBackend = status === 'implemented' || status === 'backend_only';

  // --- frontend block -------------------------------------------------
  const fe = contract.frontend;
  if (!fe || typeof fe !== 'object' || Array.isArray(fe)) {
    errors.push(`${label}: "frontend" must be an object.`);
  } else {
    if (typeof fe.user_visible !== 'boolean') errors.push(`${label}: "frontend.user_visible" must be a boolean.`);
    if (!('route' in fe)) errors.push(`${label}: "frontend.route" is required (string or null).`);
    if (!('component' in fe)) errors.push(`${label}: "frontend.component" is required (string, array, or null).`);
    if (!isNonEmptyString(fe.note)) errors.push(`${label}: "frontend.note" must be a non-empty string.`);

    const claimsVisibleUI = fe.user_visible === true;

    // Core rule: never mark a capability user-visible without a concrete,
    // existing route/component. This is the rule that catches a backend-only
    // capability being mislabeled as shipped UI.
    if (claimsVisibleUI) {
      const hasRoute = isNonEmptyString(fe.route);
      const hasComponent = isNonEmptyStringOrArray(fe.component);
      if (!hasRoute || !hasComponent) {
        errors.push(
          `${label}: frontend.user_visible=true but "frontend.route" and/or "frontend.component" is missing. A backend-only capability must not be marked user-visible without a route/component.`
        );
      }
      const files = Array.isArray(fe.files) ? fe.files : null;
      if (!files || files.length === 0) {
        errors.push(`${label}: frontend.user_visible=true requires a non-empty "frontend.files" array listing the concrete file(s) implementing the UI.`);
      } else {
        for (const f of files) {
          if (!fileExists(repoRoot, f)) {
            errors.push(`${label}: frontend.files references a file that does not exist in the repository: "${f}".`);
          }
        }
      }
    }

    // Rule: a queued entry must not claim a reachable UI.
    if (status === 'queued') {
      if (fe.user_visible !== false || fe.route !== null || fe.component !== null) {
        errors.push(`${label}: status "queued" must not claim a reachable UI -- frontend.user_visible must be false and frontend.route/component must be null.`);
      }
    }

    // Rule: status <-> visibility consistency.
    if (status === 'implemented' && fe.user_visible !== true) {
      errors.push(`${label}: status "implemented" requires frontend.user_visible = true (a fully implemented contract must have a reachable UI).`);
    }
    if (status === 'backend_only' && fe.user_visible !== false) {
      errors.push(`${label}: status "backend_only" must not claim frontend.user_visible = true.`);
    }
  }

  // --- backend_files ----------------------------------------------------
  if (!Array.isArray(contract.backend_files)) {
    errors.push(`${label}: "backend_files" must be an array.`);
  } else {
    if (statusBuiltOnBackend && contract.backend_files.length === 0) {
      errors.push(`${label}: status "${status}" requires at least one entry in "backend_files".`);
    }
    for (const f of contract.backend_files) {
      if (!isNonEmptyString(f)) {
        errors.push(`${label}: backend_files entries must be non-empty strings.`);
        continue;
      }
      if (!fileExists(repoRoot, f)) {
        errors.push(`${label}: backend_files references a file that does not exist in the repository: "${f}".`);
      }
    }
  }

  // --- durable_tables -----------------------------------------------------
  if (!Array.isArray(contract.durable_tables)) {
    errors.push(`${label}: "durable_tables" must be an array.`);
  } else {
    if (statusBuiltOnBackend && contract.durable_tables.length === 0) {
      errors.push(`${label}: status "${status}" requires at least one entry in "durable_tables".`);
    }
    for (const t of contract.durable_tables) {
      if (!t || typeof t !== 'object' || !isNonEmptyString(t.table) || !isNonEmptyString(t.cardinality)) {
        errors.push(`${label}: each durable_tables entry needs a non-empty "table" and "cardinality".`);
      }
    }
  }

  // --- append_only_event ---------------------------------------------------
  const evt = contract.append_only_event;
  if (!evt || typeof evt !== 'object' || Array.isArray(evt)) {
    errors.push(`${label}: "append_only_event" must be an object.`);
  } else if (typeof evt.applicable !== 'boolean') {
    errors.push(`${label}: "append_only_event.applicable" must be a boolean.`);
  } else if (evt.applicable === false) {
    if (!isNonEmptyString(evt.reason)) {
      errors.push(`${label}: append_only_event.applicable=false requires a non-empty "reason" explaining why no append-only event/proof exists.`);
    }
  } else {
    if (!isNonEmptyString(evt.table) || !isNonEmptyString(evt.event_type)) {
      errors.push(`${label}: append_only_event.applicable=true requires non-empty "table" and "event_type".`);
    }
    if (statusBuiltOnBackend && !isNonEmptyString(evt.idempotency_key)) {
      errors.push(`${label}: status "${status}" with an applicable append_only_event requires a non-empty "idempotency_key".`);
    }
  }

  // --- failure_recovery_states ---------------------------------------------
  if (
    !Array.isArray(contract.failure_recovery_states) ||
    contract.failure_recovery_states.length === 0 ||
    !contract.failure_recovery_states.every((s) => isNonEmptyString(s))
  ) {
    errors.push(`${label}: "failure_recovery_states" must be a non-empty array of non-empty strings.`);
  }

  // --- evidence_test_references ---------------------------------------------
  if (!Array.isArray(contract.evidence_test_references) || contract.evidence_test_references.length === 0) {
    errors.push(`${label}: "evidence_test_references" must be a non-empty array.`);
  } else {
    for (const ref of contract.evidence_test_references) {
      if (!isNonEmptyString(ref)) {
        errors.push(`${label}: evidence_test_references entries must be non-empty strings.`);
        continue;
      }
      if (statusBuiltOnBackend && !fileExists(repoRoot, ref)) {
        errors.push(`${label}: evidence_test_references references a path that does not exist in the repository: "${ref}".`);
      }
    }
  }
}

/**
 * @param {unknown} ledger parsed JSON contents of frontend-backend-contracts.json
 * @param {string} repoRoot absolute path used to resolve referenced repository files
 * @returns {{ ok: boolean, errors: string[] }}
 */
function checkLedger(ledger, repoRoot, options = {}) {
  const errors = [];

  if (!ledger || typeof ledger !== 'object' || Array.isArray(ledger)) {
    return { ok: false, errors: ['Ledger root must be a JSON object.'] };
  }
  if (!Array.isArray(ledger.contracts) || ledger.contracts.length === 0) {
    return { ok: false, errors: ['Ledger must contain a non-empty "contracts" array.'] };
  }

  const seenIds = new Map();
  ledger.contracts.forEach((contract, index) => {
    checkContract(contract, index, repoRoot, errors, seenIds);
  });

  const requiredContractIds = Array.isArray(options.requiredContractIds) ? options.requiredContractIds : [];
  for (const requiredId of requiredContractIds) {
    if (!seenIds.has(requiredId)) {
      errors.push(`Required contract id "${requiredId}" is missing; required cycle coverage cannot be empty or partial.`);
    }
  }

  return { ok: errors.length === 0, errors };
}

function loadLedger(ledgerPath) {
  const raw = fs.readFileSync(ledgerPath, 'utf8');
  return JSON.parse(raw);
}

function main() {
  const repoRoot = path.resolve(__dirname, '..');
  const ledgerPath = path.join(repoRoot, 'docs', 'product', 'frontend-backend-contracts.json');

  let ledger;
  try {
    ledger = loadLedger(ledgerPath);
  } catch (err) {
    console.error(`check-frontend-backend-parity: FAIL -- could not read/parse ${ledgerPath}`);
    console.error(`  ${err.message}`);
    process.exitCode = 1;
    return;
  }

  const { ok, errors } = checkLedger(ledger, repoRoot, { requiredContractIds: REQUIRED_RELEASE_CONTRACT_IDS });
  if (!ok) {
    console.error(`check-frontend-backend-parity: FAIL (${errors.length} issue${errors.length === 1 ? '' : 's'})`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exitCode = 1;
    return;
  }

  console.log(`check-frontend-backend-parity: PASS (${ledger.contracts.length} contracts checked)`);
}

module.exports = {
  checkLedger,
  loadLedger,
  fileExists,
  REQUIRED_CONTRACT_FIELDS,
  REQUIRED_CONTRACT_SOURCE_BINDINGS,
  VALID_STATUSES,
  REQUIRED_CYCLE8_CONTRACT_IDS,
  REQUIRED_PACKET1_URGENT_CONTRACT_IDS,
  REQUIRED_PACKET1_VENDOR_CONTRACT_IDS,
  REQUIRED_RELEASE_CONTRACT_IDS,
};

if (require.main === module) {
  main();
}
