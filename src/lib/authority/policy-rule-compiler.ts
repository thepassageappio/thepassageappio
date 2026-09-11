import { canonicalPolicyJson } from "./policy-snapshot.ts";

type Source = "platform" | "jurisdiction" | "institution";
type Action = {
  key: string; label: string; meaning: string; category: string; accountTypes: string[];
  riskTier: "low" | "medium" | "high"; reviewGuidance: string; enabled: boolean;
  unavailableReason: string | null; source: Source;
};
type Evidence = {
  key: string; label: string; purpose: string; collectionMethod: "upload" | "attestation" | "provider";
  retentionClass: string; reviewerRole: "owner" | "admin" | "reviewer";
  required: boolean; lockedRequired: boolean; source: Source;
};
export type CompiledPolicyRules = {
  stage: "action-evidence-only";
  organizationId: string;
  actions: Array<Action & { labelSource: Source; availabilitySource: Source }>;
  evidence: Array<Evidence & { labelSource: Source; requirementSource: Source }>;
};

export class PolicyRuleValidationError extends Error {
  readonly path: string;
  constructor(path: string, message: string) { super(message); this.path = path; this.name = "PolicyRuleValidationError"; }
}
function invalid(path: string, message = "Check this field and try again."): never {
  throw new PolicyRuleValidationError(path, message);
}
function shape(value: unknown, required: string[], optional: string[], path: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) invalid(path);
  const record = value as Record<string, unknown>;
  if (required.some(key => !Object.hasOwn(record, key))) invalid(path, "Fill in all required fields.");
  if (Object.keys(record).some(key => !required.includes(key) && !optional.includes(key))) {
    invalid(path, "This change includes a field that cannot be edited here.");
  }
  return record;
}
function text(value: unknown, path: string): string {
  if (typeof value !== "string" || value.trim() !== value || !value || value.length > 2000 || /[\u0000-\u001f\u007f]/.test(value)) invalid(path, "Enter clear text without blank or hidden characters.");
  return value;
}
function boolean(value: unknown, path: string): boolean {
  if (typeof value !== "boolean") invalid(path, "Choose yes or no.");
  return value;
}
function choice<T extends string>(value: unknown, choices: readonly T[], path: string): T {
  if (typeof value !== "string" || !choices.includes(value as T)) invalid(path, "Choose one of the available options.");
  return value as T;
}
function list(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value) || value.length > 500) invalid(path);
  return value;
}
function key(value: unknown, path: string, organizationId?: string): string {
  const result = text(value, path);
  const prefix = organizationId ? `institution:${organizationId}:` : "";
  const suffix = result.slice(prefix.length);
  if (!result.startsWith(prefix) || !/^[a-z][a-z0-9_]{0,79}$/.test(suffix)) {
    invalid(path, organizationId ? "Use a custom code that belongs to this organization." : "Use an existing standard code.");
  }
  return result;
}
function unique<T extends { key: string }>(values: T[], path: string): Map<string, T> {
  const map = new Map<string, T>();
  for (const value of values) {
    if (map.has(value.key)) invalid(path, "Each code can appear only once.");
    map.set(value.key, value);
  }
  return map;
}
const actionFields = ["key", "label", "meaning", "category", "accountTypes", "riskTier", "reviewGuidance"];
const evidenceFields = ["key", "label", "purpose", "collectionMethod", "retentionClass", "reviewerRole", "required"];
function action(value: unknown, path: string, organizationId?: string): Action {
  const row = shape(value, [...actionFields, ...(organizationId ? [] : ["enabled", "unavailableReason", "source"])], [], path);
  const accountTypes = list(row.accountTypes, `${path}/accountTypes`).map((item, index) => text(item, `${path}/accountTypes/${index}`));
  if (!accountTypes.length || new Set(accountTypes).size !== accountTypes.length) invalid(`${path}/accountTypes`, "Choose at least one account type, with no repeats.");
  const enabled = organizationId ? true : boolean(row.enabled, `${path}/enabled`);
  const unavailableReason = organizationId || row.unavailableReason === null ? null : text(row.unavailableReason, `${path}/unavailableReason`);
  if (unavailableReason && enabled) invalid(path, "An unavailable action cannot be enabled.");
  return {
    key: key(row.key, `${path}/key`, organizationId), label: text(row.label, `${path}/label`),
    meaning: text(row.meaning, `${path}/meaning`), category: text(row.category, `${path}/category`),
    accountTypes: accountTypes.sort(), riskTier: choice(row.riskTier, ["low", "medium", "high"], `${path}/riskTier`),
    reviewGuidance: text(row.reviewGuidance, `${path}/reviewGuidance`), enabled, unavailableReason,
    source: organizationId ? "institution" : choice(row.source, ["platform", "jurisdiction"], `${path}/source`),
  };
}
function evidence(value: unknown, path: string, organizationId?: string): Evidence {
  const row = shape(value, [...evidenceFields, ...(organizationId ? [] : ["lockedRequired", "source"])], [], path);
  const required = boolean(row.required, `${path}/required`);
  const lockedRequired = organizationId ? false : boolean(row.lockedRequired, `${path}/lockedRequired`);
  if (lockedRequired && !required) invalid(path, "A locked requirement must remain required.");
  return {
    key: key(row.key, `${path}/key`, organizationId), label: text(row.label, `${path}/label`),
    purpose: text(row.purpose, `${path}/purpose`), retentionClass: text(row.retentionClass, `${path}/retentionClass`),
    collectionMethod: choice(row.collectionMethod, ["upload", "attestation", "provider"], `${path}/collectionMethod`),
    reviewerRole: choice(row.reviewerRole, ["owner", "admin", "reviewer"], `${path}/reviewerRole`), required, lockedRequired,
    source: organizationId ? "institution" : choice(row.source, ["platform", "jurisdiction"], `${path}/source`),
  };
}

/**
 * Compile only action/evidence rules. The catalog must come from a trusted, versioned
 * server source, never the institution's submitted form. This is not publication,
 * authentication, complete policy validation, or a legal-validity decision.
 */
export function compilePolicyRules(organizationId: string, trustedCatalog: unknown, submittedDraft: unknown): CompiledPolicyRules {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(organizationId)) invalid("/organizationId");
  // Reject getters, unsupported JSON and excess payloads; detach inputs before merging.
  let catalogInput: unknown, draftInput: unknown;
  try {
    catalogInput = JSON.parse(canonicalPolicyJson(trustedCatalog));
    draftInput = JSON.parse(canonicalPolicyJson(submittedDraft));
  } catch { invalid("/", "We could not read these rules. Check the entered values."); }
  const catalog = shape(catalogInput, ["actions", "evidence"], [], "/catalog");
  const draft = shape(draftInput, ["actionOverrides", "evidenceOverrides", "customActions", "customEvidence"], [], "/draft");
  const actions = unique(list(catalog.actions, "/catalog/actions").map((value, index) => action(value, `/catalog/actions/${index}`)), "/catalog/actions");
  const requirements = unique(list(catalog.evidence, "/catalog/evidence").map((value, index) => evidence(value, `/catalog/evidence/${index}`)), "/catalog/evidence");
  const compiledActions = new Map([...actions].map(([id, value]) => [id, { ...value, labelSource: value.source, availabilitySource: value.source }]));
  const compiledEvidence = new Map([...requirements].map(([id, value]) => [id, { ...value, labelSource: value.source, requirementSource: value.source }]));
  for (const [field, setting] of [["actionOverrides", "enabled"], ["evidenceOverrides", "required"]] as const) {
    const seen = new Set<string>();
    list(draft[field], `/draft/${field}`).forEach((value, index) => {
      const path = `/draft/${field}/${index}`, row = shape(value, ["key"], [setting, "label"], path), id = key(row.key, `${path}/key`);
      if (seen.has(id)) invalid(path, "Each code can appear only once.");
      seen.add(id);
      if (setting === "enabled") {
        const rule = compiledActions.get(id); if (!rule) invalid(path, "This action is not in the selected catalog.");
        if (Object.hasOwn(row, "enabled")) {
          const enabled = boolean(row.enabled, `${path}/enabled`);
          if (enabled && rule.unavailableReason) invalid(path, "This action is unavailable under the selected rules.");
          if (enabled !== rule.enabled) { rule.enabled = enabled; rule.availabilitySource = "institution"; }
        }
        if (Object.hasOwn(row, "label")) { rule.label = text(row.label, `${path}/label`); rule.labelSource = "institution"; }
      } else {
        const rule = compiledEvidence.get(id); if (!rule) invalid(path, "This requirement is not in the selected catalog.");
        if (Object.hasOwn(row, "required")) {
          const required = boolean(row.required, `${path}/required`);
          if (!required && rule.lockedRequired) invalid(path, "This requirement cannot be removed.");
          if (required !== rule.required) { rule.required = required; rule.requirementSource = "institution"; }
        }
        if (Object.hasOwn(row, "label")) { rule.label = text(row.label, `${path}/label`); rule.labelSource = "institution"; }
      }
    });
  }
  for (const rule of unique(list(draft.customActions, "/draft/customActions").map((value, index) => action(value, `/draft/customActions/${index}`, organizationId)), "/draft/customActions").values()) {
    compiledActions.set(rule.key, { ...rule, labelSource: "institution", availabilitySource: "institution" });
  }
  for (const rule of unique(list(draft.customEvidence, "/draft/customEvidence").map((value, index) => evidence(value, `/draft/customEvidence/${index}`, organizationId)), "/draft/customEvidence").values()) {
    compiledEvidence.set(rule.key, { ...rule, labelSource: "institution", requirementSource: "institution" });
  }
  return {
    stage: "action-evidence-only", organizationId,
    actions: [...compiledActions.values()].sort((a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0),
    evidence: [...compiledEvidence.values()].sort((a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0),
  };
}
