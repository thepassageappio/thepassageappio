export function snapshotObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

export type GoverningContext = {
  saved: Record<string, unknown> | null;
  current: Record<string, unknown> | null;
  stale: boolean;
  currentHash: string | null;
};

export function mapGoverningContext(value: unknown): GoverningContext {
  const row = snapshotObject(value);
  if (!row || typeof row.stale !== "boolean") throw new Error("jurisdiction_configuration_unavailable");
  return { saved: snapshotObject(row.saved), current: snapshotObject(row.current), stale: row.stale,
    currentHash: typeof row.current_hash === "string" && /^[a-f0-9]{64}$/.test(row.current_hash) ? row.current_hash : null };
}

const labels: Record<string, string> = {
  schema_version: "Saved settings format", template_key: "Workflow", template_version: "Workflow version",
  jurisdiction_code: "State", pack_key: "Rules reference", pack_version: "Rules version", display_name: "Rules name",
  effective_at: "Effective date", source_citation: "Source", notes: "Notes", default_form_class: "Default form type",
  initial_business_days: "Initial review days", followup_business_days: "Follow-up days", reason_codes: "Review reasons",
  supported_actions: "Supported actions", required_evidence: "Required evidence", principal_confirmation_required: "Account holder confirmation required",
  code: "Reference", theme: "Topic", label: "Name", description: "Explanation", severity: "Notice type",
  institution_overlay: "Institution-specific reason", warn_if_sole_refusal: "Warn when used as the only refusal reason",
};

function flatten(value: unknown, path: string[] = [], result: Record<string, string> = {}) {
  if (Array.isArray(value)) {
    if (!value.length) result[path.join(" / ")] = "None";
    value.forEach((item, i) => flatten(item, [...path, `Item ${i + 1}`], result));
  } else if (snapshotObject(value)) {
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) flatten(item, [...path, labels[key] ?? key.replaceAll("_", " ")], result);
  } else result[path.join(" / ")] = value === null || value === undefined ? "Not recorded" : value === true ? "Yes" : value === false ? "No" : String(value);
  return result;
}

export function governingSnapshotChanges(saved: unknown, current: unknown) {
  const before = flatten(saved ?? {});
  const after = flatten(current ?? {});
  return [...new Set([...Object.keys(before), ...Object.keys(after)])].sort().filter(key => before[key] !== after[key])
    .map(label => ({ label, before: before[label] ?? "Not recorded", after: after[label] ?? "Removed" }));
}

export function governingRulesLabel(snapshot: unknown) {
  const value = snapshotObject(snapshot);
  return value && typeof value.display_name === "string" && typeof value.pack_version === "string"
    ? `${value.display_name} · version ${value.pack_version}`
    : "The rules version was not saved with this request. Later labels do not establish which rules governed it.";
}
