/** Domain helpers for the organization public-listing opt-in setting. */

export type OrganizationPublicListingState =
  | { ready: false }
  | { ready: true; listed: boolean; version: number };

/**
 * Pre-migration (column absent) or malformed rows are not ready: hide or disable
 * the toggle. After migration, default false means unlisted until an owner opts in.
 */
export function organizationPublicListingState(
  row: Record<string, unknown> | null | undefined,
): OrganizationPublicListingState {
  if (!row || !Object.prototype.hasOwnProperty.call(row, "listed_for_public_requests")) {
    return { ready: false };
  }
  const listed = row.listed_for_public_requests;
  const version = Number(row.version);
  if (typeof listed !== "boolean" || !Number.isInteger(version) || version < 1) {
    return { ready: false };
  }
  return { ready: true, listed, version };
}

const knownListingErrors: Record<string, string> = {
  mfa_verification_required: "mfa_required",
  member_management_not_allowed: "member_management_not_allowed",
  authentication_required: "member_management_not_allowed",
  stale_organization_version: "organization_changed",
  idempotency_payload_mismatch: "organization_changed",
  organization_not_available: "request_failed",
  listed_required: "request_failed",
  idempotency_key_required: "request_failed",
};

/** Maps a thrown error to a user message code. Never passes provider or database text through. */
export function organizationPublicListingErrorCode(error: unknown) {
  if (!error || typeof error !== "object") return "request_failed";
  const candidate = error as { message?: unknown; code?: unknown };
  const code = String(candidate.code ?? "");
  const message = String(candidate.message ?? "");
  if (
    code === "PGRST202"
    || code === "42883"
    || /could not find the function|function .* does not exist|PGRST202/i.test(message)
  ) {
    return "try_again_later";
  }
  // Prefer the exact RPC message when PostgREST wraps it.
  for (const key of Object.keys(knownListingErrors)) {
    if (message === key || message.includes(key)) return knownListingErrors[key]!;
  }
  return "request_failed";
}
