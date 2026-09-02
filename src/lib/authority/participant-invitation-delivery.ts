import { Resend } from "resend";

export type ParticipantInvitationDelivery = {
  invitationId: string;
  invitationVersion: number;
  participantRole: "principal" | "representative";
  email: string;
  institutionName: string;
  participantName: string;
  otherPersonName: string;
  purpose: string;
  accountBoundary: string;
  expiresAt: string;
  secureUrl: string;
  accessPurpose?: "decision" | "resume" | "receipt";
};

export type ParticipantDeliveryResult =
  | { accepted: true; provider: "resend"; messageId: string }
  | { accepted: false; provider: "disabled" | "resend"; reason: "configuration_missing" | "provider_rejected" };

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function expirationLabel(expiresAt: string) {
  const value = new Date(expiresAt);
  if (Number.isNaN(value.getTime())) return "within 72 hours";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York",
  }).format(value);
}

export function participantInvitationIdempotencyKey(delivery: ParticipantInvitationDelivery) {
  return `authority-participant-${delivery.invitationId}-v${delivery.invitationVersion}`;
}

export function buildParticipantInvitationEmail(delivery: ParticipantInvitationDelivery) {
  const role = delivery.participantRole === "principal" ? "person granting authority" : "representative";
  const isResume = delivery.participantRole === "representative" && delivery.accessPurpose === "resume";
  const isReceipt = delivery.accessPurpose === "receipt";
  const action = delivery.participantRole === "principal"
    ? "review and confirm the request"
    : isResume
      ? "continue the requested evidence and certification steps"
      : "review and accept or decline the responsibility";
  const subject = isReceipt
    ? `${delivery.institutionName} recorded a decision on your request`
    : isResume
    ? `${delivery.institutionName} sent you a fresh secure access link`
    : `${delivery.institutionName} sent you a secure authority request`;
  const preview = isReceipt
    ? `View the institution decision receipt for your request with ${delivery.institutionName}.`
    : isResume
    ? `Resume your secure authority request with ${delivery.institutionName}.`
    : `${delivery.institutionName} invited you as the ${role}.`;
  const heading = isReceipt ? "Your institution decision receipt is ready" : isResume ? "Resume your secure authority request" : "A secure authority request needs your review";
  const introduction = isReceipt
    ? `${delivery.institutionName} recorded its decision on this request. Open the secure receipt to see the outcome, accepted scope, limits, and current lifecycle status.`
    : isResume
    ? `${delivery.institutionName} sent you a fresh link as the ${role} to ${action}. Your prior authority decision remains saved.`
    : `${delivery.institutionName} invited you as the ${role} to ${action}.`;
  const buttonLabel = isReceipt ? "View decision receipt" : isResume ? "Resume secure request" : "Open secure request";
  const expires = expirationLabel(delivery.expiresAt);

  const text = [
    `Hello, ${delivery.participantName}.`,
    "",
    introduction,
    `${delivery.otherPersonName} is the other person named in this request.`,
    "",
    delivery.purpose,
    delivery.accountBoundary,
    "",
    `Open the secure request: ${delivery.secureUrl}`,
    "",
    `This one-time link expires ${expires} Eastern Time.`,
    "Passage coordinates the request. The receiving institution keeps the final decision.",
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
            <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2">${escapeHtml(heading)}</h1>
            <p style="margin:0 0 18px;font-size:17px;line-height:1.6">Hello, ${escapeHtml(delivery.participantName)}. ${escapeHtml(introduction)}</p>
            <p style="margin:0 0 18px;color:#4e625d;font-size:15px;line-height:1.6"><strong>Other person:</strong> ${escapeHtml(delivery.otherPersonName)}<br><strong>Purpose:</strong> ${escapeHtml(delivery.purpose)}<br><strong>Relationship:</strong> ${escapeHtml(delivery.accountBoundary)}</p>
            <p style="margin:0 0 28px"><a href="${escapeHtml(delivery.secureUrl)}" style="display:inline-block;background:#12664f;color:#ffffff;text-decoration:none;font-weight:700;padding:14px 20px;border-radius:10px">${escapeHtml(buttonLabel)}</a></p>
            <p style="margin:0 0 12px;color:#4e625d;font-size:14px;line-height:1.6">This one-time link expires ${escapeHtml(expires)} Eastern Time.</p>
            <p style="margin:0;color:#4e625d;font-size:14px;line-height:1.6">Passage coordinates the request. The receiving institution keeps the final decision.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  return { subject, preview, text, html };
}

export async function deliverParticipantInvitation(delivery: ParticipantInvitationDelivery): Promise<ParticipantDeliveryResult> {
  const provider = process.env.AUTHORITY_PARTICIPANT_INVITATION_DELIVERY?.trim().toLowerCase();
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.AUTHORITY_EMAIL_FROM?.trim();
  if (provider !== "resend" || !apiKey || !from) {
    return { accepted: false, provider: "disabled", reason: "configuration_missing" };
  }

  try {
    const message = buildParticipantInvitationEmail(delivery);
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send(
      {
        from,
        to: delivery.email,
        subject: message.subject,
        text: message.text,
        html: message.html,
      },
      { headers: { "Idempotency-Key": participantInvitationIdempotencyKey(delivery) } },
    );
    if (error || !data?.id) return { accepted: false, provider: "resend", reason: "provider_rejected" };
    return { accepted: true, provider: "resend", messageId: data.id };
  } catch {
    return { accepted: false, provider: "resend", reason: "provider_rejected" };
  }
}
