import { createHash } from "node:crypto";

export type PolicyJson = null | boolean | number | string | PolicyJson[] | { [key: string]: PolicyJson };
export type PolicySnapshotBody = {
  format: "passage-policy-snapshot-v1";
  organizationId: string;
  policyVersion: string;
  effectiveFrom: string;
  sources: {
    platform: { key: string; version: string };
    jurisdiction: { key: string; version: string };
    institution: { key: string; version: string };
  };
  // The compiler must supply every effective rule and its provenance here.
  // JSON integrity does not establish semantic compatibility or legal approval.
  content: { [key: string]: PolicyJson };
};
export type StoredPolicySnapshot = { canonicalJson: string; sha256: string };

/** Read the exact transport envelope without invoking property getters. */
export function readStoredPolicyEnvelope(value: unknown): StoredPolicySnapshot {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail();
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) fail();
  const keys = Reflect.ownKeys(value);
  if (keys.length !== 2 || !keys.includes("canonicalJson") || !keys.includes("sha256")) fail();
  const canonical = Object.getOwnPropertyDescriptor(value, "canonicalJson");
  const hash = Object.getOwnPropertyDescriptor(value, "sha256");
  if (!canonical?.enumerable || !("value" in canonical) || typeof canonical.value !== "string" ||
      !hash?.enumerable || !("value" in hash) || typeof hash.value !== "string" ||
      Buffer.byteLength(canonical.value, "utf8") > 1_000_000 || !/^[a-f0-9]{64}$/.test(hash.value)) fail();
  return { canonicalJson: canonical.value, sha256: hash.value };
}

function fail(): never { throw new Error("policy_snapshot_invalid"); }

/** Project-specific canonical encoding. Arrays retain their order; object keys sort by UTF-16 code unit. */
export function canonicalPolicyJson(value: unknown): string {
  const ancestors = new Set<object>();
  let nodes = 0;
  function encode(input: unknown, depth: number): string {
    if (++nodes > 50_000 || depth > 64) return fail();
    if (input === null || typeof input === "boolean") return JSON.stringify(input);
    if (typeof input === "string") {
      if (!input.isWellFormed()) return fail();
      return JSON.stringify(input);
    }
    if (typeof input === "number") {
      if (!Number.isFinite(input) || Object.is(input, -0)) return fail();
      return JSON.stringify(input);
    }
    if (typeof input !== "object" || ancestors.has(input)) return fail();
    ancestors.add(input);
    try {
      if (Array.isArray(input)) {
        if (Reflect.ownKeys(input).length !== input.length + 1) return fail();
        const items: string[] = [];
        for (let index = 0; index < input.length; index++) {
          const property = Object.getOwnPropertyDescriptor(input, String(index));
          if (!property || !("value" in property)) return fail();
          items.push(encode(property.value, depth + 1));
        }
        return `[${items.join(",")}]`;
      }
      if (Object.getPrototypeOf(input) !== Object.prototype && Object.getPrototypeOf(input) !== null) return fail();
      const keys = Reflect.ownKeys(input);
      if (keys.some(key => typeof key !== "string")) return fail();
      return `{${(keys as string[]).sort().map(key => {
        const property = Object.getOwnPropertyDescriptor(input, key);
        if (!key.isWellFormed() || !property?.enumerable || !("value" in property)) return fail();
        return `${JSON.stringify(key)}:${encode(property.value, depth + 1)}`;
      }).join(",")}}`;
    } finally {
      ancestors.delete(input);
    }
  }
  const encoded = encode(value, 0);
  if (Buffer.byteLength(encoded, "utf8") > 1_000_000) return fail();
  return encoded;
}

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function exactKeys(value: Record<string, unknown>, keys: string[]) {
  return Object.keys(value).sort().join("\n") === [...keys].sort().join("\n");
}
function text(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 200 && value.trim() === value;
}
function validateBody(value: unknown): asserts value is PolicySnapshotBody {
  if (!object(value) || !exactKeys(value, ["format", "organizationId", "policyVersion", "effectiveFrom", "sources", "content"])) fail();
  if (value.format !== "passage-policy-snapshot-v1" || !text(value.organizationId) ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(value.organizationId) ||
      !text(value.policyVersion) || !text(value.effectiveFrom)) fail();
  const effective = new Date(value.effectiveFrom);
  if (!Number.isFinite(effective.getTime()) || effective.toISOString() !== value.effectiveFrom) fail();
  if (!object(value.sources) || !exactKeys(value.sources, ["platform", "jurisdiction", "institution"])) fail();
  for (const source of Object.values(value.sources)) {
    if (!object(source) || !exactKeys(source, ["key", "version"]) || !text(source.key) || !text(source.version)) fail();
  }
  if (!object(value.content) || Object.keys(value.content).length === 0) fail();
}

/** Captures detached bytes; never holds a reference to the caller's mutable policy. */
export function capturePolicySnapshot(body: PolicySnapshotBody): StoredPolicySnapshot {
  const canonicalJson = canonicalPolicyJson(body);
  validateBody(JSON.parse(canonicalJson));
  return { canonicalJson, sha256: createHash("sha256").update(canonicalJson, "utf8").digest("hex") };
}

export function readPolicySnapshot(snapshot: StoredPolicySnapshot): PolicySnapshotBody {
  snapshot = readStoredPolicyEnvelope(snapshot);
  if (createHash("sha256").update(snapshot.canonicalJson, "utf8").digest("hex") !== snapshot.sha256) {
    throw new Error("policy_snapshot_hash_mismatch");
  }
  let body: unknown;
  try { body = JSON.parse(snapshot.canonicalJson); } catch { return fail(); }
  validateBody(body);
  if (canonicalPolicyJson(body) !== snapshot.canonicalJson) fail();
  return body;
}

export type PolicySnapshotChange =
  | { path: string; kind: "added"; after: PolicyJson }
  | { path: string; kind: "removed"; before: PolicyJson }
  | { path: string; kind: "changed"; before: PolicyJson; after: PolicyJson };

/** Exact saved-content comparison, not permission to publish, activate or rebase. */
export function comparePolicySnapshots(before: StoredPolicySnapshot, after: StoredPolicySnapshot): PolicySnapshotChange[] {
  const oldBody = readPolicySnapshot(before), newBody = readPolicySnapshot(after);
  if (oldBody.organizationId !== newBody.organizationId) throw new Error("policy_snapshot_organization_mismatch");
  const changes: PolicySnapshotChange[] = [];
  function diff(oldValue: PolicyJson, newValue: PolicyJson, path: string) {
    if (canonicalPolicyJson(oldValue) === canonicalPolicyJson(newValue)) return;
    if (object(oldValue) && object(newValue)) {
      for (const key of [...new Set([...Object.keys(oldValue), ...Object.keys(newValue)])].sort()) {
        const childPath = `${path}/${key.replaceAll("~", "~0").replaceAll("/", "~1")}`;
        if (!Object.hasOwn(oldValue, key)) changes.push({ path: childPath, kind: "added", after: newValue[key] as PolicyJson });
        else if (!Object.hasOwn(newValue, key)) changes.push({ path: childPath, kind: "removed", before: oldValue[key] as PolicyJson });
        else diff(oldValue[key] as PolicyJson, newValue[key] as PolicyJson, childPath);
      }
    } else {
      // Arrays compare as whole ordered values; never invent identities from array positions.
      changes.push({ path, kind: "changed", before: oldValue, after: newValue });
    }
  }
  diff(oldBody, newBody, "");
  return changes;
}
