import 'server-only';

const RESEND_API_BASE = 'https://api.resend.com';
const DEFAULT_FROM = 'Passage Care Team <care@thepassageapp.io>';

function resendApiKey(): string | null {
  return process.env.RESEND_API_KEY?.trim() || null;
}

export function isEmailConfigured(): boolean {
  return resendApiKey() !== null;
}

export type SendEmailInput = {
  to: string[];
  subject: string;
  text: string;
};

export type SendEmailResult =
  | { ok: true; providerMessageId: string }
  | { ok: false; reason: string };

// Thin wrapper over Resend's REST API (raw fetch, not the SDK -- matches
// lib/hubspot.ts's existing convention in this codebase rather than adding
// a new dependency for one call site). thepassageapp.io is a verified,
// sending-enabled Resend domain (confirmed directly against the account),
// so DEFAULT_FROM is a real, deliverable address, not a placeholder.
export async function sendTaskCommunicationEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = resendApiKey();
  if (!apiKey) return { ok: false, reason: 'Email sending is not configured yet.' };
  if (input.to.length === 0) return { ok: false, reason: 'No recipients.' };

  try {
    const response = await fetch(`${RESEND_API_BASE}/emails`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: DEFAULT_FROM, to: input.to, subject: input.subject, text: input.text }),
    });
    const body = await response.json().catch(() => null) as { id?: string; message?: string } | null;
    if (!response.ok || !body?.id) {
      return { ok: false, reason: body?.message || `Email provider returned ${response.status}` };
    }
    return { ok: true, providerMessageId: body.id };
  } catch {
    return { ok: false, reason: 'Could not reach the email provider.' };
  }
}
