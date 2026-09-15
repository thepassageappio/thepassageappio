/**
 * Jurisdiction pack helpers for Wave1 encode work.
 * Phase 0 lands US-NY scaffolding only. Passage records workflow metadata;
 * it does not validate POAs or create authority.
 */

export const NY_JURISDICTION_CODE = "US-NY" as const;
export const NY_PACK_KEY = "us_ny_financial_poa" as const;
export const NY_PACK_VERSION = "2026.1" as const;

export type JurisdictionFormClass = "statutory_short" | "non_statutory" | "unknown";

export type JurisdictionPackRef = {
  packKey: string;
  packVersion: string;
  jurisdictionCode: string;
  displayName: string;
};

export type JurisdictionTimerPolicy = {
  initialBusinessDays: number;
  followupBusinessDays: number;
};

export type JurisdictionReasonCode = {
  code: string;
  theme: string;
  label: string;
  description: string;
  severity: "info" | "warn" | "block_hint";
  isFiOverlay: boolean;
  warnIfSoleRefusal: boolean;
  sortOrdinal: number;
};

export const NY_DEFAULT_TIMER_POLICY: JurisdictionTimerPolicy = {
  initialBusinessDays: 10,
  followupBusinessDays: 7,
};

export const NY_PACK_REF: JurisdictionPackRef = {
  packKey: NY_PACK_KEY,
  packVersion: NY_PACK_VERSION,
  jurisdictionCode: NY_JURISDICTION_CODE,
  displayName: "New York financial power of attorney",
};


/** Plain-language staff label for recorded form_class. */
export function formClassPlainLabel(formClass: JurisdictionFormClass) {
  if (formClass === "statutory_short") return "Statutory short form";
  if (formClass === "non_statutory") return "Not a statutory short form";
  return "Form type unknown";
}

/**
 * Read-only soft notice near decide panel when no reason-code picker exists.
 * Soft-warn only; does not block. Plain language hard bar.
 */
export const NY_SOLE_REFUSAL_SOFT_NOTICE =
  "Reminder: If this is a New York statutory short form, do not refuse only because it is not your bank's form, or only because of the form's age. Add another reason if you decide not to accept.";

/** Plain-language staff label for receipt / case surfaces. */
export function jurisdictionPackVersionLabel(pack: Pick<JurisdictionPackRef, "displayName" | "packVersion">) {
  return `${pack.displayName} · pack ${pack.packVersion}`;
}

export function isSupportedLiveJurisdiction(code: string | null | undefined) {
  return code === NY_JURISDICTION_CODE;
}

export function normalizeFormClass(value: string | null | undefined): JurisdictionFormClass {
  if (value === "statutory_short" || value === "non_statutory" || value === "unknown") return value;
  return "unknown";
}

/**
 * Soft warning helper for NY themes: sole "not our form" or age-alone refusals
 * on a statutory short form. Does not block; institution decides.
 */
export function soleRefusalWarningCodes(input: {
  formClass: JurisdictionFormClass;
  reasonCodes: string[];
}): string[] {
  if (input.formClass !== "statutory_short") return [];
  const codes = [...new Set(input.reasonCodes.map((code) => code.trim()).filter(Boolean))];
  if (codes.length !== 1) return [];
  const only = codes[0]!;
  if (only === "ny.warn.not_our_form_alone" || only === "ny.warn.age_alone") return [only];
  return [];
}

export function mapJurisdictionPackRow(row: Record<string, unknown>): JurisdictionPackRef | null {
  const packKey = typeof row.pack_key === "string" ? row.pack_key : null;
  const packVersion = typeof row.pack_version === "string" ? row.pack_version : null;
  const jurisdictionCode = typeof row.jurisdiction_code === "string" ? row.jurisdiction_code : null;
  const displayName = typeof row.display_name === "string" ? row.display_name : null;
  if (!packKey || !packVersion || !jurisdictionCode || !displayName) return null;
  return { packKey, packVersion, jurisdictionCode, displayName };
}
