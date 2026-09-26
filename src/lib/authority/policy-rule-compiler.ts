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

type PolicyChannel = {
  key: string; label: string; enabled: boolean; accessLevel: "view" | "transaction";
  separateIdentity: boolean; requiresMfa: boolean; requiresAcknowledgment: boolean;
  actionKeys: string[]; unavailableReason: string | null; source: Source;
  availabilitySource: Source; securitySource: Source;
};
type PolicyControl = {
  key: string; kind: "max_amount" | "max_duration_days" | "min_approvers" | "max_count";
  value: number; currency: string | null; windowHours: number | null; actionKeys: string[];
  locked: boolean; source: Source; valueSource: Source;
};
function positiveInteger(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0) invalid(path, "Enter a positive whole number.");
  return value;
}
function actionReferences(value: unknown, actions: Set<string>, path: string): string[] {
  const values = list(value, path).map((item, index) => text(item, `${path}/${index}`));
  if (!values.length || new Set(values).size !== values.length || values.some(item => !actions.has(item))) {
    invalid(path, "Choose existing actions, with no repeats.");
  }
  return values.sort();
}

/** Combines structural rule sections; still requires trusted source resolution and publication validation. */
export function compilePolicyConfiguration(organizationId: string, trustedCatalog: unknown, submittedDraft: unknown) {
  let catalogInput: unknown, draftInput: unknown;
  try {
    catalogInput = JSON.parse(canonicalPolicyJson(trustedCatalog));
    draftInput = JSON.parse(canonicalPolicyJson(submittedDraft));
  } catch { invalid("/", "We could not read these rules. Check the entered values."); }
  const catalog = shape(catalogInput, ["actions", "evidence", "channels", "controls"], [], "/catalog");
  const draft = shape(draftInput, ["actionOverrides", "evidenceOverrides", "customActions", "customEvidence", "channelOverrides", "controlOverrides"], [], "/draft");
  const base = compilePolicyRules(organizationId, { actions: catalog.actions, evidence: catalog.evidence }, {
    actionOverrides: draft.actionOverrides, evidenceOverrides: draft.evidenceOverrides,
    customActions: draft.customActions, customEvidence: draft.customEvidence,
  });
  const actionKeys = new Set(base.actions.map(item => item.key));
  const channels = unique(list(catalog.channels, "/catalog/channels").map((value, index): PolicyChannel => {
    const path = `/catalog/channels/${index}`;
    const row = shape(value, ["key", "label", "enabled", "accessLevel", "separateIdentity", "requiresMfa", "requiresAcknowledgment", "actionKeys", "unavailableReason", "source"], [], path);
    const source = choice(row.source, ["platform", "jurisdiction"], `${path}/source`);
    return {
      key: choice(row.key, ["branch", "phone", "online", "mobile", "api"], `${path}/key`),
      label: text(row.label, `${path}/label`), enabled: boolean(row.enabled, `${path}/enabled`),
      accessLevel: choice(row.accessLevel, ["view", "transaction"], `${path}/accessLevel`),
      separateIdentity: boolean(row.separateIdentity, `${path}/separateIdentity`),
      requiresMfa: boolean(row.requiresMfa, `${path}/requiresMfa`),
      requiresAcknowledgment: boolean(row.requiresAcknowledgment, `${path}/requiresAcknowledgment`),
      actionKeys: actionReferences(row.actionKeys, actionKeys, `${path}/actionKeys`),
      unavailableReason: row.unavailableReason === null ? null : text(row.unavailableReason, `${path}/unavailableReason`),
      source, availabilitySource: source, securitySource: source,
    };
  }), "/catalog/channels");
  const channelOverrides = unique(list(draft.channelOverrides, "/draft/channelOverrides").map((value, index) => {
    const path = `/draft/channelOverrides/${index}`, row = shape(value, ["key"], ["enabled", "requiresMfa"], path);
    return { key: text(row.key, `${path}/key`), row, path };
  }), "/draft/channelOverrides");
  for (const { key: id, row, path } of channelOverrides.values()) {
    const channel = channels.get(id); if (!channel) invalid(path, "This channel is not in the selected catalog.");
    if (Object.hasOwn(row, "enabled")) {
      const enabled = boolean(row.enabled, `${path}/enabled`);
      if (enabled !== channel.enabled) { channel.enabled = enabled; channel.availabilitySource = "institution"; }
    }
    if (Object.hasOwn(row, "requiresMfa")) {
      const requiresMfa = boolean(row.requiresMfa, `${path}/requiresMfa`);
      if (!requiresMfa && channel.requiresMfa) invalid(path, "This security check cannot be removed.");
      if (requiresMfa !== channel.requiresMfa) { channel.requiresMfa = requiresMfa; channel.securitySource = "institution"; }
    }
  }
  for (const channel of channels.values()) {
    const path = `/channels/${channel.key}`;
    if (channel.enabled && channel.unavailableReason) invalid(path, "This channel is unavailable under the selected rules.");
    if (channel.enabled && ["online", "mobile", "api"].includes(channel.key)) {
      if (!channel.separateIdentity) invalid(path, "The representative needs their own sign-in.");
      if (!channel.requiresAcknowledgment) invalid(path, "The institution must confirm when access is set up.");
      if (channel.accessLevel === "transaction" && !channel.requiresMfa) invalid(path, "Transaction access requires an extra sign-in check.");
    }
  }
  const controls = unique(list(catalog.controls, "/catalog/controls").map((value, index): PolicyControl => {
    const path = `/catalog/controls/${index}`;
    const row = shape(value, ["key", "kind", "value", "currency", "windowHours", "actionKeys", "locked", "source"], [], path);
    const kind = choice(row.kind, ["max_amount", "max_duration_days", "min_approvers", "max_count"], `${path}/kind`);
    const currency = row.currency === null ? null : text(row.currency, `${path}/currency`);
    if ((kind === "max_amount" && (!currency || !/^[A-Z]{3}$/.test(currency))) || (kind !== "max_amount" && currency !== null)) invalid(`${path}/currency`, "Use a three-letter currency code only for an amount limit.");
    const windowHours = row.windowHours === null ? null : positiveInteger(row.windowHours, `${path}/windowHours`);
    if ((kind === "max_count" && windowHours === null) || (kind !== "max_count" && windowHours !== null)) invalid(`${path}/windowHours`, "Set a time window only for a frequency limit.");
    const amount = positiveInteger(row.value, `${path}/value`);
    if (kind === "min_approvers" && amount < 2) invalid(`${path}/value`, "Dual approval needs at least two people.");
    const source = choice(row.source, ["platform", "jurisdiction"], `${path}/source`);
    return { key: key(row.key, `${path}/key`), kind, value: amount, currency, windowHours, actionKeys: actionReferences(row.actionKeys, actionKeys, `${path}/actionKeys`), locked: boolean(row.locked, `${path}/locked`), source, valueSource: source };
  }), "/catalog/controls");
  const controlOverrides = unique(list(draft.controlOverrides, "/draft/controlOverrides").map((value, index) => {
    const path = `/draft/controlOverrides/${index}`, row = shape(value, ["key", "value"], [], path);
    return { key: key(row.key, `${path}/key`), value: positiveInteger(row.value, `${path}/value`), path };
  }), "/draft/controlOverrides");
  for (const override of controlOverrides.values()) {
    const control = controls.get(override.key); if (!control) invalid(override.path, "This limit is not in the selected catalog.");
    if (override.value === control.value) continue;
    if (control.locked) invalid(override.path, "This limit cannot be changed.");
    if (control.kind === "min_approvers" ? override.value < control.value : override.value > control.value) {
      invalid(override.path, "This change would weaken a required limit.");
    }
    control.value = override.value; control.valueSource = "institution";
  }
  return {
    ...base, stage: "configuration-only" as const,
    channels: [...channels.values()].sort((a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0),
    controls: [...controls.values()].sort((a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0),
  };
}

/**
 * Operational compatibility against a server-controlled, versioned contract.
 * This does not establish legal approval or a complete publishable policy.
 * Custom actions need a governed semantic review path before they can pass.
 */
export function compileCompatiblePolicyConfiguration(organizationId: string, trustedCatalog: unknown, submittedDraft: unknown, trustedCompatibility: unknown) {
  const configuration = compilePolicyConfiguration(organizationId, trustedCatalog, submittedDraft);
  let input: unknown;
  try { input = JSON.parse(canonicalPolicyJson(trustedCompatibility)); }
  catch { invalid("/compatibility", "We could not read the rules for these combinations."); }
  const contract = shape(input, ["accountTypes", "retentionClasses", "currencies", "actions"], [], "/compatibility");
  function strings(value: unknown, path: string): string[] {
    const result = list(value, path).map((item, index) => text(item, `${path}/${index}`));
    if (new Set(result).size !== result.length) invalid(path, "Each value can appear only once.");
    return result;
  }
  const accountTypes = new Set(strings(contract.accountTypes, "/compatibility/accountTypes"));
  const retentionClasses = new Set(strings(contract.retentionClasses, "/compatibility/retentionClasses"));
  const currencies = new Set(strings(contract.currencies, "/compatibility/currencies"));
  for (const currency of currencies) if (!/^[A-Z]{3}$/.test(currency)) invalid("/compatibility/currencies", "Use a three-letter currency code.");
  const actionKeys = new Set(configuration.actions.map(rule => rule.key));
  const evidenceByKey = new Map(configuration.evidence.map(rule => [rule.key, rule]));
  const rules = unique(list(contract.actions, "/compatibility/actions").map((value, index) => {
    const path = `/compatibility/actions/${index}`;
    const row = shape(value, ["key", "requiredEvidenceKeys", "allowedChannelAccess", "allowedControlKinds"], [], path);
    const id = key(row.key, `${path}/key`);
    if (!actionKeys.has(id)) invalid(path, "This compatibility rule names an unknown action.");
    const requiredEvidenceKeys = strings(row.requiredEvidenceKeys, `${path}/requiredEvidenceKeys`);
    if (requiredEvidenceKeys.some(id => !evidenceByKey.has(id))) invalid(path, "This action names missing evidence.");
    const allowedChannelAccess = strings(row.allowedChannelAccess, `${path}/allowedChannelAccess`);
    if (allowedChannelAccess.some(item => !/^(branch|phone|online|mobile|api):(view|transaction)$/.test(item))) invalid(path, "Choose a supported channel and access level.");
    const allowedControlKinds = strings(row.allowedControlKinds, `${path}/allowedControlKinds`);
    if (allowedControlKinds.some(item => !["max_amount", "max_duration_days", "min_approvers", "max_count"].includes(item))) invalid(path, "Choose a supported kind of limit.");
    return { key: id, requiredEvidenceKeys, allowedChannelAccess, allowedControlKinds };
  }), "/compatibility/actions");
  for (const action of configuration.actions) {
    const path = `/actions/${action.key}`;
    if (action.source === "institution") invalid(path, "Custom actions need a reviewed definition before this policy can continue.");
    const rule = rules.get(action.key);
    if (!rule) invalid(path, "This action is missing its combination rules.");
    if (action.accountTypes.some(type => !accountTypes.has(type))) invalid(path, "This action names an unsupported account type.");
    if (action.enabled && rule.requiredEvidenceKeys.some(id => !evidenceByKey.get(id)?.required)) invalid(path, "Keep the evidence required for this action.");
  }
  for (const evidence of configuration.evidence) {
    if (!retentionClasses.has(evidence.retentionClass)) invalid(`/evidence/${evidence.key}`, "Choose a supported record retention rule.");
  }
  for (const channel of configuration.channels) {
    for (const id of channel.actionKeys) {
      if (!rules.get(id)?.allowedChannelAccess.includes(`${channel.key}:${channel.accessLevel}`)) invalid(`/channels/${channel.key}`, "This channel and access level do not fit one of its actions.");
    }
  }
  for (const control of configuration.controls) {
    if (control.currency !== null && !currencies.has(control.currency)) invalid(`/controls/${control.key}`, "Choose a supported currency for this limit.");
    for (const id of control.actionKeys) {
      if (!rules.get(id)?.allowedControlKinds.includes(control.kind)) invalid(`/controls/${control.key}`, "This kind of limit does not fit one of its actions.");
    }
  }
  return { ...configuration, compatibility: "operational-references-checked" as const };
}
