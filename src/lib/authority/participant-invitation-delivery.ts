import { Resend } from "resend";
import { isDemoEmailRecipientAllowed } from "./delivery-boundary.ts";
import { authorityPurposeLabel } from "./display-copy.ts";

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
  | { accepted: false; provider: "disabled" | "resend"; reason: "configuration_missing" | "provider_rejected" | "recipient_not_allowed" };

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
    ? "review the request and confirm whether it is correct"
    : isResume
      ? "finish the remaining requirements"
      : "review and accept or decline the responsibility";
  const subject = isReceipt
    ? `${delivery.institutionName}: decision receipt ready`
    : isResume
    ? `${delivery.institutionName} sent you a fresh secure access link`
    : `${delivery.institutionName} sent you a secure authority request`;
  const preview = isReceipt
    ? "View the decision, accepted actions, and any limits."
    : isResume
    ? `Resume your secure authority request with ${delivery.institutionName}.`
    : `${delivery.institutionName} invited you as the ${role}.`;
  const heading = isReceipt ? "Decision receipt ready" : isResume ? "Continue your request" : "Please review this request";
  const introduction = isReceipt
    ? `${delivery.institutionName} recorded its decision. View the outcome, accepted actions, and any limits.`
    : isResume
    ? `${delivery.institutionName} sent you a new link to ${action}. Your earlier answers are still saved.`
    : `${delivery.institutionName} invited you as the ${role} to ${action}.`;
  const buttonLabel = isReceipt ? "View decision receipt" : isResume ? "Resume secure request" : "Open secure request";
  const expires = expirationLabel(delivery.expiresAt);
  const purpose = authorityPurposeLabel(delivery.purpose);

  const text = [
    `Hello, ${delivery.participantName}.`,
    "",
    introduction,
    `${delivery.otherPersonName} is the other person named in this request.`,
    "",
    purpose,
    delivery.accountBoundary,
    "",
    `Open the secure request: ${delivery.secureUrl}`,
    "",
    `This one-time link expires ${expires} Eastern Time. The receiving institution keeps the final decision.`,
    "Use the newest Passage email for this request. If a fresh link is sent, every earlier link stops working.",
  ].join("\n");

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(subject)}</title>
    <style>
      html, body, table, td, p, h1, a { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
      @media only screen and (max-width: 480px) {
        .email-outer { padding: 12px 8px !important; }
        .email-card { border-radius: 12px !important; }
        .email-content { padding: 20px !important; }
        .email-brand { margin-bottom: 14px !important; font-size: 14px !important; }
        .email-title { margin-bottom: 12px !important; font-size: 24px !important; line-height: 1.15 !important; }
        .email-copy { margin-bottom: 14px !important; font-size: 15px !important; line-height: 1.45 !important; }
        .email-meta { margin-bottom: 16px !important; font-size: 13px !important; line-height: 1.45 !important; }
        .email-action { margin-bottom: 16px !important; }
        .email-button { box-sizing: border-box !important; display: block !important; min-height: 44px !important; padding: 13px 14px !important; text-align: center !important; }
        .email-fine { font-size: 12px !important; line-height: 1.45 !important; }
      }
    </style>
  </head>
  <body style="margin:0;background:#f4f7f5;color:#17342f;font-family:Arial,sans-serif;-webkit-text-size-adjust:100%;text-size-adjust:100%">
    <div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px">${escapeHtml(preview)}</div>
    <table class="email-outer" role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7f5;padding:24px 12px">
      <tr><td align="center">
        <table class="email-card" role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid #dce7e2;border-radius:16px;overflow:hidden">
          <tr><td class="email-content" style="padding:28px">
            <p class="email-brand" style="margin:0 0 18px;color:#1c765f;font-size:15px;font-weight:700">Passage Authority</p>
            <h1 class="email-title" style="margin:0 0 14px;font-size:26px;line-height:1.2">${escapeHtml(heading)}</h1>
            <p class="email-copy" style="margin:0 0 16px;font-size:16px;line-height:1.5">Hello, ${escapeHtml(delivery.participantName)}. ${escapeHtml(introduction)}</p>
            <p class="email-meta" style="margin:0 0 18px;color:#4e625d;font-size:14px;line-height:1.5"><strong>Other person:</strong> ${escapeHtml(delivery.otherPersonName)}<br><strong>Purpose:</strong> ${escapeHtml(purpose)}<br><strong>Account:</strong> ${escapeHtml(delivery.accountBoundary)}</p>
            <p class="email-action" style="margin:0 0 20px"><a class="email-button" href="${escapeHtml(delivery.secureUrl)}" style="display:inline-block;min-height:44px;box-sizing:border-box;background:#12664f;color:#ffffff;text-decoration:none;font-weight:700;padding:13px 18px;border-radius:10px">${escapeHtml(buttonLabel)}</a></p>
            <p class="email-fine" style="margin:0;color:#4e625d;font-size:13px;line-height:1.5">This one-time link expires ${escapeHtml(expires)} Eastern Time. The receiving institution keeps the final decision.<br><br>Use the newest Passage email for this request. If a fresh link is sent, every earlier link stops working.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  return { subject, preview, text, html };
}

export async function deliverParticipantInvitation(delivery: ParticipantInvitationDelivery): Promise<ParticipantDeliveryResult> {
  if (!isDemoEmailRecipientAllowed(delivery.email)) {
    return { accepted: false, provider: "disabled", reason: "recipient_not_allowed" };
  }

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
