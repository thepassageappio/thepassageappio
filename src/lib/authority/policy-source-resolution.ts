import { createHash } from "node:crypto";
import { canonicalPolicyJson, type PolicyJson } from "./policy-snapshot.ts";

export type PolicySourceKind = "platform" | "jurisdiction" | "institution";
export type PolicySourceReference = { key: string; version: string; sha256: string };
export type PolicySourceVersion = {
  format: "passage-policy-source-v1";
  kind: PolicySourceKind;
  key: string;
  version: string;
  organizationId: string | null;
  jurisdiction: string;
  authorityType: string;
  publishedAt: string;
  effectiveFrom: string;
  dependencies: Partial<Record<"platform" | "jurisdiction", PolicySourceReference>>;
  content: { [key: string]: PolicyJson };
};
export type StoredPolicySource = { canonicalJson: string; sha256: string };
export type PolicySourceSelection = {
  organizationId: string;
  jurisdiction: string;
  authorityType: string;
  at: string;
  keys: Record<PolicySourceKind, string>;
};
const kinds: PolicySourceKind[] = ["platform", "jurisdiction", "institution"];
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
function fail(message: string): never { throw new Error(`policy_source_invalid: ${message}`); }
function object(value: unknown, keys: string[]): asserts value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value) ||
    Object.keys(value).sort().join("|") !== [...keys].sort().join("|")) fail("Unexpected source fields.");
}
function text(value: unknown): asserts value is string {
  if (typeof value !== "string" || !value.length || value.length > 200 || value.trim() !== value || /[\u0000-\u001f\u007f]/.test(value)) fail("Source details are missing or invalid.");
}
function timestamp(value: unknown): asserts value is string {
  text(value);
  const date = new Date(value);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) || !Number.isFinite(date.getTime()) || date.toISOString() !== value) fail("Use an exact UTC date and time.");
}
function validate(value: unknown): asserts value is PolicySourceVersion {
  object(value, ["format", "kind", "key", "version", "organizationId", "jurisdiction", "authorityType", "publishedAt", "effectiveFrom", "dependencies", "content"]);
  if (value.format !== "passage-policy-source-v1" || !kinds.includes(value.kind as PolicySourceKind)) fail("Unknown source format or kind.");
  for (const key of ["key", "version", "jurisdiction", "authorityType"]) text(value[key]);
  if (value.kind === "institution" ? typeof value.organizationId !== "string" || !uuid.test(value.organizationId) : value.organizationId !== null) fail("Source ownership does not match its kind.");
  timestamp(value.publishedAt); timestamp(value.effectiveFrom);
  if (value.publishedAt > value.effectiveFrom) fail("A source cannot take effect before it was published.");
  const dependencyKinds = value.kind === "platform" ? [] : value.kind === "jurisdiction" ? ["platform"] : ["platform", "jurisdiction"];
  object(value.dependencies, dependencyKinds);
  for (const reference of Object.values(value.dependencies)) {
    object(reference, ["key", "version", "sha256"]);
    text(reference.key); text(reference.version);
    if (typeof reference.sha256 !== "string" || !/^[0-9a-f]{64}$/.test(reference.sha256)) fail("A source dependency needs its exact saved hash.");
  }
  if (!value.content || typeof value.content !== "object" || Array.isArray(value.content) || !Object.keys(value.content).length) fail("Source rules are missing.");
}

/** Encoding only: this does not authorize publication or establish source trust. */
export function capturePolicySource(value: PolicySourceVersion): StoredPolicySource {
  const canonicalJson = canonicalPolicyJson(value);
  validate(JSON.parse(canonicalJson));
  return { canonicalJson, sha256: createHash("sha256").update(canonicalJson, "utf8").digest("hex") };
}

export function readPolicySource(stored: StoredPolicySource): PolicySourceVersion {
  object(stored, ["canonicalJson", "sha256"]);
  if (typeof stored.canonicalJson !== "string" || Buffer.byteLength(stored.canonicalJson, "utf8") > 1_000_000 ||
    typeof stored.sha256 !== "string" || !/^[0-9a-f]{64}$/.test(stored.sha256)) fail("The saved source is invalid.");
  const value: unknown = JSON.parse(stored.canonicalJson);
  const canonical = canonicalPolicyJson(value);
  if (canonical !== stored.canonicalJson || createHash("sha256").update(canonical, "utf8").digest("hex") !== stored.sha256) fail("The saved source does not match its hash.");
  validate(value);
  return value;
}

/**
 * Call only with a complete history from a trusted server-side source registry.
 * Browser-supplied records or filtered histories cannot establish the current version.
 * Dependency pins reject unprepared version combinations; they do not establish
 * semantic compatibility, registry authenticity or counsel approval.
 */
export function resolvePolicySources(trustedHistory: readonly StoredPolicySource[], selection: PolicySourceSelection) {
  const query: unknown = JSON.parse(canonicalPolicyJson(selection));
  object(query, ["organizationId", "jurisdiction", "authorityType", "at", "keys"]);
  if (typeof query.organizationId !== "string" || !uuid.test(query.organizationId)) fail("Choose an institution.");
  text(query.jurisdiction); text(query.authorityType); timestamp(query.at);
  object(query.keys, kinds); for (const kind of kinds) text(query.keys[kind]);
  if (!Array.isArray(trustedHistory) || trustedHistory.length > 10_000) fail("The source history is invalid.");
  const history = trustedHistory.map(readPolicySource);
  const resolved = {} as Record<PolicySourceKind, { source: PolicySourceVersion; sha256: string }>;
  for (const kind of kinds) {
    const candidates = history.filter(source => source.kind === kind && source.key === (query.keys as Record<string, unknown>)[kind] &&
      source.organizationId === (kind === "institution" ? query.organizationId : null) &&
      source.jurisdiction === query.jurisdiction && source.authorityType === query.authorityType);
    const versions = new Set<string>(), dates = new Set<string>();
    for (const source of candidates) {
      if (versions.has(source.version) || dates.has(source.effectiveFrom)) fail("The source history has conflicting versions.");
      versions.add(source.version); dates.add(source.effectiveFrom);
    }
    const current = candidates.filter(source => source.effectiveFrom <= (query.at as string) && source.publishedAt <= (query.at as string))
      .sort((left, right) => left.effectiveFrom < right.effectiveFrom ? 1 : -1)[0];
    if (!current) fail(`No ${kind} rules are in effect for this request.`);
    resolved[kind] = { source: current, sha256: capturePolicySource(current).sha256 };
  }
  for (const kind of kinds) {
    for (const dependencyKind of ["platform", "jurisdiction"] as const) {
      const expected = resolved[kind].source.dependencies[dependencyKind];
      if (!expected) continue;
      const actual = resolved[dependencyKind];
      if (expected.key !== actual.source.key || expected.version !== actual.source.version || expected.sha256 !== actual.sha256) {
        fail(`The ${kind} rules need review against the current ${dependencyKind} version.`);
      }
      if (actual.source.publishedAt > resolved[kind].source.publishedAt) fail("A source cannot depend on rules published after it.");
    }
  }
  return { stage: "sources-only" as const, ...resolved };
}
