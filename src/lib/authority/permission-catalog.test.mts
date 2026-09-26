import assert from "node:assert/strict";
import test from "node:test";
import {
  LOCKED_P1_PERMISSIONS,
  acceptedLabelsFromReceiptSnapshot,
  buildDecisionPermissionSnapshots,
  lockedPermissionLabel,
  offeredFinancialPoaPermissions,
  parsePublishedPermissionCatalog,
  resolvePermissionLabels,
} from "./permission-catalog.ts";

test("offered financial POA permissions are exactly the two locked acts", () => {
  const offered = offeredFinancialPoaPermissions();
  assert.deepEqual(offered.map((item) => item.key), [
    "receive_duplicate_statements",
    "discuss_service_issues",
  ]);
  assert.equal(LOCKED_P1_PERMISSIONS.receive_duplicate_statements.label, "Get copies of account statements");
  assert.equal(LOCKED_P1_PERMISSIONS.discuss_service_issues.label, "Talk with the bank about the account");
});

test("decision snapshot freezes accepted labels separately from not-included", () => {
  const snaps = buildDecisionPermissionSnapshots({
    requestedKeys: ["receive_duplicate_statements", "discuss_service_issues"],
    acceptedKeys: ["receive_duplicate_statements"],
    outcome: "accepted_with_limits",
  });
  assert.equal(snaps.accepted.items.length, 1);
  assert.equal(snaps.accepted.items[0].label, "Get copies of account statements");
  assert.equal(snaps.accepted.items[0].outcome, "accepted_with_limits");
  assert.equal(snaps.notIncluded.items.length, 1);
  assert.equal(snaps.notIncluded.items[0].key, "discuss_service_issues");
  assert.equal(snaps.notIncluded.items[0].outcome, "not_included");
});

test("resolvePermissionLabels prefers snapshot wording over live locked labels", () => {
  const labels = resolvePermissionLabels(
    ["receive_duplicate_statements"],
    {
      catalog_version_id: null,
      catalog_version: null,
      authority_type_key: "financial_poa",
      content_hash: null,
      legacy_provenance: true,
      items: [{
        key: "receive_duplicate_statements",
        kind: "act",
        source: "platform",
        label: "Frozen label from decide time",
        help: "",
        label_version: 1,
        outcome: "permitted",
      }],
    },
  );
  assert.deepEqual(labels, ["Frozen label from decide time"]);
  assert.equal(lockedPermissionLabel("receive_duplicate_statements"), "Get copies of account statements");
});

test("acceptedLabelsFromReceiptSnapshot reads frozen receipt payload", () => {
  const labels = acceptedLabelsFromReceiptSnapshot({
    accepted_permissions_snapshot: {
      authority_type_key: "financial_poa",
      legacy_provenance: true,
      items: [{
        key: "discuss_service_issues",
        kind: "act",
        source: "platform",
        label: "Talk with the bank about the account",
        help: "help",
        label_version: 1,
        outcome: "permitted",
      }],
    },
  });
  assert.deepEqual(labels, ["Talk with the bank about the account"]);
  assert.equal(acceptedLabelsFromReceiptSnapshot({}), null);
});

test("parsePublishedPermissionCatalog reads per-kind offered items", () => {
  const parsed = parsePublishedPermissionCatalog({
    organization_id: "org-1",
    authority_type_key: "financial_poa",
    pack_ready: true,
    published: {
      id: "ver-1",
      version: "2026.9.15.2",
      content_hash: "a".repeat(64),
      platform_semantic_version: "2026.9.15.1",
      jurisdiction_package_key: "US-NY",
      jurisdiction_package_version: "2026.1",
      published_at: "2026-09-15T12:00:00Z",
      published_by: null,
      publish_reason: "Save for new requests",
    },
    items: [{
      permission_key: "receive_duplicate_statements",
      kind: "act",
      source: "platform",
      offered: true,
      label: "Get copies of account statements",
      help: "help",
      group_key: "information",
      risk_tier: 1,
      availability: "production",
      label_version: 1,
    }],
  });
  assert.equal(parsed?.authority_type_key, "financial_poa");
  assert.equal(parsed?.published?.version, "2026.9.15.2");
  assert.equal(parsed?.items.length, 1);
  assert.equal(parsePublishedPermissionCatalog(null), null);
});
