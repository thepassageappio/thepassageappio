export type MfaTeamStatus = {
  capturedAt: string;
  members: { id: string; name: string; email: string; role: "owner" | "admin"; verifiedCount: number }[];
};

/** Fail closed on incomplete inventory; unavailable must never look like zero gaps. */
export function parseMfaTeamStatus(value: unknown): MfaTeamStatus | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  if (typeof input.captured_at !== "string" || !Number.isFinite(Date.parse(input.captured_at)) || !Array.isArray(input.members) || input.members.length === 0) return null;
  const members: MfaTeamStatus["members"] = [];
  const ids = new Set<string>();
  for (const row of input.members) {
    if (!row || typeof row !== "object") return null;
    const m = row as Record<string, unknown>;
    if (typeof m.membership_id !== "string" || !m.membership_id || ids.has(m.membership_id) ||
      typeof m.email !== "string" || !m.email.trim() ||
      (m.display_name !== null && typeof m.display_name !== "string") ||
      (m.role !== "owner" && m.role !== "admin") ||
      typeof m.verified_totp_count !== "number" || !Number.isSafeInteger(m.verified_totp_count) || m.verified_totp_count < 0) return null;
    ids.add(m.membership_id);
    members.push({ id: m.membership_id, name: m.display_name?.trim() || m.email, email: m.email, role: m.role, verifiedCount: m.verified_totp_count });
  }
  return { capturedAt: input.captured_at, members };
}

export function mfaEnrollmentLabel(count: number): string {
  if (count === 0) return "Enrollment needed";
  if (count === 1) return "Backup authenticator needed";
  return "Backup authenticator enrolled";
}
