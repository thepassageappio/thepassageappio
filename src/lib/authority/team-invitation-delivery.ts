import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { Resend } from "resend";

export type TeamInvitationDelivery = {
  invitationId: string;
  email: string;
  organizationName: string;
  role: string;
  expiresAt: string;
  secureUrl: string;
};

type DeliveryResult =
  | { delivered: true; provider: "local" | "resend"; messageId?: string }
  | { delivered: false; provider: "disabled" | "resend"; reason: "configuration_missing" | "provider_rejected" };

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function roleLabel(role: string) {
  const labels: Record<string, string> = {
    admin: "Administrator",
    staff: "Operations staff",
    reviewer: "Institution reviewer",
    developer: "Developer",
    auditor: "Auditor",
  };
  return labels[role] ?? "Team member";
}

function expirationLabel(expiresAt: string) {
  const value = new Date(expiresAt);
  if (Number.isNaN(value.getTime())) return "seven days";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York",
  }).format(value);
}

export function buildTeamInvitationEmail(delivery: TeamInvitationDelivery) {
  const organizationName = delivery.organizationName.trim();
  const role = roleLabel(delivery.role);
  const expires = expirationLabel(delivery.expiresAt);
  const subject = `Join ${organizationName} in Passage Authority`;
  const preview = `${organizationName} invited you to join as ${role}.`;

  const text = [
    preview,
    "",
    "Review the organization and requested role before accepting access:",
    delivery.secureUrl,
    "",
    `This secure link is bound to ${delivery.email} and expires ${expires} Eastern Time.`,
    "Passage Authority coordinates authority requests. The receiving institution keeps the final decision.",
  ].join("\n");

  const html = `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(subject)}</title></head>
  <body style="margin:0;background:#f4f7f5;color:#17342f;font-family:Arial,sans-serif">
    <div style="display:none;max-height:0;overflow:hidden">${escapeHtml(preview)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7f5;padding:32px 16px">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid #dce7e2;border-radius:16px;overflow:hidden">
          <tr><td style="padding:32px">
            <p style="margin:0 0 24px;color:#1c765f;font-size:15px;font-weight:700">Passage Authority</p>
            <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2">You have been invited</h1>
            <p style="margin:0 0 24px;font-size:17px;line-height:1.6">${escapeHtml(organizationName)} invited you to join its Passage Authority workspace as <strong>${escapeHtml(role)}</strong>.</p>
            <p style="margin:0 0 28px"><a href="${escapeHtml(delivery.secureUrl)}" style="display:inline-block;background:#12664f;color:#ffffff;text-decoration:none;font-weight:700;padding:14px 20px;border-radius:10px">Review invitation</a></p>
            <p style="margin:0 0 12px;color:#4e625d;font-size:14px;line-height:1.6">This secure link is bound to ${escapeHtml(delivery.email)} and expires ${escapeHtml(expires)} Eastern Time.</p>
            <p style="margin:0;color:#4e625d;font-size:14px;line-height:1.6">Passage Authority coordinates authority requests. The receiving institution keeps the final decision.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  return { subject, text, html };
}

async function deliverTeamInvitationLocally(delivery: TeamInvitationDelivery): Promise<DeliveryResult> {

  const directory = path.join(process.cwd(), ".data");
  await mkdir(directory, { recursive: true });
  await appendFile(
    path.join(directory, "team-invitations.ndjson"),
    `${JSON.stringify({ ...delivery, createdAt: new Date().toISOString() })}\n`,
    { encoding: "utf8", mode: 0o600 },
  );

  return { delivered: true, provider: "local" };
}

async function deliverTeamInvitationWithResend(delivery: TeamInvitationDelivery): Promise<DeliveryResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.AUTHORITY_EMAIL_FROM?.trim();
  if (!apiKey || !from) {
    return { delivered: false, provider: "resend", reason: "configuration_missing" };
  }

  try {
    const resend = new Resend(apiKey);
    const message = buildTeamInvitationEmail(delivery);
    const { data, error } = await resend.emails.send(
      {
        from,
        to: delivery.email,
        subject: message.subject,
        text: message.text,
        html: message.html,
      },
      { headers: { "Idempotency-Key": `authority-team-invitation-${delivery.invitationId}` } },
    );

    if (error || !data?.id) {
      return { delivered: false, provider: "resend", reason: "provider_rejected" };
    }

    return { delivered: true, provider: "resend", messageId: data.id };
  } catch {
    return { delivered: false, provider: "resend", reason: "provider_rejected" };
  }
}

export async function deliverTeamInvitation(delivery: TeamInvitationDelivery): Promise<DeliveryResult> {
  const provider = process.env.AUTHORITY_TEAM_INVITATION_DELIVERY?.trim().toLowerCase();
  if (provider === "local") return deliverTeamInvitationLocally(delivery);
  if (provider === "resend") return deliverTeamInvitationWithResend(delivery);
  return { delivered: false, provider: "disabled", reason: "configuration_missing" };
}
