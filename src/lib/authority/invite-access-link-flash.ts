export const INVITE_ACCESS_LINK_COOKIE = "pa_invite_access_link";

export type InviteAccessLinkFlash = {
  recordId: string;
  role: "principal" | "representative";
  url: string;
};

export function parseInviteAccessLinkFlash(
  raw: string | undefined,
  recordId: string,
): Omit<InviteAccessLinkFlash, "recordId"> | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<InviteAccessLinkFlash>;
    if (parsed.recordId !== recordId) return null;
    if (parsed.role !== "principal" && parsed.role !== "representative") return null;
    if (typeof parsed.url !== "string" || !parsed.url) return null;
    const url = new URL(parsed.url);
    if (!url.pathname.startsWith("/r/")) return null;
    return { role: parsed.role, url: url.toString() };
  } catch {
    return null;
  }
}
