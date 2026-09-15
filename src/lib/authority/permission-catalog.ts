/**
 * Permission catalog Phase 0 helpers.
 * Live claims remain NY financial POA + these two locked acts until acceptance bars green.
 * UI copy: never say "catalog" — use "What people may ask for" / "What the bank said yes to".
 */

import type { HostedActionKey } from "./hosted-records.ts";

export const FINANCIAL_POA_AUTHORITY_TYPE_KEY = "financial_poa" as const;

/** Locked P1 labels (Compliance + Design 2026-09-15). Eng keys never shown in UI. */
export const LOCKED_P1_PERMISSIONS = {
  receive_duplicate_statements: {
    key: "receive_duplicate_statements",
    kind: "act",
    label: "Get copies of account statements",
    help: "The helper asks the bank to send statement copies for this account.",
    labelVersion: 1,
  },
  discuss_service_issues: {
    key: "discuss_service_issues",
    kind: "act",
    label: "Talk with the bank about the account",
    help: "The helper may call or visit to ask ordinary service questions. This does not mean they can move money.",
    labelVersion: 1,
  },
} as const satisfies Record<
  HostedActionKey,
  {
    key: HostedActionKey;
    kind: "act";
    label: string;
    help: string;
    labelVersion: number;
  }
>;

export type PermissionSnapshotItem = {
  key: string;
  kind: "act" | "channel";
  source: "platform" | "institution";
  label: string;
  help: string;
  label_version: number;
  outcome: "permitted" | "not_included" | "accepted_with_limits" | null;
};

export type PermissionsSnapshot = {
  catalog_version_id: string | null;
  catalog_version: string | null;
  authority_type_key: string;
  content_hash: string | null;
  legacy_provenance: boolean;
  items: PermissionSnapshotItem[];
};

/** Offered acts for live NY financial POA (Phase 0 = locked two only). */
export function offeredFinancialPoaPermissions() {
  return (Object.keys(LOCKED_P1_PERMISSIONS) as HostedActionKey[]).map((key) => LOCKED_P1_PERMISSIONS[key]);
}

export function lockedPermissionLabel(key: string): string | null {
  if (key in LOCKED_P1_PERMISSIONS) {
    return LOCKED_P1_PERMISSIONS[key as HostedActionKey].label;
  }
  return null;
}

export function buildPermissionsSnapshot(input: {
  keys: string[];
  authorityTypeKey?: string;
  catalogVersionId?: string | null;
  catalogVersion?: string | null;
  contentHash?: string | null;
  outcomes?: Record<string, PermissionSnapshotItem["outcome"]>;
  legacyProvenance?: boolean;
}): PermissionsSnapshot {
  const items: PermissionSnapshotItem[] = [];
  for (const key of [...new Set(input.keys)]) {
    const locked = key in LOCKED_P1_PERMISSIONS ? LOCKED_P1_PERMISSIONS[key as HostedActionKey] : null;
    items.push({
      key,
      kind: locked?.kind ?? "act",
      source: "platform",
      label: locked?.label ?? key,
      help: locked?.help ?? "",
      label_version: locked?.labelVersion ?? 1,
      outcome: input.outcomes?.[key] ?? null,
    });
  }
  return {
    catalog_version_id: input.catalogVersionId ?? null,
    catalog_version: input.catalogVersion ?? null,
    authority_type_key: input.authorityTypeKey ?? FINANCIAL_POA_AUTHORITY_TYPE_KEY,
    content_hash: input.contentHash ?? null,
    legacy_provenance: input.legacyProvenance ?? true,
    items,
  };
}

export function buildDecisionPermissionSnapshots(input: {
  requestedKeys: string[];
  acceptedKeys: string[];
  outcome: "accepted" | "accepted_with_limits" | "rejected";
  catalogVersionId?: string | null;
  catalogVersion?: string | null;
  contentHash?: string | null;
}) {
  const accepted = new Set(input.acceptedKeys);
  const outcomes: Record<string, PermissionSnapshotItem["outcome"]> = {};
  for (const key of input.requestedKeys) {
    if (accepted.has(key)) {
      outcomes[key] = input.outcome === "accepted_with_limits" ? "accepted_with_limits" : "permitted";
    } else {
      outcomes[key] = "not_included";
    }
  }
  const requested = buildPermissionsSnapshot({
    keys: input.requestedKeys,
    catalogVersionId: input.catalogVersionId,
    catalogVersion: input.catalogVersion,
    contentHash: input.contentHash,
    outcomes,
    legacyProvenance: !input.catalogVersionId,
  });
  const acceptedSnapshot: PermissionsSnapshot = {
    ...requested,
    items: requested.items.filter((item) => item.outcome === "permitted" || item.outcome === "accepted_with_limits"),
  };
  const notIncludedSnapshot: PermissionsSnapshot = {
    ...requested,
    items: requested.items.filter((item) => item.outcome === "not_included"),
  };
  return { requested, accepted: acceptedSnapshot, notIncluded: notIncludedSnapshot };
}

/** Prefer frozen snapshot labels; fall back to locked P1 then raw key. */
export function resolvePermissionLabels(
  keys: string[],
  snapshot: PermissionsSnapshot | null | undefined,
): string[] {
  const byKey = new Map((snapshot?.items ?? []).map((item) => [item.key, item.label]));
  return keys.map((key) => byKey.get(key) ?? lockedPermissionLabel(key) ?? key);
}

export function permissionsSnapshotFromUnknown(value: unknown): PermissionsSnapshot | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (!Array.isArray(row.items)) return null;
  const items: PermissionSnapshotItem[] = [];
  for (const entry of row.items) {
    if (!entry || typeof entry !== "object") continue;
    const item = entry as Record<string, unknown>;
    if (typeof item.key !== "string" || typeof item.label !== "string") continue;
    const kind = item.kind === "channel" ? "channel" : "act";
    const source = item.source === "institution" ? "institution" : "platform";
    const outcome =
      item.outcome === "permitted"
      || item.outcome === "not_included"
      || item.outcome === "accepted_with_limits"
        ? item.outcome
        : null;
    items.push({
      key: item.key,
      kind,
      source,
      label: item.label,
      help: typeof item.help === "string" ? item.help : "",
      label_version: typeof item.label_version === "number" ? item.label_version : 1,
      outcome,
    });
  }
  return {
    catalog_version_id: typeof row.catalog_version_id === "string" ? row.catalog_version_id : null,
    catalog_version: typeof row.catalog_version === "string" ? row.catalog_version : null,
    authority_type_key: typeof row.authority_type_key === "string" ? row.authority_type_key : FINANCIAL_POA_AUTHORITY_TYPE_KEY,
    content_hash: typeof row.content_hash === "string" ? row.content_hash : null,
    legacy_provenance: row.legacy_provenance === true,
    items,
  };
}

/** Read accepted labels from a decision receipt_snapshot jsonb. */
export function acceptedLabelsFromReceiptSnapshot(receiptSnapshot: Record<string, unknown> | null | undefined): string[] | null {
  if (!receiptSnapshot) return null;
  const snap = permissionsSnapshotFromUnknown(receiptSnapshot.accepted_permissions_snapshot);
  if (snap && snap.items.length > 0) return snap.items.map((item) => item.label);
  return null;
}
