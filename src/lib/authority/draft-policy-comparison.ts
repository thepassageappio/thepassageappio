import { comparePolicySnapshots, readPolicySnapshot, type StoredPolicySnapshot } from "./policy-snapshot.ts";

/**
 * Draft-only comparison, not permission to activate or rebase.
 * The caller must supply the authenticated organization, server time and current
 * approved publication under the same transaction lock as the eventual command.
 * Never substitute this result for an activated request's immutable snapshot.
 */
export function compareDraftPolicy(
  organizationId: string,
  serverTime: string,
  saved: StoredPolicySnapshot,
  current: StoredPolicySnapshot,
) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(organizationId)) {
    throw new Error("draft_policy_invalid_organization");
  }
  const time = new Date(serverTime);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(serverTime) ||
      !Number.isFinite(time.getTime()) || time.toISOString() !== serverTime) {
    throw new Error("draft_policy_invalid_time");
  }
  const before = readPolicySnapshot(saved), after = readPolicySnapshot(current);
  if (before.organizationId !== organizationId || after.organizationId !== organizationId) {
    throw new Error("draft_policy_organization_mismatch");
  }
  const oldTime = new Date(before.effectiveFrom).getTime(), newTime = new Date(after.effectiveFrom).getTime();
  if (oldTime > time.getTime() || newTime > time.getTime()) throw new Error("draft_policy_not_effective");
  if (newTime < oldTime) throw new Error("draft_policy_publication_went_backwards");
  const changes = comparePolicySnapshots(saved, current);
  return {
    stage: "draft-comparison-only" as const,
    status: changes.length ? "review-required" as const : "current" as const,
    savedHash: saved.sha256,
    currentHash: current.sha256,
    changes,
  };
}
