import { Resend } from "resend";
import { isDemoEmailRecipientAllowed } from "./delivery-boundary.ts";

// Mirrors participant-invitation-delivery.ts's structure exactly: a pure
// build*Email() function per message plus an async deliver*() wrapper that
// checks isDemoEmailRecipientAllowed(), checks the env-var + Resend + from-address
// gate, and fails soft (never throws) when anything is missing or rejected.

export type RequesterVerificationDelivery = {
  kind: "verification";
  groupId: string;
  email: string;
  requesterName: string;
  referenceCode: string;
  expiresAt: string;
  secureUrl: string;
};

export type RequesterSubmittedDelivery = {
  kind: "submitted";
  groupId: string;
  email: string;
  requesterName: string;
  referenceCode: string;
  matchedCount: number;
  unmatchedCount: number;
  secureUrl: string;
};

export type RequesterDeliveryResult =
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
  if (Number.isNaN(value.getTime())) return "shortly";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York",
  }).format(value);
}

export function requesterDeliveryIdempotencyKey(delivery: RequesterVerificationDelivery | RequesterSubmittedDelivery) {
  return `authority-requester-${delivery.kind}-${delivery.groupId}`;
}

function shell(subject: string, preview: string, heading: string, bodyHtml: string) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;background:#f4f7f5;color:#17342f;font-family:Arial,sans-serif">
    <div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px">${escapeHtml(preview)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7f5;padding:24px 12px">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid #dce7e2;border-radius:16px;overflow:hidden">
          <tr><td style="padding:28px">
            <p style="margin:0 0 18px;color:#1c765f;font-size:15px;font-weight:700">Passage Authority</p>
            <h1 style="margin:0 0 14px;font-size:26px;line-height:1.2">${escapeHtml(heading)}</h1>
            ${bodyHtml}
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

function buttonHtml(url: string, label: string) {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 20px">
              <tr><td align="center" bgcolor="#12664f" style="border-radius:10px">
                <a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" style="display:block;min-height:44px;box-sizing:border-box;background:#12664f;color:#ffffff;text-decoration:none;font-weight:700;padding:13px 18px;border-radius:10px;text-align:center;line-height:20px">${escapeHtml(label)}</a>
              </td></tr>
            </table>`;
}

export function buildRequesterVerificationEmail(delivery: RequesterVerificationDelivery) {
  const subject = `Confirm your Passage request (${delivery.referenceCode})`;
  const preview = "Confirm your email to continue your multi-institution request.";
  const expires = expirationLabel(delivery.expiresAt);

  const text = [
    `Hello, ${delivery.requesterName}.`,
    "",
    `You started a Passage request (reference ${delivery.referenceCode}) naming more than one institution.`,
    "Confirm your email address to continue.",
    "",
    `Confirm your email: ${delivery.secureUrl}`,
    "",
    `This one-time link expires ${expires} Eastern Time.`,
    "Passage does not create, validate, or determine the legal validity of a power of attorney. It coordinates workflow and institutional review. Each institution reviews and decides independently.",
  ].join("\n");

  const html = shell(subject, preview, "Confirm your email", `
            <p style="margin:0 0 16px;font-size:16px;line-height:1.5">Hello, ${escapeHtml(delivery.requesterName)}. You started a Passage request (reference ${escapeHtml(delivery.referenceCode)}) naming more than one institution. Confirm your email address to continue.</p>
            ${buttonHtml(delivery.secureUrl, "Confirm your email")}
            <p style="margin:0 0 16px;color:#4e625d;font-size:13px;line-height:1.5">If the button does not open, <a href="${escapeHtml(delivery.secureUrl)}" target="_blank" rel="noopener noreferrer" style="color:#12664f;text-decoration:underline;font-weight:700">open the secure link here</a>.</p>
            <p style="margin:0;color:#4e625d;font-size:13px;line-height:1.5">This one-time link expires ${escapeHtml(expires)} Eastern Time.<br><br>Passage does not create, validate, or determine the legal validity of a power of attorney. It coordinates workflow and institutional review. Each institution reviews and decides independently.</p>`);

  return { subject, preview, text, html };
}

export function buildRequesterSubmittedEmail(delivery: RequesterSubmittedDelivery) {
  const subject = `Your Passage request is saved (${delivery.referenceCode})`;
  const preview = "Open your request to check file and invitation delivery.";
  const matchedLine = `Your request (reference ${delivery.referenceCode}) is saved for ${delivery.matchedCount} institution${delivery.matchedCount === 1 ? "" : "s"} already on Passage.`;
  const unmatchedLine = delivery.unmatchedCount > 0
    ? ` ${delivery.unmatchedCount} institution${delivery.unmatchedCount === 1 ? "" : "s"} you named are not yet on Passage; no request has been sent to those institutions.`
    : "";

  const text = [
    `Hello, ${delivery.requesterName}.`,
    "",
    `${matchedLine}${unmatchedLine}`,
    "",
    `View the status of your request: ${delivery.secureUrl}`,
    "",
    "Each institution makes its own, independent decision on its own copy of the evidence you provided. Passage does not create legal authority, determine the validity of a power of attorney, or decide any institution's case.",
  ].join("\n");

  const html = shell(subject, preview, "Your request is saved", `
            <p style="margin:0 0 16px;font-size:16px;line-height:1.5">Hello, ${escapeHtml(delivery.requesterName)}. ${escapeHtml(matchedLine)}${escapeHtml(unmatchedLine)}</p>
            ${buttonHtml(delivery.secureUrl, "View request status")}
            <p style="margin:0;color:#4e625d;font-size:13px;line-height:1.5">Each institution makes its own, independent decision on its own copy of the evidence you provided. Passage does not create legal authority, determine the validity of a power of attorney, or decide any institution's case.</p>`);

  return { subject, preview, text, html };
}

async function sendRequesterEmail(email: string, message: { subject: string; text: string; html: string }, idempotencyKey: string): Promise<RequesterDeliveryResult> {
  if (!isDemoEmailRecipientAllowed(email)) {
    return { accepted: false, provider: "disabled", reason: "recipient_not_allowed" };
  }

  const provider = process.env.AUTHORITY_REQUESTER_VERIFICATION_DELIVERY?.trim().toLowerCase();
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.AUTHORITY_EMAIL_FROM?.trim();
  if (provider !== "resend" || !apiKey || !from) {
    return { accepted: false, provider: "disabled", reason: "configuration_missing" };
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send(
      { from, to: email, subject: message.subject, text: message.text, html: message.html },
      { headers: { "Idempotency-Key": idempotencyKey } },
    );
    if (error || !data?.id) return { accepted: false, provider: "resend", reason: "provider_rejected" };
    return { accepted: true, provider: "resend", messageId: data.id };
  } catch {
    return { accepted: false, provider: "resend", reason: "provider_rejected" };
  }
}

export async function deliverRequesterVerificationEmail(delivery: RequesterVerificationDelivery): Promise<RequesterDeliveryResult> {
  return sendRequesterEmail(delivery.email, buildRequesterVerificationEmail(delivery), requesterDeliveryIdempotencyKey(delivery));
}

export async function deliverRequesterSubmittedEmail(delivery: RequesterSubmittedDelivery): Promise<RequesterDeliveryResult> {
  return sendRequesterEmail(delivery.email, buildRequesterSubmittedEmail(delivery), requesterDeliveryIdempotencyKey(delivery));
}
